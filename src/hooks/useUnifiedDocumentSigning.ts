/**
 * useUnifiedDocumentSigning
 *
 * Single, reusable signing engine consumed by Prontuário and Atendimento.
 *
 * Pipeline:
 *  1. Validate context (clinic, professional, document not yet signed).
 *  2. Re-authenticate user via password (Assinatura Avançada YesClin).
 *  3. Generate SHA-256 hash of the document snapshot for integrity.
 *  4. Upload the handwritten signature image (if provided) into
 *     `signature-evidence/<userId>/...` and capture the path as evidence.
 *  5. Persist the signature in `medical_record_signatures` with snapshot,
 *     hash, sign_method, IP, user agent, evidence_snapshot.
 *  6. Update the source row (consolidated_document, evolution, anamnesis)
 *     to status=signed/assinado + signed_at + signed_by.
 *  7. Append events to `medical_signature_events` (timeline).
 *
 * The same hook is used regardless of source module — consumers only pass a
 * `SignableDocumentContext` object.
 */
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

export type SignableDocumentType =
  | "consolidated_document"
  | "evolution"
  | "anamnesis";

export type SignMethod = "saved_signature" | "handwritten";

export interface SignableDocumentContext {
  document_type: SignableDocumentType;
  document_id: string;
  patient_id: string;
  clinic_id: string;
  /** Snapshot used for hashing + immutable storage. */
  snapshot: Record<string, unknown> | null;
  /** Display label for toasts/audit. */
  professional_name?: string;
  /** Optional override of the source table to update. */
  target_table?: string;
}

export interface SignDocumentInput {
  context: SignableDocumentContext;
  password: string;
  /** Mode chosen by the user. */
  method: SignMethod;
  /** When method === 'handwritten', PNG dataURL produced by the canvas. */
  handwrittenDataUrl?: string;
  /** When method === 'saved_signature', a dataURL captured at sign time
   *  so the document keeps its own immutable copy. */
  savedSignatureDataUrl?: string;
}

export interface SignDocumentResult {
  success: boolean;
  signatureId?: string;
  documentHash?: string;
}

const SOURCE_TABLE_MAP: Record<SignableDocumentType, string> = {
  consolidated_document: "clinical_attendance_documents",
  evolution: "clinical_evolutions",
  anamnesis: "anamnesis_records",
};

const RECORD_TYPE_MAP: Record<SignableDocumentType, string> = {
  consolidated_document: "consolidated_document",
  evolution: "evolution",
  anamnesis: "anamnesis",
};

async function sha256(content: unknown): Promise<string> {
  const json = JSON.stringify(
    content,
    content && typeof content === "object" ? Object.keys(content as object).sort() : undefined
  );
  const buf = new TextEncoder().encode(json);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [meta, b64] = dataUrl.split(",");
    const mime = meta.match(/data:(.*?);base64/)?.[1] || "image/png";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  } catch {
    return null;
  }
}

async function uploadSignatureEvidence(
  userId: string,
  documentId: string,
  dataUrl: string
): Promise<string | null> {
  const blob = dataUrlToBlob(dataUrl);
  if (!blob) return null;
  const path = `${userId}/${documentId}-${Date.now()}.png`;
  const { error } = await supabase.storage
    .from("signature-evidence")
    .upload(path, blob, { contentType: "image/png", upsert: false });
  if (error) {
    console.warn("[SIGN] evidence upload failed:", error);
    return null;
  }
  return path;
}

async function logEvent(
  signatureId: string | null,
  clinicId: string,
  eventType: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (signatureId) {
      await supabase.from("medical_signature_events").insert({
        signature_id: signatureId,
        clinic_id: clinicId,
        event_type: eventType,
        metadata: metadata as any,
        created_by: userData?.user?.id || null,
      });
    } else {
      await supabase.from("access_logs").insert({
        clinic_id: clinicId,
        user_id: userData?.user?.id || "",
        action: `signature_event_${eventType}`,
        resource_type: "medical_signature",
        details: metadata as any,
      });
    }
  } catch (e) {
    console.warn("[SIGN] log event failed:", e);
  }
}

