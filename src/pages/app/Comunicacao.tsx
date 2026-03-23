import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, Zap, Megaphone, History } from "lucide-react";
import { useComunicacaoMockData } from "@/hooks/useComunicacaoMockData";
import { CRMPipeline } from "@/components/comunicacao/CRMPipeline";
import { CRMPatientList } from "@/components/comunicacao/CRMPatientList";
import { TemplatesList } from "@/components/comunicacao/TemplatesList";
import { AutomationsList } from "@/components/comunicacao/AutomationsList";
import { CampaignsList } from "@/components/comunicacao/CampaignsList";
import { MessageHistory } from "@/components/comunicacao/MessageHistory";
import { CommunicationStats } from "@/components/comunicacao/CommunicationStats";
import { WhatsAppStatus } from "@/components/comunicacao/WhatsAppStatus";
import type { CRMStatus } from "@/types/comunicacao";

export default function Comunicacao() {
  const {
    crmPatients, templates, automations, campaigns, messageLogs,
    settings, pipelineStats, messageStats, toggleAutomation,
  } = useComunicacaoMockData();

  const [selectedStatus, setSelectedStatus] = useState<CRMStatus | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Marketing</h1>
        <p className="text-muted-foreground">CRM clínico, automações e campanhas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><CommunicationStats stats={messageStats} /></div>
        <WhatsAppStatus />
      </div>

      <CRMPipeline stats={pipelineStats} onStatusClick={(s) => setSelectedStatus(selectedStatus === s ? null : s)} selectedStatus={selectedStatus} />

      <Tabs defaultValue="crm" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="crm"><Users className="h-4 w-4 mr-2" />CRM</TabsTrigger>
          <TabsTrigger value="templates"><MessageSquare className="h-4 w-4 mr-2" />Templates</TabsTrigger>
          <TabsTrigger value="automations"><Zap className="h-4 w-4 mr-2" />Automações</TabsTrigger>
          <TabsTrigger value="campaigns"><Megaphone className="h-4 w-4 mr-2" />Campanhas</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="crm"><CRMPatientList patients={crmPatients} selectedStatus={selectedStatus} /></TabsContent>
        <TabsContent value="templates"><TemplatesList templates={templates} /></TabsContent>
        <TabsContent value="automations"><AutomationsList automations={automations} onToggle={toggleAutomation} /></TabsContent>
        <TabsContent value="campaigns"><CampaignsList campaigns={campaigns} /></TabsContent>
        <TabsContent value="history"><MessageHistory messages={messageLogs} /></TabsContent>
      </Tabs>
    </div>
  );
}
