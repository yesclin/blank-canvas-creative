import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Legend, ComposedChart, Area } from 'recharts';
import { cn } from '@/lib/utils';
import type { ExecutiveSummary, FinancialReportData } from '@/types/relatorios';

interface ExecutiveReportProps {
  summary: ExecutiveSummary;
  financialTrend: FinancialReportData[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function KPICard({
  title,
  value,
  previousValue,
  variation,
  format,
  icon: Icon,
}: {
  title: string;
  value: number;
  previousValue?: number;
  variation: number;
  format: 'currency' | 'percentage' | 'number';
  icon: React.ElementType;
}) {
  const isPositive = variation >= 0;
  const formattedValue = format === 'currency' 
    ? formatCurrency(value) 
    : format === 'percentage' 
      ? `${value}%` 
      : value.toLocaleString('pt-BR');

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{formattedValue}</p>
            <div className="flex items-center gap-2">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={cn(
                "text-sm font-semibold",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                {isPositive ? '+' : ''}{variation}%
              </span>
              <span className="text-xs text-muted-foreground">vs mês anterior</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExecutiveReport({ summary, financialTrend }: ExecutiveReportProps) {
  const metaMensal = 100000;
  const progressoMeta = Math.round((summary.faturamentoAtual / metaMensal) * 100);

  const chartConfig = {
    faturamento: { label: 'Faturamento', color: 'hsl(var(--primary))' },
  };

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Faturamento do Mês"
          value={summary.faturamentoAtual}
          previousValue={summary.faturamentoAnterior}
          variation={summary.variacaoFaturamento}
          format="currency"
          icon={DollarSign}
        />
        <KPICard
          title="Ocupação da Agenda"
          value={summary.ocupacaoAgenda}
          previousValue={summary.ocupacaoAnterior}
          variation={summary.variacaoOcupacao}
          format="percentage"
          icon={Calendar}
        />
        <KPICard
          title="Ticket Médio"
          value={summary.ticketMedio}
          previousValue={summary.ticketMedioAnterior}
          variation={summary.variacaoTicket}
          format="currency"
          icon={Target}
        />
        <KPICard
          title="Taxa de Retenção"
          value={summary.taxaRetencao}
          previousValue={summary.taxaRetencaoAnterior}
          variation={summary.variacaoRetencao}
          format="percentage"
          icon={Users}
        />
      </div>

      {/* Meta Mensal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Meta Mensal</CardTitle>
            <span className="text-2xl font-bold text-primary">{progressoMeta}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progressoMeta} className="h-4" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Atingido: <span className="font-semibold text-foreground">{formatCurrency(summary.faturamentoAtual)}</span>
              </span>
              <span className="text-muted-foreground">
                Meta: <span className="font-semibold text-foreground">{formatCurrency(metaMensal)}</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Faltam <span className="font-semibold text-foreground">{formatCurrency(metaMensal - summary.faturamentoAtual)}</span> para atingir a meta
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grid de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Tendência de Faturamento */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Tendência de Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ComposedChart data={financialTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="period" className="text-xs" />
                <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                <Area type="monotone" dataKey="faturamento" fill="hsl(var(--primary))" fillOpacity={0.2} stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="recebido" stroke="#10b981" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Indicadores Rápidos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Indicadores do Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Novos Pacientes</span>
                <span className="font-bold">{summary.novosPacientes}</span>
              </div>
              <Progress value={(summary.novosPacientes / 60) * 100} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Atendimentos Realizados</span>
                <span className="font-bold">{summary.atendimentosRealizados}</span>
              </div>
              <Progress value={(summary.atendimentosRealizados / 350) * 100} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Taxa de Faltas</span>
                <span className={cn(
                  "font-bold",
                  summary.taxaFaltas > 10 ? "text-red-600" : "text-green-600"
                )}>
                  {summary.taxaFaltas}%
                </span>
              </div>
              <Progress 
                value={summary.taxaFaltas} 
                className={cn(
                  "h-2",
                  summary.taxaFaltas > 10 ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"
                )} 
              />
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.faturamentoAtual - summary.faturamentoAnterior)}
                  </p>
                  <p className="text-xs text-muted-foreground">Crescimento</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {Math.round((summary.atendimentosRealizados * (100 - summary.taxaFaltas)) / 100)}
                  </p>
                  <p className="text-xs text-muted-foreground">Comparecimentos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
