import { useQuery } from "@tanstack/react-query";
import { getPublicProfessionalAvailability, PublicSlot, PublicAvailabilityParams } from "@/services/publicAvailability";

export function usePublicProfessionalAvailability(
  params: PublicAvailabilityParams | null
) {
  return useQuery<PublicSlot[]>({
    queryKey: ["public-availability", params?.clinicId, params?.professionalId, params?.dateStart?.toISOString(), params?.dateEnd?.toISOString()],
    queryFn: () => getPublicProfessionalAvailability(params!),
    enabled: !!params?.clinicId && !!params?.professionalId && !!params?.dateStart && !!params?.dateEnd,
    staleTime: 30_000, // 30s cache to reduce recalculation
    refetchOnWindowFocus: true,
  });
}
