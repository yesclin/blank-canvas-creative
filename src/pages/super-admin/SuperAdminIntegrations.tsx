import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Activity, AlertTriangle, Building2, Plug, Webhook, FileSearch, Settings as SettingsIcon,
  Zap, RefreshCw, Eye, KeyRound, Power, Copy, Download, ShieldAlert,
} from 'lucide-react';
import { logPlatformAction } from '@/lib/superAdminAudit';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Provider = {
  id: string;
  key: string;
  name: string;
  category: string;
  status: string;
  environment: string;
  base_url: string | null;
  api_key_masked: string | null;
  token_masked: string | null;
  webhook_secret_masked: string | null;
  timeout_seconds: number;
  retry_limit: number;
  is_enabled: boolean;
  last_healthcheck_at: string | null;
  last_healthcheck_status: string | null;
  last_error_message: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
};

type WebhookRow = {
  id: string;
  name: string;
  provider_key: string;
  url: string;
  secret_masked: string | null;
  status: string;
  last_received_at: string | null;
  failure_count: number;
};

type LogRow = {
  id: string;
  provider_key: string;
  clinic_id: string | null;
  event_type: string;
  status: string;
  http_status: number | null;
  request_id: string | null;
  message: string | null;
  request_payload: unknown;
  response_payload: unknown;
  error_stack: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type SettingsRow = {
  id: string;
  logs_enabled: boolean;
  log_retention_days: number;
  default_timeout_seconds: number;
  default_retry_limit: number;
  notify_critical_failures: boolean;
  alert_email: string | null;
  alert_webhook_url: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  erro: 'Com erro',
  configuracao_pendente: 'Configuração pendente',
  degradado: 'Degradado',
};

const STATUS_VARIANT: Record<string, string> = {
  ativo: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  inativo: 'bg-muted text-muted-foreground border-border',
  erro: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  configuracao_pendente: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  degradado: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
};

const LOG_STATUS_LABEL: Record<string, string> = {
  sucesso: 'Sucesso',
  erro: 'Erro',
  aviso: 'Aviso',
  info: 'Informação',
};

const LOG_STATUS_VARIANT: Record<string, string> = {
  sucesso: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  erro: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  aviso: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  info: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
};

const ENV_LABEL: Record<string, string> = {
  production: 'Produção',
  staging: 'Homologação',
  development: 'Desenvolvimento',
};

function maskValue(v: string): string {
  const tail = v.slice(-4);
  return `••••••••••••${tail}`;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  try {
    return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return '—';
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={STATUS_VARIANT[status] ?? STATUS_VARIANT.inativo}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

function LogStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={LOG_STATUS_VARIANT[status] ?? LOG_STATUS_VARIANT.info}>
      {LOG_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export default function SuperAdminIntegrations() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [settings, setSettings] = useState<SettingsRow | null>(null);
  const [clinicsByIntegration, setClinicsByIntegration] = useState<Array<{
    id: string; clinic_id: string; clinic_name: string; channel: string; status: string | null;
    last_check: string | null; last_error: string | null; is_active: boolean;
  }>>([]);
  const [stats, setStats] = useState({
    active: 0, errors: 0, clinicsConnected: 0, webhooksToday: 0, failures24h: 0,
  });

  // Filters logs
  const [logFilters, setLogFilters] = useState({
    provider: 'all', status: 'all', clinic: 'all', period: '7d', search: '',
  });

  // Modals
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [logDetail, setLogDetail] = useState<LogRow | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, wh, lg, st, ci] = await Promise.all([
        supabase.from('platform_integration_providers').select('*').order('category').order('name'),
        supabase.from('platform_integration_webhooks').select('*').order('created_at', { ascending: false }),
        supabase.from('platform_integration_logs').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('platform_integration_settings').select('*').order('created_at').limit(1),
        supabase.from('clinic_channel_integrations').select('id, clinic_id, channel, provider, is_active, last_connection_status, last_connection_check_at, last_error, clinics:clinic_id(name)').order('updated_at', { ascending: false }).limit(200),
      ]);

      if (pr.error) throw pr.error;
      const provs = (pr.data ?? []) as Provider[];
      setProviders(provs);
      setWebhooks((wh.data ?? []) as WebhookRow[]);
      setLogs((lg.data ?? []) as LogRow[]);
      setSettings((st.data?.[0] ?? null) as SettingsRow | null);

      const ciRows = (ci.data ?? []).map((r: any) => ({
        id: r.id,
        clinic_id: r.clinic_id,
        clinic_name: r.clinics?.name ?? '—',
        channel: r.provider ?? r.channel,
        status: r.last_connection_status,
        last_check: r.last_connection_check_at,
        last_error: r.last_error,
        is_active: !!r.is_active,
      }));
      setClinicsByIntegration(ciRows);

      // Stats
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const day24h = new Date(Date.now() - 24 * 3600 * 1000);

      const webhooksToday = (lg.data ?? []).filter(
        (l: LogRow) => l.event_type?.toLowerCase().includes('webhook') && new Date(l.created_at) >= todayStart,
      ).length;
      const failures24h = (lg.data ?? []).filter(
        (l: LogRow) => l.status === 'erro' && new Date(l.created_at) >= day24h,
      ).length;

      setStats({
        active: provs.filter((p) => p.is_enabled && p.status === 'ativo').length,
        errors: provs.filter((p) => p.status === 'erro' || p.status === 'degradado').length,
        clinicsConnected: new Set(ciRows.filter((r) => r.is_active).map((r) => r.clinic_id)).size,
        webhooksToday,
        failures24h,
      });
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível carregar as integrações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ---- Provider actions ----
  const toggleProvider = async (p: Provider) => {
    const next = !p.is_enabled;
    const { error } = await supabase
      .from('platform_integration_providers')
      .update({ is_enabled: next, status: next ? (p.status === 'inativo' ? 'ativo' : p.status) : 'inativo' })
      .eq('id', p.id);
    if (error) {
      toast.error('Não foi possível concluir a ação.');
      return;
    }
    toast.success(next ? 'Integração ativada com sucesso.' : 'Integração desativada com sucesso.');
    await logPlatformAction({
      action: next ? 'integration.enable' : 'integration.disable',
      entity: 'platform_integration_providers',
      entity_id: p.id,
      module: 'integracoes',
      description: `${next ? 'Ativou' : 'Desativou'} integração ${p.name}`,
      metadata: { provider_key: p.key },
    });
    loadAll();
  };

  const testConnection = async (p: Provider) => {
    const t0 = Date.now();
    let ok = true;
    let message: string | null = null;
    try {
      // Real lightweight check: ping base_url if available, else mark as warning if no creds.
      if (!p.base_url && !p.api_key_masked && !p.token_masked) {
        ok = false;
        message = 'Sem credenciais configuradas para teste real.';
      } else if (p.base_url) {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), Math.min(p.timeout_seconds, 10) * 1000);
        try {
          const res = await fetch(p.base_url, { method: 'HEAD', mode: 'no-cors', signal: ctrl.signal });
          ok = true;
          message = `HEAD ${p.base_url} respondeu (${res.type}).`;
        } catch (e: any) {
          ok = false;
          message = `Falha ao alcançar ${p.base_url}: ${e?.message ?? 'erro desconhecido'}`;
        } finally {
          clearTimeout(to);
        }
      }
    } catch (e: any) {
      ok = false;
      message = e?.message ?? 'Erro inesperado.';
    }

    await supabase
      .from('platform_integration_providers')
      .update({
        last_healthcheck_at: new Date().toISOString(),
        last_healthcheck_status: ok ? 'sucesso' : 'erro',
        last_error_message: ok ? null : message,
        status: ok ? (p.is_enabled ? 'ativo' : 'inativo') : 'erro',
      })
      .eq('id', p.id);

    await supabase.from('platform_integration_logs').insert({
      provider_key: p.key,
      event_type: 'healthcheck',
      status: ok ? 'sucesso' : 'erro',
      message,
      metadata: { duration_ms: Date.now() - t0 },
    });

    await logPlatformAction({
      action: 'integration.test_connection',
      entity: 'platform_integration_providers',
      entity_id: p.id,
      module: 'integracoes',
      description: `Testou conexão de ${p.name}`,
      metadata: { provider_key: p.key, success: ok },
    });

    if (ok) toast.success('Conexão testada com sucesso.');
    else toast.error('Falha ao testar conexão.');
    loadAll();
  };

  const saveProvider = async (form: Partial<Provider> & {
    api_key?: string; token?: string; webhook_secret?: string;
  }) => {
    if (!editingProvider) return;
    const update: any = {
      name: form.name,
      category: form.category,
      environment: form.environment,
      base_url: form.base_url || null,
      timeout_seconds: form.timeout_seconds,
      retry_limit: form.retry_limit,
      is_enabled: form.is_enabled,
      notes: form.notes || null,
      status: form.status,
    };
    if (form.api_key && form.api_key.trim()) update.api_key_masked = maskValue(form.api_key.trim());
    if (form.token && form.token.trim()) update.token_masked = maskValue(form.token.trim());
    if (form.webhook_secret && form.webhook_secret.trim()) update.webhook_secret_masked = maskValue(form.webhook_secret.trim());

    const { error } = await supabase
      .from('platform_integration_providers')
      .update(update)
      .eq('id', editingProvider.id);

    if (error) {
      toast.error('Não foi possível concluir a ação.');
      return;
    }

    const credsChanged = !!(form.api_key || form.token || form.webhook_secret);
    toast.success(credsChanged ? 'Credencial atualizada com sucesso.' : 'Integração atualizada com sucesso.');

    await logPlatformAction({
      action: credsChanged ? 'integration.update_credential' : 'integration.update',
      entity: 'platform_integration_providers',
      entity_id: editingProvider.id,
      module: 'integracoes',
      description: `Atualizou integração ${editingProvider.name}`,
      metadata: { provider_key: editingProvider.key, credentials_rotated: credsChanged },
    });

    setEditingProvider(null);
    loadAll();
  };

  // ---- Webhook actions ----
  const regenerateWebhookSecret = async (w: WebhookRow) => {
    const fresh = crypto.randomUUID().replace(/-/g, '');
    const { error } = await supabase
      .from('platform_integration_webhooks')
      .update({ secret_masked: maskValue(fresh) })
      .eq('id', w.id);
    if (error) {
      toast.error('Não foi possível concluir a ação.');
      return;
    }
    try { await navigator.clipboard.writeText(fresh); } catch { /* ignore */ }
    toast.success('Segredo do webhook regenerado com sucesso.');
    await logPlatformAction({
      action: 'webhook.regenerate_secret',
      entity: 'platform_integration_webhooks',
      entity_id: w.id,
      module: 'integracoes',
      description: `Regenerou segredo do webhook ${w.name}`,
    });
    loadAll();
  };

  const toggleWebhook = async (w: WebhookRow) => {
    const next = w.status === 'ativo' ? 'inativo' : 'ativo';
    const { error } = await supabase.from('platform_integration_webhooks').update({ status: next }).eq('id', w.id);
    if (error) { toast.error('Não foi possível concluir a ação.'); return; }
    toast.success(next === 'ativo' ? 'Integração ativada com sucesso.' : 'Integração desativada com sucesso.');
    loadAll();
  };

  // ---- Logs filters ----
  const filteredLogs = useMemo(() => {
    const since = logFilters.period === '24h' ? Date.now() - 24 * 3600 * 1000
      : logFilters.period === '7d' ? Date.now() - 7 * 24 * 3600 * 1000
      : logFilters.period === '30d' ? Date.now() - 30 * 24 * 3600 * 1000
      : 0;
    return logs.filter((l) => {
      if (logFilters.provider !== 'all' && l.provider_key !== logFilters.provider) return false;
      if (logFilters.status !== 'all' && l.status !== logFilters.status) return false;
      if (logFilters.clinic !== 'all' && l.clinic_id !== logFilters.clinic) return false;
      if (since && new Date(l.created_at).getTime() < since) return false;
      if (logFilters.search && !(l.message ?? '').toLowerCase().includes(logFilters.search.toLowerCase())) return false;
      return true;
    });
  }, [logs, logFilters]);

  const exportLogsCsv = async () => {
    const header = ['Data/Hora', 'Provedor', 'Evento', 'Status', 'Clínica', 'Código HTTP', 'Request ID', 'Mensagem'];
    const rows = filteredLogs.map((l) => [
      formatDate(l.created_at),
      l.provider_key,
      l.event_type,
      LOG_STATUS_LABEL[l.status] ?? l.status,
      l.clinic_id ?? '',
      l.http_status ?? '',
      l.request_id ?? '',
      (l.message ?? '').replace(/[\r\n;]/g, ' '),
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `logs_integracoes_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Logs exportados com sucesso.');
    await logPlatformAction({
      action: 'integration.export_logs',
      module: 'integracoes',
      description: `Exportou ${rows.length} logs técnicos de integrações`,
      metadata: { count: rows.length, filters: logFilters },
    });
  };

  // ---- Settings ----
  const saveSettings = async (s: SettingsRow) => {
    const { error } = await supabase.from('platform_integration_settings').update({
      logs_enabled: s.logs_enabled,
      log_retention_days: s.log_retention_days,
      default_timeout_seconds: s.default_timeout_seconds,
      default_retry_limit: s.default_retry_limit,
      notify_critical_failures: s.notify_critical_failures,
      alert_email: s.alert_email,
      alert_webhook_url: s.alert_webhook_url,
    }).eq('id', s.id);
    if (error) { toast.error('Não foi possível concluir a ação.'); return; }
    toast.success('Integração atualizada com sucesso.');
    await logPlatformAction({
      action: 'integration.update_settings',
      module: 'integracoes',
      description: 'Atualizou configurações globais de integrações',
      metadata: {
        log_retention_days: s.log_retention_days,
        default_timeout_seconds: s.default_timeout_seconds,
        default_retry_limit: s.default_retry_limit,
      },
    });
    loadAll();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
        <p className="text-sm text-muted-foreground">
          Conectores com gateways, mensageria, Storage e outros provedores.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <SummaryCard icon={<Activity className="h-4 w-4" />} label="Integrações ativas" value={stats.active} loading={loading} />
        <SummaryCard icon={<AlertTriangle className="h-4 w-4 text-red-500" />} label="Integrações com erro" value={stats.errors} loading={loading} />
        <SummaryCard icon={<Building2 className="h-4 w-4" />} label="Clínicas conectadas" value={stats.clinicsConnected} loading={loading} />
        <SummaryCard icon={<Webhook className="h-4 w-4" />} label="Webhooks recebidos hoje" value={stats.webhooksToday} loading={loading} />
        <SummaryCard icon={<ShieldAlert className="h-4 w-4 text-orange-500" />} label="Falhas nas últimas 24h" value={stats.failures24h} loading={loading} />
      </div>

      <Tabs defaultValue="provedores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="provedores"><Plug className="mr-2 h-4 w-4" />Provedores</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook className="mr-2 h-4 w-4" />Webhooks</TabsTrigger>
          <TabsTrigger value="logs"><FileSearch className="mr-2 h-4 w-4" />Logs técnicos</TabsTrigger>
          <TabsTrigger value="clinicas"><Building2 className="mr-2 h-4 w-4" />Clínicas conectadas</TabsTrigger>
          <TabsTrigger value="config"><SettingsIcon className="mr-2 h-4 w-4" />Configurações globais</TabsTrigger>
        </TabsList>

        {/* PROVEDORES */}
        <TabsContent value="provedores">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
            </div>
          ) : providers.length === 0 ? (
            <EmptyState title="Nenhuma integração cadastrada." subtitle="Cadastre os provedores globais usados pela plataforma YesClin." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {providers.map((p) => {
                const clinicCount = clinicsByIntegration.filter(
                  (c) => c.is_active && (c.channel === p.key || c.channel?.startsWith(p.key.split('_')[0])),
                ).length;
                const recentFailures = logs.filter(
                  (l) => l.provider_key === p.key && l.status === 'erro' &&
                  new Date(l.created_at).getTime() > Date.now() - 24 * 3600 * 1000,
                ).length;
                return (
                  <Card key={p.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{p.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{p.category}</p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-2 text-sm">
                      <Row label="Ambiente" value={ENV_LABEL[p.environment] ?? p.environment} />
                      <Row label="Última verificação" value={formatDate(p.last_healthcheck_at)} />
                      <Row label="Clínicas conectadas" value={String(clinicCount)} />
                      <Row label="Falhas recentes (24h)" value={String(recentFailures)} />
                      {p.last_error_message && (
                        <p className="text-xs text-red-500 line-clamp-2">{p.last_error_message}</p>
                      )}
                    </CardContent>
                    <div className="flex flex-wrap gap-2 border-t p-3">
                      <Button size="sm" variant="outline" onClick={() => setEditingProvider(p)}>
                        <SettingsIcon className="mr-1 h-3.5 w-3.5" />Configurar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => testConnection(p)}>
                        <Zap className="mr-1 h-3.5 w-3.5" />Testar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setLogFilters((f) => ({ ...f, provider: p.key }));
                        document.getElementById('tab-logs-trigger')?.click();
                      }}>
                        <Eye className="mr-1 h-3.5 w-3.5" />Logs
                      </Button>
                      <Button size="sm" variant={p.is_enabled ? 'destructive' : 'default'} onClick={() => toggleProvider(p)}>
                        <Power className="mr-1 h-3.5 w-3.5" />{p.is_enabled ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* WEBHOOKS */}
        <TabsContent value="webhooks">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4"><Skeleton className="h-40" /></div>
              ) : webhooks.length === 0 ? (
                <EmptyState title="Nenhum webhook cadastrado." subtitle="Cadastre webhooks globais para receber eventos dos provedores." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Provedor</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último recebimento</TableHead>
                      <TableHead className="text-right">Falhas</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">{w.name}</TableCell>
                        <TableCell>{w.provider_key}</TableCell>
                        <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">{w.url}</TableCell>
                        <TableCell><StatusBadge status={w.status} /></TableCell>
                        <TableCell>{formatDate(w.last_received_at)}</TableCell>
                        <TableCell className="text-right">{w.failure_count}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="icon" variant="ghost" title="Copiar URL" onClick={() => {
                            navigator.clipboard.writeText(w.url); toast.success('URL copiada.');
                          }}><Copy className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" title="Ver segredo" onClick={() => toast.info(w.secret_masked ?? 'Sem segredo configurado.')}>
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Regenerar segredo" onClick={() => regenerateWebhookSecret(w)}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" title={w.status === 'ativo' ? 'Desativar' : 'Ativar'} onClick={() => toggleWebhook(w)}>
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOGS */}
        <TabsContent value="logs" id="tab-logs-trigger">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Select value={logFilters.provider} onValueChange={(v) => setLogFilters((f) => ({ ...f, provider: v }))}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Provedor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os provedores</SelectItem>
                    {providers.map((p) => <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={logFilters.status} onValueChange={(v) => setLogFilters((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {Object.entries(LOG_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={logFilters.period} onValueChange={(v) => setLogFilters((f) => ({ ...f, period: v }))}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Período" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Últimas 24 horas</SelectItem>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="all">Todo o período</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Buscar por mensagem..."
                  value={logFilters.search}
                  onChange={(e) => setLogFilters((f) => ({ ...f, search: e.target.value }))}
                  className="w-[240px]"
                />
                <Button variant="outline" onClick={exportLogsCsv}><Download className="mr-2 h-4 w-4" />Exportar CSV</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4"><Skeleton className="h-40" /></div>
              ) : filteredLogs.length === 0 ? (
                <EmptyState title="Nenhum log técnico encontrado." subtitle="Os eventos das integrações aparecerão aqui." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Provedor</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Clínica</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.slice(0, 200).map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="whitespace-nowrap text-xs">{formatDate(l.created_at)}</TableCell>
                        <TableCell>{l.provider_key}</TableCell>
                        <TableCell>{l.event_type}</TableCell>
                        <TableCell><LogStatusBadge status={l.status} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.clinic_id ?? '—'}</TableCell>
                        <TableCell className="max-w-[320px] truncate">{l.message ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => setLogDetail(l)}>Ver detalhes</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CLINICAS */}
        <TabsContent value="clinicas">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4"><Skeleton className="h-40" /></div>
              ) : clinicsByIntegration.length === 0 ? (
                <EmptyState title="Nenhuma clínica conectada." subtitle="Quando uma clínica configurar uma integração, ela aparecerá aqui." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clínica</TableHead>
                      <TableHead>Integração</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Última sincronização</TableHead>
                      <TableHead>Último erro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clinicsByIntegration.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.clinic_name}</TableCell>
                        <TableCell>{r.channel}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={r.is_active ? STATUS_VARIANT.ativo : STATUS_VARIANT.inativo}>
                            {r.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{formatDate(r.last_check)}</TableCell>
                        <TableCell className="max-w-[260px] truncate text-xs text-red-500">{r.last_error ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => window.open(`/super-admin/clinicas?clinic=${r.clinic_id}`, '_self')}>
                            Abrir clínica
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONFIG GLOBAL */}
        <TabsContent value="config">
          {settings ? <SettingsForm settings={settings} onSave={saveSettings} /> : <Skeleton className="h-72" />}
        </TabsContent>
      </Tabs>

      {/* PROVIDER MODAL */}
      <ProviderDialog provider={editingProvider} onClose={() => setEditingProvider(null)} onSave={saveProvider} />

      {/* LOG DETAIL */}
      <Sheet open={!!logDetail} onOpenChange={(o) => !o && setLogDetail(null)}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          {logDetail && (
            <>
              <SheetHeader>
                <SheetTitle>Detalhes do log</SheetTitle>
                <SheetDescription>Evento técnico da integração.</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                <Row label="Data/hora" value={formatDate(logDetail.created_at)} />
                <Row label="Provedor" value={logDetail.provider_key} />
                <Row label="Evento" value={logDetail.event_type} />
                <Row label="Status" value={LOG_STATUS_LABEL[logDetail.status] ?? logDetail.status} />
                <Row label="Clínica" value={logDetail.clinic_id ?? '—'} />
                <Row label="Request ID" value={logDetail.request_id ?? '—'} />
                <Row label="Código HTTP" value={String(logDetail.http_status ?? '—')} />
                <div>
                  <Label className="text-xs text-muted-foreground">Mensagem</Label>
                  <p className="mt-1 rounded border bg-muted/30 p-2 text-xs">{logDetail.message ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Metadata</Label>
                  <pre className="mt-1 overflow-auto rounded border bg-muted/30 p-2 text-[11px]">
                    {JSON.stringify(logDetail.metadata ?? {}, null, 2)}
                  </pre>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Por segurança, payloads sensíveis (tokens, dados clínicos, mensagens de pacientes) são omitidos desta visualização.
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ============== Subcomponents ==============

function SummaryCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: number; loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
        <div className="mt-2 text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12" /> : value}</div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium truncate max-w-[60%] text-right">{value}</span>
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function ProviderDialog({
  provider, onClose, onSave,
}: {
  provider: Provider | null;
  onClose: () => void;
  onSave: (form: any) => void;
}) {
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (provider) {
      setForm({
        name: provider.name,
        category: provider.category,
        environment: provider.environment,
        base_url: provider.base_url ?? '',
        timeout_seconds: provider.timeout_seconds,
        retry_limit: provider.retry_limit,
        is_enabled: provider.is_enabled,
        notes: provider.notes ?? '',
        status: provider.status,
        api_key: '',
        token: '',
        webhook_secret: '',
      });
    }
  }, [provider]);

  if (!provider) return null;

  return (
    <Dialog open={!!provider} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar {provider.name}</DialogTitle>
          <DialogDescription>Provedor global da plataforma. Esta configuração não substitui a integração individual de cada clínica.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2 sm:grid-cols-2">
          <Field label="Nome"><Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Categoria">
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Mensageria', 'Pagamentos', 'Armazenamento', 'Comunicação', 'Vídeo/Teleconsulta', 'Webhook', 'API', 'Sistema'].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status global">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Ambiente">
            <Select value={form.environment} onValueChange={(v) => setForm({ ...form, environment: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ENV_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="URL base" className="sm:col-span-2">
            <Input value={form.base_url ?? ''} onChange={(e) => setForm({ ...form, base_url: e.target.value })} placeholder="https://api.exemplo.com" />
          </Field>

          <Field label="Chave de API">
            <div className="space-y-1">
              {provider.api_key_masked && <p className="text-[11px] text-muted-foreground">Atual: {provider.api_key_masked}</p>}
              <Input type="password" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="Nova chave (opcional)" />
            </div>
          </Field>
          <Field label="Token secreto">
            <div className="space-y-1">
              {provider.token_masked && <p className="text-[11px] text-muted-foreground">Atual: {provider.token_masked}</p>}
              <Input type="password" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} placeholder="Novo token (opcional)" />
            </div>
          </Field>
          <Field label="Webhook secret" className="sm:col-span-2">
            <div className="space-y-1">
              {provider.webhook_secret_masked && <p className="text-[11px] text-muted-foreground">Atual: {provider.webhook_secret_masked}</p>}
              <Input type="password" value={form.webhook_secret} onChange={(e) => setForm({ ...form, webhook_secret: e.target.value })} placeholder="Novo segredo (opcional)" />
            </div>
          </Field>

          <Field label="Timeout (segundos)">
            <Input type="number" min={1} value={form.timeout_seconds ?? 30} onChange={(e) => setForm({ ...form, timeout_seconds: Number(e.target.value) })} />
          </Field>
          <Field label="Limite de tentativas">
            <Input type="number" min={0} value={form.retry_limit ?? 3} onChange={(e) => setForm({ ...form, retry_limit: Number(e.target.value) })} />
          </Field>

          <Field label="Observações internas" className="sm:col-span-2">
            <Textarea rows={3} value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>

          <div className="flex items-center gap-3 sm:col-span-2 rounded-md border p-3">
            <Switch checked={!!form.is_enabled} onCheckedChange={(c) => setForm({ ...form, is_enabled: c })} />
            <div>
              <p className="text-sm font-medium">Ativar integração globalmente</p>
              <p className="text-xs text-muted-foreground">Quando desativada, nenhuma clínica poderá usar este provedor.</p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground sm:col-span-2">
            Por segurança, segredos completos nunca são exibidos após salvar — apenas os 4 últimos caracteres ficam visíveis.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(form)}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function SettingsForm({ settings, onSave }: { settings: SettingsRow; onSave: (s: SettingsRow) => void }) {
  const [s, setS] = useState<SettingsRow>(settings);
  useEffect(() => setS(settings), [settings]);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Configurações globais de integrações</CardTitle></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-md border p-3 sm:col-span-2">
          <Switch checked={s.logs_enabled} onCheckedChange={(c) => setS({ ...s, logs_enabled: c })} />
          <div>
            <p className="text-sm font-medium">Ativar logs detalhados de integrações</p>
            <p className="text-xs text-muted-foreground">Quando ligado, requests e responses resumidos são gravados.</p>
          </div>
        </div>
        <Field label="Retenção de logs (dias)">
          <Input type="number" min={1} value={s.log_retention_days} onChange={(e) => setS({ ...s, log_retention_days: Number(e.target.value) })} />
        </Field>
        <Field label="Número máximo de tentativas">
          <Input type="number" min={0} value={s.default_retry_limit} onChange={(e) => setS({ ...s, default_retry_limit: Number(e.target.value) })} />
        </Field>
        <Field label="Timeout padrão (segundos)">
          <Input type="number" min={1} value={s.default_timeout_seconds} onChange={(e) => setS({ ...s, default_timeout_seconds: Number(e.target.value) })} />
        </Field>
        <Field label="E-mail para alertas técnicos">
          <Input type="email" value={s.alert_email ?? ''} onChange={(e) => setS({ ...s, alert_email: e.target.value })} placeholder="alertas@yesclin.com" />
        </Field>
        <Field label="Webhook interno de alertas" className="sm:col-span-2">
          <Input value={s.alert_webhook_url ?? ''} onChange={(e) => setS({ ...s, alert_webhook_url: e.target.value })} placeholder="https://..." />
        </Field>
        <div className="flex items-center gap-3 rounded-md border p-3 sm:col-span-2">
          <Switch checked={s.notify_critical_failures} onCheckedChange={(c) => setS({ ...s, notify_critical_failures: c })} />
          <div>
            <p className="text-sm font-medium">Notificar Super Admin em falhas críticas</p>
            <p className="text-xs text-muted-foreground">Envia alerta por e-mail/webhook quando uma integração entra em estado de erro.</p>
          </div>
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button onClick={() => onSave(s)}>Salvar configurações</Button>
        </div>
      </CardContent>
    </Card>
  );
}
