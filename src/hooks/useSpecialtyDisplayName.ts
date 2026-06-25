import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the per-clinic display name for a specialty.
 * When the specialty slug is the wildcard "other_specialty", returns the alias
 * stored in `clinic_specialty_aliases`. Otherwise returns the specialty name.
 */
export function useSpecialtyDisplayName(
  clinicId: string | null | undefined,
  specialty: { slug?: string | null; name?: string | null } | null | undefined,
) {
  const isOther = specialty?.slug === "other_specialty";

  const { data: alias } = useQuery({
    queryKey: ["clinic-specialty-alias", clinicId, "other_specialty"],
    queryFn: async () => {
      if (!clinicId) return null;
      const { data } = await supabase
        .from("clinic_specialty_aliases")
        .select("display_name")
        .eq("clinic_id", clinicId)
        .eq("base_specialty_key", "other_specialty")
        .maybeSingle();
      return data?.display_name ?? null;
    },
    enabled: !!clinicId && isOther,
    staleTime: 5 * 60 * 1000,
  });

  if (isOther && alias) return alias;
  return specialty?.name ?? "";
}
