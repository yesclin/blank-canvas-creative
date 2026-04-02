import { useMemo } from "react";
import type { Appointment, PaymentStatus } from "@/types/agenda";
import { paymentStatusLabels, paymentTypeLabels, typeLabels, careModeLabels, statusLabels } from "@/types/agenda";

interface PreviewData {
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  patientBirthDate?: string;
  patientAge?: number;
  patientAvatarUrl?: string;
  professionalName?: string;
  specialtyName?: string;
  procedureName?: string;
  insuranceName?: string;
  paymentTypeLabel: string;
  paymentStatusLabel: string;
  paymentStatus: PaymentStatus;
  amountExpected: number;
  amountReceived: number;
  amountDue: number;
  appointmentTypeLabel: string;
  careModeLabel: string;
  statusLabel: string;
  notes?: string;
}

function calculateAge(birthDate?: string): number | undefined {
  if (!birthDate) return undefined;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function useAppointmentPreviewData(appointment: Appointment | null): PreviewData | null {
  return useMemo(() => {
    if (!appointment) return null;

    const amountExpected = appointment.amount_expected ?? appointment.expected_value ?? 0;
    const amountReceived = appointment.amount_received ?? 0;
    const amountDue = appointment.amount_due ?? Math.max(amountExpected - amountReceived, 0);
    const paymentStatus: PaymentStatus = appointment.payment_status ?? "pendente";

    return {
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
      paymentTypeLabel: paymentTypeLabels[appointment.payment_type] || appointment.payment_type || "—",
      paymentStatusLabel: paymentStatusLabels[paymentStatus] || paymentStatus,
      paymentStatus,
      amountExpected,
      amountReceived,
      amountDue,
      appointmentTypeLabel: typeLabels[appointment.appointment_type] || appointment.appointment_type,
      careModeLabel: careModeLabels[appointment.care_mode] || appointment.care_mode,
      statusLabel: statusLabels[appointment.status] || appointment.status,
      notes: appointment.notes,
    };
  }, [appointment]);
}
