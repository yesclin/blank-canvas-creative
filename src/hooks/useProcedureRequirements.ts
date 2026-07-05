/**
 * Fase 3 — Integração Procedimento × Atendimento.
 *
 * Carrega o procedimento vinculado ao agendamento (com os novos flags),
 * consulta o estado clínico atual e devolve o checklist de requisitos
 * (pendente / concluído) para bloquear a finalização quando algo faltar.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProcedureRequirementKey =
  | "anamnesis"
  | "evolution"
  | "signature"
  | "before_after_photos"
  | "consent_term";

export interface ProcedureRequirementItem {
  key: ProcedureRequirementKey;
  label: string;
  required: boolean;
  satisfied: boolean;
  helperText?: string;
}

export interface ProcedureRequirementsData {
  procedure: {
    id: string;
    name: string;
    type: string | null;
    protocol_notes: string | null;
    pre_procedure_care: string | null;
    post_procedure_care: string | null;
    contraindications: string | null;
    possible_intercurrences: string | null;
    uses_sessions: boolean;
    charge_on_schedule: boolean | null;
    charge_on_finish: boolean | null;
    requires_anamnesis: boolean;
    requires_evolution: boolean;
    requires_signature: boolean;
    requires_before_after_photos: boolean;
    requires_consent_term: boolean;
  } | null;
  requirements: ProcedureRequirementItem[];
  hasBlockingPending: boolean;
  isLegacyProcedure: boolean;
}

async function countRows(
  table: string,
  filters: Record<string, string | boolean | null>,
): Promise<number> {
  let q = supabase.from(table as any).select("id", { count: "exact", head: true });
  for (const [k, v] of Object.entries(filters)) {
    if (v === null) q = q.is(k, null);
    else q = q.eq(k, v as any);
  }
  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
}

export function useProcedureRequirements(
  appointmentId: string | null | undefined,
) {
  return useQuery<ProcedureRequirementsData>({
    queryKey: ["procedure-requirements", appointmentId],
    enabled: !!appointmentId,
    staleTime: 15_000,
    queryFn: async () => {
      const empty: ProcedureRequirementsData = {
        procedure: null,
        requirements: [],
        hasBlockingPending: false,
        isLegacyProcedure: true,
      };
      if (!appointmentId) return empty;

      // 1. Load appointment + procedure with the new flags.
      const { data: apt } = await supabase
        .from("appointments")
        .select(`
          id, patient_id, clinic_id, procedure_id,
          procedures(
            id, name, type, protocol_notes,
            pre_procedure_care, post_procedure_care,
            contraindications, possible_intercurrences,
            uses_sessions, charge_on_schedule, charge_on_finish,
            requires_anamnesis, requires_evolution, requires_signature,
            requires_before_after_photos, requires_consent_term
          )
        `)
        .eq("id", appointmentId)
        .maybeSingle();

      const proc = (apt?.procedures as any) ?? null;
      if (!apt || !proc) return empty;

      // 2. Fetch current clinical state (best-effort; degrade gracefully).
      const [anamCount, evolCount, sigCount, baAestheticCount, baGeneralCount, consentCount, consolidatedDoc] = await Promise.all([
        countRows("anamnesis_records", { appointment_id: appointmentId }),
        countRows("clinical_evolutions", { appointment_id: appointmentId }),
        // Signatures are linked via record_id (consolidated_document). Load consolidated first.
        Promise.resolve(0),
        countRows("aesthetic_before_after", { appointment_id: appointmentId }),
        countRows("before_after_records", { appointment_id: appointmentId }),
        countRows("patient_consents", { appointment_id: appointmentId, status: "accepted" }),
        supabase
          .from("clinical_attendance_documents")
          .select("id, signed_at")
          .eq("appointment_id", appointmentId)
          .limit(1)
          .maybeSingle(),
      ]);

      let signatureSatisfied = false;
      if (consolidatedDoc.data?.signed_at) signatureSatisfied = true;

      const beforeAfterSatisfied = baAestheticCount + baGeneralCount > 0;

      const requirements: ProcedureRequirementItem[] = [];
      if (proc.requires_anamnesis) {
        requirements.push({
          key: "anamnesis",
          label: "Anamnese preenchida",
          required: true,
          satisfied: anamCount > 0,
          helperText: anamCount > 0 ? undefined : "Preencha a anamnese no prontuário.",
        });
      }
      if (proc.requires_evolution) {
        requirements.push({
          key: "evolution",
          label: "Evolução registrada",
          required: true,
          satisfied: evolCount > 0,
          helperText: evolCount > 0 ? undefined : "Registre a evolução do atendimento.",
        });
      }
      if (proc.requires_signature) {
        requirements.push({
          key: "signature",
          label: "Assinatura do documento consolidado",
          required: true,
          satisfied: signatureSatisfied,
          helperText: signatureSatisfied ? undefined : "Assine o documento clínico antes de finalizar.",
        });
      }
      if (proc.requires_before_after_photos) {
        requirements.push({
          key: "before_after_photos",
          label: "Fotos antes e depois",
          required: true,
          satisfied: beforeAfterSatisfied,
          helperText: beforeAfterSatisfied ? undefined : "Adicione ao menos um registro antes/depois.",
        });
      }
      if (proc.requires_consent_term) {
        requirements.push({
          key: "consent_term",
          label: "Termo de consentimento",
          required: true,
          satisfied: consentCount > 0,
          helperText: consentCount > 0 ? undefined : "Registre a aceitação do termo de consentimento.",
        });
      }

      const hasBlockingPending = requirements.some((r) => r.required && !r.satisfied);

      return {
        procedure: {
          id: proc.id,
          name: proc.name,
          type: proc.type ?? null,
          protocol_notes: proc.protocol_notes ?? null,
          pre_procedure_care: proc.pre_procedure_care ?? null,
          post_procedure_care: proc.post_procedure_care ?? null,
          contraindications: proc.contraindications ?? null,
          possible_intercurrences: proc.possible_intercurrences ?? null,
          uses_sessions: !!proc.uses_sessions,
          charge_on_schedule: proc.charge_on_schedule ?? null,
          charge_on_finish: proc.charge_on_finish ?? null,
          requires_anamnesis: !!proc.requires_anamnesis,
          requires_evolution: !!proc.requires_evolution,
          requires_signature: !!proc.requires_signature,
          requires_before_after_photos: !!proc.requires_before_after_photos,
          requires_consent_term: !!proc.requires_consent_term,
        },
        requirements,
        hasBlockingPending,
        isLegacyProcedure: false,
      };
    },
  });
}
