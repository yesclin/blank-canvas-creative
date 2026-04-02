import type { BookingSource, Appointment } from "@/types/agenda";
import { bookingSourceLabels } from "@/types/agenda";

/**
 * Retorna o label de origem do agendamento.
 * Aplica fallback inteligente baseado em flags do appointment.
 */
export function getAppointmentSourceLabel(appointment: Appointment): string | undefined {
  // Explicit source takes priority
  if (appointment.booking_source && appointment.booking_source !== 'manual') {
    return bookingSourceLabels[appointment.booking_source as BookingSource] || appointment.booking_source;
  }

  // Derive from flags if no explicit source
  if (appointment.is_fit_in) return bookingSourceLabels.encaixe;
  if (appointment.is_return) return bookingSourceLabels.retorno;

  // If manual, only show if explicitly set
  if (appointment.booking_source === 'manual') return bookingSourceLabels.manual;

  return undefined;
}
