import type { QueryClient } from "@tanstack/react-query";
import type { Appointment } from "@/types/agenda";

export const GLOBAL_ACTIVE_APPOINTMENTS_QUERY_KEY = ["global-active-appointments"] as const;

export function isGloballyActiveAppointment(
  appointment: Pick<Appointment, "status" | "started_at" | "finished_at"> | null | undefined
) {
  return appointment?.status === "em_atendimento" && Boolean(appointment.started_at) && !appointment.finished_at;
}

function sortActiveAppointments(appointments: Appointment[]) {
  return [...appointments].sort((a, b) => {
    const aTime = new Date(a.started_at ?? a.created_at).getTime();
    const bTime = new Date(b.started_at ?? b.created_at).getTime();
    return bTime - aTime;
  });
}

export function upsertGlobalActiveAppointment(queryClient: QueryClient, appointment: Appointment) {
  queryClient.setQueriesData<Appointment[]>(
    { queryKey: GLOBAL_ACTIVE_APPOINTMENTS_QUERY_KEY },
    (current) => {
      if (!isGloballyActiveAppointment(appointment)) {
        return current?.filter((item) => item.id !== appointment.id) ?? [];
      }

      const next = (current ?? []).filter((item) => item.id !== appointment.id);
      next.unshift(appointment);
      return sortActiveAppointments(next);
    }
  );
}

export function removeGlobalActiveAppointment(queryClient: QueryClient, appointmentId: string) {
  queryClient.setQueriesData<Appointment[]>(
    { queryKey: GLOBAL_ACTIVE_APPOINTMENTS_QUERY_KEY },
    (current) => sortActiveAppointments((current ?? []).filter((item) => item.id !== appointmentId))
  );
}