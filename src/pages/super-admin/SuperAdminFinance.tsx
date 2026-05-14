import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertCircle, ArrowDownRight, ArrowUpRight, Download, RefreshCw, Search,
  TrendingUp, Wallet, Users, Activity, AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logPlatformAction } from '@/lib/superAdminAudit';
import { useNavigate } from 'react-router-dom';

type SubRow = {
  id: string;
  clinic_id: string;
  plan_id: string | null;
  status: string;
  cycle: string | null;
  contracted_amount: number | null;
  current_period_end: string | null;
  next_billing_at: string | null;
  last_payment_at: string | null;
  trial_ends_at: string | null;
  canceled_at: string | null;
  created_at: string;
  clinics?: { name: string | null } | null;
  subscription_plans?: { name: string | null; slug: string | null } | null;
};

const STATUS_LABEL: Record<string, string> = {
  trial: 'Trial', active: 'Ativa', overdue: 'Atrasada', blocked: 'Suspensa', canceled: 'Cancelada',
};
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  trial: 'secondary', active: 'default', overdue: 'destructive', blocked: 'destructive', canceled: 'outline',
};

const formatBRL = (v: number | null | undefined) =>
  Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function daysOverdue(s: SubRow): number {
  if (s.status !== 'overdue' && s.status !== 'blocked') return 0;
  const ref = s.next_billing_at ?? s.current_period_end;
  if (!ref) return 0;
  const d = Math.floor((Date.now() - new Date(ref).getTime()) / 86400000);
  return d > 0 ? d : 0;
}

function monthlyValue(s: SubRow): number {
  const amount = Number(s.contracted_amount ?? 0);
  if (!amount) return 0;
  if (s.cycle === 'yearly' || s.cycle === 'annual') return amount / 12;
  if (s.cycle === 'quarterly') return amount / 3;
  return amount;
}

