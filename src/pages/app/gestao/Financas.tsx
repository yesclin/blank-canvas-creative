import { useState } from "react";
import { DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { FinanceDashboard } from "@/components/financeiro/FinanceDashboard";
import { ReceivablesTab } from "@/components/financeiro/tabs/ReceivablesTab";
import { PayablesTab } from "@/components/financeiro/tabs/PayablesTab";
import { CashRegisterTab } from "@/components/financeiro/tabs/CashRegisterTab";
import { PackagesTab } from "@/components/financeiro/tabs/PackagesTab";
import { MarginAlertSettings } from "@/components/config/MarginAlertSettings";
import { useFinancialAccessControl } from "@/hooks/useFinancialAccessControl";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

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

function PackagesTab() {
  const { data: packages = [], isLoading } = useTreatmentPackages();
  return (
    <Card>
      <CardHeader><CardTitle>Pacotes / Sessões</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <div className="text-sm text-muted-foreground">Carregando…</div> : packages.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Nenhum pacote cadastrado.</div>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Paciente</TableHead><TableHead>Pacote</TableHead><TableHead>Sessões</TableHead>
              <TableHead>Total</TableHead><TableHead>Pago</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {packages.map((p: any) => {
                const pct = p.total_sessions > 0 ? (p.completed_sessions / p.total_sessions) * 100 : 0;
                return (
                  <TableRow key={p.id}>
                    <TableCell>{p.patients?.full_name ?? "-"}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="w-[180px]">
                      <div className="flex items-center gap-2 text-xs">{p.completed_sessions}/{p.total_sessions}</div>
                      <Progress value={pct} className="h-1.5 mt-1" />
                    </TableCell>
                    <TableCell>{fmt(Number(p.total_amount))}</TableCell>
                    <TableCell>{fmt(Number(p.paid_amount))}</TableCell>
                    <TableCell><Badge className={packageStatusColors[p.status as PackageStatus]}>{packageStatusLabels[p.status as PackageStatus]}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <p className="text-xs text-muted-foreground mt-4">CRUD completo, venda, geração de sessões e parcelamento serão entregues na Fase 2B.</p>
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
        <TabsContent value="commissions"><ComingSoon title="Comissões" phase="Fase 2B" /></TabsContent>
        <TabsContent value="reports"><ComingSoon title="Relatórios financeiros" phase="Fase 2C" /></TabsContent>
        <TabsContent value="settings"><MarginAlertSettings /></TabsContent>
      </Tabs>
    </div>
  );
}
