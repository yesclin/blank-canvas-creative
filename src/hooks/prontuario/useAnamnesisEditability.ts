/**
 * Central hook for anamnesis record editability.
 * Wraps useRecordEditability and adds anamnesis-specific status transitions.
 */
import { useMemo, useCallback } from "react";
import { useRecordEditability, type RecordEditability } from "./useRecordEditability";
import { supabase } from "@/integrations/supabase/client";

export type AnamnesisStatus = "draft" | "saved_editable" | "locked" | "signed" | "addendum_only" | "discarded";

export interface AnamnesisEditabilityResult {
  editability: RecordEditability;
  status: AnamnesisStatus;
  isReadonly: boolean;
  canAddAddendum: boolean;
  canDiscard: boolean;
  markAsSaved: (recordId: string) => Promise<void>;
  markAsLocked: (recordId: string) => Promise<void>;
  discardRecord: (recordId: string, reason: string) => Promise<void>;
}

interface AnamnesisRecordInfo {
  id: string;
  created_at: string;
  signed_at?: string | null;
  saved_at?: string | null;
  edit_window_until?: string | null;
  locked_at?: string | null;
  status?: string | null;
  discarded_at?: string | null;
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
    if (record.discarded_at) return "discarded";
    if (record.signed_at || editability.isSigned) return "signed";
    if (record.locked_at || editability.lockReason === "locked_time") return "locked";
    if (record.saved_at && editability.canEdit) return "saved_editable";
    if (!record.saved_at) return "draft";
    return "locked";
  }, [record, editability]);

  const isReadonly = status === "locked" || status === "signed" || status === "addendum_only" || status === "discarded";
  const canAddAddendum = (status === "locked" || status === "signed" || status === "addendum_only") && !editability.isLoading;
  const canDiscard = !!record && !record.signed_at && !record.discarded_at && !!record.saved_at;

  const markAsSaved = useCallback(async (recordId: string) => {
    const now = new Date();
    const editWindowUntil = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

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

  const discardRecord = useCallback(async (recordId: string, reason: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    await supabase
      .from("anamnesis_records")
      .update({
        discarded_at: new Date().toISOString(),
        discarded_by: userId,
        discard_reason: reason,
        status: "descartado",
      } as any)
      .eq("id", recordId);
  }, []);

  return {
    editability,
    status,
    isReadonly,
    canAddAddendum,
    canDiscard,
    markAsSaved,
    markAsLocked,
    discardRecord,
  };
}
