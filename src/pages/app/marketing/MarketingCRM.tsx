import { useComunicacaoMockData } from "@/hooks/useComunicacaoMockData";
import { CRMPipeline } from "@/components/comunicacao/CRMPipeline";
import { CRMPatientList } from "@/components/comunicacao/CRMPatientList";
import { useState } from "react";
import type { CRMStatus } from "@/types/comunicacao";

export default function MarketingCRM() {
  const { crmPatients, pipelineStats } = useComunicacaoMockData();
  const [selectedStatus, setSelectedStatus] = useState<CRMStatus | null>(null);

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