export function useUnifiedDocumentSigning() {
  const { clinic } = useClinicData();
  const { professionalId } = usePermissions();
  const [signing, setSigning] = useState(false);

  const reAuthenticate = useCallback(async (password: string): Promise<boolean> => {
    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email;
    if (!email) {
      toast.error("Sessão expirada. Faça login novamente.");
      return false;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Senha incorreta. Tente novamente.");
      return false;
    }
    return true;
  }, []);

  const signDocument = useCallback(
    async (input: SignDocumentInput): Promise<SignDocumentResult> => {
      const { context, password, method, handwrittenDataUrl, savedSignatureDataUrl } = input;

      if (!clinic?.id) {
        toast.error("Clínica não identificada.");
        return { success: false };
      }
      if (!context.document_id || !context.clinic_id || !context.patient_id) {
        toast.error("Contexto do documento incompleto.");
        return { success: false };
      }
      if (method === "handwritten" && !handwrittenDataUrl) {
        toast.error("Assinatura manuscrita está vazia.");
        return { success: false };
      }
      if (method === "saved_signature" && !savedSignatureDataUrl) {
        toast.error("Assinatura padrão indisponível.");
        return { success: false };
      }

      setSigning(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) {
          toast.error("Usuário não autenticado.");
          return { success: false };
        }

        await logEvent(null, clinic.id, "signature_requested", {
          document_id: context.document_id,
          document_type: context.document_type,
        });

        // Re-auth
        const ok = await reAuthenticate(password);
        if (!ok) return { success: false };
        await logEvent(null, clinic.id, "reauth_passed", {
          document_id: context.document_id,
        });

        // Hash + IP + UA
        const documentHash = await sha256({
          ...(context.snapshot || {}),
          __sign_method: method,
        });
        const userAgent = navigator.userAgent;
        let ipAddress: string | null = null;
        try {
          const r = await fetch("https://api.ipify.org?format=json");
          const j = await r.json();
          ipAddress = j?.ip || null;
        } catch { /* ignore */ }

        // Upload evidence (signature image used in this signing act)
        const evidenceDataUrl = method === "handwritten" ? handwrittenDataUrl! : savedSignatureDataUrl!;
        const evidencePath = await uploadSignatureEvidence(
          userId,
          context.document_id,
          evidenceDataUrl
        );

        const evidenceSnapshot = {
          method,
          has_saved_signature: method === "saved_signature",
          handwritten_path: evidencePath,
          signature_data_url: evidenceDataUrl, // immutable copy embedded in row
          captured_at: new Date().toISOString(),
        };

        // Insert signature row
        const { data: sigRow, error: sigErr } = await supabase
          .from("medical_record_signatures")
          .insert({
            clinic_id: clinic.id,
            patient_id: context.patient_id,
            record_id: context.document_id,
            record_type: RECORD_TYPE_MAP[context.document_type],
            signature_hash: documentHash,
            document_snapshot_json: (context.snapshot || {}) as any,
            signed_by: userId,
            signed_by_professional_id: professionalId,
            signed_by_name: context.professional_name || null,
            sign_method: method,
            ip_address: ipAddress,
            user_agent: userAgent,
            handwritten_path: evidencePath,
            evidence_snapshot: evidenceSnapshot as any,
            signature_level: "advanced",
            auth_method: "password_reauth",
          })
          .select("id")
          .single();
        if (sigErr) throw sigErr;

        await logEvent(sigRow.id, clinic.id, "document_hashed", {
          hash_preview: documentHash.substring(0, 16),
        });

        // Update source table
        const targetTable = context.target_table || SOURCE_TABLE_MAP[context.document_type];
        const now = new Date().toISOString();
        const updatePayload: Record<string, unknown> =
          context.document_type === "consolidated_document"
            ? {
                signed_at: now,
                signed_by: userId,
                status: "signed",
                is_locked: true,
                locked_at: now,
                hash_sha256: documentHash,
                signature_metadata: {
                  method,
                  signed_at: now,
                  user_id: userId,
                  ip_address: ipAddress,
                  user_agent: userAgent,
                  document_hash: documentHash,
                  signature_id: sigRow.id,
                  sign_method_label:
                    method === "saved_signature"
                      ? "Assinatura Avançada YesClin (assinatura salva)"
                      : "Assinatura Avançada YesClin (manuscrita)",
                },
              }
            : {
                status: "assinado",
                signed_at: now,
                signed_by: userId,
              };

        const { error: updErr } = await supabase
          .from(targetTable as any)
          .update(updatePayload as any)
          .eq("id", context.document_id);
        if (updErr) {
          console.error(`[SIGN] update ${targetTable} failed:`, updErr);
          if ((updErr as any).code === "42501") {
            throw new Error(
              "Permissão negada: você não é o profissional responsável por este registro."
            );
          }
          throw updErr;
        }

        await logEvent(sigRow.id, clinic.id, "document_signed", {
          document_type: context.document_type,
          method,
        });

        // Audit access_logs
        await supabase.from("access_logs").insert({
          clinic_id: clinic.id,
          user_id: userId,
          action: "advanced_sign_document",
          resource_type: context.document_type,
          resource_id: context.document_id,
          ip_address: ipAddress,
          user_agent: userAgent,
          details: { method, signature_id: sigRow.id } as any,
        });

        toast.success("Documento assinado com Assinatura Avançada YesClin.");
        return { success: true, signatureId: sigRow.id, documentHash };
      } catch (err: any) {
        console.error("[SIGN] error:", err);
        toast.error(err?.message || "Erro ao assinar documento.");
        return { success: false };
      } finally {
        setSigning(false);
      }
    },
    [clinic?.id, professionalId, reAuthenticate]
  );

  return { signing, signDocument, reAuthenticate };
}
