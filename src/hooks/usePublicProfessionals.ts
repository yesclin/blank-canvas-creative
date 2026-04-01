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

      // Get professional IDs linked to specialty
      let professionalIds: string[] | null = null;
      if (specialtyId) {
        const { data: links } = await supabase
          .from("professional_specialties")
          .select("professional_id")
          .eq("specialty_id", specialtyId);
        if (links?.length) {
          professionalIds = links.map((l: any) => l.professional_id);
        } else {
          return [];
        }
      }

      let query = supabase
        .from("professionals")
        .select("id, full_name, avatar_url, registration_number, color")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .order("full_name");

      if (professionalIds) {
        query = query.in("id", professionalIds);
      }

      const { data, error } = await query;
      if (error) return [];
      return (data || []) as PublicProfessional[];
    },
    enabled: !!clinicId,
  });
}
