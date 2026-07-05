import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PayableFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  supplier?: string;
  costCenter?: string;
  categoryId?: string | null;
  paymentMethod?: string | null;
  search?: string;
}

export interface PayableRow {
  id: string;
  description: string;
  amount: number;
  paid_amount: number;
  status: string;
  transaction_date: string;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  supplier_name: string | null;
  cost_center: string | null;
  recurrence: string | null;
  receipt_url: string | null;
  notes: string | null;
  finance_categories?: { id: string; name: string } | null;
}

export function usePayables(filters: PayableFilters = {}) {
  return useQuery({
    queryKey: ["finance", "payables", filters],
    queryFn: async () => {
      let q: any = supabase
        .from("finance_transactions")
        .select(`
          id, description, amount, paid_amount, status, transaction_date, due_date, paid_at,
          payment_method, supplier_name, cost_center, recurrence, receipt_url, notes,
          finance_categories(id, name)
        `)
        .eq("type", "despesa")
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("transaction_date", { ascending: false });

      if (filters.startDate) q = q.gte("transaction_date", filters.startDate);
      if (filters.endDate) q = q.lte("transaction_date", filters.endDate);
      if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
      if (filters.supplier) q = q.ilike("supplier_name", `%${filters.supplier}%`);
      if (filters.costCenter) q = q.eq("cost_center", filters.costCenter);
      if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
      if (filters.paymentMethod) q = q.eq("payment_method", filters.paymentMethod);
      if (filters.search) q = q.ilike("description", `%${filters.search}%`);

      const { data, error } = await q.limit(500);
      if (error) throw error;
      return (data ?? []) as PayableRow[];
    },
  });
}
