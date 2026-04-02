import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ReceivePaymentInput {
  appointmentId: string;
  clinicId: string;
  patientId: string;
  professionalId: string;
  patientName: string;
  appointmentType: string;
  amountExpected: number;
  amountReceivedBefore: number;
  amountToReceive: number;
  paymentMethod: string;
  transactionDate: string;
  notes?: string;
  createFinanceTransaction: boolean;
}

export function useReceiveAppointmentPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReceivePaymentInput) => {
      const {
        appointmentId,
        clinicId,
        patientId,
        professionalId,
        patientName,
        appointmentType,
        amountExpected,
        amountReceivedBefore,
        amountToReceive,
        paymentMethod,
        transactionDate,
        notes,
        createFinanceTransaction,
      } = input;

      if (amountToReceive <= 0) throw new Error("Valor deve ser maior que zero");
      if (!paymentMethod) throw new Error("Forma de pagamento obrigatória");

      const newAmountReceived = amountReceivedBefore + amountToReceive;
      const newAmountDue = Math.max(amountExpected - newAmountReceived, 0);

      let newPaymentStatus: string;
      if (amountExpected > 0 && newAmountReceived >= amountExpected) {
        newPaymentStatus = "pago";
      } else if (newAmountReceived > 0 && newAmountReceived < amountExpected) {
        newPaymentStatus = "parcial";
      } else if (amountExpected === 0 && amountToReceive > 0) {
        newPaymentStatus = "pago";
      } else {
        newPaymentStatus = "parcial";
      }

      const newHasPending = newAmountDue > 0;

      // 1. Update appointment
      const { error: aptError } = await supabase
        .from("appointments")
        .update({
          amount_received: newAmountReceived,
          amount_due: newAmountDue,
          payment_status: newPaymentStatus,
          has_pending_payment: newHasPending,
        })
        .eq("id", appointmentId);

      if (aptError) throw new Error(`Erro ao atualizar agendamento: ${aptError.message}`);

      // 2. Create finance transaction
      if (createFinanceTransaction) {
        const origin = appointmentType === "procedimento" ? "procedimento" : "consulta";
        const description = `Recebimento do agendamento - ${patientName}`;

        const { data: { user } } = await supabase.auth.getUser();

        const { error: txError } = await supabase
          .from("finance_transactions")
          .insert({
            clinic_id: clinicId,
            appointment_id: appointmentId,
            patient_id: patientId,
            professional_id: professionalId,
            type: "receita" as any,
            description,
            amount: amountToReceive,
            payment_method: paymentMethod,
            origin,
            transaction_date: transactionDate,
            notes: notes || null,
            status: "pago" as any,
            paid_at: new Date().toISOString(),
            created_by: user?.id || null,
          });

        if (txError) throw new Error(`Erro ao criar transação financeira: ${txError.message}`);
      }

      return { newPaymentStatus, newAmountReceived, newAmountDue };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["agenda"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Pagamento registrado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
