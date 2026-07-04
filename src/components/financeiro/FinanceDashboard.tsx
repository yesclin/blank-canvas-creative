import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Wallet, Clock, AlertCircle, CalendarClock, Coins, Target } from "lucide-react";
import { useFinanceDashboard, type DashboardPeriod } from "@/hooks/useFinanceDashboard";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFinancialAccessControl } from "@/hooks/useFinancialAccessControl";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2, 217 91% 60%))", "hsl(var(--chart-3, 142 71% 45%))", "hsl(var(--chart-4, 38 92% 50%))", "hsl(var(--chart-5, 340 82% 52%))", "hsl(var(--muted-foreground))"];

function KpiCard({ icon: Icon, label, value, hint, tone }: { icon: any; label: string; value: string; hint?: string; tone?: "positive" | "negative" | "warning" | "neutral" }) {
  const toneClass =
    tone === "positive" ? "text-green-600" :
    tone === "negative" ? "text-red-600" :
    tone === "warning" ? "text-orange-600" : "text-foreground";
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${toneClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function FinanceDashboard() {
  const { canViewRevenue, isLoading: accLoading } = useFinancialAccessControl();
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [specialtyId, setSpecialtyId] = useState<string | null>(null);

  const { data: professionals = [] } = useProfessionals();
  const { data: specialties = [] } = useQuery({
    queryKey: ["specialties-lookup"],
    queryFn: async () => {
      const { data } = await supabase.from("specialties").select("id,name").order("name");
      return data ?? [];
    },
  });

  const { data, isLoading } = useFinanceDashboard({ period, professionalId, specialtyId });

  const professionalPie = useMemo(() =>
    (data?.byProfessional ?? []).slice(0, 6).map(p => ({ name: p.name, value: p.total })),
  [data]);
  const specialtyPie = useMemo(() =>
    (data?.bySpecialty ?? []).slice(0, 6).map(s => ({ name: s.name, value: s.total })),
  [data]);
  const paymentPie = useMemo(() =>
    (data?.byPaymentMethod ?? []).slice(0, 6).map(p => ({ name: p.method, value: p.total })),
  [data]);
  const procedureBars = useMemo(() =>
    (data?.byProcedure ?? []).slice(0, 8).map(p => ({ name: p.name, total: p.total })),
  [data]);

  if (!accLoading && !canViewRevenue) {
    return (
      <Card>
        <CardHeader><CardTitle>Dashboard Financeiro</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Você não tem permissão para visualizar dados financeiros.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as DashboardPeriod)}>
          <TabsList>
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="year">Ano</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap gap-2">
          <Select value={professionalId ?? "all"} onValueChange={(v) => setProfessionalId(v === "all" ? null : v)}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Profissional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos profissionais</SelectItem>
              {professionals.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={specialtyId ?? "all"} onValueChange={(v) => setSpecialtyId(v === "all" ? null : v)}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Especialidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas especialidades</SelectItem>
              {specialties.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI cards row 1: revenue windows */}
      {isLoading || !data ? (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <KpiCard icon={TrendingUp} label="Receita Hoje" value={fmt(data.revenue.today)} tone="positive" />
            <KpiCard icon={TrendingUp} label="Receita Semana" value={fmt(data.revenue.week)} tone="positive" />
            <KpiCard icon={TrendingUp} label="Receita Mês" value={fmt(data.revenue.month)} tone="positive" />
            <KpiCard icon={TrendingUp} label="Receita Ano" value={fmt(data.revenue.year)} tone="positive" />
          </div>

          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <KpiCard icon={Clock} label="Contas a Receber" value={fmt(data.receivable)} tone="warning" hint="Pendentes" />
            <KpiCard icon={TrendingDown} label="Contas a Pagar" value={fmt(data.payable)} tone="negative" hint="Pendentes" />
            <KpiCard icon={AlertCircle} label="Contas Vencidas" value={fmt(data.overdue)} tone="negative" />
            <KpiCard icon={CalendarClock} label="Contas a Vencer" value={fmt(data.upcoming)} tone="neutral" />
          </div>

          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <KpiCard icon={Wallet} label="Caixa Atual" value={fmt(data.cashCurrent)} tone="neutral" hint="Caixas abertos" />
            <KpiCard icon={Target} label="Ticket Médio" value={fmt(data.ticketAverage)} tone="neutral" />
            <KpiCard icon={Coins} label="Faturamento período" value={fmt(data.timeSeries.reduce((a, b) => a + b.receita, 0))} tone="positive" />
            <KpiCard icon={TrendingDown} label="Despesa período" value={fmt(data.timeSeries.reduce((a, b) => a + b.despesa, 0))} tone="negative" />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Receita x Despesa no período</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                {data.timeSeries.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem lançamentos no período</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                      <Tooltip formatter={(v: any) => fmt(Number(v))} />
                      <Legend />
                      <Line type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={2} />
                      <Line type="monotone" dataKey="despesa" stroke="#dc2626" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Faturamento por Procedimento</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                {procedureBars.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={procedureBars} layout="vertical" margin={{ left: 40 }}>
                      <XAxis type="number" fontSize={11} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                      <YAxis dataKey="name" type="category" fontSize={11} width={140} />
                      <Tooltip formatter={(v: any) => fmt(Number(v))} />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Faturamento por Profissional</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                {professionalPie.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={professionalPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={95}>
                        {professionalPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => fmt(Number(v))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Faturamento por Especialidade</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                {specialtyPie.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={specialtyPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={95}>
                        {specialtyPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => fmt(Number(v))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Faturamento por Forma de Pagamento</CardTitle></CardHeader>
              <CardContent className="h-[260px]">
                {paymentPie.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentPie}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                      <Tooltip formatter={(v: any) => fmt(Number(v))} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
