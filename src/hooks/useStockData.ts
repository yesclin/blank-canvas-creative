import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { InventoryItem } from "@/types/inventory-items";
import { useClinicData } from "@/hooks/useClinicData";

// =============================================
// STOCK CATEGORIES (derived from inventory_items)
// =============================================

export interface StockCategory {
  id: string;
  name: string;
  product_count: number;
}

export function useStockCategories() {
  const { clinic } = useClinicData();

  return useQuery({
    queryKey: ["stock-categories", clinic?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("category")
        .eq("clinic_id", clinic!.id)
        .eq("is_active", true)
        .eq("controls_stock", true);
      
      if (error) throw error;
      
      const categoryMap = new Map<string, number>();
      data.forEach((p: any) => {
        const cat = p.category || "Sem categoria";
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });
      
      return Array.from(categoryMap.entries()).map(([name, count]) => ({
        id: name,
        name,
        product_count: count,
      })) as StockCategory[];
    },
    enabled: !!clinic?.id,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// =============================================
// STOCK PRODUCT - compatibility wrapper for
// components that still expect Product-like shape
// =============================================

export interface StockProduct {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  unit: string;
  current_stock: number;
  min_stock: number;
  max_stock?: number | null;
  cost_price: number;
  sale_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Aliases for backward compatibility
  current_quantity: number;
  min_quantity: number;
  avg_cost: number;
  product_type: string;
}

function mapInventoryItemToStockProduct(item: InventoryItem): StockProduct {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    sku: item.sku,
    category: item.category,
    unit: item.unit_of_measure,
    current_stock: 0, // derived from movements/batches
    min_stock: item.minimum_stock,
    max_stock: item.ideal_stock,
    cost_price: item.default_cost_price,
    sale_price: item.default_sale_price,
    is_active: item.is_active,
    created_at: item.created_at,
    updated_at: item.updated_at,
    // Aliases
    current_quantity: 0,
    min_quantity: item.minimum_stock,
    avg_cost: item.default_cost_price,
    product_type: item.item_type,
  };
}

export function useStockProducts(filters?: {
  category?: string;
  status?: 'all' | 'active' | 'inactive' | 'low' | 'out';
  search?: string;
}) {
  const { clinic } = useClinicData();

  return useQuery({
    queryKey: ["stock-products", clinic?.id, filters?.category, filters?.status, filters?.search],
    queryFn: async () => {
      let query = supabase
        .from("inventory_items")
        .select("*")
        .eq("clinic_id", clinic!.id)
        .eq("controls_stock", true)
        .order("name");
      
      const { data, error } = await query;
      if (error) throw error;
      
      let products = (data as InventoryItem[]).map(mapInventoryItemToStockProduct);
      
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
          // low/out require current_stock which we don't have yet
        }
      }
      
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.sku?.toLowerCase().includes(searchLower)
        );
      }
      
      return products;
    },
    enabled: !!clinic?.id,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// =============================================
// STOCK STATS (from inventory_items + batches)
// =============================================

export interface StockStats {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  expiringSoon: number;
  totalValue: number;
}

export function useStockStats() {
  const { clinic } = useClinicData();

  return useQuery({
    queryKey: ["stock-stats", clinic?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("default_cost_price, is_active, controls_stock")
        .eq("clinic_id", clinic!.id)
        .eq("controls_stock", true);
      
      if (error) throw error;
      
      const active = data.filter((p: any) => p.is_active);
      
      return {
        totalProducts: active.length,
        lowStock: 0, // will be computed from movements in future
        outOfStock: 0,
        expiringSoon: 0,
        totalValue: 0,
      } as StockStats;
    },
    enabled: !!clinic?.id,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// =============================================
// STOCK ALERTS
// =============================================

export function useLowStockAlerts() {
  return useQuery({
    queryKey: ["stock-alerts", "low"],
    queryFn: async () => [] as StockProduct[],
  });
}

export function useOutOfStockAlerts() {
  return useQuery({
    queryKey: ["stock-alerts", "out"],
    queryFn: async () => [] as StockProduct[],
  });
}

export function useExpiringProducts(_daysThreshold = 30) {
  return useQuery({
    queryKey: ["stock-alerts", "expiring", _daysThreshold],
    queryFn: async () => [] as StockProduct[],
  });
}

// =============================================
// RECENT STOCK MOVEMENTS (from inventory_movements)
// =============================================

export function useRecentStockMovements(limit = 50) {
  return useQuery({
    queryKey: ["stock-movements", "recent", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_movements")
        .select(`*, inventory_items(id, name, unit_of_measure)`)
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
  });
}

// =============================================
// COMBINED HOOK FOR COMPAT
// =============================================

export function useStockData() {
  const { data: products = [], isLoading: productsLoading } = useStockProducts({ status: 'all' });
  const { data: stats = { totalProducts: 0, lowStock: 0, outOfStock: 0, expiringSoon: 0, totalValue: 0 } } = useStockStats();
  const { data: categories = [] } = useStockCategories();
  
  return {
    categories,
    products,
    movements: [],
    lowStockProducts: [],
    outOfStockProducts: [],
    expiringProducts: [],
    stats,
    isLoading: productsLoading,
  };
}
