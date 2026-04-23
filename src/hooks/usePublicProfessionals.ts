import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicProfessional {
  id: string;
  full_name: string;
  avatar_url: string | null;
  registration_number: string | null;
  color: string;
}

export function usePublicProfessionals(clinicId: string | undefined, specialtyId: string | undefined) {
  return useQuery<PublicProfessional[]>({
    queryKey: ["public-professionals", clinicId, specialtyId],
    queryFn: async () => {
      if (!clinicId) return [];

      const { data, error } = await supabase.rpc("get_public_professionals", {
        _clinic_id: clinicId,
        _specialty_id: specialtyId ?? null,
      });

      if (error) {
        console.error("[usePublicProfessionals] RPC error:", error.message);
        return [];
      }
      return (data || []) as PublicProfessional[];
    },
    enabled: !!clinicId,
  });
}
