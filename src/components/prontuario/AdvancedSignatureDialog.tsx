/**
 * AdvancedSignatureDialog (Compatibility Wrapper)
 *
 * Thin adapter that keeps the legacy `entry` / `onSign` API used across the
 * Prontuário (Anamnese, Evoluções, Médico Geral) but delegates ALL signing
 * UX, validation, persistence, hash, evidence upload and audit trail to the
 * unified `UnifiedSignatureWizard` + `useUnifiedDocumentSigning` engine.
 *
 * This guarantees that Prontuário and Atendimento share the same signing
 * pipeline (saved signature / handwritten, SHA-256 hash, IP/UA capture,
 * snapshot persistence, source-table lock, signature events).
 *
 * The legacy `onSign(password)` prop is kept for backwards compatibility but
 * is no longer the primary path — the wizard performs the real signing and
 * fires `onSign` only as a notification hook so callers can refresh local
 * state. If the caller returns `false` we still consider the signature done
 * (the unified engine has already persisted everything).
 */
import { useMemo } from "react";
import { UnifiedSignatureWizard } from "@/components/signature/UnifiedSignatureWizard";
import type {
  SignableDocumentContext,
  SignableDocumentType,
} from "@/hooks/useUnifiedDocumentSigning";
import { useClinicData } from "@/hooks/useClinicData";
import type { MedicalRecordEntry } from "@/hooks/prontuario/useMedicalRecordEntries";

interface AdvancedSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: MedicalRecordEntry | null;
  professionalName: string;
  patientName: string;
  /** Kept for API compatibility; not used by the unified pipeline. */
  hasValidConsent?: boolean;
  /** Optional notification callback fired AFTER the unified engine signs.
   *  The boolean it returns is ignored — persistence already happened. */
  onSign?: (password: string) => Promise<boolean> | boolean;
  /** Kept for API compatibility — wizard manages its own loading state. */
  signing?: boolean;
}

const ENTRY_TYPE_TO_DOC_TYPE: Record<MedicalRecordEntry["entry_type"], SignableDocumentType> = {
  evolution: "evolution",
  anamnesis: "anamnesis",
};

export function AdvancedSignatureDialog({
  open,
  onOpenChange,
  entry,
  professionalName,
  patientName,
  onSign,
}: AdvancedSignatureDialogProps) {
  const { clinic } = useClinicData();

  const context: SignableDocumentContext | null = useMemo(() => {
    if (!entry || !clinic?.id) return null;
    return {
      document_type: ENTRY_TYPE_TO_DOC_TYPE[entry.entry_type],
      document_id: entry.id,
      patient_id: entry.patient_id,
      clinic_id: clinic.id,
      snapshot: entry.content || {},
      professional_name: professionalName,
    };
  }, [entry, clinic?.id, professionalName]);

  if (!entry) return null;

  return (
    <UnifiedSignatureWizard
      open={open}
      onOpenChange={onOpenChange}
      context={context}
      patientName={patientName}
      generatedAt={entry.created_at}
      onSigned={() => {
        // Notify legacy caller so it can refetch / update local state.
        // Persistence already completed inside the unified engine.
        try {
          onSign?.("");
        } catch {
          /* ignore — wizard already persisted the signature */
        }
      }}
    />
  );
}
