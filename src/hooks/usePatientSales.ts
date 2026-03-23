import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Sale } from "@/types/inventory";

export function usePatientSales(patientId: string | null | undefined) {
  return useQuery({
    queryKey: ["patient-sales", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          patients(id, full_name),
          professionals(id, full_name),
          sale_items(*)
        `)
        .eq("patient_id", patientId)
        .order("sale_date", { ascending: false });
      
      if (error) throw error;
      return data as Sale[];
    },
    enabled: !!patientId,
  });
}
