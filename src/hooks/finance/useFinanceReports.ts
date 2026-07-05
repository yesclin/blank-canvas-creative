import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  professionalId?: string | null;
}

export interface FinanceReportsData {
  transactions: any[];
  commissions: any[];
  packages: any[];
}

export function useFinanceReports(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ["finance", "reports", filters],
    queryFn: async (): Promise<FinanceReportsData> => {
      let tq: any = supabase
        .from("finance_transactions")
        .select(`
          id, type, description, amount, paid_amount, status,
          transaction_date, due_date, paid_at, payment_method, origin,
          patient_id, professional_id, procedure_id,
          patients(id, full_name),
          professionals(id, full_name, specialty_id, specialties(id, name)),
          procedures(id, name),
          finance_categories(id, name, type)
        `)
        .order("transaction_date", { ascending: false })
        .limit(2000);

      if (filters.startDate) tq = tq.gte("transaction_date", filters.startDate);
      if (filters.endDate) tq = tq.lte("transaction_date", filters.endDate);
      if (filters.professionalId) tq = tq.eq("professional_id", filters.professionalId);

      const { data: transactions, error: te } = await tq;
      if (te) throw te;

      let cq: any = supabase
        .from("commission_entries")
        .select(`id, professional_id, gross_amount, commission_amount, status, generated_at, paid_at,
          professionals(id, full_name)`)
        .order("generated_at", { ascending: false })
        .limit(2000);
      if (filters.startDate) cq = cq.gte("generated_at", filters.startDate);
      if (filters.endDate) cq = cq.lte("generated_at", filters.endDate);
      if (filters.professionalId) cq = cq.eq("professional_id", filters.professionalId);

      const { data: commissions, error: ce } = await cq;
      if (ce) throw ce;

      const { data: packages, error: pe } = await supabase
        .from("treatment_packages")
        .select(`id, patient_id, procedure_id, professional_id, total_amount, paid_amount,
          total_sessions, completed_sessions, status, created_at,
          patients(id, full_name),
          professionals(id, full_name),
          procedures(id, name)`)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (pe) throw pe;

      return {
        transactions: transactions ?? [],
        commissions: commissions ?? [],
        packages: packages ?? [],
      };
    },
  });
}
