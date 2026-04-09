import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { useClinicData } from "@/hooks/useClinicData";
import type { Appointment } from "@/types/agenda";

const ACTIVE_APPOINTMENT_SELECT = `
  id,
  clinic_id,
  patient_id,
  professional_id,
  room_id,
  specialty_id,
  insurance_id,
  procedure_id,
  scheduled_date,
  start_time,
  end_time,
  duration_minutes,
  appointment_type,
  status,
  is_first_visit,
  is_return,
  is_fit_in,
  has_pending_payment,
  payment_type,
  payment_status,
  amount_expected,
  amount_received,
  amount_due,
  expected_value,
  procedure_cost,
  booking_source,
  patient_snapshot_name,
  patient_snapshot_phone,
  notes,
  cancellation_reason,
  arrived_at,
  started_at,
  finished_at,
  created_at,
  care_mode,
  meeting_provider,
  meeting_link,
  meeting_id,
  meeting_password,
  meeting_status,
  meeting_created_at,
  meeting_started_at,
  meeting_ended_at,
  precheck_status,
  consent_telehealth_accepted,
  consent_telehealth_accepted_at,
  technical_issue_count,
  teleconsultation_notes,
  paused_at,
  payment_method_id,
  created_source,
  created_by,
  patients:patient_id(id, full_name, email, phone, cpf, birth_date, gender, avatar_url, has_clinical_alert, clinical_alert_text, is_active, clinic_id),
  professionals:professional_id(id, full_name, email, phone, registration_number, avatar_url, color, is_active, clinic_id),
  specialties:specialty_id(id, name, color, is_active, clinic_id),
  procedures:procedure_id(id, name, duration_minutes, price:procedure_cost),
  rooms:room_id(id, name, is_active, clinic_id),
  insurances:insurance_id(id, name, is_active, clinic_id)
`;

function mapAppointmentRow(row: any): Appointment {
  return {
    ...row,
    patient: row.patients || undefined,
    professional: row.professionals || undefined,
    specialty: row.specialties || undefined,
    procedure: row.procedures || undefined,
    room: row.rooms || undefined,
    insurance: row.insurances || undefined,
  };
}

export function useGlobalActiveAppointments() {
  const { role, professionalId, isLoading: permLoading } = usePermissions();
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const queryClient = useQueryClient();

  const clinicId = clinic?.id;
  const isProfessional = role === "profissional";

  const query = useQuery({
    queryKey: ["global-active-appointments", clinicId, isProfessional ? professionalId : "all"],
    queryFn: async (): Promise<Appointment[]> => {
      if (!clinicId) return [];

      let q = supabase
        .from("appointments")
        .select(ACTIVE_APPOINTMENT_SELECT)
        .eq("clinic_id", clinicId)
        .eq("status", "em_atendimento")
        .is("finished_at", null)
        .order("started_at", { ascending: false });

      // Professional sees only their own
      if (isProfessional && professionalId) {
        q = q.eq("professional_id", professionalId);
      }

      const { data, error } = await q;
      if (error) {
        console.error("Error fetching global active appointments:", error);
        return [];
      }

      return (data || []).map(mapAppointmentRow);
    },
    enabled: !!clinicId && !permLoading && !clinicLoading,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Realtime subscription for appointment status changes
  useEffect(() => {
    if (!clinicId) return undefined;

    const channelName = `global-active-appointments-${clinicId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `clinic_id=eq.${clinicId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["global-active-appointments"] });
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // Channel may already be removed during HMR
      }
    };
  }, [clinicId, queryClient]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["global-active-appointments"] });
  };

  return {
    appointments: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refresh,
  };
}
