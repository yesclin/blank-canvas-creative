import { useComunicacaoMockData } from "@/hooks/useComunicacaoMockData";
import { CampaignsList } from "@/components/comunicacao/CampaignsList";

export default function MarketingCampanhas() {
  const { campaigns } = useComunicacaoMockData();
  return <CampaignsList campaigns={campaigns} />;
}
