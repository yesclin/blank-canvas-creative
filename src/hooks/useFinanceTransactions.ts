import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { toDbType, toUiType, isRevenue, isExpense, type UiTransactionType } from "@/utils/financeEnumMapper";

// Re-export for backward compatibility
export type TransactionType = UiTransactionType;

export interface FinanceTransaction {
  id: string;
  clinic_id: string;
  type: string; // raw DB value (receita/despesa)
  uiType: UiTransactionType; // mapped UI value (entrada/saida)
  status: string;
  description: string;
  amount: number;
  transaction_date: string;
  payment_method: string | null;
  category_id: string | null;
  patient_id: string | null;
  professional_id: string | null;
  appointment_id: string | null;
  origin: string | null;
  reference_type: string | null;
  reference_id: string | null;
  due_date: string | null;
  paid_at: string | null;
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
  type: string; // raw DB value
  uiType: UiTransactionType; // mapped
  is_active: boolean;
}

export interface TransactionFormData {
  type: UiTransactionType; // UI sends entrada/saida
  description: string;
  amount: number;
  transaction_date: string;
  payment_method?: string;
  category_id?: string;
  patient_id?: string;
  professional_id?: string;
  appointment_id?: string;
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

function mapTransaction(raw: any): FinanceTransaction {
  return {
    ...raw,
    uiType: toUiType(raw.type),
  };
}

function mapCategory(raw: any): FinanceCategory {
  return {
    ...raw,
    uiType: toUiType(raw.type),
  };
}

// Fetch transactions with filters
export function useTransactions(filters?: {
  startDate?: string;
  endDate?: string;
  type?: UiTransactionType;
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
        // Convert UI type to DB enum for filtering
        query = query.eq("type", toDbType(filters.type));
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []).map(mapTransaction) as FinanceTransaction[];
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
          type: toDbType(data.type), // Convert UI → DB enum
          description: data.description,
          amount: data.amount,
          transaction_date: data.transaction_date,
          payment_method: data.payment_method || null,
          category_id: data.category_id || null,
          patient_id: data.patient_id || null,
          professional_id: data.professional_id || null,
          appointment_id: data.appointment_id || null,
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<TransactionFormData> & { status?: string; paid_at?: string | null } }) => {
      const updatePayload: any = {
        updated_at: new Date().toISOString(),
      };
      
      // Map UI type to DB enum if provided
      if (data.type) updatePayload.type = toDbType(data.type);
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.amount !== undefined) updatePayload.amount = data.amount;
      if (data.transaction_date !== undefined) updatePayload.transaction_date = data.transaction_date;
      if (data.payment_method !== undefined) updatePayload.payment_method = data.payment_method || null;
      if (data.category_id !== undefined) updatePayload.category_id = data.category_id || null;
      if (data.patient_id !== undefined) updatePayload.patient_id = data.patient_id || null;
      if (data.professional_id !== undefined) updatePayload.professional_id = data.professional_id || null;
      if (data.appointment_id !== undefined) updatePayload.appointment_id = data.appointment_id || null;
      if (data.origin !== undefined) updatePayload.origin = data.origin || null;
      if (data.notes !== undefined) updatePayload.notes = data.notes || null;
      if (data.status !== undefined) updatePayload.status = data.status;
      if (data.paid_at !== undefined) updatePayload.paid_at = data.paid_at;
      
      const { error } = await supabase
        .from("finance_transactions")
        .update(updatePayload)
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

// Mark transaction as paid (baixa)
export function useMarkTransactionPaid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, payment_method }: { id: string; payment_method?: string }) => {
      const updatePayload: any = {
        status: "pago",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (payment_method) updatePayload.payment_method = payment_method;
      
      const { error } = await supabase
        .from("finance_transactions")
        .update(updatePayload)
        .eq("id", id);
      
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
      toast.success("Transação marcada como paga!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao registrar pagamento: " + error.message);
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
      return (data || []).map(mapCategory) as FinanceCategory[];
    },
  });
}

// Create finance category
export function useCreateFinanceCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, type }: { name: string; type: UiTransactionType }) => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from("finance_categories")
        .insert({
          clinic_id: clinicId,
          name,
          type: toDbType(type), // Convert UI → DB enum
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
        .filter((t: any) => isRevenue(t.type))
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      
      const todayExpenses = data
        .filter((t: any) => isExpense(t.type))
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      
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
        .filter((t: any) => isRevenue(t.type))
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      
      const monthExpenses = data
        .filter((t: any) => isExpense(t.type))
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      
      return {
        monthRevenue,
        monthExpenses,
        monthBalance: monthRevenue - monthExpenses,
        transactionCount: data.length,
      };
    },
  });
}

// Fetch treatment packages
export function useTreatmentPackages() {
  return useQuery({
    queryKey: ["treatment-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_packages")
        .select(`
          *,
          patients(id, full_name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });
}

// Create treatment package
export function useCreateTreatmentPackage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      patient_id: string;
      name: string;
      total_sessions: number;
      total_amount: number;
      paid_amount?: number;
      payment_method?: string;
      valid_until?: string;
      notes?: string;
    }) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: pkg, error } = await supabase
        .from("treatment_packages")
        .insert({
          clinic_id: clinicId,
          patient_id: data.patient_id,
          name: data.name,
          total_sessions: data.total_sessions,
          total_amount: data.total_amount,
          paid_amount: data.paid_amount || 0,
          payment_method: data.payment_method || null,
          valid_until: data.valid_until || null,
          notes: data.notes || null,
          created_by: user?.id || null,
          status: "ativo",
        })
        .select()
        .single();
      
      if (error) throw error;
      return pkg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-packages"] });
      toast.success("Pacote criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar pacote: " + error.message);
    },
  });
}
