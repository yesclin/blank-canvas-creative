import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicSpecialty {
  id: string;
  name: string;
  color: string;
  description: string | null;
  slug: string | null;
}

export function usePublicSpecialties(clinicId: string | undefined) {
  return useQuery<PublicSpecialty[]>({
    queryKey: ["public-specialties", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data, error } = await supabase.rpc("get_public_specialties", {
        _clinic_id: clinicId,
      });
      if (error) {
        console.error("[usePublicSpecialties] RPC error:", error.message);
        return [];
      }
      return (data || []) as PublicSpecialty[];
    },
    enabled: !!clinicId,
  });
}
