import { useQuery } from "@tanstack/react-query";
import { getPublicAvailabilityWithDetails, PublicSlot, PublicAvailabilityParams, PublicAvailabilityResult } from "@/services/publicAvailability";

export function usePublicProfessionalAvailability(
  params: PublicAvailabilityParams | null
) {
  return useQuery<PublicAvailabilityResult>({
    queryKey: ["public-availability", params?.clinicId, params?.professionalId, params?.dateStart?.toISOString(), params?.dateEnd?.toISOString()],
    queryFn: () => getPublicAvailabilityWithDetails(params!),
    enabled: !!params?.clinicId && !!params?.professionalId && !!params?.dateStart && !!params?.dateEnd,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
