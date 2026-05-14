import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertCircle, Save, RefreshCw, RotateCcw, Settings, ToggleRight, Sparkles,
  Clock, Plug, Shield, Palette, Wrench, Copy, ExternalLink, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePlatformSettings, DEFAULTS, type FeatureFlag } from '@/hooks/usePlatformSettings';

const SPECIALTIES = [
  { value: 'general', label: 'Clínica Geral' },
  { value: 'psychology', label: 'Psicologia' },
  { value: 'nutrition', label: 'Nutrição' },
  { value: 'physiotherapy', label: 'Fisioterapia' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'aesthetics', label: 'Estética / Harmonização Facial' },
  { value: 'dentistry', label: 'Odontologia' },
  { value: 'dermatology', label: 'Dermatologia' },
  { value: 'pediatrics', label: 'Pediatria' },
];

const STATUS_OPTIONS = [
  { value: 'operational', label: 'Operacional' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'degraded', label: 'Instável' },
];

const NOTICE_SEVERITY = [
  { value: 'info', label: 'Informação' },
  { value: 'warning', label: 'Alerta' },
  { value: 'critical', label: 'Crítico' },
];

const NOTICE_AUDIENCE = [
  { value: 'all', label: 'Todos' },
  { value: 'admins', label: 'Apenas admins' },
  { value: 'super_admins', label: 'Apenas super admins' },
];

const urlSchema = z.string().trim().url().or(z.literal(''));
const emailSchema = z.string().trim().email().or(z.literal(''));

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start py-3 border-b last:border-b-0">
      <div className="md:col-span-1">
        <Label className="text-sm font-medium">{label}</Label>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}

