/**
 * Fase 2B — Integração de Pacotes com Prontuário / Atendimento / Agenda.
 * Sem migração: apenas reaproveita colunas e triggers existentes.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveClinicScope } from "@/hooks/useActiveClinicScope";

export interface PatientPackageOption {
  id: string;
  name: string;
  procedure_id: string | null;
  professional_id: string | null;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
  scheduled_open: number; // sessões vinculadas ainda não finalizadas
  status: string;
  total_amount: number;
  paid_amount: number;
  procedure_name: string | null;
  professional_name: string | null;
}

/**
 * Pacotes ATIVOS de um paciente + contagem de sessões pendentes/agendadas.
 * Usado no dialog da agenda e no atendimento.
 */
export function useActivePackagesByPatient(patientId: string | null | undefined) {
  const { scope } = useActiveClinicScope();
  return useQuery({
    queryKey: ["active-packages-by-patient", scope.clinicId, patientId],
    enabled: !!scope.clinicId && !!patientId,
    queryFn: async (): Promise<PatientPackageOption[]> => {
      const { data: pkgs, error } = await supabase
        .from("treatment_packages")
        .select(`
          id, name, procedure_id, professional_id,
          total_sessions, used_sessions, status, total_amount, paid_amount,
          procedures:procedure_id(name),
          professionals:professional_id(full_name)
        `)
        .eq("clinic_id", scope.clinicId!)
        .eq("patient_id", patientId!)
        .eq("status", "ativo")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = pkgs ?? [];
      if (rows.length === 0) return [];

      // Contar appointments abertos por pacote (não-finalizados nem cancelados)
      const ids = rows.map(r => r.id);
      const { data: appts } = await supabase
        .from("appointments")
        .select("treatment_package_id, status")
        .eq("clinic_id", scope.clinicId!)
        .in("treatment_package_id", ids);
      const openMap = new Map<string, number>();
      (appts ?? []).forEach((a: any) => {
        if (!["finalizado", "cancelado"].includes(a.status)) {
          openMap.set(a.treatment_package_id, (openMap.get(a.treatment_package_id) ?? 0) + 1);
        }
      });

      return rows.map((r: any) => {
        const total = Number(r.total_sessions ?? 0);
        const used = Number(r.used_sessions ?? 0);
        return {
          id: r.id,
          name: r.name,
          procedure_id: r.procedure_id,
          professional_id: r.professional_id,
          total_sessions: total,
          used_sessions: used,
          remaining_sessions: Math.max(0, total - used),
          scheduled_open: openMap.get(r.id) ?? 0,
          status: r.status,
          total_amount: Number(r.total_amount ?? 0),
          paid_amount: Number(r.paid_amount ?? 0),
          procedure_name: r.procedures?.name ?? null,
          professional_name: r.professionals?.full_name ?? null,
        };
      });
    },
  });
}

/**
 * Contexto do pacote para um appointment específico.
 * Retorna "Sessão X de Y" (X = ordem cronológica desta sessão entre appointments finalizados + esta).
 */
export interface AppointmentPackageContext {
  package: {
    id: string;
    name: string;
    total_sessions: number;
    used_sessions: number;
    total_amount: number;
    paid_amount: number;
    status: string;
    procedure_name: string | null;
    professional_name: string | null;
    patient_id: string;
    procedure_id: string | null;
    professional_id: string | null;
  };
  session_index: number; // X
  session_total: number; // Y
}

export function useAppointmentPackageContext(appointmentId: string | null | undefined) {
  const { scope } = useActiveClinicScope();
  return useQuery({
    queryKey: ["appointment-package-context", appointmentId],
    enabled: !!scope.clinicId && !!appointmentId,
    queryFn: async (): Promise<AppointmentPackageContext | null> => {
      const { data: appt } = await supabase
        .from("appointments")
        .select("id, treatment_package_id, scheduled_date, start_time, status")
        .eq("id", appointmentId!)
        .maybeSingle();
      if (!appt?.treatment_package_id) return null;

      const { data: pkg } = await supabase
        .from("treatment_packages")
        .select(`
          id, name, patient_id, procedure_id, professional_id,
          total_sessions, used_sessions, total_amount, paid_amount, status,
          procedures:procedure_id(name),
          professionals:professional_id(full_name)
        `)
        .eq("id", appt.treatment_package_id)
        .maybeSingle();
      if (!pkg) return null;

      // Ordem cronológica desta sessão entre todos appointments do pacote (não cancelados)
      const { data: all } = await supabase
        .from("appointments")
        .select("id, scheduled_date, start_time, status")
        .eq("clinic_id", scope.clinicId!)
        .eq("treatment_package_id", pkg.id)
        .neq("status", "cancelado")
        .order("scheduled_date", { ascending: true })
        .order("start_time", { ascending: true });
      const list = all ?? [];
      const idx = list.findIndex((a: any) => a.id === appt.id);
      const sessionIndex = idx >= 0 ? idx + 1 : (Number((pkg as any).used_sessions ?? 0) + 1);

      return {
        package: {
          id: pkg.id,
          name: pkg.name,
          total_sessions: Number(pkg.total_sessions ?? 0),
          used_sessions: Number(pkg.used_sessions ?? 0),
          total_amount: Number(pkg.total_amount ?? 0),
          paid_amount: Number(pkg.paid_amount ?? 0),
          status: pkg.status as string,
          procedure_name: (pkg as any).procedures?.name ?? null,
          professional_name: (pkg as any).professionals?.full_name ?? null,
          patient_id: pkg.patient_id as string,
          procedure_id: pkg.procedure_id as string | null,
          professional_id: pkg.professional_id as string | null,
        },
        session_index: sessionIndex,
        session_total: Number(pkg.total_sessions ?? 0),
      };
    },
  });
}

/**
 * Todos pacotes (ativos+concluídos+cancelados) de um paciente para a aba do prontuário.
 */
export function usePatientPackagesFull(patientId: string | null | undefined) {
  const { scope } = useActiveClinicScope();
  return useQuery({
    queryKey: ["patient-packages-full", scope.clinicId, patientId],
    enabled: !!scope.clinicId && !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_packages")
        .select(`
          *,
          procedures:procedure_id(name),
          professionals:professional_id(full_name)
        `)
        .eq("clinic_id", scope.clinicId!)
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
