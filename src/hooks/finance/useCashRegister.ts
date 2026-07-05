import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function getClinicId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data } = await supabase.from("profiles").select("clinic_id").eq("user_id", user.id).maybeSingle().limit(1);
  if (!data?.clinic_id) throw new Error("Clínica não encontrada");
  return { clinicId: data.clinic_id as string, userId: user.id };
}

export function useOpenCashRegister() {
  return useQuery({
    queryKey: ["finance", "cash", "open"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_registers")
        .select("*")
        .eq("status", "aberto")
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCashHistory() {
  return useQuery({
    queryKey: ["finance", "cash", "history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_registers")
        .select("*")
        .order("opened_at", { ascending: false })
        .limit(50);
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
      const { data, error } = await supabase
        .from("cash_movements")
        .select("*")
        .eq("cash_register_id", cashRegisterId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!cashRegisterId,
  });
}

export function useOpenCash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opening_amount: number) => {
      const { clinicId, userId } = await getClinicId();
      const { error } = await supabase.from("cash_registers").insert({
        clinic_id: clinicId,
        opened_by: userId,
        opening_amount,
        status: "aberto",
        opened_at: new Date().toISOString(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", "cash"] }); toast.success("Caixa aberto."); },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useCloseCash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, closing_amount, notes }: { id: string; closing_amount: number; notes?: string }) => {
      const { userId } = await getClinicId();
      const { error } = await supabase.from("cash_registers")
        .update({ status: "fechado", closed_at: new Date().toISOString(), closed_by: userId, closing_amount, notes } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", "cash"] }); toast.success("Caixa fechado."); },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useAddCashMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts: { cash_register_id: string; type: "sangria" | "suprimento" | "pagamento"; amount: number; description?: string; payment_method?: string; }) => {
      const { clinicId, userId } = await getClinicId();
      const { error } = await supabase.from("cash_movements").insert({
        clinic_id: clinicId,
        created_by: userId,
        ...opts,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", "cash"] }); toast.success("Movimento registrado."); },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}
