import { useState, useMemo, useCallback } from 'react';
import { ShoppingCart, TrendingUp, Percent, Ban, CheckCircle, Eye, ShieldX, EyeOff } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ReportKPICards } from './ReportKPICards';
import { SaleReportDetailsDialog } from './SaleReportDetailsDialog';
import { ReportEmptyState } from './ReportEmptyState';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePermissions } from '@/hooks/usePermissions';
import type { 
  SalesReportSummary, 
  SalesByPeriod, 
  SalesByPaymentMethod,
  SaleReportItem 
} from '@/types/relatorios';

interface SalesReportsProps {
  summary: SalesReportSummary;
  salesByPeriod: SalesByPeriod[];
  salesByPaymentMethod: SalesByPaymentMethod[];
  salesList: SaleReportItem[];
  isLoading: boolean;
}

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const chartConfig = {
  vendas: { label: 'Vendas', color: 'hsl(var(--primary))' },
  estornos: { label: 'Estornos', color: '#ef4444' },
  liquido: { label: 'Líquido', color: '#10b981' },
};

const paymentLabels: Record<string, string> = {
  pix: 'PIX',
  credito: 'Cartão de Crédito',
  debito: 'Cartão de Débito',
  dinheiro: 'Dinheiro',
  convenio: 'Convênio',
  boleto: 'Boleto',
  transferencia: 'Transferência',
};

function formatCurrency(value: number, canViewFinancials: boolean): string {
  if (!canViewFinancials) return '•••••';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function formatPaymentMethod(method: string | null): string {
  if (!method) return '-';
  return paymentLabels[method] || method;
}

/**
 * Access denied message for users without permission
 */
function AccessDeniedMessage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <ShieldX className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Acesso Restrito
      </h2>
      <p className="text-muted-foreground max-w-md">
        Você não tem permissão para acessar o <strong>Relatório de Vendas e Estornos</strong>.
        Entre em contato com o administrador da clínica.
      </p>
    </div>
  );
}

