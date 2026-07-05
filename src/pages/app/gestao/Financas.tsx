import { useState } from "react";
import { DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanceDashboard } from "@/components/financeiro/FinanceDashboard";
import { ReceivablesTab } from "@/components/financeiro/tabs/ReceivablesTab";
import { PayablesTab } from "@/components/financeiro/tabs/PayablesTab";
import { CashRegisterTab } from "@/components/financeiro/tabs/CashRegisterTab";
import { PackagesTab } from "@/components/financeiro/tabs/PackagesTab";
import { CommissionsTab } from "@/components/financeiro/tabs/CommissionsTab";
import { MarginAlertSettings } from "@/components/config/MarginAlertSettings";
import { useFinancialAccessControl } from "@/hooks/useFinancialAccessControl";

function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground py-6 text-center">
          Módulo em construção — entregue na {phase}.
        </div>
      </CardContent>
    </Card>
  );
}



export default function Financas() {
  const [tab, setTab] = useState("overview");
  const { canViewRevenue, isLoading } = useFinancialAccessControl();

  if (!isLoading && !canViewRevenue) {
    return (
      <Card>
        <CardHeader><CardTitle>Financeiro</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Você não tem permissão para acessar o módulo financeiro.</p></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          Financeiro
        </h1>
        <p className="text-muted-foreground mt-1">Gestão financeira completa da clínica</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="receivables">Receber</TabsTrigger>
          <TabsTrigger value="payables">Pagar</TabsTrigger>
          <TabsTrigger value="cash">Caixa</TabsTrigger>
          <TabsTrigger value="packages">Pacotes/Sessões</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><FinanceDashboard /></TabsContent>
        <TabsContent value="receivables"><ReceivablesTab /></TabsContent>
        <TabsContent value="payables"><PayablesTab /></TabsContent>
        <TabsContent value="cash"><CashRegisterTab /></TabsContent>
        <TabsContent value="packages"><PackagesTab /></TabsContent>
        <TabsContent value="commissions"><CommissionsTab /></TabsContent>
        <TabsContent value="reports"><ReportsTab /></TabsContent>
        <TabsContent value="settings"><MarginAlertSettings /></TabsContent>
      </Tabs>
    </div>
  );
}
