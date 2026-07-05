import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReceivableFilters {
  startDate?: string;
  endDate?: string;
  status?: string; // pendente | pago | parcial | vencido | cancelado | all
  patientId?: string | null;
  professionalId?: string | null;
  procedureId?: string | null;
  paymentMethod?: string | null;
  search?: string;
}

export interface ReceivableRow {
  id: string;
  description: string;
  amount: number;
  paid_amount: number;
  status: string;
  transaction_date: string;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  origin: string | null;
  installment_number: number | null;
  installment_total: number | null;
  appointment_id: string | null;
  procedure_id: string | null;
  patient_id: string | null;
  professional_id: string | null;
  patients?: { id: string; full_name: string } | null;
  professionals?: { id: string; full_name: string } | null;
  procedures?: { id: string; name: string } | null;
  finance_categories?: { id: string; name: string } | null;
}

export function useReceivables(filters: ReceivableFilters = {}) {
  return useQuery({
    queryKey: ["finance", "receivables", filters],
    queryFn: async () => {
      let q: any = supabase
        .from("finance_transactions")
        .select(`
          id, description, amount, paid_amount, status, transaction_date, due_date, paid_at,
          payment_method, origin, installment_number, installment_total,
          appointment_id, procedure_id, patient_id, professional_id,
          patients(id, full_name),
          professionals(id, full_name),
          procedures(id, name),
          finance_categories(id, name)
        `)
        .eq("type", "receita")
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("transaction_date", { ascending: false });

      if (filters.startDate) q = q.gte("transaction_date", filters.startDate);
      if (filters.endDate) q = q.lte("transaction_date", filters.endDate);
      if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
      if (filters.patientId) q = q.eq("patient_id", filters.patientId);
      if (filters.professionalId) q = q.eq("professional_id", filters.professionalId);
      if (filters.procedureId) q = q.eq("procedure_id", filters.procedureId);
      if (filters.paymentMethod) q = q.eq("payment_method", filters.paymentMethod);
      if (filters.search) q = q.ilike("description", `%${filters.search}%`);

      const { data, error } = await q.limit(500);
      if (error) throw error;
      return (data ?? []) as ReceivableRow[];
    },
  });
}
