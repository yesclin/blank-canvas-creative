import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import type { ProductMarginFilters } from "@/types/productMarginReport";

// =============================================
// TYPES
// =============================================

export interface ProductMarginItem {
  productId: string;
  productName: string;
  category: string | null;
  quantitySold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  marginPercent: number;
}

export interface ProductMarginSummary {
  totalProducts: number;
  totalQuantitySold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageMargin: number;
}

// =============================================
// HOOK
// =============================================

export function useProductMarginReport(filters: ProductMarginFilters) {
  const startDate = format(filters.startDate, "yyyy-MM-dd");
  const endDate = format(filters.endDate, "yyyy-MM-dd");

  const query = useQuery({
    queryKey: [
      "product-margin-report",
      startDate,
      endDate,
      filters.status,
      filters.productId,
      filters.categoryId,
    ],
    queryFn: async () => {
      // Build sales query with status filter
      let salesQuery = supabase
        .from("sales")
        .select("id")
        .gte("sale_date", `${startDate}T00:00:00`)
        .lte("sale_date", `${endDate}T23:59:59`);

      // Apply status filter
      if (filters.status === "active") {
        salesQuery = salesQuery.neq("payment_status", "cancelado");
      } else if (filters.status === "canceled") {
        salesQuery = salesQuery.eq("payment_status", "cancelado");
      }

      const { data: sales, error: salesError } = await salesQuery;

      if (salesError) throw salesError;

      if (!sales || sales.length === 0) {
        return { items: [], summary: getEmptySummary() };
      }

      const saleIds = sales.map((s) => s.id);

      // Get sale_items for these sales
      let itemsQuery = supabase
        .from("sale_items")
        .select(`
          product_id,
          product_name,
          quantity,
          total_price,
          cost_price,
          total_cost,
          profit,
          margin_percent
        `)
        .in("sale_id", saleIds);

      // Apply product filter
      if (filters.productId) {
        itemsQuery = itemsQuery.eq("product_id", filters.productId);
      }

      const { data: saleItems, error: itemsError } = await itemsQuery;

      if (itemsError) throw itemsError;

      // If category filter is set, we need to filter by product category
      let filteredItems = saleItems || [];
      if (filters.categoryId) {
        // Get products with the specified category
        const { data: products } = await supabase
          .from("products")
          .select("id, category")
          .eq("category", filters.categoryId);

        const productIdsWithCategory = new Set((products || []).map((p) => p.id));
        filteredItems = filteredItems.filter((item) =>
          productIdsWithCategory.has(item.product_id)
        );
      }

      // Get product categories for display
      const productIds = [...new Set(filteredItems.map((item) => item.product_id))];
      const { data: productsData } = await supabase
        .from("products")
        .select("id, category")
        .in("id", productIds);

      const productCategoryMap = new Map(
        (productsData || []).map((p) => [p.id, p.category])
      );

      // Aggregate by product
      const productMap = new Map<string, ProductMarginItem>();

      filteredItems.forEach((item) => {
        const existing = productMap.get(item.product_id);
        const quantity = item.quantity || 0;
        const revenue = Number(item.total_price) || 0;
        const cost = Number(item.total_cost) || 0;
        const profit = Number(item.profit) || 0;

        if (existing) {
          existing.quantitySold += quantity;
          existing.totalRevenue += revenue;
          existing.totalCost += cost;
          existing.totalProfit += profit;
        } else {
          productMap.set(item.product_id, {
            productId: item.product_id,
            productName: item.product_name,
            category: productCategoryMap.get(item.product_id) || null,
            quantitySold: quantity,
            totalRevenue: revenue,
            totalCost: cost,
            totalProfit: profit,
            marginPercent: 0,
          });
        }
      });

      // Calculate margin for each product
      const items: ProductMarginItem[] = Array.from(productMap.values()).map((item) => ({
        ...item,
        marginPercent: item.totalRevenue > 0 
          ? (item.totalProfit / item.totalRevenue) * 100 
          : 0,
      }));

      // Sort by profit descending
      items.sort((a, b) => b.totalProfit - a.totalProfit);

      // Calculate summary
      const summary: ProductMarginSummary = {
        totalProducts: items.length,
        totalQuantitySold: items.reduce((sum, i) => sum + i.quantitySold, 0),
        totalRevenue: items.reduce((sum, i) => sum + i.totalRevenue, 0),
        totalCost: items.reduce((sum, i) => sum + i.totalCost, 0),
        totalProfit: items.reduce((sum, i) => sum + i.totalProfit, 0),
        averageMargin: 0,
      };

      summary.averageMargin = summary.totalRevenue > 0
        ? (summary.totalProfit / summary.totalRevenue) * 100
        : 0;

      return { items, summary };
    },
  });

  return {
    items: query.data?.items || [],
    summary: query.data?.summary || getEmptySummary(),
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

function getEmptySummary(): ProductMarginSummary {
  return {
    totalProducts: 0,
    totalQuantitySold: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    averageMargin: 0,
  };
}
