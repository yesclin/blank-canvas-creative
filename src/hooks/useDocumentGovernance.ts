import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────
export interface DocumentNote {
  id: string;
  document_id: string;
  clinic_id: string;
  author_id: string;
  note_type: string;
  content: string;
  created_at: string;
}

export interface DocumentHistoryEntry {
  id: string;
  document_id: string;
  clinic_id: string;
  action_type: string;
  performed_by: string | null;
  metadata: any;
  created_at: string;
}

// ─── Fetch notes for a document ──────────────────────────
export function useDocumentNotes(documentId: string | null) {
  return useQuery({
    queryKey: ["doc-notes", documentId],
    queryFn: async () => {
      if (!documentId) return [];
      const { data, error } = await supabase
        .from("clinical_attendance_document_notes")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as DocumentNote[];
    },
    enabled: !!documentId,
  });
}

// ─── Add a note / addendum ───────────────────────────────
export function useAddDocumentNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      documentId: string;
      clinicId: string;
      noteType: "note" | "addendum";
      content: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("clinical_attendance_document_notes")
        .insert({
          document_id: params.documentId,
          clinic_id: params.clinicId,
          author_id: userId,
          note_type: params.noteType,
          content: params.content,
        })
        .select("id")
        .single();
      if (error) throw error;

      // Log history
      await logDocumentAction({
        documentId: params.documentId,
        clinicId: params.clinicId,
        actionType: params.noteType === "addendum" ? "addendum_added" : "note_added",
        metadata: { note_id: data.id },
      });

      return data;
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ["doc-notes", params.documentId] });
      qc.invalidateQueries({ queryKey: ["doc-history", params.documentId] });
      toast.success(params.noteType === "addendum" ? "Adendo registrado." : "Nota adicionada.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao salvar nota.");
    },
  });
}

// ─── Sign document (Assinatura Avançada YesClin) ─────────
// Same flow as prontuário: password reauth + SHA-256 hash + audit trail
async function generateDocumentHash(content: unknown): Promise<string> {
  const jsonString = JSON.stringify(
    content,
    content && typeof content === "object" ? Object.keys(content as object).sort() : undefined
  );
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function useSignDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { documentId: string; clinicId: string; password: string; snapshot?: unknown }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      const email = userData?.user?.email;
      if (!userId || !email) throw new Error("Sessão expirada. Faça login novamente.");

      // 1. Re-authenticate user with password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: params.password,
      });
      if (authError) {
        throw new Error("Senha incorreta. Tente novamente.");
      }

      // 2. Generate SHA-256 hash of the snapshot for integrity
      let documentHash: string | null = null;
      try {
        if (params.snapshot) documentHash = await generateDocumentHash(params.snapshot);
      } catch (e) {
        console.warn("[SIGN_DOC] Hash generation failed:", e);
      }

      // 3. Capture IP / user agent
      const userAgent = navigator.userAgent;
      let ipAddress: string | null = null;
      try {
        const r = await fetch("https://api.ipify.org?format=json");
        const j = await r.json();
        ipAddress = j.ip || null;
      } catch { /* ignore */ }

      // 4. Update the consolidated document with signature
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("clinical_attendance_documents")
        .update({
          signed_at: now,
          signed_by: userId,
          status: "signed",
          signature_metadata: {
            method: "password_reauth",
            signed_at: now,
            user_id: userId,
            ip_address: ipAddress,
            user_agent: userAgent,
            document_hash: documentHash,
            sign_method_label: "Assinatura Avançada YesClin",
          } as any,
        })
        .eq("id", params.documentId);
      if (error) throw error;

      // 5. Log access + governance history
      await supabase.from("access_logs").insert({
        clinic_id: params.clinicId,
        user_id: userId,
        action: "advanced_sign_attendance_document",
        resource_type: "clinical_attendance_document",
        resource_id: params.documentId,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      await logDocumentAction({
        documentId: params.documentId,
        clinicId: params.clinicId,
        actionType: "signed",
        metadata: {
          method: "password_reauth",
          hash_preview: documentHash?.substring(0, 16) || null,
        },
      });
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ["attendance-detail"] });
      qc.invalidateQueries({ queryKey: ["doc-history", params.documentId] });
      toast.success("Documento assinado com Assinatura Avançada YesClin.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao assinar documento.");
    },
  });
}

// ─── Fetch document action history ───────────────────────
export function useDocumentHistory(documentId: string | null) {
  return useQuery({
    queryKey: ["doc-history", documentId],
    queryFn: async () => {
      if (!documentId) return [];
      const { data, error } = await supabase
        .from("clinical_attendance_document_history")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as DocumentHistoryEntry[];
    },
    enabled: !!documentId,
  });
}

// ─── Log a document action ──────────────────────────────
export async function logDocumentAction(params: {
  documentId: string;
  clinicId: string;
  actionType: string;
  metadata?: any;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id || null;

  await supabase.from("clinical_attendance_document_history").insert({
    document_id: params.documentId,
    clinic_id: params.clinicId,
    action_type: params.actionType,
    performed_by: userId,
    metadata: params.metadata || {},
  });
}
