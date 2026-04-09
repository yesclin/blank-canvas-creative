/**
 * Central hook for anamnesis record editability.
 * Wraps useRecordEditability and adds anamnesis-specific status transitions.
 */
import { useMemo, useCallback } from "react";
import { useRecordEditability, type RecordEditability } from "./useRecordEditability";
import { supabase } from "@/integrations/supabase/client";

export type AnamnesisStatus = "draft" | "saved_editable" | "locked" | "signed" | "addendum_only";

export interface AnamnesisEditabilityResult {
  /** Full editability info from the base hook */
  editability: RecordEditability;
  /** Resolved anamnesis status */
  status: AnamnesisStatus;
  /** Whether the record content fields should be readonly */
  isReadonly: boolean;
  /** Whether addendums can be added */
  canAddAddendum: boolean;
  /** Sets saved_at + edit_window_until on first save */
  markAsSaved: (recordId: string) => Promise<void>;
  /** Sets locked_at when time expires */
  markAsLocked: (recordId: string) => Promise<void>;
}

interface AnamnesisRecordInfo {
  id: string;
  created_at: string;
  signed_at?: string | null;
  saved_at?: string | null;
  edit_window_until?: string | null;
  locked_at?: string | null;
  status?: string | null;
}

/**
 * Determines editability for an anamnesis record using the global security config.
 */
export function useAnamnesisEditability(
  record: AnamnesisRecordInfo | null
): AnamnesisEditabilityResult {
  const recordInfo = useMemo(() => {
    if (!record) return null;
    return {
      recordId: record.id,
      recordType: "anamnesis" as const,
      createdAt: record.created_at,
      signedAt: record.signed_at,
    };
  }, [record?.id, record?.created_at, record?.signed_at]);

  const editability = useRecordEditability(recordInfo);

  const status = useMemo((): AnamnesisStatus => {
    if (!record) return "draft";
    if (record.signed_at || editability.isSigned) return "signed";
    if (record.locked_at || editability.lockReason === "locked_time") return "locked";
    if (record.saved_at && editability.canEdit) return "saved_editable";
    if (!record.saved_at) return "draft";
    return "locked";
  }, [record, editability]);

  const isReadonly = status === "locked" || status === "signed" || status === "addendum_only";
  const canAddAddendum = isReadonly && !editability.isLoading;

  const markAsSaved = useCallback(async (recordId: string) => {
    const now = new Date();
    const editWindowUntil = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

    await supabase
      .from("anamnesis_records")
      .update({
        saved_at: now.toISOString(),
        edit_window_until: editWindowUntil.toISOString(),
        status: "rascunho", // keep using existing enum value for now
      } as any)
      .eq("id", recordId);
  }, []);

  const markAsLocked = useCallback(async (recordId: string) => {
    await supabase
      .from("anamnesis_records")
      .update({
        locked_at: new Date().toISOString(),
      } as any)
      .eq("id", recordId);
  }, []);

  return {
    editability,
    status,
    isReadonly,
    canAddAddendum,
    markAsSaved,
    markAsLocked,
  };
}
