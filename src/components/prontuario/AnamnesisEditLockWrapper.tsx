/**
 * AnamnesisEditLockWrapper
 * 
 * Drop-in wrapper that adds edit-lock banner + addendum section to any anamnesis record view.
 * Integrates with useAnamnesisEditability for centralized lock/unlock logic.
 */
import { RecordEditLockBanner } from "./RecordEditLockBanner";
import { AddendumSection } from "./AddendumSection";
import type { AnamnesisEditabilityResult } from "@/hooks/prontuario/useAnamnesisEditability";

interface Props {
  /** Result from useAnamnesisEditability */
  editabilityResult: AnamnesisEditabilityResult;
  /** Record ID */
  recordId: string;
  /** Patient ID */
  patientId: string;
  /** Professional ID for addendum creation */
  professionalId: string;
  /** Optional specialty ID */
  specialtyId?: string | null;
  /** Children = the actual form/view content */
  children: React.ReactNode;
}

export function AnamnesisEditLockWrapper({
  editabilityResult,
  recordId,
  patientId,
  professionalId,
  specialtyId,
  children,
}: Props) {
  const { editability, status, canAddAddendum } = editabilityResult;

  return (
    <div className="space-y-3">
      {/* Lock/edit status banner */}
      <RecordEditLockBanner editability={editability} />

      {/* Signed indicator */}
      {status === "signed" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300">
          <span className="font-semibold">🔒 Registro assinado digitalmente — imutável</span>
        </div>
      )}

      {/* Form/view content (parent handles readonly) */}
      {children}

      {/* Addendum section (visible when locked or signed) */}
      {canAddAddendum && (
        <AddendumSection
          recordType="anamnesis"
          recordId={recordId}
          patientId={patientId}
          professionalId={professionalId}
          specialtyId={specialtyId}
          moduleOrigin="anamnese"
          editability={editability}
        />
      )}
    </div>
  );
}
