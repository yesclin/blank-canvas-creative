import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logPlatformAction } from '@/lib/superAdminAudit';
import {
  Loader2, Save, ShieldAlert, MessageSquareWarning, Code2, CheckCircle2, XCircle, ClipboardCheck,
} from 'lucide-react';

const db = supabase as any;

export type InvestigationStatus =
  | 'aberta' | 'em_investigacao' | 'aguardando_cliente'
  | 'aguardando_desenvolvimento' | 'corrigida' | 'resolvida' | 'cancelada';
export type InvestigationSeverity = 'baixa' | 'media' | 'alta' | 'critica';

const INV_STATUS_LABEL: Record<InvestigationStatus, string> = {
  aberta: 'Aberta',
  em_investigacao: 'Em investigação',
  aguardando_cliente: 'Aguardando cliente',
  aguardando_desenvolvimento: 'Aguardando desenvolvimento',
  corrigida: 'Corrigida',
  resolvida: 'Resolvida',
  cancelada: 'Cancelada',
};
const INV_SEVERITY_LABEL: Record<InvestigationSeverity, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica',
};

const DEFAULT_CHECKLIST: Array<{ key: string; label: string }> = [
  { key: 'validar_relato', label: 'Validar relato do cliente' },
  { key: 'reproduzir', label: 'Reproduzir comportamento' },
  { key: 'verificar_logs', label: 'Verificar logs/auditoria' },
  { key: 'identificar_modulo', label: 'Identificar módulo afetado' },
  { key: 'validar_impacto', label: 'Validar impacto em outras clínicas' },
  { key: 'encaminhar_dev', label: 'Encaminhar para desenvolvimento, se necessário' },
  { key: 'confirmar_correcao', label: 'Confirmar correção' },
  { key: 'comunicar_cliente', label: 'Comunicar cliente' },
  { key: 'encerrar', label: 'Encerrar ocorrência' },
];

interface Occurrence {
  id: string;
  code: string;
  clinic_id: string | null;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  reported_by_name: string | null;
  reported_by_email: string | null;
  module: string | null;
  route: string | null;
  environment: string;
  created_at: string;
  updated_at: string;
  investigation_status?: string | null;
  investigation_severity?: string | null;
  investigation_assigned_to?: string | null;
  investigation_started_at?: string | null;
  investigation_resolved_at?: string | null;
  investigation_root_cause?: string | null;
  investigation_diagnosis?: string | null;
  investigation_reproduction_steps?: string | null;
  investigation_impact?: string | null;
  investigation_action_taken?: string | null;
  investigation_next_action?: string | null;
  investigation_internal_notes?: string | null;
  investigation_checklist?: Array<{ key: string; label?: string; checked: boolean }> | null;
}

interface OccurrenceEvent {
  id: string;
  event_type: string;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown>;
  actor_user_id: string | null;
  created_at: string;
}

interface Props {
  open: boolean;
  occurrenceId: string | null;
  userId: string | null;
  admins: Array<{ user_id: string; full_name: string | null; email: string }>;
  clinicName: string | null;
  onClose: () => void;
  onChanged: () => void;
}

function fmt(iso?: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('pt-BR'); } catch { return '—'; }
}

