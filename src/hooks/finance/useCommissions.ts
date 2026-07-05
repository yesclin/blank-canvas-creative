import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CommissionStatus =
  | "pendente"
  | "aprovado"
  | "pago"
  | "cancelado"
  | "estornada"
  | "bloqueada";

export interface CommissionFilters {
  startDate?: string;
  endDate?: string;
  status?: CommissionStatus | "todos";
  professionalId?: string;
  procedureId?: string;
  onlyOwn?: boolean;
  ownProfessionalId?: string;
}

export interface CommissionRow {
  id: string;
  clinic_id: string;
  professional_id: string;
  appointment_id: string | null;
  transaction_id: string | null;
  patient_id: string | null;
  procedure_id: string | null;
  insurance_id: string | null;
  payer_type: string | null;
  base_amount: number;
  gross_amount: number | null;
  received_amount: number | null;
  commission_amount: number;
  percent_applied: number | null;
  fixed_applied: number | null;
  status: CommissionStatus;
  reference_date: string;
  due_date: string | null;
  paid_at: string | null;
  cancel_reason: string | null;
  notes: string | null;
  professional?: { id: string; full_name: string } | null;
  patient?: { id: string; full_name: string } | null;
  procedure?: { id: string; name: string } | null;
  appointment?: { id: string; scheduled_date: string | null; start_time: string | null } | null;
}

export function useCommissions(filters: CommissionFilters = {}) {
  return useQuery({
    queryKey: ["finance", "commissions", filters],
    queryFn: async () => {
      let q: any = supabase
        .from("commission_entries")
        .select(`
          id, clinic_id, professional_id, appointment_id, transaction_id,
          patient_id, procedure_id, insurance_id, payer_type,
          base_amount, gross_amount, received_amount, commission_amount,
          percent_applied, fixed_applied,
          status, reference_date, due_date, paid_at, cancel_reason, notes,
          professional:professionals(id, full_name),
          patient:patients(id, full_name),
          procedure:procedures(id, name),
          appointment:appointments(id, scheduled_date, start_time)
        `)
        .order("reference_date", { ascending: false })
        .limit(1000);

      if (filters.startDate) q = q.gte("reference_date", filters.startDate);
      if (filters.endDate) q = q.lte("reference_date", filters.endDate);
      if (filters.status && filters.status !== "todos") q = q.eq("status", filters.status);
      if (filters.professionalId) q = q.eq("professional_id", filters.professionalId);
      if (filters.procedureId) q = q.eq("procedure_id", filters.procedureId);
      if (filters.onlyOwn && filters.ownProfessionalId) {
        q = q.eq("professional_id", filters.ownProfessionalId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CommissionRow[];
    },
  });
}

export function useCommissionActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["finance", "commissions"] });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).rpc("mark_commission_paid", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Comissão marcada como paga"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao marcar como paga"),
  });

  const cancel = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await (supabase as any).rpc("cancel_commission", { _id: id, _reason: reason });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Comissão cancelada"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao cancelar"),
  });

  const refund = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await (supabase as any).rpc("refund_commission", { _id: id, _reason: reason });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Comissão estornada"); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao estornar"),
  });

  return { markPaid, cancel, refund };
}
