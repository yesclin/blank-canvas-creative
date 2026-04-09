import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface ActiveAppointment {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  appointment_type: string;
  professional_id: string;
  professional_name: string | null;
  procedure_id: string | null;
  procedure_name: string | null;
  procedure_specialty_id: string | null;
  procedure_specialty_name: string | null;
  specialty_id: string | null;
  specialty_name: string | null;
  resolved_specialty_id: string | null;
  resolved_specialty_name: string | null;
  started_at: string | null;
}

const ACTIVE_APPOINTMENT_STATUSES = [
  "em_atendimento",
  "in_progress",
  "atendendo",
  "attending",
] as const;

function isActiveAppointmentStatus(status: string | null | undefined) {
  return ACTIVE_APPOINTMENT_STATUSES.includes(
    status as (typeof ACTIVE_APPOINTMENT_STATUSES)[number]
  );
}

function mapAppointmentData(data: any): ActiveAppointment {
  const procedureSpecialtyId = data.procedures?.specialty_id || null;
  const procedureSpecialtyName = data.procedures?.specialties?.name || null;
  const resolvedSpecialtyId = data.specialty_id || procedureSpecialtyId;
  const resolvedSpecialtyName = data.specialties?.name || procedureSpecialtyName;
  
  return {
    id: data.id,
    scheduled_date: data.scheduled_date,
    start_time: data.start_time,
    end_time: data.end_time,
    status: data.status,
    appointment_type: data.appointment_type,
    professional_id: data.professional_id,
    professional_name: data.professionals?.full_name || null,
    procedure_id: data.procedure_id,
    procedure_name: data.procedures?.name || null,
    procedure_specialty_id: procedureSpecialtyId,
    procedure_specialty_name: procedureSpecialtyName,
    specialty_id: data.specialty_id || null,
    specialty_name: data.specialties?.name || null,
    resolved_specialty_id: resolvedSpecialtyId,
    resolved_specialty_name: resolvedSpecialtyName,
    started_at: data.started_at,
  };
}

/**
 * Check if there is an active appointment (in_progress status) for a patient today.
 * This determines whether the medical record fields can be edited.
 * 
 * An appointment is considered "active" if:
 * - It has started_at filled and finished_at is null, regardless of the scheduled date, OR
 * - It's scheduled for today and its status indicates the appointment is in progress:
 *   - "em_atendimento" (in progress - Portuguese)
 *   - "in_progress" (in progress - English)
 *   - "atendendo" (attending - Portuguese alternative)
 *   - "attending" (English alternative)
 *   - OR started_at is not null (appointment was explicitly started)
 * - AND finished_at is null (not finished yet)
 */
export function useActiveAppointment(patientId: string | null | undefined, preferredAppointmentId?: string | null) {
  return useQuery({
    queryKey: ["active-appointment", patientId, preferredAppointmentId],
    queryFn: async () => {
      if (!patientId) return null;
      
      const today = format(new Date(), "yyyy-MM-dd");
      
      const selectFields = `
        id,
        scheduled_date,
        start_time,
        end_time,
        status,
        appointment_type,
        professional_id,
        started_at,
        procedure_id,
        specialty_id,
        professionals(full_name),
        procedures(
          name,
          specialty_id,
          specialties:specialty_id(name)
        ),
        specialties(name)
      `;

      // If we have a preferred appointment ID from URL, try it first
      if (preferredAppointmentId) {
        const { data: preferred } = await supabase
          .from("appointments")
          .select(selectFields)
          .eq("id", preferredAppointmentId)
          .eq("patient_id", patientId)
          .is("finished_at", null)
          .maybeSingle();
        
        if (preferred && (isActiveAppointmentStatus(preferred.status) || preferred.started_at)) {
          return mapAppointmentData(preferred);
        }
      }

      const { data: startedAppointment, error: startedAppointmentError } = await supabase
        .from("appointments")
        .select(selectFields)
        .eq("patient_id", patientId)
        .not("started_at", "is", null)
        .is("finished_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (startedAppointmentError) {
        console.error("Error fetching started appointment:", startedAppointmentError);
      }

      if (startedAppointment) {
        return mapAppointmentData(startedAppointment);
      }
      
      const { data, error } = await supabase
        .from("appointments")
        .select(selectFields)
        .eq("patient_id", patientId)
        .eq("scheduled_date", today)
        .or("status.eq.em_atendimento,status.eq.in_progress,status.eq.atendendo,status.eq.attending,started_at.not.is.null")
        .is("finished_at", null)
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching active appointment:", error);
        return null;
      }
      
      if (!data) return null;
      
      return mapAppointmentData(data);
    },
    enabled: !!patientId,
    refetchInterval: 30000,
  });
}

/**
 * Returns whether editing is allowed based on active appointment status.
 * Editing is allowed when there's an active appointment in progress.
 */
export function useCanEditMedicalRecord(patientId: string | null | undefined, preferredAppointmentId?: string | null) {
  const { data: activeAppointment, isLoading } = useActiveAppointment(patientId, preferredAppointmentId);
  
  return {
    canEdit: !!activeAppointment,
    activeAppointment,
    isLoading,
    reason: activeAppointment 
      ? `Atendimento em andamento com ${activeAppointment.professional_name || 'profissional'}` 
      : 'Nenhum atendimento ativo. Inicie um atendimento para editar o prontuário.',
  };
}
