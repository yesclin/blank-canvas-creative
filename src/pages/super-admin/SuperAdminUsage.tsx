import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Activity, Users, Building2, CalendarCheck, FileText, MessageSquare, Stethoscope, Plug,
  RefreshCcw, AlertTriangle, TrendingUp, TrendingDown, Eye, ExternalLink, FileSearch, CreditCard, Loader2,
} from "lucide-react";
import { useSuperAdminPlatformUsage, fetchSubscriptionPlans, UsagePeriod, UsageFilters, ClinicUsageRow } from "@/hooks/useSuperAdminPlatformUsage";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend,
} from "recharts";

const PERIODS: { value: UsagePeriod; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "ytd", label: "Ano atual" },
  { value: "custom", label: "Personalizado" },
];

function fmtNumber(n: number) {
  return new Intl.NumberFormat("pt-BR").format(Math.round(n));
}
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("pt-BR"); } catch { return "—"; }
}
function healthVariant(label: ClinicUsageRow["health_label"]) {
  switch (label) {
    case "Saudável": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    case "Atenção": return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
    case "Risco": return "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30";
    case "Crítico": return "bg-destructive/15 text-destructive border-destructive/30";
  }
}
function severityVariant(s: string) {
  switch (s) {
    case "crítica": return "bg-destructive/15 text-destructive border-destructive/30";
    case "alta": return "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30";
    case "média": return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
    default: return "bg-muted text-muted-foreground";
  }
}

