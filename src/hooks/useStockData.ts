import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product, StockMovement } from "@/types/inventory";
import { format, subDays } from "date-fns";

// =============================================
// STOCK CATEGORIES
// =============================================

export interface StockCategory {
  id: string;
  name: string;
  product_count: number;
}

export function useStockCategories() {
  return useQuery({
    queryKey: ["stock-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("category")
        .eq("is_active", true);
      
      if (error) throw error;
      
      // Aggregate categories
      const categoryMap = new Map<string, number>();
      data.forEach(p => {
        const cat = p.category || "Sem categoria";
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });
      
      return Array.from(categoryMap.entries()).map(([name, count], idx) => ({
        id: name,
        name,
        product_count: count,
      })) as StockCategory[];
    },
  });
}

// =============================================
// STOCK PRODUCTS WITH ALERTS
// =============================================

export interface StockProduct extends Product {
  // Alias for compatibility with existing component
  current_quantity: number;
  min_quantity: number;
  avg_cost: number;
}

export function useStockProducts(filters?: {
  category?: string;
  status?: 'all' | 'active' | 'inactive' | 'low' | 'out';
  search?: string;
}) {
  return useQuery({
    queryKey: ["stock-products", filters?.category, filters?.status, filters?.search],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .order("name");
      
      // Only filter by is_active if not looking at inactive
      if (filters?.status !== 'inactive') {
        // Don't filter here - we'll do client-side for stock-based filters
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Map to StockProduct interface
      let products = (data as Product[]).map(p => ({
        ...p,
        current_quantity: p.stock_quantity,
        min_quantity: p.min_stock_quantity,
        avg_cost: p.cost_price,
      })) as StockProduct[];
      
      // Apply filters
      if (filters?.category && filters.category !== 'all') {
        products = products.filter(p => p.category === filters.category);
      }
      
      if (filters?.status) {
        switch (filters.status) {
          case 'active':
            products = products.filter(p => p.is_active);
            break;
          case 'inactive':
            products = products.filter(p => !p.is_active);
            break;
          case 'low':
            products = products.filter(p => 
              p.is_active && 
              p.current_quantity <= p.min_quantity && 
              p.current_quantity > 0
            );
            break;
          case 'out':
            products = products.filter(p => p.is_active && p.current_quantity === 0);
            break;
        }
      }
      
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.sku?.toLowerCase().includes(searchLower) ||
          p.barcode?.toLowerCase().includes(searchLower)
        );
      }
      
      return products;
    },
  });
}

// =============================================
// STOCK ALERTS - Low & Out of Stock
// =============================================

export function useLowStockAlerts() {
  return useQuery({
    queryKey: ["stock-alerts", "low"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true);
      
      if (error) throw error;
      
      // Filter: stock at or below minimum but not zero
      return (data as Product[])
        .filter(p => p.stock_quantity <= p.min_stock_quantity && p.stock_quantity > 0)
        .map(p => ({
          ...p,
          current_quantity: p.stock_quantity,
          min_quantity: p.min_stock_quantity,
          avg_cost: p.cost_price,
        })) as StockProduct[];
    },
    // Refetch every 30 seconds to catch updates
    refetchInterval: 30000,
  });
}

export function useOutOfStockAlerts() {
  return useQuery({
    queryKey: ["stock-alerts", "out"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("stock_quantity", 0);
      
      if (error) throw error;
      
      return (data as Product[]).map(p => ({
        ...p,
        current_quantity: p.stock_quantity,
        min_quantity: p.min_stock_quantity,
        avg_cost: p.cost_price,
      })) as StockProduct[];
    },
    refetchInterval: 30000,
  });
}

// =============================================
// EXPIRING PRODUCTS
// =============================================

export function useExpiringProducts(daysThreshold = 30) {
  return useQuery({
    queryKey: ["stock-alerts", "expiring", daysThreshold],
    queryFn: async () => {
      // Products table doesn't have expiration_date currently
      // Return empty for now - can be extended when field is added
      return [] as StockProduct[];
    },
  });
}

// =============================================
// STOCK STATS
// =============================================

export interface StockStats {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  expiringSoon: number;
  totalValue: number;
}

export function useStockStats() {
  return useQuery({
    queryKey: ["stock-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("stock_quantity, min_stock_quantity, cost_price, is_active");
      
      if (error) throw error;
      
      const active = data.filter(p => p.is_active);
      const lowStock = active.filter(
        p => p.stock_quantity <= p.min_stock_quantity && p.stock_quantity > 0
      );
      const outOfStock = active.filter(p => p.stock_quantity === 0);
      
      const totalValue = active.reduce(
        (sum, p) => sum + (p.stock_quantity * (p.cost_price || 0)), 
        0
      );
      
      return {
        totalProducts: active.length,
        lowStock: lowStock.length,
        outOfStock: outOfStock.length,
        expiringSoon: 0, // Extend when expiration tracking is added
        totalValue,
      } as StockStats;
    },
    refetchInterval: 30000,
  });
}

// =============================================
// RECENT STOCK MOVEMENTS
// =============================================

export function useRecentStockMovements(limit = 50) {
  return useQuery({
    queryKey: ["stock-movements", "recent", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select(`
          *,
          products(id, name, unit)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (error) throw error;

      // Enrich procedure execution movements with patient info
      const procedureMovements = (data || []).filter(
        m => m.reference_type === 'procedure_execution' && m.reference_id
      );
      
      if (procedureMovements.length > 0) {
        const appointmentIds = procedureMovements.map(m => m.reference_id);
        
        const { data: appointments } = await supabase
          .from('appointments')
          .select('id, patient_id, patients(full_name)')
          .in('id', appointmentIds);
        
        const appointmentMap = new Map(
          (appointments || []).map(a => [a.id, a])
        );
        
        // Attach patient info to movements
        return (data as StockMovement[]).map(m => {
          if (m.reference_type === 'procedure_execution' && m.reference_id) {
            const apt = appointmentMap.get(m.reference_id);
            return {
              ...m,
              patient_name: (apt as any)?.patients?.full_name || null,
              patient_id: apt?.patient_id || null,
            };
          }
          return m;
        });
      }
      
      return data as StockMovement[];
    },
  });
}

// =============================================
// COMBINED HOOK FOR ESTOQUE PAGE
// =============================================

export function useStockData() {
  const { data: products = [], isLoading: productsLoading } = useStockProducts({ status: 'all' });
  const { data: lowStockProducts = [], isLoading: lowLoading } = useLowStockAlerts();
  const { data: outOfStockProducts = [], isLoading: outLoading } = useOutOfStockAlerts();
  const { data: expiringProducts = [] } = useExpiringProducts();
  const { data: stats = { totalProducts: 0, lowStock: 0, outOfStock: 0, expiringSoon: 0, totalValue: 0 } } = useStockStats();
  const { data: movements = [] } = useRecentStockMovements();
  const { data: categories = [] } = useStockCategories();
  
  return {
    categories,
    products,
    movements,
    lowStockProducts,
    outOfStockProducts,
    expiringProducts,
    stats,
    isLoading: productsLoading || lowLoading || outLoading,
  };
}
