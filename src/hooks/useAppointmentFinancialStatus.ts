import { useMemo } from "react";
import type { Appointment, PaymentStatus } from "@/types/agenda";

interface FinancialStatus {
  paymentStatus: PaymentStatus;
  amountExpected: number;
  amountReceived: number;
  amountDue: number;
  hasPendingPayment: boolean;
}

/**
 * Derives financial status from appointment data with legacy fallback.
 */
export function useAppointmentFinancialStatus(appointment: Appointment | null): FinancialStatus {
  return useMemo(() => {
    if (!appointment) {
      return {
        paymentStatus: "pendente" as PaymentStatus,
        amountExpected: 0,
        amountReceived: 0,
        amountDue: 0,
        hasPendingPayment: false,
      };
    }

    // Use new fields if available, otherwise derive from legacy
    const amountExpected = appointment.amount_expected ?? appointment.expected_value ?? 0;
    const amountReceived = appointment.amount_received ?? 0;
    const amountDue = appointment.amount_due ?? Math.max(amountExpected - amountReceived, 0);

    let paymentStatus: PaymentStatus = appointment.payment_status ?? "pendente";

    // Legacy fallback: if payment_status is still default 'pendente' and we have legacy data
    if (!appointment.payment_status || appointment.payment_status === "pendente") {
      if (appointment.payment_type === "convenio") {
        paymentStatus = "faturar_convenio";
      } else if (appointment.payment_type === "cortesia") {
        paymentStatus = "isento";
      } else if (amountExpected > 0 && amountReceived >= amountExpected) {
        paymentStatus = "pago";
      } else if (amountReceived > 0 && amountReceived < amountExpected) {
        paymentStatus = "parcial";
      } else if (appointment.has_pending_payment) {
        paymentStatus = "pendente";
      }
    }

    return {
      paymentStatus,
      amountExpected,
      amountReceived,
      amountDue,
      hasPendingPayment: paymentStatus === "pendente" || paymentStatus === "parcial",
    };
  }, [appointment]);
}
