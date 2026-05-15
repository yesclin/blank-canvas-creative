import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicClinicData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  phone: string | null;
  public_booking_enabled: boolean;
  public_booking_settings: Record<string, any>;
}

export function usePublicClinic(slug: string | undefined) {
  return useQuery<PublicClinicData | null>({
    queryKey: ["public-clinic", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("public_clinic_booking" as any)
        .select("id, name, slug, logo_url, phone, public_booking_enabled, public_booking_settings")
        .eq("slug", slug)
        .maybeSingle();
      if (error || !data) return null;
      return data as PublicClinicData;
    },
    enabled: !!slug,
  });
}
