import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * usePatientClinicalAlerts — fonte única da verdade para alertas clínicos ativos.
 *
 * Regras (não alterar sem critério):
 *  - Filtro mínimo: patient_id + clinic_id + is_active = true
 *  - Não filtra por especialidade, tipo, severidade ou atendimento
 *  - Não aplica limite (.limit) — o limite visual é responsabilidade do componente
 *  - acknowledged_at NÃO esconde alerta ativo
 *  - Ordenação: critical → warning → info → created_at desc
 *
 * Use este hook em TODOS os locais que exibem ou contam alertas clínicos
 * (visão geral, aba alertas, drawer de atendimento, badges, resumo).
 */

export type ClinicalAlertSeverity = "critical" | "warning" | "info";

export interface PatientClinicalAlert {
  id: string;
  clinic_id: string;
  patient_id: string;
  alert_type: string;
  title: string;
  description: string | null;
  severity: ClinicalAlertSeverity;
  is_active: boolean;
  appointment_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function sortClinicalAlerts(alerts: PatientClinicalAlert[]): PatientClinicalAlert[] {
  return [...alerts].sort((a, b) => {
    const sa = SEVERITY_ORDER[a.severity] ?? 99;
    const sb = SEVERITY_ORDER[b.severity] ?? 99;
    if (sa !== sb) return sa - sb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function usePatientClinicalAlerts(
  patientId: string | null | undefined,
  clinicId: string | null | undefined,
) {
  const enabled = !!patientId && !!clinicId;

  const query = useQuery({
    queryKey: ["patient-clinical-alerts", patientId, clinicId],
    enabled,
    staleTime: 30_000,
    queryFn: async (): Promise<PatientClinicalAlert[]> => {
      const { data, error } = await supabase
        .from("clinical_alerts")
        .select(
          "id, clinic_id, patient_id, alert_type, title, description, severity, is_active, appointment_id, created_by, created_at, updated_at",
        )
        .eq("patient_id", patientId as string)
        .eq("clinic_id", clinicId as string)
        .eq("is_active", true);

      if (error) {
        console.error("[CLINICAL_ALERTS] fetch error:", error);
        throw error;
      }

      // Dedup por id (caso a query retorne duplicatas por algum join futuro)
      const map = new Map<string, PatientClinicalAlert>();
      (data || []).forEach((row) => {
        if (!map.has(row.id)) map.set(row.id, row as PatientClinicalAlert);
      });
      const list = sortClinicalAlerts(Array.from(map.values()));

      // Logs temporários — diagnóstico de inconsistências de contagem
      console.log("[CLINICAL_ALERTS] patientId:", patientId);
      console.log("[CLINICAL_ALERTS] total:", list.length);
      console.log("[CLINICAL_ALERTS] alerts:", list);

      return list;
    },
  });

  const alerts = query.data ?? [];

  return {
    alerts,
    total: alerts.length,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
