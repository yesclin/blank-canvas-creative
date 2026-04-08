import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";

export type LockReason = "editable" | "locked_time" | "locked_signature" | "locked_time_and_signature";

export interface RecordEditability {
  /** Whether the record can still be edited */
  canEdit: boolean;
  /** Why the record is locked */
  lockReason: LockReason;
  /** Human-readable message */
  lockMessage: string | null;
  /** When the edit window expires (null if already expired or signed) */
  editableUntil: Date | null;
  /** Whether the record is signed */
  isSigned: boolean;
  /** Minutes remaining in edit window (0 if expired) */
  minutesRemaining: number;
  /** Whether justification is required for edits within the window */
  requiresJustification: boolean;
  /** Whether justification is required for addendums */
  requiresAddendumJustification: boolean;
  /** Loading state */
  isLoading: boolean;
}

interface RecordInfo {
  recordId: string;
  recordType: "anamnesis" | "evolution" | "document";
  createdAt: string; // ISO timestamp
  signedAt?: string | null;
}

/**
 * Hook that determines if a clinical record can be edited based on:
 * 1. Clinic security config (allow_evolution_edit_minutes)
 * 2. Whether the record is signed
 * 3. Time elapsed since creation
 */
export function useRecordEditability(record: RecordInfo | null): RecordEditability {
  const { clinic } = useClinicData();

  // Fetch security config for the clinic
  const { data: secConfig, isLoading: configLoading } = useQuery({
    queryKey: ["medical-record-security-config", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return null;
      const { data, error } = await supabase
        .from("medical_record_security_config")
        .select("allow_evolution_edit_minutes, lock_after_signature, require_justification_for_edit, require_justification_for_addendum, signature_blocks_immediately")
        .eq("clinic_id", clinic.id)
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("Error fetching security config:", error);
        return null;
      }
      return data;
    },
    enabled: !!clinic?.id,
    staleTime: 60000,
  });

  // Check if record is signed
  const { data: signatureData, isLoading: sigLoading } = useQuery({
    queryKey: ["record-signature-check", record?.recordId],
    queryFn: async () => {
      if (!record?.recordId) return null;
      const { data } = await supabase
        .from("medical_record_signatures")
        .select("id, signed_at")
        .eq("record_id", record.recordId)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!record?.recordId,
    staleTime: 30000,
  });

  return useMemo((): RecordEditability => {
    const isLoading = configLoading || sigLoading;

    if (!record || isLoading) {
      return {
        canEdit: false,
        lockReason: "editable",
        lockMessage: null,
        editableUntil: null,
        isSigned: false,
        minutesRemaining: 0,
        requiresJustification: false,
        requiresAddendumJustification: false,
        isLoading,
      };
    }

    const editMinutes = secConfig?.allow_evolution_edit_minutes ?? 60;
    const lockAfterSig = secConfig?.lock_after_signature ?? true;
    const sigBlocksImmediately = secConfig?.signature_blocks_immediately ?? true;
    const requiresJustification = secConfig?.require_justification_for_edit ?? true;
    const requiresAddendumJustification = secConfig?.require_justification_for_addendum ?? false;

    const isSigned = !!(signatureData?.signed_at || record.signedAt);
    const createdAt = new Date(record.createdAt);
    const editableUntil = new Date(createdAt.getTime() + editMinutes * 60 * 1000);
    const now = new Date();
    const isTimeExpired = now > editableUntil;
    const minutesRemaining = isTimeExpired ? 0 : Math.ceil((editableUntil.getTime() - now.getTime()) / 60000);

    // Rule 1: Signed + signature blocks → absolute lock
    if (isSigned && (lockAfterSig || sigBlocksImmediately)) {
      return {
        canEdit: false,
        lockReason: isTimeExpired ? "locked_time_and_signature" : "locked_signature",
        lockMessage: "Este registro está assinado e não pode ser alterado. Utilize adendo para complementos.",
        editableUntil: null,
        isSigned: true,
        minutesRemaining: 0,
        requiresJustification,
        requiresAddendumJustification,
        isLoading: false,
      };
    }

    // Rule 2: Time window expired → lock
    if (isTimeExpired) {
      return {
        canEdit: false,
        lockReason: "locked_time",
        lockMessage: `Este registro está bloqueado para edição (janela de ${editMinutes} minutos expirada). Utilize adendo para complementos.`,
        editableUntil,
        isSigned: false,
        minutesRemaining: 0,
        requiresJustification,
        requiresAddendumJustification,
        isLoading: false,
      };
    }

    // Within edit window
    return {
      canEdit: true,
      lockReason: "editable",
      lockMessage: null,
      editableUntil,
      isSigned,
      minutesRemaining,
      requiresJustification,
      requiresAddendumJustification,
      isLoading: false,
    };
  }, [record, secConfig, signatureData, configLoading, sigLoading]);
}
