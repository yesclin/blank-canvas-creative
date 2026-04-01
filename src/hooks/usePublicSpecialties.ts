import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicSpecialty {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

export function usePublicSpecialties(clinicId: string | undefined) {
  return useQuery<PublicSpecialty[]>({
    queryKey: ["public-specialties", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name, color, description")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .order("name");
      if (error) return [];
      return (data || []) as PublicSpecialty[];
    },
    enabled: !!clinicId,
  });
}
