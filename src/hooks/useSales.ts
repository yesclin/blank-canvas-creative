import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Sale, SaleFormData, SaleItem, PaymentStatus } from "@/types/inventory";

// =============================================
// HELPERS
// =============================================

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

// =============================================
// QUERIES
// =============================================

export function useSales(filters?: {
  startDate?: string;
  endDate?: string;
  patientId?: string;
  paymentStatus?: PaymentStatus;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const startDate = filters?.startDate || today;
  const endDate = filters?.endDate || today;
  
  return useQuery({
    queryKey: ["sales", startDate, endDate, filters?.patientId, filters?.paymentStatus],
    queryFn: async () => {
      let query = supabase
        .from("sales")
        .select(`
          *,
          patients(id, full_name),
          professionals(id, full_name),
          sale_items(*)
        `)
        .gte("sale_date", `${startDate}T00:00:00`)
        .lte("sale_date", `${endDate}T23:59:59`)
        .order("sale_date", { ascending: false });
      
      if (filters?.patientId) {
        query = query.eq("patient_id", filters.patientId);
      }
      
      if (filters?.paymentStatus) {
        query = query.eq("payment_status", filters.paymentStatus);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Sale[];
    },
  });
}

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: ["sales", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          patients(id, full_name),
          professionals(id, full_name),
          sale_items(*)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as Sale;
    },
    enabled: !!id,
  });
}

// Fetch sale by linked transaction_id
export function useSaleByTransactionId(transactionId: string | undefined) {
  return useQuery({
    queryKey: ["sales", "by-transaction", transactionId],
    queryFn: async () => {
      if (!transactionId) return null;
      
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          patients(id, full_name),
          professionals(id, full_name),
          sale_items(*)
        `)
        .eq("transaction_id", transactionId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Sale | null;
    },
    enabled: !!transactionId,
  });
}

// Fetch sale by stock movement reference
export function useSaleByReferenceId(referenceId: string | undefined, referenceType: string | undefined) {
  return useQuery({
    queryKey: ["sales", "by-reference", referenceId],
    queryFn: async () => {
      if (!referenceId || referenceType !== 'sale') return null;
      
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          patients(id, full_name),
          professionals(id, full_name),
          sale_items(*)
        `)
        .eq("id", referenceId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Sale | null;
    },
    enabled: !!referenceId && referenceType === 'sale',
  });
}

export function useSalesStats(startDate?: string, endDate?: string) {
  const today = format(new Date(), "yyyy-MM-dd");
  const start = startDate || today;
  const end = endDate || today;
  
  return useQuery({
    queryKey: ["sales-stats", start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("total_amount, payment_status, discount_amount")
        .gte("sale_date", `${start}T00:00:00`)
        .lte("sale_date", `${end}T23:59:59`);
      
      if (error) throw error;
      
      const stats = {
        totalVendas: 0,
        vendasPagas: 0,
        vendasPendentes: 0,
        descontosConcedidos: 0,
        quantidadeVendas: data.length,
        vendasCanceladas: 0,
      };
      
      data.forEach((s) => {
        const amount = Number(s.total_amount) || 0;
        const discount = Number(s.discount_amount) || 0;
        
        if (s.payment_status === 'cancelado') {
          stats.vendasCanceladas++;
        } else {
          stats.totalVendas += amount;
          stats.descontosConcedidos += discount;
          
          if (s.payment_status === 'pago') {
            stats.vendasPagas += amount;
          } else if (s.payment_status === 'pendente' || s.payment_status === 'parcial') {
            stats.vendasPendentes += amount;
          }
        }
      });
      
      return stats;
    },
  });
}

// =============================================
// MUTATIONS
// =============================================

export interface SaleStockValidationError {
  productId: string;
  productName: string;
  requestedQuantity: number;
  availableStock: number;
}

/**
 * Create sale using transactional edge function.
 * All operations (sale, items, finance, stock) are atomic.
 */
export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: SaleFormData & { allowNegativeStock?: boolean }) => {
      const { data: response, error } = await supabase.functions.invoke("create-sale", {
        body: data,
      });
      
      if (error) {
        throw new Error(error.message || "Erro ao criar venda");
      }
      
      if (!response.success) {
        throw new Error(response.error || "Erro ao criar venda");
      }
      
      return response.sale;
    },
    onSuccess: () => {
      // Invalidate sales queries
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales-stats"] });
      
      // Invalidate stock/product queries for immediate UI update
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["stock-stats"] });
      queryClient.invalidateQueries({ queryKey: ["stock-categories"] });
      
      // Invalidate finance queries for dashboard update
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
      
      toast.success("Venda registrada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating sale:", error);
      toast.error("Erro ao registrar venda: " + error.message);
    },
  });
}

/**
 * Update sale payment status
 */
export function useUpdateSaleStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      paymentStatus, 
      paymentMethod 
    }: { 
      id: string; 
      paymentStatus: PaymentStatus;
      paymentMethod?: string;
    }) => {
      const { error } = await supabase
        .from("sales")
        .update({ 
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          updated_at: new Date().toISOString() 
        })
        .eq("id", id);
      
      if (error) throw error;
      
      // Log audit entry
      await supabase.functions.invoke('log-access', {
        body: {
          action: 'SALE_STATUS_UPDATED',
          resource: `sales/${id}?status=${paymentStatus}`,
          user_agent: navigator.userAgent,
        },
      });
      
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Status da venda atualizado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar venda: " + error.message);
    },
  });
}

/**
 * Cancel sale and restore stock
 */
/**
 * Cancel sale using transactional edge function.
 * All operations (status update, stock revert, finance reversal) are atomic.
 */
export function useCancelSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data: response, error } = await supabase.functions.invoke("cancel-sale", {
        body: { sale_id: id, reason },
      });
      
      if (error) {
        throw new Error(error.message || "Erro ao cancelar venda");
      }
      
      if (!response.success) {
        throw new Error(response.error || "Erro ao cancelar venda");
      }
      
      return response;
    },
    onSuccess: () => {
      // Invalidate all relevant queries after sale cancellation
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales-stats"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["stock-stats"] });
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
      queryClient.invalidateQueries({ queryKey: ["patient-sales"] });
      // Note: Success toast is handled by the component for better UX control
    },
    // Note: Error toast is handled by the component for better UX control
  });
}
