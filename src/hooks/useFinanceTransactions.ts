import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export type TransactionType = "entrada" | "saida";

export interface FinanceTransaction {
  id: string;
  clinic_id: string;
  type: TransactionType;
  description: string;
  amount: number;
  transaction_date: string;
  payment_method: string | null;
  category_id: string | null;
  patient_id: string | null;
  professional_id: string | null;
  insurance_id: string | null;
  appointment_id: string | null;
  origin: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  finance_categories?: { id: string; name: string } | null;
  patients?: { id: string; full_name: string } | null;
  professionals?: { id: string; full_name: string } | null;
}

export interface FinanceCategory {
  id: string;
  clinic_id: string;
  name: string;
  type: TransactionType;
  is_active: boolean;
}

export interface TransactionFormData {
  type: TransactionType;
  description: string;
  amount: number;
  transaction_date: string;
  payment_method?: string;
  category_id?: string;
  patient_id?: string;
  professional_id?: string;
  insurance_id?: string;
  origin?: string;
  notes?: string;
}

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("user_id", user.id)
    .single();
    
  if (!profile?.clinic_id) throw new Error("Clínica não encontrada");
  return profile.clinic_id;
}

// Fetch transactions with filters
export function useTransactions(filters?: {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const startDate = filters?.startDate || today;
  const endDate = filters?.endDate || today;
  
  return useQuery({
    queryKey: ["finance-transactions", startDate, endDate, filters?.type],
    queryFn: async () => {
      let query = supabase
        .from("finance_transactions")
        .select(`
          *,
          finance_categories(id, name),
          patients(id, full_name),
          professionals(id, full_name)
        `)
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (filters?.type) {
        query = query.eq("type", filters.type);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as FinanceTransaction[];
    },
  });
}

// Fetch all transactions for current month
export function useMonthlyTransactions() {
  const now = new Date();
  const startOfMonth = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
  const endOfMonth = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd");
  
  return useTransactions({ startDate: startOfMonth, endDate: endOfMonth });
}

// Fetch today's transactions
export function useTodayTransactions() {
  const today = format(new Date(), "yyyy-MM-dd");
  return useTransactions({ startDate: today, endDate: today });
}

// Create transaction
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: transaction, error } = await supabase
        .from("finance_transactions")
        .insert({
          clinic_id: clinicId,
          type: data.type,
          description: data.description,
          amount: data.amount,
          transaction_date: data.transaction_date,
          payment_method: data.payment_method || null,
          category_id: data.category_id || null,
          patient_id: data.patient_id || null,
          professional_id: data.professional_id || null,
          insurance_id: data.insurance_id || null,
          origin: data.origin || null,
          notes: data.notes || null,
          created_by: user?.id || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
      toast.success("Transação registrada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating transaction:", error);
      toast.error("Erro ao registrar transação: " + error.message);
    },
  });
}

// Update transaction
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TransactionFormData> }) => {
      const { error } = await supabase
        .from("finance_transactions")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
      toast.success("Transação atualizada!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar transação: " + error.message);
    },
  });
}

// Delete transaction
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("finance_transactions")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
      toast.success("Transação excluída!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir transação: " + error.message);
    },
  });
}

// Fetch finance categories
export function useFinanceCategories() {
  return useQuery({
    queryKey: ["finance-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as FinanceCategory[];
    },
  });
}

// Create finance category
export function useCreateFinanceCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, type }: { name: string; type: TransactionType }) => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from("finance_categories")
        .insert({
          clinic_id: clinicId,
          name,
          type,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-categories"] });
      toast.success("Categoria criada!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar categoria: " + error.message);
    },
  });
}

// Get financial stats for a date
export function useFinanceStats(date?: Date) {
  const today = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
  
  return useQuery({
    queryKey: ["finance-stats", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_transactions")
        .select("type, amount")
        .eq("transaction_date", today);
      
      if (error) throw error;
      
      const todayRevenue = data
        .filter(t => t.type === "entrada")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const todayExpenses = data
        .filter(t => t.type === "saida")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      return {
        todayRevenue,
        todayExpenses,
        todayBalance: todayRevenue - todayExpenses,
        transactionCount: data.length,
      };
    },
  });
}

// Get monthly stats
export function useMonthlyFinanceStats() {
  const now = new Date();
  const startOfMonth = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
  const endOfMonth = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd");
  
  return useQuery({
    queryKey: ["finance-stats", "monthly", startOfMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_transactions")
        .select("type, amount")
        .gte("transaction_date", startOfMonth)
        .lte("transaction_date", endOfMonth);
      
      if (error) throw error;
      
      const monthRevenue = data
        .filter(t => t.type === "entrada")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const monthExpenses = data
        .filter(t => t.type === "saida")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      return {
        monthRevenue,
        monthExpenses,
        monthBalance: monthRevenue - monthExpenses,
        transactionCount: data.length,
      };
    },
  });
}