export default function SuperAdminSettings() {
  const navigate = useNavigate();
  const {
    settingsMap, flags, windows, loading, error,
    refetch, updateSettings, updateFeatureFlag, upsertMaintenance, deleteMaintenance, resetToDefaults,
  } = usePlatformSettings();

  const [draft, setDraft] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const merged = useMemo(() => ({ ...settingsMap, ...draft }), [settingsMap, draft]);
  const dirtyKeys = useMemo(() => Object.keys(draft).filter((k) => JSON.stringify(draft[k]) !== JSON.stringify(settingsMap[k])), [draft, settingsMap]);

  const set = (key: string, value: any) => setDraft((d) => ({ ...d, [key]: value }));

  const validate = (): string | null => {
    if (typeof merged['platform.support_email'] === 'string' && !emailSchema.safeParse(merged['platform.support_email']).success)
      return 'E-mail administrativo inválido.';
    for (const k of ['platform.public_url', 'platform.app_url', 'platform.support_url', 'integrations.whatsapp_base_url', 'integrations.global_webhook', 'branding.logo_url', 'branding.terms_url', 'branding.privacy_url']) {
      if (merged[k] != null && !urlSchema.safeParse(merged[k]).success) return `URL inválida em ${k}.`;
    }
    const numericKeys = Object.keys(merged).filter((k) => typeof DEFAULTS[k] === 'number');
    for (const k of numericKeys) {
      const v = Number(merged[k]);
      if (!Number.isFinite(v) || v < 0) return `Valor inválido em ${k}.`;
      if (k.includes('retention') && v < 1) return 'Retenção de logs deve ser pelo menos 1 dia.';
      if (k.includes('trial_days') && v < 0) return 'Dias de trial não podem ser negativos.';
    }
    return null;
  };

  const save = async () => {
    if (dirtyKeys.length === 0) return;
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const changes: Record<string, any> = {};
      for (const k of dirtyKeys) changes[k] = draft[k];
      await updateSettings(changes);
      toast.success(`${dirtyKeys.length} configuração(ões) salva(s).`);
      setDraft({});
      await refetch();
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const reload = async () => {
    setDraft({});
    await refetch();
    toast.success('Configurações recarregadas.');
  };

  const restoreDefaults = async () => {
    try {
      await resetToDefaults();
      setDraft({});
      toast.success('Configurações restauradas para os padrões.');
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao restaurar.');
    }
  };

  const stats = useMemo(() => {
    const flagsEnabled = flags.filter((f) => f.is_enabled).length;
    const premiumActive = flags.filter((f) => f.is_premium && f.is_enabled).length;
    const integrationsActive = ['integrations.email_enabled', 'integrations.sms_enabled', 'integrations.payment_gateway_enabled']
      .filter((k) => merged[k] === true).length;
    const trialPolicies = ['defaults.trial_days', 'defaults.plan_slug'].filter((k) => merged[k] != null && merged[k] !== '').length;
    const lastUpdated = [
      ...flags.map((f) => f.updated_at),
      ...windows.map((w) => w.updated_at),
    ].sort().pop();
    const allKeys = Object.keys(settingsMap).length;
    return { allKeys, flagsEnabled, premiumActive, integrationsActive, trialPolicies, lastUpdated };
  }, [flags, windows, merged, settingsMap]);

  const activeMaintenance = useMemo(() => windows.find((w) => w.is_active), [windows]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configurações da plataforma</h1>
            <p className="text-sm text-muted-foreground">Parâmetros globais, defaults de clínica e flags do sistema.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading || saving}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Recarregar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={loading || saving}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restaurar padrões
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Restaurar padrões?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Todas as configurações conhecidas voltarão aos valores padrão de fábrica. Feature flags e janelas de manutenção não são afetadas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void restoreDefaults()}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button size="sm" onClick={() => void save()} disabled={dirtyKeys.length === 0 || saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando…' : `Salvar alterações${dirtyKeys.length ? ` (${dirtyKeys.length})` : ''}`}
            </Button>
          </div>
        </div>

        {dirtyKeys.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Alterações pendentes</AlertTitle>
            <AlertDescription>{dirtyKeys.length} configuração(ões) não salva(s). Clique em "Salvar alterações" para persistir.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-2">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={() => void refetch()}>Tentar novamente</Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Status cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <StatusCard icon={<Settings className="h-4 w-4" />} label="Configurações ativas" value={loading ? null : String(stats.allKeys)} hint="chaves persistidas" />
          <StatusCard icon={<ToggleRight className="h-4 w-4" />} label="Flags habilitadas" value={loading ? null : `${stats.flagsEnabled}/${flags.length}`} hint="recursos globais" />
          <StatusCard icon={<Sparkles className="h-4 w-4" />} label="Premium ativos" value={loading ? null : String(stats.premiumActive)} hint="módulos premium" />
          <StatusCard icon={<Clock className="h-4 w-4" />} label="Trial configurado" value={loading ? null : `${merged['defaults.trial_days'] ?? 0}d`} hint="duração padrão" />
          <StatusCard icon={<Plug className="h-4 w-4" />} label="Integrações" value={loading ? null : String(stats.integrationsActive)} hint="ativas globalmente" />
          <StatusCard icon={<Clock className="h-4 w-4" />} label="Última alteração" value={loading ? null : (stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString('pt-BR') : '—')} hint="flags ou manutenção" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="flex flex-wrap h-auto justify-start">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="defaults">Defaults</TabsTrigger>
            <TabsTrigger value="flags">Recursos e Flags</TabsTrigger>
            <TabsTrigger value="limits">Planos e Limites</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
            <TabsTrigger value="branding">Aparência</TabsTrigger>
            <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <>
              {/* GENERAL */}
              <TabsContent value="general" className="mt-4 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Identidade da plataforma</CardTitle></CardHeader>
                  <CardContent>
                    <FieldRow label="Nome da plataforma">
                      <Input value={merged['platform.name'] ?? ''} onChange={(e) => set('platform.name', e.target.value)} />
                    </FieldRow>
                    <FieldRow label="E-mail administrativo padrão">
                      <Input type="email" value={merged['platform.support_email'] ?? ''} onChange={(e) => set('platform.support_email', e.target.value)} />
                    </FieldRow>
                    <FieldRow label="URL pública">
                      <Input value={merged['platform.public_url'] ?? ''} onChange={(e) => set('platform.public_url', e.target.value)} />
                    </FieldRow>
                    <FieldRow label="URL do app">
                      <Input value={merged['platform.app_url'] ?? ''} onChange={(e) => set('platform.app_url', e.target.value)} />
                    </FieldRow>
                    <FieldRow label="URL de suporte">
                      <Input value={merged['platform.support_url'] ?? ''} onChange={(e) => set('platform.support_url', e.target.value)} />
                    </FieldRow>
                    <FieldRow label="Fuso horário">
                      <Input value={merged['platform.timezone'] ?? ''} onChange={(e) => set('platform.timezone', e.target.value)} />
                    </FieldRow>
                    <FieldRow label="Idioma padrão">
                      <Input value={merged['platform.locale'] ?? ''} onChange={(e) => set('platform.locale', e.target.value)} />
                    </FieldRow>
                    <FieldRow label="Moeda padrão">
                      <Input value={merged['platform.currency'] ?? ''} onChange={(e) => set('platform.currency', e.target.value)} />
                    </FieldRow>
                    <FieldRow label="Status da plataforma">
                      <Select value={merged['platform.status'] ?? 'operational'} onValueChange={(v) => set('platform.status', v)}>
                        <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </FieldRow>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Aviso global</CardTitle>
                    <CardDescription>Mensagem opcional exibida no app conforme a audiência.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldRow label="Ativo">
                      <Switch checked={!!merged['notice.enabled']} onCheckedChange={(v) => set('notice.enabled', v)} />
                    </FieldRow>
                    <FieldRow label="Título">
                      <Input value={merged['notice.title'] ?? ''} onChange={(e) => set('notice.title', e.target.value)} maxLength={120} />
                    </FieldRow>
                    <FieldRow label="Mensagem">
                      <Textarea value={merged['notice.message'] ?? ''} onChange={(e) => set('notice.message', e.target.value)} maxLength={500} rows={3} />
                    </FieldRow>
                    <FieldRow label="Tipo">
                      <Select value={merged['notice.severity'] ?? 'info'} onValueChange={(v) => set('notice.severity', v)}>
                        <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{NOTICE_SEVERITY.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </FieldRow>
                    <FieldRow label="Exibir para">
                      <Select value={merged['notice.audience'] ?? 'all'} onValueChange={(v) => set('notice.audience', v)}>
                        <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{NOTICE_AUDIENCE.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </FieldRow>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* DEFAULTS */}
              <TabsContent value="defaults" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Defaults para novas clínicas</CardTitle>
                    <CardDescription>Aplicados durante o onboarding quando não houver override explícito.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldRow label="Plano padrão (slug)">
                      <Input value={merged['defaults.plan_slug'] ?? ''} onChange={(e) => set('defaults.plan_slug', e.target.value)} />
                    </FieldRow>
                    <FieldRow label="Trial (dias)">
                      <Input type="number" min={0} value={merged['defaults.trial_days'] ?? 0} onChange={(e) => set('defaults.trial_days', Number(e.target.value))} className="max-w-xs" />
                    </FieldRow>
                    <FieldRow label="Profissionais (limite)">
                      <Input type="number" min={0} value={merged['defaults.max_professionals'] ?? 0} onChange={(e) => set('defaults.max_professionals', Number(e.target.value))} className="max-w-xs" />
                    </FieldRow>
                    <FieldRow label="Pacientes (limite)">
                      <Input type="number" min={0} value={merged['defaults.max_patients'] ?? 0} onChange={(e) => set('defaults.max_patients', Number(e.target.value))} className="max-w-xs" />
                    </FieldRow>
                    <FieldRow label="Agendamentos/mês (limite)">
                      <Input type="number" min={0} value={merged['defaults.max_appointments_monthly'] ?? 0} onChange={(e) => set('defaults.max_appointments_monthly', Number(e.target.value))} className="max-w-xs" />
                    </FieldRow>
                    <FieldRow label="Armazenamento (MB)">
                      <Input type="number" min={0} value={merged['defaults.max_storage_mb'] ?? 0} onChange={(e) => set('defaults.max_storage_mb', Number(e.target.value))} className="max-w-xs" />
                    </FieldRow>
                    <FieldRow label="Especialidade inicial">
                      <Select value={merged['defaults.specialty'] ?? 'general'} onValueChange={(v) => set('defaults.specialty', v)}>
                        <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{SPECIALTIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </FieldRow>
                    {[
                      ['defaults.create_owner_professional', 'Criar profissional owner automaticamente'],
                      ['defaults.create_anamnesis_templates', 'Criar modelos padrão de anamnese'],
                      ['defaults.create_finance_categories', 'Criar categorias financeiras padrão'],
                      ['defaults.create_appointment_statuses', 'Criar status de agenda padrão'],
                      ['defaults.create_appointment_types', 'Criar tipos de agendamento padrão'],
                      ['defaults.create_payment_methods', 'Criar formas de recebimento padrão'],
                    ].map(([k, label]) => (
                      <FieldRow key={k} label={label}>
                        <Switch checked={!!merged[k]} onCheckedChange={(v) => set(k, v)} />
                      </FieldRow>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FLAGS */}
              <TabsContent value="flags" className="mt-4 space-y-4">
                {flags.length === 0 ? (
                  <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhuma feature flag cadastrada.</CardContent></Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {flags.map((f) => <FlagCard key={f.id} flag={f} onUpdate={async (patch) => {
                      try { await updateFeatureFlag(f.id, patch); toast.success(`${f.name} atualizado.`); await refetch(); }
                      catch (e: any) { toast.error(e.message ?? 'Erro.'); }
                    }} />)}
                  </div>
                )}
              </TabsContent>

              {/* LIMITS */}
              <TabsContent value="limits" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Limites mínimos globais</CardTitle>
                    <CardDescription>Pisos garantidos a qualquer plano. Configure planos comerciais em Planos.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {[
                      ['limits.min_professionals', 'Mínimo de profissionais'],
                      ['limits.min_patients', 'Mínimo de pacientes'],
                      ['limits.min_appointments', 'Mínimo de agendamentos'],
                      ['limits.min_storage_mb', 'Mínimo de armazenamento (MB)'],
                      ['limits.min_whatsapp_messages', 'Mínimo de mensagens WhatsApp'],
                      ['limits.max_pending_invites', 'Convites pendentes por clínica'],
                      ['limits.max_users_per_clinic', 'Usuários por clínica'],
                      ['limits.basic_specialties', 'Especialidades no plano básico'],
                      ['limits.max_integrations', 'Integrações por clínica'],
                    ].map(([k, label]) => (
                      <FieldRow key={k} label={label}>
                        <Input type="number" min={0} value={merged[k] ?? 0} onChange={(e) => set(k, Number(e.target.value))} className="max-w-xs" />
                      </FieldRow>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Atalho para Planos</CardTitle>
                      <CardDescription>Edite preços e recursos detalhados no módulo dedicado.</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate('/super-admin/planos')}>
                      Ir para Planos <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </CardHeader>
                </Card>
              </TabsContent>

              {/* SECURITY */}
              <TabsContent value="security" className="mt-4 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Sessão e autenticação</CardTitle></CardHeader>
                  <CardContent>
                    <FieldRow label="Tempo de sessão (min)">
                      <Input type="number" min={1} value={merged['security.session_timeout_minutes'] ?? 60} onChange={(e) => set('security.session_timeout_minutes', Number(e.target.value))} className="max-w-xs" />
                    </FieldRow>
                    <FieldRow label="Senha forte obrigatória">
                      <Switch checked={!!merged['security.require_strong_password']} onCheckedChange={(v) => set('security.require_strong_password', v)} />
                    </FieldRow>
                    <FieldRow label="Confirmação de e-mail obrigatória">
                      <Switch checked={!!merged['security.require_email_confirmation']} onCheckedChange={(v) => set('security.require_email_confirmation', v)} />
                    </FieldRow>
                    <FieldRow label="Bloquear após tentativas inválidas">
                      <Switch checked={!!merged['security.lock_after_invalid_attempts']} onCheckedChange={(v) => set('security.lock_after_invalid_attempts', v)} />
                    </FieldRow>
                    <FieldRow label="Máx. tentativas inválidas">
                      <Input type="number" min={1} value={merged['security.max_invalid_attempts'] ?? 5} onChange={(e) => set('security.max_invalid_attempts', Number(e.target.value))} className="max-w-xs" />
                    </FieldRow>
                    <FieldRow label="Duração do bloqueio (min)">
                      <Input type="number" min={1} value={merged['security.lock_duration_minutes'] ?? 15} onChange={(e) => set('security.lock_duration_minutes', Number(e.target.value))} className="max-w-xs" />
                    </FieldRow>
                    <FieldRow label="Permitir múltiplas sessões">
                      <Switch checked={!!merged['security.allow_multi_session']} onCheckedChange={(v) => set('security.allow_multi_session', v)} />
                    </FieldRow>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">LGPD e logs de acesso</CardTitle></CardHeader>
                  <CardContent>
                    <FieldRow label="Aceite LGPD obrigatório no onboarding"><Switch checked={!!merged['security.require_lgpd_onboarding']} onCheckedChange={(v) => set('security.require_lgpd_onboarding', v)} /></FieldRow>
                    <FieldRow label="Enforcement LGPD em novas clínicas"><Switch checked={!!merged['security.lgpd_default_enforcement']} onCheckedChange={(v) => set('security.lgpd_default_enforcement', v)} /></FieldRow>
                    <FieldRow label="Registrar logs de acesso sensível"><Switch checked={!!merged['security.log_sensitive_access']} onCheckedChange={(v) => set('security.log_sensitive_access', v)} /></FieldRow>
                    <FieldRow label="Registrar logs administrativos"><Switch checked={!!merged['security.log_admin_actions']} onCheckedChange={(v) => set('security.log_admin_actions', v)} /></FieldRow>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Políticas críticas (imutáveis)</CardTitle>
                    <CardDescription>Regras protegidas pelo backend; exibidas aqui para transparência.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <PolicyLine label="Alterações em roles de owner exigem confirmação" />
                    <PolicyLine label="Desativação de clínica exige confirmação" />
                    <PolicyLine label="Exclusão física de dados clínicos sensíveis é proibida" />
                    <PolicyLine label="Documentos clínicos assinados são imutáveis" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* INTEGRATIONS */}
              <TabsContent value="integrations" className="mt-4 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Integrações globais</CardTitle></CardHeader>
                  <CardContent>
                    <FieldRow label="Provedor WhatsApp padrão">
                      <Select value={merged['integrations.whatsapp_provider'] ?? 'uazapi'} onValueChange={(v) => set('integrations.whatsapp_provider', v)}>
                        <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uazapi">UAZAPI</SelectItem>
                          <SelectItem value="evolution">Evolution API</SelectItem>
                          <SelectItem value="custom">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldRow>
                    <FieldRow label="URL base do provedor">
                      <Input value={merged['integrations.whatsapp_base_url'] ?? ''} onChange={(e) => set('integrations.whatsapp_base_url', e.target.value)} />
                    </FieldRow>
                    <FieldRow label="Webhook global">
                      <div className="flex gap-2">
                        <Input value={merged['integrations.global_webhook'] ?? ''} onChange={(e) => set('integrations.global_webhook', e.target.value)} />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button type="button" size="icon" variant="outline" onClick={() => {
                              const v = merged['integrations.global_webhook'] ?? '';
                              if (!v) return;
                              navigator.clipboard.writeText(v); toast.success('Webhook copiado.');
                            }}><Copy className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>Copiar webhook</TooltipContent>
                        </Tooltip>
                      </div>
                    </FieldRow>
                    <FieldRow label="Timeout (s)"><Input type="number" min={1} value={merged['integrations.timeout_seconds'] ?? 30} onChange={(e) => set('integrations.timeout_seconds', Number(e.target.value))} className="max-w-xs" /></FieldRow>
                    <FieldRow label="Máx. tentativas"><Input type="number" min={0} value={merged['integrations.max_retries'] ?? 3} onChange={(e) => set('integrations.max_retries', Number(e.target.value))} className="max-w-xs" /></FieldRow>
                    <FieldRow label="Intervalo entre tentativas (s)"><Input type="number" min={0} value={merged['integrations.retry_interval_seconds'] ?? 60} onChange={(e) => set('integrations.retry_interval_seconds', Number(e.target.value))} className="max-w-xs" /></FieldRow>
                    <FieldRow label="E-mail transacional"><Switch checked={!!merged['integrations.email_enabled']} onCheckedChange={(v) => set('integrations.email_enabled', v)} /></FieldRow>
                    <FieldRow label="SMS"><Switch checked={!!merged['integrations.sms_enabled']} onCheckedChange={(v) => set('integrations.sms_enabled', v)} /></FieldRow>
                    <FieldRow label="Gateway de pagamento"><Switch checked={!!merged['integrations.payment_gateway_enabled']} onCheckedChange={(v) => set('integrations.payment_gateway_enabled', v)} /></FieldRow>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <Tooltip>
                        <TooltipTrigger asChild><span><Button size="sm" variant="outline" disabled>Testar configuração global</Button></span></TooltipTrigger>
                        <TooltipContent>Backend de teste ainda não disponível</TooltipContent>
                      </Tooltip>
                      <Button size="sm" variant="outline" onClick={() => navigate('/super-admin/integracoes')}>
                        Ver logs de integração <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AUDIT */}
              <TabsContent value="audit" className="mt-4 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Política de auditoria</CardTitle></CardHeader>
                  <CardContent>
                    <FieldRow label="Auditoria global ativa"><Switch checked={!!merged['audit.enabled']} onCheckedChange={(v) => set('audit.enabled', v)} /></FieldRow>
                    {[
                      ['audit.log_login', 'Registrar login/logout'],
                      ['audit.log_plan_change', 'Registrar alteração de plano'],
                      ['audit.log_subscription_change', 'Registrar alteração de assinatura'],
                      ['audit.log_permission_change', 'Registrar alteração de permissões'],
                      ['audit.log_settings_change', 'Registrar alteração de configurações'],
                    ].map(([k, label]) => (
                      <FieldRow key={k} label={label}><Switch checked={!!merged[k]} onCheckedChange={(v) => set(k, v)} /></FieldRow>
                    ))}
                    <FieldRow label="Retenção audit_logs (dias)" hint="Mínimo 1 dia"><Input type="number" min={1} value={merged['audit.retention_audit_days'] ?? 365} onChange={(e) => set('audit.retention_audit_days', Number(e.target.value))} className="max-w-xs" /></FieldRow>
                    <FieldRow label="Retenção access_logs (dias)"><Input type="number" min={1} value={merged['audit.retention_access_days'] ?? 180} onChange={(e) => set('audit.retention_access_days', Number(e.target.value))} className="max-w-xs" /></FieldRow>
                    <FieldRow label="Retenção ocorrências (dias)"><Input type="number" min={1} value={merged['audit.retention_occurrences_days'] ?? 730} onChange={(e) => set('audit.retention_occurrences_days', Number(e.target.value))} className="max-w-xs" /></FieldRow>
                    <FieldRow label="Severidade mínima para alertas">
                      <Select value={merged['audit.alert_min_severity'] ?? 'warning'} onValueChange={(v) => set('audit.alert_min_severity', v)}>
                        <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldRow>
                    <div className="mt-4">
                      <Button size="sm" variant="outline" onClick={() => navigate('/super-admin/logs')}>
                        Ver em Logs e Auditoria <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* BRANDING */}
              <TabsContent value="branding" className="mt-4 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" /> Marca</CardTitle></CardHeader>
                  <CardContent>
                    <FieldRow label="Nome da marca"><Input value={merged['branding.brand_name'] ?? ''} onChange={(e) => set('branding.brand_name', e.target.value)} /></FieldRow>
                    <FieldRow label="URL do logo"><Input value={merged['branding.logo_url'] ?? ''} onChange={(e) => set('branding.logo_url', e.target.value)} placeholder="https://…" /></FieldRow>
                    <FieldRow label="Cor primária">
                      <div className="flex gap-2 items-center">
                        <Input type="color" value={merged['branding.primary_color'] ?? '#0F766E'} onChange={(e) => set('branding.primary_color', e.target.value)} className="w-16 h-9 p-1" />
                        <Input value={merged['branding.primary_color'] ?? ''} onChange={(e) => set('branding.primary_color', e.target.value)} className="max-w-[140px]" />
                      </div>
                    </FieldRow>
                    <FieldRow label="Cor secundária">
                      <div className="flex gap-2 items-center">
                        <Input type="color" value={merged['branding.secondary_color'] ?? '#0EA5E9'} onChange={(e) => set('branding.secondary_color', e.target.value)} className="w-16 h-9 p-1" />
                        <Input value={merged['branding.secondary_color'] ?? ''} onChange={(e) => set('branding.secondary_color', e.target.value)} className="max-w-[140px]" />
                      </div>
                    </FieldRow>
                    <FieldRow label="Cor de destaque">
                      <div className="flex gap-2 items-center">
                        <Input type="color" value={merged['branding.accent_color'] ?? '#F59E0B'} onChange={(e) => set('branding.accent_color', e.target.value)} className="w-16 h-9 p-1" />
                        <Input value={merged['branding.accent_color'] ?? ''} onChange={(e) => set('branding.accent_color', e.target.value)} className="max-w-[140px]" />
                      </div>
                    </FieldRow>
                    <FieldRow label="Texto do rodapé"><Input value={merged['branding.footer_text'] ?? ''} onChange={(e) => set('branding.footer_text', e.target.value)} /></FieldRow>
                    <FieldRow label="Termos de uso"><Input value={merged['branding.terms_url'] ?? ''} onChange={(e) => set('branding.terms_url', e.target.value)} /></FieldRow>
                    <FieldRow label="Política de privacidade"><Input value={merged['branding.privacy_url'] ?? ''} onChange={(e) => set('branding.privacy_url', e.target.value)} /></FieldRow>
                    <FieldRow label="URL de suporte"><Input value={merged['platform.support_url'] ?? ''} onChange={(e) => set('platform.support_url', e.target.value)} /></FieldRow>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* MAINTENANCE */}
              <TabsContent value="maintenance" className="mt-4 space-y-4">
                <MaintenancePanel
                  windows={windows}
                  active={activeMaintenance}
                  onUpsert={async (data) => { try { await upsertMaintenance(data); toast.success('Janela salva.'); await refetch(); } catch (e: any) { toast.error(e.message ?? 'Erro.'); } }}
                  onDelete={async (id) => { try { await deleteMaintenance(id); toast.success('Janela removida.'); await refetch(); } catch (e: any) { toast.error(e.message ?? 'Erro.'); } }}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

function StatusCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string | null; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}<span className="truncate">{label}</span></div>
        <div className="mt-1 text-xl font-bold">{value === null ? <Skeleton className="h-6 w-16" /> : value}</div>
        {hint && <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function PolicyLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Shield className="h-3.5 w-3.5 text-primary" /> <span>{label}</span>
    </div>
  );
}

function FlagCard({ flag, onUpdate }: { flag: FeatureFlag; onUpdate: (patch: Partial<FeatureFlag>) => Promise<void> }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toggle = (next: boolean) => {
    if (flag.is_essential && !next) { setConfirmOpen(true); return; }
    void onUpdate({ is_enabled: next });
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-sm">{flag.name}</span>
              {flag.is_essential && <Badge variant="default" className="text-[10px]">Essencial</Badge>}
              {flag.is_premium && <Badge variant="secondary" className="text-[10px]">Premium</Badge>}
              {flag.is_experimental && <Badge variant="outline" className="text-[10px]">Experimental</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{flag.description ?? '—'}</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">{flag.key} · impacto: {flag.impact_level}</p>
          </div>
          <Switch checked={flag.is_enabled} onCheckedChange={toggle} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Override por clínica</span>
          <Switch checked={flag.allow_clinic_override} onCheckedChange={(v) => void onUpdate({ allow_clinic_override: v })} />
        </div>
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Recurso essencial</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{flag.name}</strong> é essencial. Desativar pode quebrar funcionalidades em produção. Dados existentes não serão apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onUpdate({ is_enabled: false })}>Desativar mesmo assim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function MaintenancePanel({
  windows, active, onUpsert, onDelete,
}: {
  windows: any[]; active: any | undefined;
  onUpsert: (data: any) => Promise<void>; onDelete: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<any>({
    title: '', message: '', starts_at: '', ends_at: '',
    is_active: false, allow_super_admin_access: true, allow_clinic_access: false, show_banner: true,
  });

  const submit = async (overrides: any = {}) => {
    const data = { ...draft, ...overrides };
    if (!data.title?.trim()) { toast.error('Informe um título.'); return; }
    if (data.starts_at && data.ends_at && new Date(data.starts_at) > new Date(data.ends_at)) {
      toast.error('Início deve ser anterior ao fim.'); return;
    }
    await onUpsert({
      ...data,
      starts_at: data.starts_at || null,
      ends_at: data.ends_at || null,
    });
    setDraft({ title: '', message: '', starts_at: '', ends_at: '', is_active: false, allow_super_admin_access: true, allow_clinic_access: false, show_banner: true });
  };

  return (
    <>
      {active && (
        <Alert variant="destructive">
          <Wrench className="h-4 w-4" />
          <AlertTitle>Manutenção ativa: {active.title}</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>{active.message ?? 'Sem mensagem.'}</span>
            <Button size="sm" variant="outline" onClick={() => void onUpsert({ id: active.id, is_active: false })}>Desativar agora</Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova janela de manutenção</CardTitle>
          <CardDescription>Programe ou ative imediatamente. Persiste em <code>platform_maintenance_windows</code>.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldRow label="Título"><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={120} /></FieldRow>
          <FieldRow label="Mensagem"><Textarea rows={3} value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} maxLength={500} /></FieldRow>
          <FieldRow label="Início"><Input type="datetime-local" value={draft.starts_at} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })} className="max-w-xs" /></FieldRow>
          <FieldRow label="Fim"><Input type="datetime-local" value={draft.ends_at} onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })} className="max-w-xs" /></FieldRow>
          <FieldRow label="Permitir Super Admin durante"><Switch checked={draft.allow_super_admin_access} onCheckedChange={(v) => setDraft({ ...draft, allow_super_admin_access: v })} /></FieldRow>
          <FieldRow label="Permitir clínicas durante"><Switch checked={draft.allow_clinic_access} onCheckedChange={(v) => setDraft({ ...draft, allow_clinic_access: v })} /></FieldRow>
          <FieldRow label="Mostrar banner no app"><Switch checked={draft.show_banner} onCheckedChange={(v) => setDraft({ ...draft, show_banner: v })} /></FieldRow>

          <div className="flex flex-wrap gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => void submit({ is_active: false })}>Agendar</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">Ativar agora</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ativar modo manutenção?</AlertDialogTitle>
                  <AlertDialogDescription>O acesso ao app pode ser bloqueado conforme as flags configuradas. Tem certeza?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void submit({ is_active: true })}>Ativar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Janelas registradas</CardTitle></CardHeader>
        <CardContent className="p-0">
          {windows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma janela registrada.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Janela</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {windows.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {w.starts_at ? new Date(w.starts_at).toLocaleString('pt-BR') : '—'} → {w.ends_at ? new Date(w.ends_at).toLocaleString('pt-BR') : '—'}
                    </TableCell>
                    <TableCell>
                      {w.is_active ? <Badge variant="destructive">Ativa</Badge> : <Badge variant="outline">Inativa</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {w.is_active ? (
                          <Button size="sm" variant="outline" onClick={() => void onUpsert({ id: w.id, is_active: false })}>Desativar</Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => void onUpsert({ id: w.id, is_active: true })}>Ativar</Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => void onDelete(w.id)}>Cancelar</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
