import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

export interface PatientAppointment {
  id: string;
  scheduled_date: string;
  start_time: string;
  status: string;
  appointment_type: string;
  professional?: { id: string; full_name: string } | null;
  procedure?: { id: string; name: string } | null;
}

/**
 * Fetch recent appointments for a specific patient
 * Returns last 30 days of appointments, ordered by most recent first
 */
export function usePatientAppointments(patientId: string | null | undefined) {
  return useQuery({
    queryKey: ["patient-appointments", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const today = new Date();
      const thirtyDaysAgo = subDays(today, 30);
      
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_date,
          start_time,
          status,
          appointment_type,
          professionals(id, full_name),
          procedures(id, name)
        `)
        .eq("patient_id", patientId)
        .gte("scheduled_date", format(thirtyDaysAgo, "yyyy-MM-dd"))
        .lte("scheduled_date", format(today, "yyyy-MM-dd"))
        .order("scheduled_date", { ascending: false })
        .order("start_time", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      return (data || []).map(apt => ({
        id: apt.id,
        scheduled_date: apt.scheduled_date,
        start_time: apt.start_time,
        status: apt.status,
        appointment_type: apt.appointment_type,
        professional: apt.professionals,
        procedure: apt.procedures,
      })) as PatientAppointment[];
    },
    enabled: !!patientId,
  });
}
