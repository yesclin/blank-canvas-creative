/**
 * useProfessionalSignature
 *
 * Manages the professional's saved (default) signature image.
 * - Reads the active row from `professional_signatures`.
 * - Resolves a signed URL for the stored image (private bucket).
 * - Uploads a new signature (PNG/JPEG/WebP, ≤2MB) to `professional-signatures`
 *   and upserts the row, deactivating any previous active signature.
 *
 * Used by the unified signing wizard to offer a "use saved signature" option.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

export interface ProfessionalSignatureRow {
  id: string;
  clinic_id: string;
  professional_id: string;
  signature_file_url: string; // storage path (e.g. <userId>/sig-<ts>.png)
  signature_type: string; // 'image' | 'drawn'
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const BUCKET = "professional-signatures";

export function useProfessionalSignature() {
  const { clinic } = useClinicData();
  const { professionalId } = usePermissions();
  const [signature, setSignature] = useState<ProfessionalSignatureRow | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSignature = useCallback(async () => {
    if (!clinic?.id || !professionalId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("professional_signatures")
        .select("*")
        .eq("clinic_id", clinic.id)
        .eq("professional_id", professionalId)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      setSignature(data as ProfessionalSignatureRow | null);

      if (data?.signature_file_url) {
        const { data: urlData } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(data.signature_file_url, 60 * 30);
        setSignedUrl(urlData?.signedUrl || null);
      } else {
        setSignedUrl(null);
      }
    } catch (e) {
      console.error("[PROF_SIGNATURE] fetch error:", e);
      setSignature(null);
      setSignedUrl(null);
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, professionalId]);

  useEffect(() => {
    fetchSignature();
  }, [fetchSignature]);

  /**
   * Upload a new signature and mark it as the active one.
   * Accepts a Blob (typically image/png from a canvas) or a File from upload.
   */
  const saveSignature = useCallback(
    async (
      blob: Blob,
      opts: { type?: "drawn" | "image"; filename?: string } = {}
    ): Promise<boolean> => {
      if (!clinic?.id || !professionalId) {
        toast.error("Profissional não identificado.");
        return false;
      }
      if (blob.size > 2 * 1024 * 1024) {
        toast.error("Assinatura muito grande (máximo 2MB).");
        return false;
      }
      setSaving(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) throw new Error("Sessão expirada.");

        const ext = opts.filename?.split(".").pop() || "png";
        const path = `${userId}/sig-${Date.now()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, {
            contentType: blob.type || "image/png",
            upsert: false,
          });
        if (upErr) throw upErr;

        // Deactivate previous active signatures for this professional
        await supabase
          .from("professional_signatures")
          .update({ is_active: false })
          .eq("clinic_id", clinic.id)
          .eq("professional_id", professionalId)
          .eq("is_active", true);

        const { error: insErr } = await supabase
          .from("professional_signatures")
          .insert({
            clinic_id: clinic.id,
            professional_id: professionalId,
            signature_file_url: path,
            signature_type: opts.type || "drawn",
            is_active: true,
          });
        if (insErr) throw insErr;

        await fetchSignature();
        toast.success("Assinatura padrão salva.");
        return true;
      } catch (e: any) {
        console.error("[PROF_SIGNATURE] save error:", e);
        toast.error(e?.message || "Erro ao salvar assinatura.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [clinic?.id, professionalId, fetchSignature]
  );

  return {
    signature,
    signedUrl,
    hasSavedSignature: !!signature,
    loading,
    saving,
    refetch: fetchSignature,
    saveSignature,
  };
}

/**
 * Helper: download a saved signature as a base64 dataURL for embedding in the
 * signed snapshot (so the document keeps its own copy, immutable, even if the
 * professional later changes their default signature).
 */
export async function fetchSignatureAsDataUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error || !data) return null;
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(data);
    });
  } catch {
    return null;
  }
}
