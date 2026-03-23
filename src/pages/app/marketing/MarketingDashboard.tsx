import { useMarketingStats } from "@/hooks/useMarketingStats";
import { CommunicationStats } from "@/components/comunicacao/CommunicationStats";
import { WhatsAppStatus } from "@/components/comunicacao/WhatsAppStatus";
import { Loader2 } from "lucide-react";

export default function MarketingDashboard() {
  const { messageStats, loading } = useMarketingStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CommunicationStats stats={messageStats} />
        </div>
        <WhatsAppStatus />
      </div>
    </div>
  );
}
