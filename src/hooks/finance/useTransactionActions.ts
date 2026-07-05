import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function getClinicId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data } = await supabase.from("profiles").select("clinic_id").eq("user_id", user.id).maybeSingle().limit(1);
  if (!data?.clinic_id) throw new Error("Clínica não encontrada");
  return data.clinic_id as string;
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["finance"] });
  qc.invalidateQueries({ queryKey: ["finance-transactions"] });
  qc.invalidateQueries({ queryKey: ["finance-stats"] });
  qc.invalidateQueries({ queryKey: ["finance-dashboard"] });
}

/** Total or partial write-down (baixa) */
export function useSettleTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts: { id: string; amount: number; totalAmount: number; currentPaid: number; payment_method?: string; receipt_url?: string; }) => {
      const newPaid = Number((opts.currentPaid + opts.amount).toFixed(2));
      const isFull = newPaid >= opts.totalAmount - 0.001;
      const payload: any = {
        paid_amount: newPaid,
        status: isFull ? "pago" : "parcial",
        payment_method: opts.payment_method ?? undefined,
        paid_at: isFull ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      if (opts.receipt_url) payload.receipt_url = opts.receipt_url;
      const { error } = await supabase.from("finance_transactions").update(payload).eq("id", opts.id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(qc); toast.success("Baixa registrada."); },
    onError: (e: Error) => toast.error("Erro ao baixar: " + e.message),
  });
}

export function useCancelTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!reason || reason.trim().length < 3) throw new Error("Motivo obrigatório");
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("finance_transactions")
        .update({
          status: "cancelado",
          cancel_reason: reason,
          canceled_at: new Date().toISOString(),
          canceled_by: user?.id ?? null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(qc); toast.success("Cobrança cancelada."); },
    onError: (e: Error) => toast.error("Erro ao cancelar: " + e.message),
  });
}

/** Reversal (estorno): creates opposite-sign transaction linked to parent */
export function useReverseTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ parent, reason }: { parent: any; reason: string }) => {
      if (!reason || reason.trim().length < 3) throw new Error("Motivo obrigatório");
      const clinic_id = await getClinicId();
      const reverseType = parent.type === "receita" ? "despesa" : "receita";
      const { error } = await supabase.from("finance_transactions").insert({
        clinic_id,
        type: reverseType,
        description: `Estorno: ${parent.description}`,
        amount: parent.paid_amount || parent.amount,
        transaction_date: new Date().toISOString().slice(0, 10),
        status: "pago",
        paid_at: new Date().toISOString(),
        parent_transaction_id: parent.id,
        origin: "estorno",
        reversal_reason: reason,
        notes: reason,
        patient_id: parent.patient_id ?? null,
        professional_id: parent.professional_id ?? null,
        appointment_id: parent.appointment_id ?? null,
        procedure_id: parent.procedure_id ?? null,
      } as any);
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("finance_transactions")
        .update({
          status: "cancelado",
          reversal_reason: reason,
          canceled_at: new Date().toISOString(),
          canceled_by: user?.id ?? null,
        } as any)
        .eq("id", parent.id);
    },
    onSuccess: () => { invalidate(qc); toast.success("Estorno registrado."); },
    onError: (e: Error) => toast.error("Erro ao estornar: " + e.message),
  });
}

/** Renegociação: altera valor/vencimento de uma parcela pendente/parcial */
export function useRenegotiateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newAmount, newDueDate, reason }:
      { id: string; newAmount: number; newDueDate?: string; reason: string }) => {
      const { error } = await (supabase as any).rpc("renegotiate_transaction", {
        _id: id,
        _new_amount: newAmount,
        _new_due_date: newDueDate ?? null,
        _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(qc); toast.success("Lançamento renegociado."); },
    onError: (e: Error) => toast.error("Erro ao renegociar: " + e.message),
  });
}

export interface PayableInput {
  description: string;
  amount: number;
  due_date?: string;
  transaction_date: string;
  supplier_name?: string;
  cost_center?: string;
  category_id?: string;
  payment_method?: string;
  recurrence?: string;
  notes?: string;
}

export function useCreatePayable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PayableInput) => {
      const clinic_id = await getClinicId();
      const { error } = await supabase.from("finance_transactions").insert({
        clinic_id,
        type: "despesa",
        status: "pendente",
        paid_amount: 0,
        ...input,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(qc); toast.success("Conta a pagar registrada."); },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export interface ReceivableInput {
  description: string;
  amount: number;
  due_date?: string;
  transaction_date: string;
  patient_id?: string;
  professional_id?: string;
  procedure_id?: string;
  appointment_id?: string;
  category_id?: string;
  payment_method?: string;
  installments?: number;
  notes?: string;
}

export function useCreateReceivable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReceivableInput) => {
      const clinic_id = await getClinicId();
      const n = Math.max(1, input.installments ?? 1);
      const per = Number((input.amount / n).toFixed(2));
      const groupId = crypto.randomUUID();
      const rows = Array.from({ length: n }, (_, i) => {
        const dueBase = input.due_date ? new Date(input.due_date) : new Date(input.transaction_date);
        dueBase.setMonth(dueBase.getMonth() + i);
        return {
          clinic_id,
          type: "receita",
          status: "pendente",
          paid_amount: 0,
          description: n > 1 ? `${input.description} (${i + 1}/${n})` : input.description,
          amount: i === n - 1 ? Number((input.amount - per * (n - 1)).toFixed(2)) : per,
          due_date: dueBase.toISOString().slice(0, 10),
          transaction_date: input.transaction_date,
          patient_id: input.patient_id ?? null,
          professional_id: input.professional_id ?? null,
          procedure_id: input.procedure_id ?? null,
          appointment_id: input.appointment_id ?? null,
          category_id: input.category_id ?? null,
          payment_method: input.payment_method ?? null,
          notes: input.notes ?? null,
          installment_number: n > 1 ? i + 1 : null,
          installment_total: n > 1 ? n : null,
          installment_group_id: n > 1 ? groupId : null,
        };
      });
      const { error } = await supabase.from("finance_transactions").insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(qc); toast.success("Conta a receber criada."); },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}
