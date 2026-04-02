import { useMemo } from "react";
import type { Appointment, PaymentStatus, AgendaAppointmentViewModel } from "@/types/agenda";
import { paymentStatusLabels, paymentTypeLabels, typeLabels, careModeLabels, statusLabels } from "@/types/agenda";
import { getAppointmentSourceLabel } from "@/utils/appointmentSource";

function calculateAge(birthDate?: string): number | undefined {
  if (!birthDate) return undefined;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function useAppointmentPreviewData(appointment: Appointment | null): AgendaAppointmentViewModel | null {
  return useMemo(() => {
    if (!appointment) return null;

    const amountExpected = appointment.amount_expected ?? appointment.expected_value ?? 0;
    const amountReceived = appointment.amount_received ?? 0;
    const amountDue = appointment.amount_due ?? Math.max(amountExpected - amountReceived, 0);
    const paymentStatus: PaymentStatus = appointment.payment_status ?? "pendente";
    const sourceLabel = getAppointmentSourceLabel(appointment);

    return {
      id: appointment.id,
      patientName: appointment.patient?.full_name || "Paciente",
      patientPhone: appointment.patient?.phone,
      patientEmail: appointment.patient?.email,
      patientBirthDate: appointment.patient?.birth_date,
      patientAge: calculateAge(appointment.patient?.birth_date),
      patientAvatarUrl: appointment.patient?.avatar_url,
      professionalName: appointment.professional?.full_name,
      specialtyName: appointment.specialty?.name,
      procedureName: appointment.procedure?.name,
      insuranceName: appointment.insurance?.name,
      paymentType: appointment.payment_type,
      paymentTypeLabel: paymentTypeLabels[appointment.payment_type] || appointment.payment_type || "—",
      paymentStatus,
      paymentStatusLabel: paymentStatusLabels[paymentStatus] || paymentStatus,
      amountExpected,
      amountReceived,
      amountDue,
      appointmentType: appointment.appointment_type,
      appointmentTypeLabel: typeLabels[appointment.appointment_type] || appointment.appointment_type,
      careMode: appointment.care_mode,
      careModeLabel: careModeLabels[appointment.care_mode] || appointment.care_mode,
      status: appointment.status,
      statusLabel: statusLabels[appointment.status] || appointment.status,
      bookingSource: appointment.booking_source,
      bookingSourceLabel: sourceLabel,
      notes: appointment.notes,
      isFirstVisit: appointment.is_first_visit,
      isReturn: appointment.is_return,
      isFitIn: appointment.is_fit_in,
      hasClinicalAlert: appointment.patient?.has_clinical_alert || false,
      clinicalAlertText: appointment.patient?.clinical_alert_text,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      scheduledDate: appointment.scheduled_date,
    };
  }, [appointment]);
}
