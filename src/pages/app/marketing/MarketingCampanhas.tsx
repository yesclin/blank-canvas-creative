import { useComunicacaoRealData } from "@/hooks/useComunicacaoRealData";
import { CampaignsList } from "@/components/comunicacao/CampaignsList";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingCampanhas() {
  const { campaigns, isLoading } = useComunicacaoRealData();
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  return <CampaignsList campaigns={campaigns} />;
}
