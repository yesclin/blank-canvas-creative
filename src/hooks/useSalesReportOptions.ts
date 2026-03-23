import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para carregar as opções de filtro do relatório de vendas
 * (produtos, pacientes e usuários)
 */
export function useSalesReportOptions() {
  // Query produtos
  const productsQuery = useQuery({
    queryKey: ["sales-report-products"],
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

  // Query pacientes
  const patientsQuery = useQuery({
    queryKey: ["sales-report-patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name")
        .order("full_name")
        .limit(500);

      if (error) throw error;
      return (data || []).map((p) => ({ id: p.id, name: p.full_name }));
    },
    staleTime: 1000 * 60 * 5,
  });

  // Query usuários (profiles)
  const usersQuery = useQuery({
    queryKey: ["sales-report-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");

      if (error) throw error;
      return (data || []).map((u) => ({ id: u.id, name: u.full_name || "Usuário" }));
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    products: productsQuery.data || [],
    patients: patientsQuery.data || [],
    users: usersQuery.data || [],
    isLoading: productsQuery.isLoading || patientsQuery.isLoading || usersQuery.isLoading,
  };
}
