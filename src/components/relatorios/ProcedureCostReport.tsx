import { DollarSign, TrendingUp, AlertTriangle, Hash, BarChart3, Lock, Flame, Info, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip } from 'recharts';
import { ReportKPICards } from './ReportKPICards';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip as TooltipUI, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ProcedureCostData, ProcedureCostSummary } from '@/hooks/useProcedureCostReport';
import { useFinancialAccessControl } from '@/hooks/useFinancialAccessControl';

interface ProcedureCostReportProps {
  data: ProcedureCostData[];
  summary: ProcedureCostSummary | null;
  isLoading: boolean;
}

const chartConfig = {
  cost: { label: 'Custo', color: 'hsl(var(--primary))' },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getCostLevel(cost: number, maxCost: number): { 
  color: string; 
  label: string; 
  bgClass: string;
  isHigh: boolean;
} {
  const ratio = maxCost > 0 ? cost / maxCost : 0;
  if (ratio >= 0.7) {
    return { 
      color: 'hsl(0, 84%, 60%)', 
      label: 'Alto', 
      bgClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      isHigh: true
    };
  }
  if (ratio >= 0.4) {
    return { 
      color: 'hsl(45, 93%, 47%)', 
      label: 'Médio', 
      bgClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      isHigh: false
    };
  }
  return { 
    color: 'hsl(142, 76%, 36%)', 
    label: 'Baixo', 
    bgClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    isHigh: false
  };
}

export function ProcedureCostReport({
  data,
  summary,
  isLoading,
}: ProcedureCostReportProps) {
  const { canViewCost, isLoading: accessLoading } = useFinancialAccessControl();

  // Verificar permissão de acesso a custos
  if (!accessLoading && !canViewCost) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Acesso Restrito</AlertTitle>
        <AlertDescription>
          Você não tem permissão para visualizar custos de procedimentos.
          Entre em contato com o administrador da clínica.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (!summary || data.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Sem dados</AlertTitle>
        <AlertDescription>
          Não há atendimentos finalizados com procedimentos no período selecionado.
          Verifique os filtros ou selecione outro período.
        </AlertDescription>
      </Alert>
    );
  }

  // Preparar dados para o gráfico (top 10 por custo total)
  const chartData = data.slice(0, 10).map(proc => ({
    name: proc.procedureName.length > 25 
      ? proc.procedureName.substring(0, 25) + '...' 
      : proc.procedureName,
    fullName: proc.procedureName,
    totalCost: proc.totalCost,
    averageCost: proc.averageCost,
    quantity: proc.quantity,
    hasCostData: proc.hasCostData,
  }));

  const maxCost = Math.max(...data.filter(p => p.hasCostData).map(p => p.averageCost), 0);
  const highCostCount = data.filter(p => p.hasCostData && getCostLevel(p.averageCost, maxCost).isHigh).length;

  // KPIs
  const kpiCards = [
    { 
      title: 'Custo Total no Período', 
      value: summary.totalCost, 
      format: 'currency' as const, 
      icon: <DollarSign className="h-5 w-5" /> 
    },
    { 
      title: 'Total de Execuções', 
      value: summary.totalExecutions, 
      format: 'number' as const, 
      icon: <Hash className="h-5 w-5" /> 
    },
    { 
      title: 'Custo Médio por Execução', 
      value: summary.averageCostPerExecution, 
      format: 'currency' as const, 
      icon: <BarChart3 className="h-5 w-5" /> 
    },
    { 
      title: 'Procedimento Mais Custoso', 
      value: summary.mostExpensive 
        ? `${summary.mostExpensive.name.length > 20 ? summary.mostExpensive.name.substring(0, 20) + '...' : summary.mostExpensive.name}` 
        : 'N/A', 
      icon: <Flame className="h-5 w-5" /> 
    },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* KPIs */}
        <ReportKPICards columns={4} cards={kpiCards} />

        {/* Alerta de procedimentos sem custo configurado */}
        {summary.proceduresWithoutCost > 0 && (
          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
            <Settings className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-400">
              Configuração de Custos Pendente
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <strong>{summary.proceduresWithoutCost} procedimento(s)</strong> foram executados sem custo registrado. 
              Isso pode ocorrer porque:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Os materiais não estão vinculados ao procedimento</li>
                <li>Os materiais não têm preço de custo definido</li>
                <li>O atendimento foi finalizado antes da configuração</li>
              </ul>
              <p className="mt-2 font-medium">
                Configure em <strong>Configurações → Materiais</strong> para rastrear custos futuros.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Alerta de procedimentos com custo elevado */}
        {highCostCount > 0 && (
          <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <Flame className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800 dark:text-red-400">
              {highCostCount} Procedimento(s) com Custo Elevado
            </AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300">
              Estes procedimentos representam os maiores custos operacionais. 
              Considere revisar os materiais utilizados ou renegociar com fornecedores.
            </AlertDescription>
          </Alert>
        )}

        {/* Gráfico de Custo por Procedimento */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">Custo Total por Procedimento</CardTitle>
                <CardDescription>Top 10 procedimentos por custo acumulado no período</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                <XAxis 
                  type="number" 
                  tickFormatter={(v) => formatCurrency(v)} 
                  className="text-xs"
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={180} 
                  className="text-xs" 
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    const level = getCostLevel(d.averageCost, maxCost);
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg min-w-[200px]">
                        <p className="font-medium mb-2">{d.fullName}</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Execuções:</span>
                            <span className="font-medium">{d.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Custo Médio:</span>
                            <span className="font-medium">{formatCurrency(d.averageCost)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-muted-foreground">Custo Total:</span>
                            <span className="font-bold text-primary">{formatCurrency(d.totalCost)}</span>
                          </div>
                          {d.hasCostData && (
                            <Badge className={cn("w-full justify-center mt-2", level.bgClass)}>
                              {level.isHigh && <Flame className="h-3 w-3 mr-1" />}
                              Custo {level.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="totalCost" radius={[0, 4, 4, 0]} name="Custo Total">
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.hasCostData ? getCostLevel(entry.averageCost, maxCost).color : 'hsl(var(--muted))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            
            {/* Legenda */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }} />
                <span>Custo Alto (≥70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(45, 93%, 47%)' }} />
                <span>Custo Médio (40-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(142, 76%, 36%)' }} />
                <span>Custo Baixo (&lt;40%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela Detalhada */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Detalhamento por Procedimento</CardTitle>
                <CardDescription>Custos históricos registrados no momento de cada execução</CardDescription>
              </div>
              <TooltipUI>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Os valores exibidos são custos históricos capturados no momento da finalização de cada atendimento, garantindo rastreabilidade mesmo que os preços mudem.</p>
                </TooltipContent>
              </TooltipUI>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Procedimento</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="text-right">Médio</TableHead>
                  <TableHead className="text-right">Máximo</TableHead>
                  <TableHead className="text-right">Total Acumulado</TableHead>
                  <TableHead className="text-center">Nível</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((proc) => {
                  const level = proc.hasCostData ? getCostLevel(proc.averageCost, maxCost) : null;
                  
                  return (
                    <TableRow 
                      key={proc.procedureId}
                      className={cn(level?.isHigh && "bg-red-50/50 dark:bg-red-900/10")}
                    >
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{proc.procedureName}</span>
                            {level?.isHigh && (
                              <Flame className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          {!proc.hasCostData && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Custo não configurado — configure em Materiais
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono">
                          {proc.quantity}x
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {proc.hasCostData ? formatCurrency(proc.minCost) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {proc.hasCostData ? (
                          <span className={cn(level?.isHigh && "text-red-600 dark:text-red-400")}>
                            {formatCurrency(proc.averageCost)}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {proc.hasCostData ? formatCurrency(proc.maxCost) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {proc.hasCostData ? (
                          <span className="font-bold text-primary text-base">
                            {formatCurrency(proc.totalCost)}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {proc.hasCostData && level ? (
                          <Badge className={cn("text-xs", level.bgClass)}>
                            {level.label}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-muted">
                            N/A
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Linha de totais */}
                <TableRow className="bg-muted/50 font-semibold border-t-2">
                  <TableCell className="text-base">Total Geral</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="font-mono">
                      {summary.totalExecutions}x
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                  <TableCell className="text-right">{formatCurrency(summary.averageCostPerExecution)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                  <TableCell className="text-right">
                    <span className="text-primary text-lg font-bold">
                      {formatCurrency(summary.totalCost)}
                    </span>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
