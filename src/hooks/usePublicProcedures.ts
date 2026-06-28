import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicProcedure {
  id: string;
  clinic_id: string;
  specialty_id: string | null;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  is_active: boolean;
}

export function usePublicProcedures(
  clinicId: string | undefined,
  specialtyId: string | undefined,
  professionalId: string | undefined,
) {
  return useQuery<PublicProcedure[]>({
    queryKey: ["public-procedures", clinicId, specialtyId, professionalId],
    queryFn: async () => {
      if (!clinicId) return [];

      const { data, error } = await (supabase as any).rpc("get_public_procedures", {
        _clinic_id: clinicId,
        _specialty_id: specialtyId ?? null,
        _professional_id: professionalId ?? null,
      });

      if (error) {
        console.error("[usePublicProcedures] RPC error:", error.message);
        return [];
      }

      return (data || []) as PublicProcedure[];
    },
    enabled: !!clinicId,
    staleTime: 60_000,
  });
}