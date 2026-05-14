import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { logPlatformAudit } from '@/lib/superAdminAudit';
import { toast } from 'sonner';
import {
  AlertTriangle, Download, Eye, FilterX, RefreshCw, ShieldAlert, Activity, CreditCard, Settings2, XCircle,
} from 'lucide-react';

type Severity = 'info' | 'warning' | 'critical' | 'error' | 'success';
type Source = 'frontend' | 'backend' | 'edge_function' | 'trigger' | 'system';

interface LogRow {
  id: string;
  created_at: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  actor_role: string | null;
  clinic_id: string | null;
  module: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  target_type: string | null;
  target_id: string | null;
  severity: Severity;
  description: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  route: string | null;
  source: Source;
  environment: string | null;
}

const MODULES: Array<{ value: string; label: string }> = [
  { value: 'plataforma', label: 'Plataforma' },
  { value: 'clinicas', label: 'Clínicas' },
  { value: 'planos', label: 'Planos' },
  { value: 'assinaturas', label: 'Assinaturas' },
  { value: 'recursos', label: 'Recursos da Clínica' },
  { value: 'usuarios', label: 'Usuários' },
  { value: 'ocorrencias', label: 'Ocorrências' },
  { value: 'integracoes', label: 'Integrações' },
  { value: 'uso', label: 'Uso da Plataforma' },
  { value: 'financeiro', label: 'Financeiro SaaS' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'sistema', label: 'Sistema' },
];

const SEVERITY_LABEL: Record<Severity, string> = {
  info: 'Informação',
  warning: 'Atenção',
  critical: 'Crítico',
  error: 'Erro',
  success: 'Sucesso',
};

const SOURCE_LABEL: Record<Source, string> = {
  frontend: 'frontend',
  backend: 'backend',
  edge_function: 'edge_function',
  trigger: 'trigger',
  system: 'sistema',
};

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  support: 'Suporte',
  operations: 'Operação',
  saas_finance: 'Financeiro SaaS',
};

function moduleLabel(v: string): string {
  return MODULES.find((m) => m.value === v)?.label ?? v;
}

function severityVariant(sev: Severity): { className: string } {
  switch (sev) {
    case 'info':
      return { className: 'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300' };
    case 'warning':
      return { className: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300' };
    case 'critical':
      return { className: 'bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-300' };
    case 'error':
      return { className: 'bg-red-700/20 text-red-800 border-red-700/40 dark:text-red-300' };
    case 'success':
      return { className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300' };
  }
}

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
  } catch {
    return iso;
  }
}

