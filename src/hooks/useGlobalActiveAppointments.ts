import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { useClinicData } from "@/hooks/useClinicData";
import type { Appointment } from "@/types/agenda";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

  // Preserve last known appointments to prevent flicker during refetch/loading
  const lastKnownRef = useRef<Appointment[]>([]);

  const query = useQuery({
    queryKey: ["global-active-appointments", clinicId, isProfessional ? professionalId : "all"],
    queryFn: async (): Promise<Appointment[]> => {
      if (!clinicId) return [];

      let q = supabase
        .from("appointments")
        .select(ACTIVE_APPOINTMENT_SELECT)
        .eq("clinic_id", clinicId)
        .eq("status", "em_atendimento")
        .not("started_at", "is", null)
        .is("finished_at", null)
        .order("started_at", { ascending: false });

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
    // Keep previous data during refetch to prevent UI flicker
    placeholderData: (prev) => prev,
  });

  // Update lastKnownRef only when we have a successful, non-loading result
  useEffect(() => {
    if (query.data && !query.isLoading && !query.isFetching) {
      lastKnownRef.current = query.data;
    } else if (query.data && query.data.length > 0) {
      // Also update if we got actual data even during refetch
      lastKnownRef.current = query.data;
    }
  }, [query.data, query.isLoading, query.isFetching]);

  // Stable appointments: use query.data if available, fall back to lastKnown
  const appointments = (query.data && query.data.length > 0)
    ? query.data
    : (query.isLoading || query.isFetching)
      ? lastKnownRef.current
      : (query.data ?? lastKnownRef.current);

  // Realtime subscription for appointment status changes
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!clinicId) return;

    // Clean up any previous channel first
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
      } catch {
        // ignore cleanup errors
      }
      channelRef.current = null;
    }

    const channelName = `global-active-appointments-${clinicId}-${Date.now()}`;
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

    channelRef.current = channel;

    return () => {
      const ch = channelRef.current;
      channelRef.current = null;
      if (ch) {
        try {
          ch.unsubscribe();
        } catch {
          // ignore cleanup errors on destroyed channels
        }
      }
    };
  }, [clinicId, queryClient]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["global-active-appointments"] });
  }, [queryClient]);

  return {
    appointments,
    isLoading: query.isLoading && lastKnownRef.current.length === 0,
    error: query.error,
    refresh,
  };
}
