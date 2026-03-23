import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { StockMovement, StockMovementFormData, StockMovementType } from "@/types/inventory";

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

// Fetch stock movements with filters
export function useStockMovements(filters?: {
  startDate?: string;
  endDate?: string;
  productId?: string;
  movementType?: StockMovementType;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const startDate = filters?.startDate || today;
  const endDate = filters?.endDate || today;
  
  return useQuery({
    queryKey: ["stock-movements", startDate, endDate, filters?.productId, filters?.movementType],
    queryFn: async () => {
      let query = supabase
        .from("stock_movements")
        .select(`
          *,
          products(id, name, unit, sale_price)
        `)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false });
      
      if (filters?.productId) {
        query = query.eq("product_id", filters.productId);
      }
      
      if (filters?.movementType) {
        query = query.eq("movement_type", filters.movementType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as StockMovement[];
    },
  });
}

// Fetch movements for a specific product
export function useProductMovements(productId: string | undefined) {
  return useQuery({
    queryKey: ["stock-movements", "product", productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from("stock_movements")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as StockMovement[];
    },
    enabled: !!productId,
  });
}

// Create stock movement and update product stock
export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: StockMovementFormData) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get current product stock
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock_quantity, cost_price")
        .eq("id", data.product_id)
        .single();
      
      if (productError) throw productError;
      
      const previousQuantity = Number(product.stock_quantity) || 0;
      let newQuantity = previousQuantity;
      
      // Calculate new quantity based on movement type
      switch (data.movement_type) {
        case 'entrada':
        case 'devolucao':
          newQuantity = previousQuantity + data.quantity;
          break;
        case 'saida':
        case 'venda':
          newQuantity = previousQuantity - data.quantity;
          break;
        case 'ajuste':
          newQuantity = data.quantity; // Direct set for adjustments
          break;
      }
      
      const unitCost = data.unit_cost || product.cost_price || 0;
      const totalCost = unitCost * data.quantity;
      
      // Insert movement
      const { data: movement, error: movementError } = await supabase
        .from("stock_movements")
        .insert({
          clinic_id: clinicId,
          product_id: data.product_id,
          movement_type: data.movement_type,
          quantity: data.quantity,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          unit_cost: unitCost,
          total_cost: totalCost,
          reason: data.reason,
          reference_type: data.reference_type || null,
          reference_id: data.reference_id || null,
          notes: data.notes || null,
          created_by: user?.id || null,
        })
        .select()
        .single();
      
      if (movementError) throw movementError;
      
      // Update product stock
      const { error: updateError } = await supabase
        .from("products")
        .update({ 
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString() 
        })
        .eq("id", data.product_id);
      
      if (updateError) throw updateError;
      
      return movement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Movimentação registrada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating stock movement:", error);
      toast.error("Erro ao registrar movimentação: " + error.message);
    },
  });
}

// Get stock movement stats
export function useStockMovementStats(startDate?: string, endDate?: string) {
  const today = format(new Date(), "yyyy-MM-dd");
  const start = startDate || today;
  const end = endDate || today;
  
  return useQuery({
    queryKey: ["stock-movement-stats", start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select("movement_type, quantity, total_cost")
        .gte("created_at", `${start}T00:00:00`)
        .lte("created_at", `${end}T23:59:59`);
      
      if (error) throw error;
      
      const stats = {
        totalEntradas: 0,
        totalSaidas: 0,
        totalVendas: 0,
        custoEntradas: 0,
        custoSaidas: 0,
        movementCount: data.length,
      };
      
      data.forEach((m) => {
        const qty = Number(m.quantity) || 0;
        const cost = Number(m.total_cost) || 0;
        
        if (m.movement_type === 'entrada' || m.movement_type === 'devolucao') {
          stats.totalEntradas += qty;
          stats.custoEntradas += cost;
        } else if (m.movement_type === 'saida') {
          stats.totalSaidas += qty;
          stats.custoSaidas += cost;
        } else if (m.movement_type === 'venda') {
          stats.totalVendas += qty;
        }
      });
      
      return stats;
    },
  });
}
