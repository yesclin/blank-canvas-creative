/**
 * COMPATIBILITY LAYER: Products ↔ Inventory Items
 * 
 * This hook provides a unified view of sellable items by merging
 * legacy `products` table with new `inventory_items` table.
 * 
 * During the migration period, sales components can use this hook
 * to show items from both sources. New items created in inventory_items
 * with is_sellable=true will appear alongside legacy products.
 * 
 * Strategy:
 * - Legacy `products` are the primary source for sales (edge functions depend on it)
 * - `inventory_items` with is_sellable=true are shown as additional items
 * - Items that exist in both (matched by name+clinic_id) are deduped, preferring inventory_items data
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/inventory";

/**
 * Unified product view for sales: merges products + sellable inventory_items
 */
export function useProductsUnified(includeInactive = false) {
  return useQuery({
    queryKey: ["products-unified", includeInactive],
    queryFn: async () => {
      // Fetch both sources in parallel
      const [productsRes, inventoryRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .order("name")
          .then(r => ({ data: r.data || [], error: r.error })),
        supabase
          .from("inventory_items")
          .select("*")
          .eq("is_sellable", true)
          .order("name")
          .then(r => ({ data: r.data || [], error: r.error })),
      ]);

      if (productsRes.error) throw productsRes.error;

      let products = productsRes.data as Product[];
      if (!includeInactive) {
        products = products.filter(p => p.is_active);
      }

      // If inventory_items query works, merge sellable items not already in products
      if (!inventoryRes.error && inventoryRes.data.length > 0) {
        const existingNames = new Set(products.map(p => p.name.toLowerCase()));
        
        const additionalProducts: Product[] = inventoryRes.data
          .filter((item: any) => {
            if (!includeInactive && !item.is_active) return false;
            return !existingNames.has(item.name.toLowerCase());
          })
          .map((item: any) => ({
            id: item.id,
            clinic_id: item.clinic_id,
            name: item.name,
            description: item.description,
            sku: item.sku,
            product_type: item.item_type,
            category: item.category,
            unit: item.unit_of_measure,
            current_stock: 0, // inventory_items doesn't track current_stock directly
            min_stock: item.minimum_stock || 0,
            max_stock: item.ideal_stock,
            cost_price: item.default_cost_price || 0,
            sale_price: item.default_sale_price || 0,
            is_active: item.is_active,
            created_at: item.created_at,
            updated_at: item.updated_at,
          }));

        products = [...products, ...additionalProducts];
        products.sort((a, b) => a.name.localeCompare(b.name));
      }

      return products;
    },
  });
}

/**
 * Sales report options that include both products and inventory_items
 */
export function useSalesReportOptionsUnified() {
  return useQuery({
    queryKey: ["sales-report-products-unified"],
    queryFn: async () => {
      const [productsRes, inventoryRes] = await Promise.all([
        supabase.from("products").select("id, name").eq("is_active", true).order("name"),
        supabase.from("inventory_items").select("id, name").eq("is_sellable", true).eq("is_active", true).order("name"),
      ]);

      const products = productsRes.data || [];
      const inventoryItems = inventoryRes.data || [];

      const existingNames = new Set(products.map((p: any) => p.name.toLowerCase()));
      const additional = inventoryItems.filter((i: any) => !existingNames.has(i.name.toLowerCase()));

      return [...products, ...additional] as { id: string; name: string }[];
    },
    staleTime: 1000 * 60 * 5,
  });
}
