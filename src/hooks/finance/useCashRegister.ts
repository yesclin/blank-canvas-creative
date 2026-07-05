import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function getCtx() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data } = await supabase.from("profiles").select("clinic_id").eq("user_id", user.id).maybeSingle().limit(1);
  if (!data?.clinic_id) throw new Error("Clínica não encontrada");
  return { clinicId: data.clinic_id as string, userId: user.id };
}

export type MovementType = "recebimento" | "sangria" | "suprimento" | "despesa" | "ajuste" | "pagamento";

export function useMyOpenCashRegister() {
  return useQuery({
    queryKey: ["finance", "cash", "myOpen"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from("cash_registers")
        .select("*").eq("status", "aberto").eq("opened_by", user.id)
        .order("opened_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCashHistory(filters: { startDate?: string; endDate?: string; status?: string; userId?: string } = {}) {
  return useQuery({
    queryKey: ["finance", "cash", "history", filters],
    queryFn: async () => {
      let q: any = supabase.from("cash_registers").select("*").order("opened_at", { ascending: false }).limit(100);
      if (filters.startDate) q = q.gte("opened_at", filters.startDate);
      if (filters.endDate) q = q.lte("opened_at", filters.endDate + "T23:59:59");
      if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
      if (filters.userId) q = q.eq("opened_by", filters.userId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCashMovements(cashRegisterId: string | null | undefined) {
  return useQuery({
    queryKey: ["finance", "cash", "movements", cashRegisterId],
    queryFn: async () => {
      if (!cashRegisterId) return [];
      const { data, error } = await supabase.from("cash_movements")
        .select("*, payment_methods(id, name, category)")
        .eq("cash_register_id", cashRegisterId)
        .order("performed_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!cashRegisterId,
  });
}

export function usePaymentMethodsActive() {
  return useQuery({
    queryKey: ["payment-methods", "active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_methods")
        .select("id, name, category").eq("is_active", true).order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useOpenCash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ opening_amount, notes }: { opening_amount: number; notes?: string }) => {
      const { clinicId, userId } = await getCtx();
      const { data: existing } = await supabase.from("cash_registers")
        .select("id").eq("status", "aberto").eq("opened_by", userId).limit(1).maybeSingle();
      if (existing) throw new Error("Você já possui um caixa aberto. Feche-o antes de abrir outro.");
      const { error } = await supabase.from("cash_registers").insert({
        clinic_id: clinicId, opened_by: userId, opening_amount, status: "aberto",
        opened_at: new Date().toISOString(), notes: notes ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", "cash"] }); toast.success("Caixa aberto."); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCloseCash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts: { id: string; expected_amount: number; closing_amount: number; summary_by_method: Record<string, number>; notes?: string; }) => {
      const { userId } = await getCtx();
      const difference = Number((opts.closing_amount - opts.expected_amount).toFixed(2));
      if (Math.abs(difference) > 0.009 && !opts.notes) throw new Error("Divergência detectada: informe uma observação.");
      const { error } = await supabase.from("cash_registers").update({
        status: "fechado", closed_at: new Date().toISOString(), closed_by: userId,
        expected_amount: opts.expected_amount, closing_amount: opts.closing_amount,
        difference_amount: difference, summary_by_method: opts.summary_by_method,
        notes: opts.notes ?? null,
      } as any).eq("id", opts.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", "cash"] }); toast.success("Caixa fechado."); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReopenCash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { userId } = await getCtx();
      const { error } = await supabase.from("cash_registers").update({
        status: "aberto", reopened_at: new Date().toISOString(), reopened_by: userId, reopen_reason: reason,
        closed_at: null, closed_by: null,
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", "cash"] }); toast.success("Caixa reaberto."); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddCashMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts: { cash_register_id: string; movement_type: MovementType; amount: number; description?: string; payment_method_id?: string; transaction_id?: string; }) => {
      const { clinicId, userId } = await getCtx();
      const { error } = await supabase.from("cash_movements").insert({
        clinic_id: clinicId, performed_by: userId, performed_at: new Date().toISOString(),
        cash_register_id: opts.cash_register_id,
        movement_type: opts.movement_type,
        amount: opts.amount,
        description: opts.description ?? null,
        payment_method_id: opts.payment_method_id ?? null,
        transaction_id: opts.transaction_id ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", "cash"] }); toast.success("Movimentação registrada."); },
    onError: (e: Error) => toast.error(e.message),
  });
}
