import { useState } from "react";
import { BarChart3, Users, Target, DollarSign, TrendingDown, Clock, Award, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CommercialFiltersBar } from "@/components/comercial/reports/CommercialFiltersBar";
import {
  useCommercialKPIs,
  useCommercialFunnel,
  useLossReasons,
  usePerformanceBySource,
  usePerformanceByUser,
  type CommercialFilters,
} from "@/hooks/crm/useCommercialStats";
import { LEAD_SOURCES } from "@/types/crm";

function KPICard({ title, value, subtitle, icon: Icon, color }: { title: string; value: string; subtitle?: string; icon: any; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color || "bg-primary/10"}`}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CommercialReportsPage() {
  const [filters, setFilters] = useState<CommercialFilters>({});
  const { data: kpis, isLoading: kpisLoading } = useCommercialKPIs(filters);
  const { data: funnel, isLoading: funnelLoading } = useCommercialFunnel(filters);
  const { data: lossReasons } = useLossReasons(filters);
  const { data: sourcePerf } = usePerformanceBySource(filters);
  const { data: userPerf } = usePerformanceByUser(filters);

  const fmtCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Relatórios Comerciais</h1>
          <p className="text-sm text-muted-foreground">Análises de funil, conversão e desempenho comercial</p>
        </div>
      </div>

      {/* Filters */}
      <CommercialFiltersBar filters={filters} onChange={setFilters} />

      {/* KPIs */}
      {kpisLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Leads" value={String(kpis.totalLeads)} icon={Users} />
          <KPICard title="Oportunidades Abertas" value={String(kpis.openOpportunities)} icon={Target} />
          <KPICard title="Em Negociação" value={fmtCurrency(kpis.valueInNegotiation)} icon={DollarSign} />
          <KPICard title="Taxa de Conversão" value={`${kpis.conversionRate.toFixed(1)}%`} icon={TrendingDown} />
          <KPICard title="Ticket Médio" value={fmtCurrency(kpis.avgTicket)} icon={DollarSign} />
          <KPICard title="Tempo Médio (dias)" value={kpis.avgCloseDays.toFixed(0)} icon={Clock} />
          <KPICard title="Ganhas" value={String(kpis.wonCount)} subtitle={`${kpis.lostCount} perdidas`} icon={Award} />
          <KPICard title="Follow-ups Atrasados" value={String(kpis.overdueFollowups)} subtitle={`de ${kpis.totalFollowups} total`} icon={AlertTriangle} />
        </div>
      ) : null}

      {/* Funnel */}
      {funnelLoading ? (
        <Skeleton className="h-32" />
      ) : funnel && funnel.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Funil Comercial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              {funnel.map((stage, i) => {
                const maxCount = Math.max(...funnel.map(s => s.count), 1);
                const height = Math.max(20, (stage.count / maxCount) * 100);
                return (
                  <div key={stage.stage} className="flex-1 text-center">
                    <div className="text-lg font-bold">{stage.count}</div>
                    <div
                      className="mx-auto rounded-t bg-primary/20"
                      style={{
                        height: `${height}px`,
                        width: `${100 - i * 15}%`,
                        minWidth: "40%",
                        background: `hsl(var(--primary) / ${0.2 + i * 0.2})`,
                      }}
                    />
                    <div className="text-xs text-muted-foreground mt-1">{stage.label}</div>
                    {stage.value > 0 && (
                      <div className="text-xs font-medium">{fmtCurrency(stage.value)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loss Reasons */}
        {lossReasons && lossReasons.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Motivos de Perda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lossReasons.map(lr => (
                  <div key={lr.reason} className="flex items-center justify-between text-sm">
                    <span className="truncate">{lr.reason}</span>
                    <Badge variant="destructive" className="ml-2">{lr.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance by Source */}
        {sourcePerf && sourcePerf.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Performance por Origem</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Origem</TableHead>
                    <TableHead className="text-xs text-right">Leads</TableHead>
                    <TableHead className="text-xs text-right">Conv.</TableHead>
                    <TableHead className="text-xs text-right">Taxa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sourcePerf.map(s => (
                    <TableRow key={s.source}>
                      <TableCell className="text-xs">
                        {LEAD_SOURCES.find(ls => ls.value === s.source)?.label || s.source}
                      </TableCell>
                      <TableCell className="text-xs text-right">{s.leads}</TableCell>
                      <TableCell className="text-xs text-right">{s.converted}</TableCell>
                      <TableCell className="text-xs text-right font-medium">{s.rate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance by User */}
      {userPerf && userPerf.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance por Responsável</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Responsável</TableHead>
                  <TableHead className="text-xs text-right">Leads</TableHead>
                  <TableHead className="text-xs text-right">Oportunidades</TableHead>
                  <TableHead className="text-xs text-right">Valor Ganho</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userPerf.map(u => (
                  <TableRow key={u.userId}>
                    <TableCell className="text-xs font-medium">{u.userName}</TableCell>
                    <TableCell className="text-xs text-right">{u.leads}</TableCell>
                    <TableCell className="text-xs text-right">{u.opportunities}</TableCell>
                    <TableCell className="text-xs text-right">{fmtCurrency(u.wonValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
