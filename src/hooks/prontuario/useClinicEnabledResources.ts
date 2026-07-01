import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Retorna o conjunto de `resource_key` liberados (enabled=true) para a
 * clínica atual, opcionalmente filtrado por `resource_type`. Fonte única:
 * public.clinic_resources (vinculado ao clinic_id).
 */
export function useClinicEnabledResources(
  clinicId: string | null | undefined,
  resourceType?: string,
) {
  const query = useQuery({
    queryKey: ["clinic-enabled-resources", clinicId, resourceType ?? "*"],
    enabled: !!clinicId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!clinicId) return new Set<string>();
      let q = supabase
        .from("clinic_resources")
        .select("resource_key, resource_type, enabled")
        .eq("clinic_id", clinicId)
        .eq("enabled", true);
      if (resourceType) q = q.eq("resource_type", resourceType);
      const { data, error } = await q;
      if (error) {
        console.error("[useClinicEnabledResources] erro:", error);
        return new Set<string>();
      }
      return new Set((data ?? []).map((r) => r.resource_key));
    },
  });

  return {
    enabledKeys: query.data ?? new Set<string>(),
    isLoading: query.isLoading,
    /** True se `resource_key` está liberado para a clínica. */
    isEnabled: (key: string) => (query.data ?? new Set<string>()).has(key),
  };
}