export function InvestigationCaseDrawer({
  open, occurrenceId, userId, admins, clinicName, onClose, onChanged,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [occ, setOcc] = useState<Occurrence | null>(null);
  const [events, setEvents] = useState<OccurrenceEvent[]>([]);

  const [form, setForm] = useState({
    investigation_status: 'aberta' as InvestigationStatus,
    investigation_severity: '' as '' | InvestigationSeverity,
    investigation_assigned_to: '' as string,
    investigation_root_cause: '',
    investigation_diagnosis: '',
    investigation_reproduction_steps: '',
    investigation_impact: '',
    investigation_action_taken: '',
    investigation_next_action: '',
    investigation_internal_notes: '',
  });
  const [checklist, setChecklist] = useState<Array<{ key: string; label: string; checked: boolean }>>(
    DEFAULT_CHECKLIST.map(i => ({ ...i, checked: false })),
  );

  const adminMap = useMemo(() => new Map(admins.map(a => [a.user_id, a.full_name || a.email])), [admins]);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [{ data: o, error: oe }, { data: ev }] = await Promise.all([
        db.from('platform_occurrences').select('*').eq('id', id).maybeSingle(),
        db.from('platform_occurrence_events').select('*').eq('occurrence_id', id).order('created_at', { ascending: false }),
      ]);
      if (oe) throw oe;
      const data = o as Occurrence;
      setOcc(data);
      setEvents((ev || []) as OccurrenceEvent[]);

      setForm({
        investigation_status: (data.investigation_status as InvestigationStatus) || 'aberta',
        investigation_severity: (data.investigation_severity as InvestigationSeverity) || '',
        investigation_assigned_to: data.investigation_assigned_to || '',
        investigation_root_cause: data.investigation_root_cause || '',
        investigation_diagnosis: data.investigation_diagnosis || '',
        investigation_reproduction_steps: data.investigation_reproduction_steps || '',
        investigation_impact: data.investigation_impact || '',
        investigation_action_taken: data.investigation_action_taken || '',
        investigation_next_action: data.investigation_next_action || '',
        investigation_internal_notes: data.investigation_internal_notes || '',
      });

      const persisted = Array.isArray(data.investigation_checklist) ? data.investigation_checklist : [];
      const merged = DEFAULT_CHECKLIST.map(item => {
        const found = persisted.find((p: any) => p?.key === item.key);
        return { ...item, checked: !!found?.checked };
      });
      setChecklist(merged);
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível carregar a investigação.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && occurrenceId) load(occurrenceId);
    else {
      setOcc(null);
      setEvents([]);
    }
  }, [open, occurrenceId, load]);

  function buildPatch() {
    const checklistPayload = checklist.map(({ key, label, checked }) => ({ key, label, checked }));
    return {
      investigation_status: form.investigation_status,
      investigation_severity: form.investigation_severity || null,
      investigation_assigned_to: form.investigation_assigned_to || null,
      investigation_root_cause: form.investigation_root_cause || null,
      investigation_diagnosis: form.investigation_diagnosis || null,
      investigation_reproduction_steps: form.investigation_reproduction_steps || null,
      investigation_impact: form.investigation_impact || null,
      investigation_action_taken: form.investigation_action_taken || null,
      investigation_next_action: form.investigation_next_action || null,
      investigation_internal_notes: form.investigation_internal_notes || null,
      investigation_checklist: checklistPayload,
    };
  }

  async function logEvent(eventType: string, oldValue: string | null, newValue: string | null, description?: string) {
    try {
      await db.from('platform_occurrence_events').insert({
        occurrence_id: occurrenceId,
        actor_user_id: userId,
        event_type: eventType,
        old_value: oldValue,
        new_value: newValue,
        metadata: description ? { description } : {},
      });
    } catch (e) {
      console.warn('event log failed', e);
    }
  }

  async function persist(extraOccurrencePatch: Record<string, unknown> = {}, action = 'occurrence.investigation_saved', successMsg = 'Investigação salva com sucesso.') {
    if (!occurrenceId || !occ) return false;
    setSaving(true);
    try {
      const patch = { ...buildPatch(), ...extraOccurrencePatch };
      const oldStatus = occ.status;
      const oldInvStatus = occ.investigation_status || null;

      // First save investigation if not yet started but now active
      if (!occ.investigation_started_at && form.investigation_status !== 'aberta') {
        (patch as any).investigation_started_at = new Date().toISOString();
      }

      const { error } = await db.from('platform_occurrences').update(patch).eq('id', occurrenceId);
      if (error) throw error;

      // History events
      if ((patch as any).status && (patch as any).status !== oldStatus) {
        await logEvent('status_changed', oldStatus, (patch as any).status as string);
      }
      if (form.investigation_status !== oldInvStatus) {
        await logEvent('investigation_status_changed', oldInvStatus, form.investigation_status);
      }
      await logEvent('investigation_updated', null, null, 'Investigação atualizada');

      logPlatformAction({
        action,
        target_type: 'platform_occurrence',
        target_id: occurrenceId,
        clinic_id: occ.clinic_id || null,
        metadata: { investigation_status: form.investigation_status },
      });

      toast.success(successMsg);
      await load(occurrenceId);
      onChanged();
      return true;
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível concluir a ação.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function actionSave() {
    await persist();
  }
  async function actionStartInvestigation() {
    setForm(f => ({ ...f, investigation_status: 'em_investigacao' }));
    await persist({ status: 'em_investigacao' }, 'occurrence.investigation_started', 'Marcado como em investigação.');
  }
  async function actionRequestClient() {
    setForm(f => ({ ...f, investigation_status: 'aguardando_cliente' }));
    await persist({ status: 'aguardando_cliente' }, 'occurrence.waiting_client', 'Aguardando retorno do cliente.');
  }
  async function actionForwardDev() {
    if (!form.investigation_reproduction_steps.trim() && !form.investigation_diagnosis.trim()) {
      toast.error('Preencha "Passos para reproduzir" ou "Diagnóstico técnico" antes de encaminhar.');
      return;
    }
    setForm(f => ({ ...f, investigation_status: 'aguardando_desenvolvimento' }));
    await persist({ status: 'aguardando_desenvolvimento' }, 'occurrence.forwarded_dev', 'Encaminhada para desenvolvimento.');
  }
  async function actionResolve() {
    if (!form.investigation_diagnosis.trim() && !form.investigation_action_taken.trim()) {
      toast.error('Preencha "Diagnóstico técnico" ou "Ação tomada" antes de resolver.');
      return;
    }
    setForm(f => ({ ...f, investigation_status: 'resolvida' }));
    const nowIso = new Date().toISOString();
    await persist(
      { status: 'resolvida', resolved_at: nowIso, resolved_by: userId, investigation_resolved_at: nowIso },
      'occurrence.resolved_via_investigation',
      'Ocorrência marcada como resolvida.',
    );
  }

  function toggleChecklist(key: string, checked: boolean) {
    setChecklist(prev => prev.map(i => (i.key === key ? { ...i, checked } : i)));
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        {loading || !occ ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Investigação da ocorrência
              </div>
              <div className="font-mono text-xs text-muted-foreground">{occ.code}</div>
              <SheetTitle className="text-left">{occ.title}</SheetTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{occ.status}</Badge>
                <Badge variant="outline">{occ.priority}</Badge>
                <Badge variant="outline">{occ.category}</Badge>
              </div>
              <SheetDescription className="text-left">
                Clínica: <strong>{clinicName || '—'}</strong>
                {' · '}Criada em {fmt(occ.created_at)} · Atualizada em {fmt(occ.updated_at)}
              </SheetDescription>
            </SheetHeader>

            <Tabs defaultValue="investigacao" className="mt-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="relato">Relato</TabsTrigger>
                <TabsTrigger value="investigacao">Investigação</TabsTrigger>
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
                <TabsTrigger value="historico">Histórico ({events.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="relato" className="mt-4 space-y-3 text-sm">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Descrição</div>
                  <p className="whitespace-pre-wrap rounded-md border p-3 bg-muted/30">{occ.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Reportante</div>
                    <div>{occ.reported_by_name || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">E-mail</div>
                    <div className="break-all">{occ.reported_by_email || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Módulo</div>
                    <div>{occ.module || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Rota/tela</div>
                    <div>{occ.route || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Ambiente</div>
                    <div>{occ.environment || '—'}</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="investigacao" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Status da investigação</Label>
                    <Select
                      value={form.investigation_status}
                      onValueChange={(v) => setForm(f => ({ ...f, investigation_status: v as InvestigationStatus }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(INV_STATUS_LABEL) as InvestigationStatus[]).map(s => (
                          <SelectItem key={s} value={s}>{INV_STATUS_LABEL[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Severidade técnica</Label>
                    <Select
                      value={form.investigation_severity || 'none'}
                      onValueChange={(v) => setForm(f => ({ ...f, investigation_severity: v === 'none' ? '' : (v as InvestigationSeverity) }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Não definida" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não definida</SelectItem>
                        {(Object.keys(INV_SEVERITY_LABEL) as InvestigationSeverity[]).map(s => (
                          <SelectItem key={s} value={s}>{INV_SEVERITY_LABEL[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Responsável pela investigação</Label>
                    <Select
                      value={form.investigation_assigned_to || 'none'}
                      onValueChange={(v) => setForm(f => ({ ...f, investigation_assigned_to: v === 'none' ? '' : v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Sem responsável" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem responsável</SelectItem>
                        {admins.map(a => (
                          <SelectItem key={a.user_id} value={a.user_id}>{a.full_name || a.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label>Causa provável</Label>
                  <Textarea rows={2} value={form.investigation_root_cause}
                    onChange={(e) => setForm(f => ({ ...f, investigation_root_cause: e.target.value }))} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Diagnóstico técnico</Label>
                  <Textarea rows={3} value={form.investigation_diagnosis}
                    onChange={(e) => setForm(f => ({ ...f, investigation_diagnosis: e.target.value }))} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Passos para reproduzir</Label>
                  <Textarea rows={3} value={form.investigation_reproduction_steps}
                    onChange={(e) => setForm(f => ({ ...f, investigation_reproduction_steps: e.target.value }))} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Impacto identificado</Label>
                  <Textarea rows={2} value={form.investigation_impact}
                    onChange={(e) => setForm(f => ({ ...f, investigation_impact: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Ação tomada</Label>
                    <Textarea rows={2} value={form.investigation_action_taken}
                      onChange={(e) => setForm(f => ({ ...f, investigation_action_taken: e.target.value }))} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Próxima ação</Label>
                    <Textarea rows={2} value={form.investigation_next_action}
                      onChange={(e) => setForm(f => ({ ...f, investigation_next_action: e.target.value }))} />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label>Observações internas</Label>
                  <Textarea rows={2} value={form.investigation_internal_notes}
                    onChange={(e) => setForm(f => ({ ...f, investigation_internal_notes: e.target.value }))} />
                </div>

                {(occ.investigation_started_at || occ.investigation_resolved_at) && (
                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div>Início: {fmt(occ.investigation_started_at)}</div>
                    <div>Resolução: {fmt(occ.investigation_resolved_at)}</div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="checklist" className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Marque os itens executados durante a investigação. As alterações são salvas ao clicar em "Salvar investigação".
                </p>
                <div className="space-y-2">
                  {checklist.map(item => (
                    <label key={item.key} className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={(v) => toggleChecklist(item.key, v === true)}
                        className="mt-0.5"
                      />
                      <span className="text-sm leading-tight">{item.label}</span>
                    </label>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="historico" className="mt-4 space-y-2">
                {events.length === 0 && <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>}
                {events.map(ev => (
                  <div key={ev.id} className="flex items-start gap-3 rounded-md border p-3 text-sm">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{ev.event_type}</span>
                        <span className="text-xs text-muted-foreground">{fmt(ev.created_at)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ev.actor_user_id ? (adminMap.get(ev.actor_user_id) || 'Usuário') : 'Sistema'}
                        {ev.old_value || ev.new_value ? ' · ' : ''}
                        {ev.old_value && <span>de <code>{ev.old_value}</code> </span>}
                        {ev.new_value && <span>para <code>{ev.new_value}</code></span>}
                        {(ev.metadata as any)?.description && <div className="mt-1">{(ev.metadata as any).description}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />

            <div className="flex flex-wrap gap-2">
              <Button onClick={actionSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar investigação
              </Button>
              <Button variant="outline" onClick={actionStartInvestigation} disabled={saving}>
                <ClipboardCheck className="h-4 w-4 mr-2" />Marcar como em investigação
              </Button>
              <Button variant="outline" onClick={actionRequestClient} disabled={saving}>
                <MessageSquareWarning className="h-4 w-4 mr-2" />Solicitar retorno do cliente
              </Button>
              <Button variant="outline" onClick={actionForwardDev} disabled={saving}>
                <Code2 className="h-4 w-4 mr-2" />Encaminhar para desenvolvimento
              </Button>
              <Button variant="outline" onClick={actionResolve} disabled={saving}>
                <CheckCircle2 className="h-4 w-4 mr-2" />Marcar como resolvida
              </Button>
              <Button variant="ghost" className="ml-auto" onClick={onClose} disabled={saving}>
                <XCircle className="h-4 w-4 mr-2" />Fechar
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