function csvEscape(v: unknown): string {
  if (v == null) return '';
  const s = String(v).replace(/"/g, '""');
  return `"${s}"`;
}

export default function SuperAdminLogs() {
  const { userId, loading: authLoading } = usePlatformAdmin();
  const [globalRole, setGlobalRole] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [clinics, setClinics] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ user_id: string; full_name: string | null; email: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<LogRow | null>(null);

  // filtros
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [clinicFilter, setClinicFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  // resumo (24h, criticas, etc.)
  const [summary, setSummary] = useState({
    last24h: 0,
    critical: 0,
    subscriptions: 0,
    features: 0,
    errors: 0,
  });

  // Carregar role global
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from('platform_users')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      setGlobalRole((data as { role?: string } | null)?.role ?? 'super_admin');
    })();
  }, [userId]);

  // Carregar listas auxiliares
  useEffect(() => {
    (async () => {
      const [{ data: cs }, { data: pus }] = await Promise.all([
        supabase.from('clinics').select('id, name').order('name'),
        supabase.from('platform_users').select('user_id, full_name, email').order('full_name'),
      ]);
      setClinics((cs as Array<{ id: string; name: string }>) ?? []);
      setUsers((pus as Array<{ user_id: string; full_name: string | null; email: string }>) ?? []);
    })();
  }, []);

  // Restrições de papel
  const canExport = globalRole === 'super_admin' || globalRole === 'support' || globalRole === 'operations';
  const restrictedToFinance = globalRole === 'saas_finance';

  // Buscar logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      let q = supabase
        .from('platform_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (restrictedToFinance) {
        q = q.in('module', ['assinaturas', 'financeiro']);
      }
      if (moduleFilter !== 'all') q = q.eq('module', moduleFilter);
      if (severityFilter !== 'all') q = q.eq('severity', severityFilter);
      if (clinicFilter !== 'all') q = q.eq('clinic_id', clinicFilter);
      if (userFilter !== 'all') q = q.eq('actor_user_id', userFilter);
      if (actionFilter.trim()) q = q.ilike('action', `%${actionFilter.trim()}%`);
      if (entityFilter.trim()) {
        const e = entityFilter.trim();
        q = q.or(`entity.ilike.%${e}%,target_type.ilike.%${e}%`);
      }
      if (from) q = q.gte('created_at', new Date(from).toISOString());
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        q = q.lte('created_at', toDate.toISOString());
      }
      if (search.trim()) {
        const s = search.trim();
        q = q.or(
          `action.ilike.%${s}%,actor_email.ilike.%${s}%,actor_name.ilike.%${s}%,entity.ilike.%${s}%,target_type.ilike.%${s}%,description.ilike.%${s}%`
        );
      }

      const offset = (page - 1) * pageSize;
      q = q.range(offset, offset + pageSize - 1);

      const { data, error, count } = await q;
      if (error) throw error;
      setLogs((data as unknown as LogRow[]) ?? []);
      setTotal(count ?? 0);

      if (page === 1 && !search && moduleFilter === 'all' && !actionFilter) {
        // recalcula resumo apenas em estado base
        await fetchSummary();
      }

      if (loading) toast.success('Logs carregados com sucesso.');
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível carregar os logs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const baseFilter = (qb: ReturnType<typeof supabase.from>) =>
      restrictedToFinance ? (qb as any).in('module', ['assinaturas', 'financeiro']) : qb;
    const [last24h, critical, subs, feats, errs] = await Promise.all([
      baseFilter(supabase.from('platform_audit_logs') as any)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', since24),
      baseFilter(supabase.from('platform_audit_logs') as any)
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'critical'),
      (supabase.from('platform_audit_logs') as any)
        .select('*', { count: 'exact', head: true })
        .eq('module', 'assinaturas')
        .gte('created_at', since24),
      (supabase.from('platform_audit_logs') as any)
        .select('*', { count: 'exact', head: true })
        .eq('module', 'recursos')
        .gte('created_at', since24),
      baseFilter(supabase.from('platform_audit_logs') as any)
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'error'),
    ]);
    setSummary({
      last24h: last24h.count ?? 0,
      critical: critical.count ?? 0,
      subscriptions: subs.count ?? 0,
      features: feats.count ?? 0,
      errors: errs.count ?? 0,
    });
  };

  useEffect(() => {
    if (authLoading) return;
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, page, pageSize, moduleFilter, severityFilter, clinicFilter, userFilter, restrictedToFinance]);

  const clinicNameById = useMemo(() => {
    const m = new Map<string, string>();
    clinics.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [clinics]);

  const handleApplyFilters = () => {
    setPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setSearch('');
    setModuleFilter('all');
    setActionFilter('');
    setSeverityFilter('all');
    setEntityFilter('');
    setClinicFilter('all');
    setUserFilter('all');
    setFrom('');
    setTo('');
    setPage(1);
    toast.success('Filtros limpos com sucesso.');
  };

  const handleExportCsv = async () => {
    if (!canExport) {
      toast.error('Você não tem permissão para acessar estes logs.');
      return;
    }
    setExporting(true);
    try {
      // Repete a query sem paginação (limite de segurança)
      let q = supabase
        .from('platform_audit_logs')
        .select(
          'created_at, actor_email, actor_name, actor_role, module, action, entity, entity_id, target_type, clinic_id, severity, ip_address, source'
        )
        .order('created_at', { ascending: false })
        .limit(5000);

      if (restrictedToFinance) q = q.in('module', ['assinaturas', 'financeiro']);
      if (moduleFilter !== 'all') q = q.eq('module', moduleFilter);
      if (severityFilter !== 'all') q = q.eq('severity', severityFilter);
      if (clinicFilter !== 'all') q = q.eq('clinic_id', clinicFilter);
      if (userFilter !== 'all') q = q.eq('actor_user_id', userFilter);
      if (actionFilter.trim()) q = q.ilike('action', `%${actionFilter.trim()}%`);
      if (entityFilter.trim()) {
        const e = entityFilter.trim();
        q = q.or(`entity.ilike.%${e}%,target_type.ilike.%${e}%`);
      }
      if (from) q = q.gte('created_at', new Date(from).toISOString());
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        q = q.lte('created_at', toDate.toISOString());
      }
      if (search.trim()) {
        const s = search.trim();
        q = q.or(
          `action.ilike.%${s}%,actor_email.ilike.%${s}%,actor_name.ilike.%${s}%,entity.ilike.%${s}%`
        );
      }

      let rows = ((await q).data as Array<Record<string, unknown>>) ?? [];

      // Suporte: não exportar logs críticos
      if (globalRole === 'support') {
        rows = rows.filter((r) => r.severity !== 'critical');
      }

      const headers = [
        'Data/Hora', 'Usuário', 'E-mail', 'Papel', 'Módulo', 'Ação',
        'Entidade', 'ID da entidade', 'Clínica', 'Severidade', 'IP', 'Origem',
      ];
      const lines = [headers.map(csvEscape).join(',')];
      for (const r of rows) {
        lines.push(
          [
            fmtDateTime(r.created_at as string),
            r.actor_name ?? '',
            r.actor_email ?? '',
            ROLE_LABEL[(r.actor_role as string) ?? ''] ?? r.actor_role ?? '',
            moduleLabel((r.module as string) ?? ''),
            r.action ?? '',
            (r.entity as string) ?? (r.target_type as string) ?? '',
            r.entity_id ?? '',
            r.clinic_id ? clinicNameById.get(r.clinic_id as string) ?? r.clinic_id : '',
            SEVERITY_LABEL[(r.severity as Severity) ?? 'info'],
            r.ip_address ?? '',
            SOURCE_LABEL[(r.source as Source) ?? 'frontend'] ?? r.source ?? '',
          ].map(csvEscape).join(',')
        );
      }
      const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      await logPlatformAudit({
        action: 'export.audit_logs',
        module: 'plataforma',
        severity: 'info',
        description: 'Exportação de logs de auditoria',
        metadata: { rows: rows.length, filters: { search, moduleFilter, severityFilter, clinicFilter, userFilter, actionFilter, from, to } },
      });
      toast.success('Exportação concluída com sucesso.');
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível exportar os logs.');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Logs e Auditoria</h1>
        <p className="text-sm text-muted-foreground">
          Auditoria das ações administrativas da plataforma.
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <SummaryCard icon={<Activity className="h-4 w-4" />} title="Eventos nas últimas 24h" value={summary.last24h} />
        <SummaryCard icon={<ShieldAlert className="h-4 w-4 text-red-500" />} title="Ações críticas" value={summary.critical} />
        <SummaryCard icon={<CreditCard className="h-4 w-4 text-blue-500" />} title="Alterações em assinaturas" value={summary.subscriptions} />
        <SummaryCard icon={<Settings2 className="h-4 w-4 text-amber-500" />} title="Recursos de clínicas" value={summary.features} />
        <SummaryCard icon={<XCircle className="h-4 w-4 text-red-700" />} title="Falhas e erros" value={summary.errors} />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            <Input
              placeholder="Buscar por usuário, e-mail, ação, entidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            />
            <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Módulo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os módulos</SelectItem>
                {MODULES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Ação (ex.: clinic.update)" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()} />
            <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Severidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as severidades</SelectItem>
                <SelectItem value="info">Informação</SelectItem>
                <SelectItem value="warning">Atenção</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Entidade (ex.: clinic, plan)" value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()} />
            <Select value={clinicFilter} onValueChange={(v) => { setClinicFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Clínica" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as clínicas</SelectItem>
                {clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={(v) => { setUserFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Usuário" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {users.map((u) => <SelectItem key={u.user_id} value={u.user_id}>{u.full_name || u.email}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="De" />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Até" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleApplyFilters} size="sm">
              <RefreshCw className="mr-2 h-4 w-4" /> Aplicar
            </Button>
            <Button onClick={handleClearFilters} variant="outline" size="sm">
              <FilterX className="mr-2 h-4 w-4" /> Limpar filtros
            </Button>
            <div className="flex-1" />
            <Button onClick={handleExportCsv} variant="outline" size="sm" disabled={exporting || !canExport}>
              <Download className="mr-2 h-4 w-4" /> {exporting ? 'Exportando...' : 'Exportar CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Clínica</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8" />
                      <p className="font-medium">Nenhum log encontrado.</p>
                      <p className="text-sm">As ações administrativas da plataforma aparecerão aqui.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap text-xs">{fmtDateTime(l.created_at)}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{l.actor_name || l.actor_email || '—'}</div>
                      <div className="text-xs text-muted-foreground">{l.actor_email}</div>
                    </TableCell>
                    <TableCell><span className="font-mono text-xs">{l.action}</span></TableCell>
                    <TableCell><span className="text-xs">{moduleLabel(l.module)}</span></TableCell>
                    <TableCell><span className="text-xs">{l.entity || l.target_type || '—'}</span></TableCell>
                    <TableCell><span className="text-xs">{l.clinic_id ? clinicNameById.get(l.clinic_id) ?? '—' : '—'}</span></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={severityVariant(l.severity).className}>
                        {SEVERITY_LABEL[l.severity]}
                      </Badge>
                    </TableCell>
                    <TableCell><span className="font-mono text-xs">{l.ip_address || '—'}</span></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(l)}>
                        <Eye className="mr-1 h-4 w-4" /> Ver detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginação */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <div>{total} registros encontrados</div>
        <div className="flex items-center gap-2">
          <span>Por página:</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span>Página {page} de {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      </div>

      {/* Drawer de detalhes */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm">{selected.action}</span>
                  <Badge variant="outline" className={severityVariant(selected.severity).className}>
                    {SEVERITY_LABEL[selected.severity]}
                  </Badge>
                  <Badge variant="secondary">{moduleLabel(selected.module)}</Badge>
                </SheetTitle>
                <SheetDescription>{fmtDateTime(selected.created_at)}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6 text-sm">
                <Section title="Responsável">
                  <Field label="Nome" value={selected.actor_name || '—'} />
                  <Field label="E-mail" value={selected.actor_email || '—'} />
                  <Field label="Papel global" value={ROLE_LABEL[selected.actor_role ?? ''] ?? selected.actor_role ?? '—'} />
                  <Field label="ID do usuário" value={selected.actor_user_id || '—'} mono />
                </Section>

                <Section title="Contexto">
                  <Field label="Clínica" value={selected.clinic_id ? clinicNameById.get(selected.clinic_id) ?? selected.clinic_id : '—'} />
                  <Field label="Entidade" value={selected.entity || selected.target_type || '—'} />
                  <Field label="ID da entidade" value={selected.entity_id || selected.target_id || '—'} mono />
                  <Field label="Módulo" value={moduleLabel(selected.module)} />
                  <Field label="Ação executada" value={selected.action} mono />
                  <Field label="IP" value={selected.ip_address || '—'} mono />
                  <Field label="User agent" value={selected.user_agent || '—'} />
                  <Field label="Rota/tela de origem" value={selected.route || '—'} />
                  <Field label="Ambiente" value={selected.environment || '—'} />
                </Section>

                <Section title="Dados da alteração">
                  {selected.description && <Field label="Descrição" value={selected.description} />}
                  {selected.old_values && (
                    <div>
                      <div className="mb-1 text-xs font-medium text-muted-foreground">Valores anteriores</div>
                      <pre className="max-h-64 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(selected.old_values, null, 2)}</pre>
                    </div>
                  )}
                  {selected.new_values && (
                    <div>
                      <div className="mb-1 text-xs font-medium text-muted-foreground">Valores novos</div>
                      <pre className="max-h-64 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(selected.new_values, null, 2)}</pre>
                    </div>
                  )}
                  {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                    <div>
                      <div className="mb-1 text-xs font-medium text-muted-foreground">Metadata</div>
                      <pre className="max-h-64 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(selected.metadata, null, 2)}</pre>
                    </div>
                  )}
                  {!selected.old_values && !selected.new_values && (!selected.metadata || Object.keys(selected.metadata).length === 0) && !selected.description && (
                    <div className="text-xs text-muted-foreground">Sem dados de alteração registrados.</div>
                  )}
                </Section>

                <Section title="Rastreamento">
                  <Field label="ID do log" value={selected.id} mono />
                  <Field label="Criado em" value={fmtDateTime(selected.created_at)} />
                  <Field label="Origem do evento" value={SOURCE_LABEL[selected.source] ?? selected.source} />
                </Section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SummaryCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md bg-muted p-2">{icon}</div>
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="space-y-2 rounded-md border p-3">{children}</div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`col-span-2 break-all text-xs ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
