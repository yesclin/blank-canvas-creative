import { DollarSign, TrendingUp, CreditCard, Users, PieChartIcon, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { ReportKPICards } from './ReportKPICards';
import { ProcedureProfitabilityReport } from './ProcedureProfitabilityReport';
import { useProcedureProfitabilityReport } from '@/hooks/useProcedureProfitabilityReport';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFinancialAccessControl } from '@/hooks/useFinancialAccessControl';
import type {
  FinancialReportData,
  RevenueByProfessional,
  RevenueByProcedure,
  RevenueByPaymentMethod,
  PackageReport,
  ReportFilters,
} from '@/types/relatorios';

interface FinancialReportsProps {
  financialData: FinancialReportData[];
  revenueByProfessional: RevenueByProfessional[];
  revenueByProcedure: RevenueByProcedure[];
  revenueByPaymentMethod: RevenueByPaymentMethod[];
  packagesReport: PackageReport[];
  totals: {
    faturamento: number;
    recebido: number;
    pendente: number;
  };
  filters: ReportFilters;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#8b5cf6'];

const chartConfig = {
  faturamento: { label: 'Faturamento', color: 'hsl(var(--primary))' },
  recebido: { label: 'Recebido', color: '#10b981' },
  pendente: { label: 'Pendente', color: '#f59e0b' },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function FinancialReports({
  financialData,
  revenueByProfessional,
  revenueByProcedure,
  revenueByPaymentMethod,
  packagesReport,
  totals,
  filters,
}: FinancialReportsProps) {
  const { canViewRevenue, canViewCost, canViewMargin, isLoading } = useFinancialAccessControl();
  const ticketMedio = totals.faturamento / (revenueByProfessional.reduce((acc, p) => acc + p.appointmentCount, 0) || 1);
  
  // Hook para relatório de rentabilidade
  const profitabilityReport = useProcedureProfitabilityReport(filters);

  // Se não tem permissão para ver faturamento, mostra mensagem de acesso restrito
  if (!isLoading && !canViewRevenue) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Acesso Restrito</AlertTitle>
        <AlertDescription>
          Você não tem permissão para visualizar relatórios financeiros. 
          Entre em contato com o administrador da clínica.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Montar KPIs baseado nas permissões
  const kpiCards = [
    { title: 'Faturamento Total', value: totals.faturamento, format: 'currency' as const, variation: 8, icon: <DollarSign className="h-5 w-5" /> },
    { title: 'Valor Recebido', value: totals.recebido, format: 'currency' as const, icon: <TrendingUp className="h-5 w-5" /> },
    { title: 'Valor Pendente', value: totals.pendente, format: 'currency' as const, icon: <CreditCard className="h-5 w-5" /> },
    { title: 'Ticket Médio', value: Math.round(ticketMedio), format: 'currency' as const, variation: 5, icon: <Users className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <ReportKPICards cards={kpiCards} />

      <Tabs defaultValue={canViewCost ? "rentabilidade" : "evolucao"} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          {/* Aba de Custo x Faturamento - apenas se pode ver custos */}
          {canViewCost && (
            <TabsTrigger value="rentabilidade" className="gap-1.5">
              <PieChartIcon className="h-4 w-4" />
              Custo x Faturamento
            </TabsTrigger>
          )}
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="profissional">Por Profissional</TabsTrigger>
          <TabsTrigger value="procedimento">Por Procedimento</TabsTrigger>
          <TabsTrigger value="pagamento">Por Pagamento</TabsTrigger>
          <TabsTrigger value="pacotes">Pacotes</TabsTrigger>
        </TabsList>

        {/* Custo x Faturamento por Procedimento - apenas se pode ver custos */}
        {canViewCost && (
          <TabsContent value="rentabilidade">
            <ProcedureProfitabilityReport
              data={profitabilityReport.data}
              summary={profitabilityReport.summary}
              isLoading={profitabilityReport.isLoading}
            />
          </TabsContent>
        )}

        {/* Evolução do Faturamento */}
        <TabsContent value="evolucao">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Faturamento por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <BarChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                  <Bar dataKey="faturamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Faturamento" />
                  <Bar dataKey="recebido" fill="#10b981" radius={[4, 4, 0, 0]} name="Recebido" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Por Profissional */}
        <TabsContent value="profissional">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Faturamento por Profissional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={revenueByProfessional} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <YAxis dataKey="professionalName" type="category" width={120} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                    <Bar dataKey="totalRevenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Faturamento" />
                  </BarChart>
                </ChartContainer>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead className="text-right">Atendimentos</TableHead>
                      <TableHead className="text-right">Faturamento</TableHead>
                      <TableHead className="text-right">Ticket Médio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByProfessional.map((prof) => (
                      <TableRow key={prof.professionalId}>
                        <TableCell className="font-medium">{prof.professionalName}</TableCell>
                        <TableCell className="text-right">{prof.appointmentCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(prof.totalRevenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(prof.averageTicket)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Por Procedimento */}
        <TabsContent value="procedimento">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Faturamento por Procedimento</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Procedimento</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Valor Unitário</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueByProcedure.sort((a, b) => b.totalRevenue - a.totalRevenue).map((proc) => (
                    <TableRow key={proc.procedureId}>
                      <TableCell className="font-medium">{proc.procedureName}</TableCell>
                      <TableCell className="text-right">{proc.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(proc.averageValue)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(proc.totalRevenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Por Forma de Pagamento */}
        <TabsContent value="pagamento">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Faturamento por Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueByPaymentMethod}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="totalRevenue"
                        nameKey="label"
                        label={({ label, percentage }) => `${label}: ${percentage}%`}
                        labelLine={false}
                      >
                        {revenueByPaymentMethod.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Forma de Pagamento</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByPaymentMethod.map((method, index) => (
                      <TableRow key={method.method}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            {method.label}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{method.count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(method.totalRevenue)}</TableCell>
                        <TableCell className="text-right">{method.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pacotes */}
        <TabsContent value="pacotes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pacotes de Tratamento</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Pacote</TableHead>
                    <TableHead className="text-center">Sessões</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packagesReport.map((pkg) => (
                    <TableRow key={pkg.packageId}>
                      <TableCell className="font-medium">{pkg.patientName}</TableCell>
                      <TableCell>{pkg.packageName}</TableCell>
                      <TableCell className="text-center">{pkg.usedSessions}/{pkg.totalSessions}</TableCell>
                      <TableCell className="text-right">{formatCurrency(pkg.totalValue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(pkg.paidValue)}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          pkg.status === 'ativo' ? 'bg-green-100 text-green-800' :
                          pkg.status === 'finalizado' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