export default function SuperAdminUsage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<UsageFilters>({ period: "30d", status: "all", plan: "all" });
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<ClinicUsageRow | null>(null);

  useEffect(() => { fetchSubscriptionPlans().then(setPlans).catch(() => setPlans([])); }, []);

  const { data, loading, error, refresh } = useSuperAdminPlatformUsage(filters);

  const kpis = useMemo(() => ([
    { label: "Clínicas cadastradas", value: data?.totals.clinicsTotal ?? 0, icon: Building2 },
    { label: "Clínicas ativas", value: data?.totals.activeClinics ?? 0, icon: Activity },
    { label: "Usuários ativos", value: data?.totals.activeUsers ?? 0, icon: Users },
    { label: "Profissionais ativos", value: data?.totals.activeProfessionals ?? 0, icon: Stethoscope },
    { label: "Pacientes cadastrados", value: data?.totals.patientsTotal ?? 0, icon: Users },
    { label: "Agendamentos", value: data?.totals.appointments ?? 0, icon: CalendarCheck },
    { label: "Atendimentos finalizados", value: data?.totals.finishedAppointments ?? 0, icon: CalendarCheck },
    { label: "Registros de prontuário", value: data?.totals.clinicalRecords ?? 0, icon: FileText },
    { label: "Mensagens enviadas", value: data?.totals.messages ?? 0, icon: MessageSquare },
    { label: "Integrações ativas", value: data?.totals.activeIntegrations ?? 0, icon: Plug },
  ]), [data]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Uso da plataforma</h1>
            <p className="text-sm text-muted-foreground">Métricas de adoção, consumo e saúde por clínica.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filters.period} onValueChange={(v) => setFilters((f) => ({ ...f, period: v as UsagePeriod }))}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Período" /></SelectTrigger>
              <SelectContent>{PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v as any }))}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="subscribed">Assinantes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.plan} onValueChange={(v) => setFilters((f) => ({ ...f, plan: v }))}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Plano" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-1.5 h-4 w-4" />}
              Atualizar
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar dados</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={refresh}>Tentar novamente</Button>
            </AlertDescription>
          </Alert>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    {loading ? (
                      <Skeleton className="mt-2 h-7 w-16" />
                    ) : (
                      <p className="mt-1 text-2xl font-semibold">{fmtNumber(k.value)}</p>
                    )}
                  </div>
                  <k.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Health overview */}
        <Card>
          <CardHeader><CardTitle className="text-base">Saúde geral da plataforma</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              <HealthStat label="Clínicas ativas" value={`${(data?.health.activeRate ?? 0).toFixed(0)}%`} loading={loading} />
              <HealthStat label="Média agendamentos/clínica" value={fmtNumber(data?.health.avgAppointments ?? 0)} loading={loading} />
              <HealthStat label="Média pacientes/clínica" value={fmtNumber(data?.health.avgPatients ?? 0)} loading={loading} />
              <HealthStat label="Média profissionais/clínica" value={fmtNumber(data?.health.avgProfessionals ?? 0)} loading={loading} />
              <HealthStat label="Sem uso há 7 dias" value={fmtNumber(data?.health.inactive7d ?? 0)} loading={loading} accent="warn" />
              <HealthStat label="Risco de churn" value={fmtNumber(data?.health.churnRisk ?? 0)} loading={loading} accent="danger" />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="clinics">Clínicas</TabsTrigger>
            <TabsTrigger value="modules">Módulos</TabsTrigger>
            <TabsTrigger value="specialties">Especialidades</TabsTrigger>
            <TabsTrigger value="consumption">Consumo</TabsTrigger>
            <TabsTrigger value="risks">Riscos e Alertas</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Evolução de uso por dia</CardTitle></CardHeader>
              <CardContent className="h-72">
                {loading ? <Skeleton className="h-full w-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.trend ?? []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" fontSize={11} />
                      <YAxis fontSize={11} />
                      <ReTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="appointments" name="Agendamentos" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="patients" name="Pacientes" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="records" name="Prontuário" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="messages" name="Mensagens" stroke="#6366f1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Alertas operacionais</CardTitle></CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-32 w-full" /> : (data?.alerts.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum alerta operacional no momento.</p>
                ) : (
                  <div className="space-y-2">
                    {data!.alerts.slice(0, 8).map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <p className="text-sm font-medium">{a.clinic_name}</p>
                          <p className="text-xs text-muted-foreground">{a.reason}</p>
                        </div>
                        <Badge variant="outline" className={severityVariant(a.severity)}>{a.severity}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clinics */}
          <TabsContent value="clinics">
            <Card>
              <CardHeader><CardTitle className="text-base">Ranking de uso por clínica</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto p-0">
                {loading ? (
                  <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : (data?.clinics.length ?? 0) === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">Nenhuma clínica encontrada para os filtros selecionados.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Clínica</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead className="text-right">Usuários</TableHead>
                        <TableHead className="text-right">Profissionais</TableHead>
                        <TableHead className="text-right">Pacientes</TableHead>
                        <TableHead className="text-right">Agendam.</TableHead>
                        <TableHead className="text-right">Finalizados</TableHead>
                        <TableHead className="text-right">Prontuário</TableHead>
                        <TableHead className="text-right">Mensagens</TableHead>
                        <TableHead>Último acesso</TableHead>
                        <TableHead>Saúde</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...(data?.clinics ?? [])]
                        .sort((a, b) => b.appointments_count - a.appointments_count)
                        .map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell><Badge variant="outline">{c.subscription_status ?? "—"}</Badge></TableCell>
                            <TableCell>{c.plan_name ?? "—"}</TableCell>
                            <TableCell className="text-right">{c.users_count}</TableCell>
                            <TableCell className="text-right">{c.professionals_count}</TableCell>
                            <TableCell className="text-right">{c.patients_count}</TableCell>
                            <TableCell className="text-right">{c.appointments_count}</TableCell>
                            <TableCell className="text-right">{c.finished_count}</TableCell>
                            <TableCell className="text-right">{c.clinical_records_count}</TableCell>
                            <TableCell className="text-right">{c.messages_count}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{fmtDate(c.last_access_at)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={healthVariant(c.health_label)}>
                                {c.health_label} · {c.health_score}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Tooltip><TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => setSelectedClinic(c)}><Eye className="h-4 w-4" /></Button>
                                </TooltipTrigger><TooltipContent>Ver detalhes</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => navigate(`/super-admin/clinicas?clinic=${c.id}`)}><ExternalLink className="h-4 w-4" /></Button>
                                </TooltipTrigger><TooltipContent>Abrir clínica</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => navigate(`/super-admin/logs?clinic=${c.id}`)}><FileSearch className="h-4 w-4" /></Button>
                                </TooltipTrigger><TooltipContent>Ver logs</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => navigate(`/super-admin/assinaturas?clinic=${c.id}`)}><CreditCard className="h-4 w-4" /></Button>
                                </TooltipTrigger><TooltipContent>Ver assinatura</TooltipContent></Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modules */}
          <TabsContent value="modules">
            <Card>
              <CardHeader><CardTitle className="text-base">Adoção por módulo</CardTitle></CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-64 w-full" /> : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {(data?.modules ?? []).map((m) => (
                      <div key={m.key} className="rounded-md border p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{m.label}</p>
                          <Badge variant="outline">{m.status}</Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {m.clinicsUsing} clínicas · {fmtNumber(m.events)} eventos · {m.adoption.toFixed(0)}% de adoção
                        </p>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-muted">
                          <div className="h-full bg-primary" style={{ width: `${Math.min(100, m.adoption)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Specialties */}
          <TabsContent value="specialties">
            <Card>
              <CardHeader><CardTitle className="text-base">Uso por especialidade oficial</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto p-0">
                {loading ? <div className="p-4"><Skeleton className="h-40 w-full" /></div> : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Especialidade</TableHead>
                      <TableHead className="text-right">Clínicas</TableHead>
                      <TableHead className="text-right">Profissionais</TableHead>
                      <TableHead className="text-right">Agendamentos</TableHead>
                      <TableHead className="text-right">Registros</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(data?.specialties ?? []).map((s) => (
                        <TableRow key={s.slug}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-right">{s.clinics}</TableCell>
                          <TableCell className="text-right">{s.professionals}</TableCell>
                          <TableCell className="text-right">{s.appointments}</TableCell>
                          <TableCell className="text-right">{s.records}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consumption */}
          <TabsContent value="consumption">
            <Card>
              <CardHeader><CardTitle className="text-base">Consumo operacional</CardTitle></CardHeader>
              <CardContent className="h-80">
                {loading ? <Skeleton className="h-full w-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.consumption ?? []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="label" fontSize={10} interval={0} angle={-20} textAnchor="end" height={70} />
                      <YAxis fontSize={11} />
                      <ReTooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risks */}
          <TabsContent value="risks">
            <Card>
              <CardHeader><CardTitle className="text-base">Riscos e alertas</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto p-0">
                {loading ? <div className="p-4"><Skeleton className="h-40 w-full" /></div> : (data?.alerts.length ?? 0) === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">Nenhum alerta no período.</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Clínica</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Última ocorrência</TableHead>
                      <TableHead>Ação sugerida</TableHead>
                      <TableHead className="text-right">Detalhes</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {data!.alerts.map((a) => {
                        const clinic = data!.clinics.find((c) => c.id === a.clinic_id) ?? null;
                        return (
                          <TableRow key={a.id}>
                            <TableCell><Badge variant="outline" className={severityVariant(a.severity)}>{a.severity}</Badge></TableCell>
                            <TableCell className="font-medium">{a.clinic_name}</TableCell>
                            <TableCell className="text-sm">{a.reason}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{fmtDate(a.lastAt)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{a.suggested}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost" onClick={() => clinic && setSelectedClinic(clinic)} disabled={!clinic}>
                                <Eye className="mr-1 h-4 w-4" /> Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Clinic details drawer */}
        <Sheet open={!!selectedClinic} onOpenChange={(o) => !o && setSelectedClinic(null)}>
          <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
            {selectedClinic && (
              <>
                <SheetHeader>
                  <SheetTitle>{selectedClinic.name}</SheetTitle>
                  <SheetDescription>Métricas agregadas no período selecionado.</SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{selectedClinic.subscription_status ?? "sem assinatura"}</Badge>
                    {selectedClinic.plan_name && <Badge variant="outline">{selectedClinic.plan_name}</Badge>}
                    <Badge variant="outline" className={healthVariant(selectedClinic.health_label)}>
                      {selectedClinic.health_label} · {selectedClinic.health_score}
                    </Badge>
                    {selectedClinic.whatsapp_connected && <Badge variant="outline">WhatsApp conectado</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailMini label="Usuários" value={selectedClinic.users_count} />
                    <DetailMini label="Profissionais" value={selectedClinic.professionals_count} />
                    <DetailMini label="Pacientes" value={selectedClinic.patients_count} />
                    <DetailMini label="Agendamentos" value={selectedClinic.appointments_count} />
                    <DetailMini label="Finalizados" value={selectedClinic.finished_count} />
                    <DetailMini label="Registros clínicos" value={selectedClinic.clinical_records_count} />
                    <DetailMini label="Mensagens" value={selectedClinic.messages_count} />
                    <DetailMini label="Último acesso" value={fmtDate(selectedClinic.last_access_at)} small />
                  </div>
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Sinais</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <Signal ok={selectedClinic.has_login_recent} label="Login nos últimos 7 dias" />
                      <Signal ok={selectedClinic.has_appt_recent} label="Agendamento nos últimos 15 dias" />
                      <Signal ok={selectedClinic.whatsapp_connected} label="Integração WhatsApp ativa" />
                    </CardContent>
                  </Card>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/super-admin/clinicas?clinic=${selectedClinic.id}`)}>
                      <ExternalLink className="mr-1.5 h-4 w-4" /> Abrir clínica
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/super-admin/logs?clinic=${selectedClinic.id}`)}>
                      <FileSearch className="mr-1.5 h-4 w-4" /> Ver logs
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/super-admin/assinaturas?clinic=${selectedClinic.id}`)}>
                      <CreditCard className="mr-1.5 h-4 w-4" /> Ver assinatura
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}

function HealthStat({ label, value, loading, accent }: { label: string; value: string; loading?: boolean; accent?: "warn" | "danger" }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {loading ? <Skeleton className="mt-2 h-6 w-20" /> : (
        <p className={`mt-1 text-xl font-semibold ${accent === "danger" ? "text-destructive" : accent === "warn" ? "text-amber-600" : ""}`}>{value}</p>
      )}
    </div>
  );
}

function DetailMini({ label, value, small }: { label: string; value: number | string; small?: boolean }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-semibold ${small ? "text-sm" : "text-lg"}`}>{typeof value === "number" ? fmtNumber(value) : value}</p>
    </div>
  );
}

function Signal({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      {ok ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
    </div>
  );
}
