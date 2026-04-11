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

// ─── Sign document ───────────────────────────────────────
export function useSignDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { documentId: string; clinicId: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error("Não autenticado");

      const now = new Date().toISOString();
      const { error } = await supabase
        .from("clinical_attendance_documents")
        .update({
          signed_at: now,
          signed_by: userId,
          status: "signed",
          signature_metadata: {
            method: "system_auth",
            signed_at: now,
            user_id: userId,
            ip: null, // placeholder for future IP capture
          } as any,
        })
        .eq("id", params.documentId);
      if (error) throw error;

      await logDocumentAction({
        documentId: params.documentId,
        clinicId: params.clinicId,
        actionType: "signed",
      });
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ["attendance-detail"] });
      qc.invalidateQueries({ queryKey: ["doc-history", params.documentId] });
      toast.success("Documento assinado com sucesso.");
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
