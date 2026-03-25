import { useComunicacaoRealData } from "@/hooks/useComunicacaoRealData";
import { CRMPipeline } from "@/components/comunicacao/CRMPipeline";
import { CRMPatientList } from "@/components/comunicacao/CRMPatientList";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CRMStatus } from "@/types/comunicacao";

export default function MarketingCRM() {
  const { crmPatients, pipelineStats, isLoading } = useComunicacaoRealData();
  const [selectedStatus, setSelectedStatus] = useState<CRMStatus | null>(null);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <CRMPipeline
        stats={pipelineStats}
        onStatusClick={(s) => setSelectedStatus(selectedStatus === s ? null : s)}
        selectedStatus={selectedStatus}
      />
      <CRMPatientList patients={crmPatients} selectedStatus={selectedStatus} />
    </div>
  );
}