export function SalesReports({
  summary,
  salesByPeriod,
  salesByPaymentMethod,
  salesList,
  isLoading,
}: SalesReportsProps) {
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const { can, isLoading: permissionsLoading } = usePermissions();
  
  // Check permissions: relatorios view for access, financeiro view for values
  const canAccessReport = can('relatorios', 'view');
  const canViewFinancials = can('financeiro', 'view');

  // Memoiza para otimização de performance
  const hasData = useMemo(() => salesList.length > 0, [salesList.length]);
  const memoizedSalesList = useMemo(() => salesList, [salesList]);
  const memoizedSalesByPeriod = useMemo(() => salesByPeriod, [salesByPeriod]);
  const memoizedSalesByPaymentMethod = useMemo(() => salesByPaymentMethod, [salesByPaymentMethod]);
  
  const valorLiquido = useMemo(() => summary.totalVendas - summary.totalEstornos, [summary.totalVendas, summary.totalEstornos]);

  const handleOpenDetails = useCallback((saleId: string) => {
    setSelectedSaleId(saleId);
    setDetailsOpen(true);
  }, []);

  if (isLoading || permissionsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Block access if user cannot view reports
  if (!canAccessReport) {
    return <AccessDeniedMessage />;
  }

  // Mensagem clara quando não houver dados
  if (!hasData) {
    return (
      <ReportEmptyState
        title="Nenhuma venda encontrada"
        description="Não foram encontradas vendas para os filtros selecionados. Experimente alterar o período, status ou outros filtros para visualizar os dados."
        icon={<ShoppingCart className="h-8 w-8 text-muted-foreground" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning for hidden financial values */}
      {!canViewFinancials && (
        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <EyeOff className="h-4 w-4" />
              <span className="text-sm">
                Você não tem permissão para visualizar valores financeiros. Entre em contato com o administrador.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo Principal */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Resumo do Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm text-muted-foreground">Vendas Ativas</span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.totalVendas, canViewFinancials)}
              </p>
              <p className="text-xs text-muted-foreground">{summary.quantidadeVendas} venda(s)</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30">
                  <Ban className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-sm text-muted-foreground">Estornos</span>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.totalEstornos, canViewFinancials)}
              </p>
              <p className="text-xs text-muted-foreground">{summary.quantidadeEstornos} cancelamento(s)</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Valor Líquido</span>
              </div>
              <p className={`text-2xl font-bold ${valorLiquido >= 0 ? 'text-primary' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(valorLiquido, canViewFinancials)}
              </p>
              <p className="text-xs text-muted-foreground">vendas - estornos</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                  <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm text-muted-foreground">Total no Período</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {summary.quantidadeVendas + summary.quantidadeEstornos}
              </p>
              <p className="text-xs text-muted-foreground">transações registradas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Secundários */}
      <ReportKPICards
        cards={[
          { 
            title: 'Ticket Médio', 
            value: canViewFinancials ? summary.ticketMedio : null, 
            format: 'currency', 
            icon: <TrendingUp className="h-5 w-5" />,
            masked: !canViewFinancials,
          },
          { 
            title: 'Descontos Concedidos', 
            value: canViewFinancials ? summary.descontosConcedidos : null, 
            format: 'currency', 
            icon: <Percent className="h-5 w-5" />,
            masked: !canViewFinancials,
          },
        ]}
      />

      <Tabs defaultValue="listagem" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="listagem">Listagem Principal</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="pagamento">Por Pagamento</TabsTrigger>
        </TabsList>

        {/* Listagem Principal Unificada */}
        <TabsContent value="listagem">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Relatório de Vendas e Estornos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data da Venda</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Forma de Pagamento</TableHead>
                    <TableHead>Usuário Responsável</TableHead>
                    <TableHead className="text-center w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memoizedSalesList.map((sale) => (
                    <TableRow 
                      key={sale.id} 
                      className={`cursor-pointer transition-colors ${sale.status === 'canceled' 
                        ? 'bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30' 
                        : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleOpenDetails(sale.id)}
                    >
                      <TableCell className="text-sm">{formatDate(sale.saleDate)}</TableCell>
                      <TableCell className="text-center">
                        {sale.status === 'canceled' ? (
                          <Badge variant="destructive" className="font-semibold">
                            <Ban className="h-3 w-3 mr-1" />
                            Cancelada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-semibold">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativa
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sale.patientName || <span className="text-muted-foreground italic">Sem paciente</span>}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${sale.status === 'canceled' ? 'text-red-600 dark:text-red-400 line-through' : ''}`}>
                        {formatCurrency(sale.totalAmount, canViewFinancials)}
                      </TableCell>
                      <TableCell>{formatPaymentMethod(sale.paymentMethod)}</TableCell>
                      <TableCell>
                        {sale.createdByName || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(sale.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evolução das Vendas */}
        <TabsContent value="evolucao">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendas e Estornos por Período</CardTitle>
            </CardHeader>
            <CardContent>
              {canViewFinancials ? (
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <BarChart data={memoizedSalesByPeriod}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value), true)} />} />
                  <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Vendas" />
                  <Bar dataKey="estornos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Estornos" />
                </BarChart>
              </ChartContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <EyeOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Valores financeiros ocultos</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Por Forma de Pagamento */}
        <TabsContent value="pagamento">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendas por Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-[300px] flex items-center justify-center">
                  {!canViewFinancials ? (
                    <div className="text-center text-muted-foreground">
                      <EyeOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Valores financeiros ocultos</p>
                    </div>
                  ) : memoizedSalesByPaymentMethod.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={memoizedSalesByPaymentMethod}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="totalAmount"
                          nameKey="label"
                          label={({ label, percentage }) => `${label}: ${percentage}%`}
                          labelLine={false}
                        >
                          {memoizedSalesByPaymentMethod.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip formatter={(value) => formatCurrency(Number(value), true)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma venda no período</p>
                  )}
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
                    {memoizedSalesByPaymentMethod.length > 0 ? (
                      memoizedSalesByPaymentMethod.map((method, index) => (
                        <TableRow key={method.method}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                              />
                              {method.label}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{method.count}</TableCell>
                          <TableCell className="text-right">{formatCurrency(method.totalAmount, canViewFinancials)}</TableCell>
                          <TableCell className="text-right">{canViewFinancials ? `${method.percentage}%` : '•••'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Nenhuma venda no período
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de detalhes */}
      <SaleReportDetailsDialog
        saleId={selectedSaleId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