export default function SuperAdminFinance() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('clinic_subscriptions')
        .select('*, clinics(name), subscription_plans(name, slug)')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setRows((data as any) ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Falha ao carregar dados financeiros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const kpis = useMemo(() => {
    const active = rows.filter((r) => r.status === 'active');
    const trial = rows.filter((r) => r.status === 'trial');
    const overdue = rows.filter((r) => r.status === 'overdue' || r.status === 'blocked');
    const canceled30 = rows.filter((r) => {
      if (r.status !== 'canceled' || !r.canceled_at) return false;
      return Date.now() - new Date(r.canceled_at).getTime() < 30 * 86400000;
    });
    const mrr = active.reduce((acc, r) => acc + monthlyValue(r), 0);
    const arr = mrr * 12;
    const pendingValue = overdue.reduce((acc, r) => acc + Number(r.contracted_amount ?? 0), 0);
    const receivedLast30 = rows
      .filter((r) => r.last_payment_at && Date.now() - new Date(r.last_payment_at).getTime() < 30 * 86400000)
      .reduce((acc, r) => acc + Number(r.contracted_amount ?? 0), 0);
    const baseChurn = active.length + canceled30.length;
    const churn = baseChurn > 0 ? (canceled30.length / baseChurn) * 100 : 0;

    return {
      mrr, arr, pendingValue, receivedLast30,
      activeCount: active.length,
      trialCount: trial.length,
      overdueCount: overdue.length,
      canceled30Count: canceled30.length,
      churn,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      const name = r.clinics?.name?.toLowerCase() ?? '';
      const plan = r.subscription_plans?.name?.toLowerCase() ?? '';
      return name.includes(q) || plan.includes(q);
    });
  }, [rows, search, statusFilter]);

  const exportCsv = async () => {
    const header = ['Clinica', 'Plano', 'Status', 'Ciclo', 'Valor', 'Proxima cobranca', 'Ultimo pagamento', 'Dias em atraso'];
    const lines = filtered.map((r) => [
      r.clinics?.name ?? '',
      r.subscription_plans?.name ?? '',
      STATUS_LABEL[r.status] ?? r.status,
      r.cycle ?? '',
      Number(r.contracted_amount ?? 0).toFixed(2),
      r.next_billing_at ? new Date(r.next_billing_at).toLocaleDateString('pt-BR') : '',
      r.last_payment_at ? new Date(r.last_payment_at).toLocaleDateString('pt-BR') : '',
      String(daysOverdue(r)),
    ]);
    const csv = [header, ...lines]
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro-saas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    await logPlatformAction({ action: 'finance.export_csv', metadata: { count: filtered.length } });
    toast.success('Exportação concluída.');
  };

  const updateStatus = async (id: string, status: string) => {
    const patch: Record<string, any> = { status };
    if (status === 'canceled') patch.canceled_at = new Date().toISOString();
    if (status === 'blocked') patch.blocked_at = new Date().toISOString();
    const { error: err } = await supabase.from('clinic_subscriptions').update(patch).eq('id', id);
    if (err) { toast.error('Erro ao atualizar status.'); return; }
    await logPlatformAction({ action: `finance.status.${status}`, target_type: 'clinic_subscription', target_id: id });
    toast.success('Status atualizado.');
    void load();
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financeiro SaaS</h1>
            <p className="text-sm text-muted-foreground">MRR, ARR, inadimplência e cobranças consolidadas da plataforma.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={loading || filtered.length === 0}>
              <Download className="h-4 w-4 mr-2" /> Exportar CSV
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Falha ao carregar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="MRR" value={loading ? null : formatBRL(kpis.mrr)} hint={`${kpis.activeCount} assinatura(s) ativa(s)`} />
          <KpiCard icon={<ArrowUpRight className="h-4 w-4" />} label="ARR projetado" value={loading ? null : formatBRL(kpis.arr)} hint="MRR x 12" />
          <KpiCard icon={<Wallet className="h-4 w-4" />} label="Recebido (30d)" value={loading ? null : formatBRL(kpis.receivedLast30)} hint="Pagamentos registrados" />
          <KpiCard icon={<AlertTriangle className="h-4 w-4 text-destructive" />} label="Inadimplência" value={loading ? null : formatBRL(kpis.pendingValue)} hint={`${kpis.overdueCount} em atraso`} />
          <KpiCard icon={<Users className="h-4 w-4" />} label="Trials ativos" value={loading ? null : String(kpis.trialCount)} hint="Em período de teste" />
          <KpiCard icon={<Activity className="h-4 w-4" />} label="Assinaturas ativas" value={loading ? null : String(kpis.activeCount)} hint="Excluindo trial" />
          <KpiCard icon={<ArrowDownRight className="h-4 w-4" />} label="Cancelamentos (30d)" value={loading ? null : String(kpis.canceled30Count)} hint="Janela móvel" />
          <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Churn (30d)" value={loading ? null : `${kpis.churn.toFixed(1)}%`} hint="cancelados / (ativas + cancelados)" />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base">Cobranças e assinaturas</CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar clínica ou plano…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Nenhuma assinatura corresponde aos filtros.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clínica</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Próxima cobrança</TableHead>
                    <TableHead>Último pagamento</TableHead>
                    <TableHead>Atraso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const overdue = daysOverdue(r);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.clinics?.name ?? '—'}</TableCell>
                        <TableCell>{r.subscription_plans?.name ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[r.status] ?? 'outline'}>
                            {STATUS_LABEL[r.status] ?? r.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatBRL(r.contracted_amount)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.next_billing_at ? new Date(r.next_billing_at).toLocaleDateString('pt-BR') : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.last_payment_at ? new Date(r.last_payment_at).toLocaleDateString('pt-BR') : '—'}
                        </TableCell>
                        <TableCell>
                          {overdue > 0 ? <Badge variant="destructive">{overdue}d</Badge> : <span className="text-muted-foreground text-sm">—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => navigate('/super-admin/assinaturas')}>
                              Detalhes
                            </Button>
                            {r.status === 'overdue' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => void updateStatus(r.id, 'blocked')}>
                                    Suspender
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Bloquear acesso até regularização</TooltipContent>
                              </Tooltip>
                            )}
                            {r.status === 'blocked' && (
                              <Button size="sm" variant="outline" onClick={() => void updateStatus(r.id, 'active')}>
                                Reativar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cobrança automática</AlertTitle>
          <AlertDescription>
            Não há gateway de pagamento ativo. Todos os valores exibidos são administrativos — registre pagamentos manualmente em <strong>Assinaturas</strong>.
          </AlertDescription>
        </Alert>
      </div>
    </TooltipProvider>
  );
}

function KpiCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string | null; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
        <div className="mt-2 text-2xl font-bold">
          {value === null ? <Skeleton className="h-7 w-24" /> : value}
        </div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}
