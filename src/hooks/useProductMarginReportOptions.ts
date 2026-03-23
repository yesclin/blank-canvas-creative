import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para carregar as opções de filtro do relatório de margem
 * (produtos e categorias)
 */
export function useProductMarginReportOptions() {
  // Query produtos
  const productsQuery = useQuery({
    queryKey: ["margin-report-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Query categorias (distinct values from products table)
  const categoriesQuery = useQuery({
    queryKey: ["margin-report-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("category")
        .eq("is_active", true)
        .not("category", "is", null);

      if (error) throw error;
      
      // Get unique categories
      const uniqueCategories = Array.from(
        new Set((data || []).map((p) => p.category).filter(Boolean))
      ).sort();
      
      return uniqueCategories.map((cat) => ({ id: cat, name: getCategoryLabel(cat as string) }));
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    products: productsQuery.data || [],
    categories: categoriesQuery.data || [],
    isLoading: productsQuery.isLoading || categoriesQuery.isLoading,
  };
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    medicamento: "Medicamento",
    cosmético: "Cosmético",
    insumo: "Insumo",
    equipamento: "Equipamento",
    suplemento: "Suplemento",
    outros: "Outros",
  };
  return labels[category] || category;
}
