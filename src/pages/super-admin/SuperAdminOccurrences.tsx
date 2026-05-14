import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle, AlertTriangle, Bug, CheckCircle2, Clock, Download, Loader2,
  MessageSquare, MoreHorizontal, Plus, Search, ShieldAlert, XCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logPlatformAction } from '@/lib/superAdminAudit';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { Navigate } from 'react-router-dom';
import { InvestigationCaseDrawer } from '@/components/super-admin/InvestigationCaseDrawer';

type Status =
  | 'aberta' | 'em_triagem' | 'em_andamento' | 'em_investigacao' | 'aguardando_cliente'
  | 'aguardando_desenvolvimento' | 'corrigida' | 'resolvida' | 'cancelada';
type Priority = 'baixa' | 'media' | 'alta' | 'critica';
type Category =
  | 'bug' | 'instabilidade' | 'erro_integracao' | 'financeiro' | 'permissao_acesso'
  | 'prontuario' | 'agenda' | 'whatsapp' | 'teleconsulta' | 'estoque'
  | 'relatorios' | 'melhoria' | 'duvida' | 'outro';

interface Occurrence {
  id: string;
  code: string;
  clinic_id: string | null;
  reported_by_user_id: string | null;
  reported_by_name: string | null;
  reported_by_email: string | null;
  reported_by_phone: string | null;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  assigned_to: string | null;
  module: string | null;
  route: string | null;
  environment: string;
  error_message: string | null;
  stack_trace: string | null;
  user_agent: string | null;
  technical_context: Record<string, unknown>;
  related_entity_type: string | null;
  related_entity_id: string | null;
  root_cause: string | null;
  resolution_summary: string | null;
  corrective_action: string | null;
  recurrence_prevention: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface OccurrenceComment {
  id: string;
  occurrence_id: string;
  author_user_id: string | null;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

interface OccurrenceEvent {
  id: string;
  occurrence_id: string;
  actor_user_id: string | null;
  event_type: string;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const STATUS_LABEL: Record<Status, string> = {
  aberta: 'Aberta',
  em_triagem: 'Em triagem',
  em_andamento: 'Em andamento',
  em_investigacao: 'Em investigação',
  aguardando_cliente: 'Aguardando cliente',
  aguardando_desenvolvimento: 'Aguardando desenvolvimento',
  corrigida: 'Corrigida',
  resolvida: 'Resolvida',
  cancelada: 'Cancelada',
};
const PRIORITY_LABEL: Record<Priority, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica',
};
const CATEGORY_LABEL: Record<Category, string> = {
  bug: 'Bug',
  instabilidade: 'Instabilidade',
  erro_integracao: 'Erro de integração',
  financeiro: 'Financeiro',
  permissao_acesso: 'Permissão/Acesso',
  prontuario: 'Prontuário',
  agenda: 'Agenda',
  whatsapp: 'WhatsApp',
  teleconsulta: 'Teleconsulta',
  estoque: 'Estoque',
  relatorios: 'Relatórios',
  melhoria: 'Melhoria',
  duvida: 'Dúvida',
  outro: 'Outro',
};
const EVENT_LABEL: Record<string, string> = {
  created: 'Ocorrência criada',
  status_changed: 'Status alterado',
  priority_changed: 'Prioridade alterada',
  assignee_changed: 'Responsável alterado',
  comment_added: 'Comentário adicionado',
  resolved: 'Resolvida',
  cancelled: 'Cancelada',
};

function StatusBadge({ status }: { status: Status }) {
  const cls: Record<Status, string> = {
    aberta: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200',
    em_triagem: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200',
    em_andamento: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200',
    em_investigacao: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-200',
    aguardando_cliente: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200',
    aguardando_desenvolvimento: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950 dark:text-pink-200',
    corrigida: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-200',
    resolvida: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200',
    cancelada: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
  };
  return <Badge variant="outline" className={cls[status]}>{STATUS_LABEL[status]}</Badge>;
}
function PriorityBadge({ priority }: { priority: Priority }) {
  const cls: Record<Priority, string> = {
    baixa: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
    media: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200',
    alta: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200',
    critica: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200',
  };
  return <Badge variant="outline" className={cls[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('pt-BR'); } catch { return '—'; }
}

const db = supabase as any;

const STATUS_OPTIONS: Status[] = ['aberta', 'em_triagem', 'em_andamento', 'em_investigacao', 'aguardando_cliente', 'aguardando_desenvolvimento', 'corrigida', 'resolvida', 'cancelada'];
const PRIORITY_OPTIONS: Priority[] = ['baixa', 'media', 'alta', 'critica'];
const CATEGORY_OPTIONS: Category[] = ['bug', 'instabilidade', 'erro_integracao', 'financeiro', 'permissao_acesso', 'prontuario', 'agenda', 'whatsapp', 'teleconsulta', 'estoque', 'relatorios', 'melhoria', 'duvida', 'outro'];

export default function SuperAdminOccurrences() {
  const { isPlatformAdmin, loading: loadingAuth, userId } = usePlatformAdmin();

  const [loading, setLoading] = useState(true);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [clinics, setClinics] = useState<Array<{ id: string; name: string }>>([]);
  const [admins, setAdmins] = useState<Array<{ user_id: string; full_name: string | null; email: string }>>([]);

  // Filtros
  const [search, setSearch] = useState('');
  const [fClinic, setFClinic] = useState<string>('all');
  const [fStatus, setFStatus] = useState<string>('all');
  const [fPriority, setFPriority] = useState<string>('all');
  const [fCategory, setFCategory] = useState<string>('all');
  const [fAssignee, setFAssignee] = useState<string>('all');
  const [fFrom, setFFrom] = useState<string>('');
  const [fTo, setFTo] = useState<string>('');

  // Detalhes
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comments, setComments] = useState<OccurrenceComment[]>([]);
  const [events, setEvents] = useState<OccurrenceEvent[]>([]);
  const [newComment, setNewComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  // Drawer de investigação
  const [investigateId, setInvestigateId] = useState<string | null>(null);

  // Modal nova ocorrência
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    clinic_id: '', title: '', description: '',
    category: 'bug' as Category, priority: 'media' as Priority, status: 'aberta' as Status,
    assigned_to: '', reported_by_name: '', reported_by_email: '', reported_by_phone: '',
    module: '', route: '', error_message: '', stack_trace: '', technical_context: '',
  });

  // Modal resolução
  const [openResolve, setOpenResolve] = useState(false);
  const [resolveForm, setResolveForm] = useState({
    resolution_summary: '', root_cause: '', corrective_action: '', recurrence_prevention: '',
  });
  const [resolving, setResolving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: occ, error: occErr }, { data: cls }, { data: pa }] = await Promise.all([
        db.from('platform_occurrences').select('*').order('created_at', { ascending: false }).limit(500),
        db.from('clinics').select('id, name').order('name'),
        db.from('platform_users').select('user_id, full_name, email').eq('status', 'active').not('user_id', 'is', null),
      ]);
      if (occErr) throw occErr;
      setOccurrences((occ || []) as Occurrence[]);
      setClinics((cls || []) as Array<{ id: string; name: string }>);
      setAdmins((pa || []) as Array<{ user_id: string; full_name: string | null; email: string }>);
    } catch (e: any) {
      console.error(e);
      toast.error('Não foi possível carregar as ocorrências.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isPlatformAdmin) loadAll(); }, [isPlatformAdmin, loadAll]);

  const clinicMap = useMemo(() => new Map(clinics.map(c => [c.id, c.name])), [clinics]);
  const adminMap = useMemo(() => new Map(admins.map(a => [a.user_id, a.full_name || a.email])), [admins]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const fromTs = fFrom ? new Date(fFrom).getTime() : null;
    const toTs = fTo ? new Date(fTo + 'T23:59:59').getTime() : null;
    return occurrences.filter(o => {
      if (fClinic !== 'all' && o.clinic_id !== fClinic) return false;
      if (fStatus !== 'all' && o.status !== fStatus) return false;
      if (fPriority !== 'all' && o.priority !== fPriority) return false;
      if (fCategory !== 'all' && o.category !== fCategory) return false;
      if (fAssignee !== 'all') {
        if (fAssignee === 'unassigned' ? o.assigned_to !== null : o.assigned_to !== fAssignee) return false;
      }
      const t = new Date(o.created_at).getTime();
      if (fromTs && t < fromTs) return false;
      if (toTs && t > toTs) return false;
      if (s) {
        const clinicName = (o.clinic_id ? clinicMap.get(o.clinic_id) : '') || '';
        const hay = `${o.title} ${o.description} ${o.code} ${clinicName} ${o.reported_by_email || ''}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [occurrences, search, fClinic, fStatus, fPriority, fCategory, fAssignee, fFrom, fTo, clinicMap]);

  // KPIs
  const kpis = useMemo(() => {
    const open = occurrences.filter(o => !['resolvida', 'cancelada'].includes(o.status));
    const criticalBugs = occurrences.filter(o => o.category === 'bug' && o.priority === 'critica' && !['resolvida', 'cancelada'].includes(o.status));
    const waitingClient = occurrences.filter(o => o.status === 'aguardando_cliente');
    const last7 = Date.now() - 7 * 86400000;
    const recentResolved = occurrences.filter(o => o.resolved_at && new Date(o.resolved_at).getTime() >= last7);
    let avgMs = 0;
    if (recentResolved.length) {
      const sum = recentResolved.reduce((acc, o) => acc + (new Date(o.resolved_at!).getTime() - new Date(o.created_at).getTime()), 0);
      avgMs = sum / recentResolved.length;
    }
    const avgHours = avgMs ? Math.round(avgMs / 3600000) : 0;
    return { open: open.length, criticalBugs: criticalBugs.length, waitingClient: waitingClient.length, recentResolved: recentResolved.length, avgHours };
  }, [occurrences]);

  // Detalhes
  const selected = useMemo(() => occurrences.find(o => o.id === selectedId) || null, [occurrences, selectedId]);

  const loadDetails = useCallback(async (id: string) => {
    try {
      const [{ data: cs }, { data: es }] = await Promise.all([
        db.from('platform_occurrence_comments').select('*').eq('occurrence_id', id).order('created_at', { ascending: true }),
        db.from('platform_occurrence_events').select('*').eq('occurrence_id', id).order('created_at', { ascending: false }),
      ]);
      setComments((cs || []) as OccurrenceComment[]);
      setEvents((es || []) as OccurrenceEvent[]);
    } catch {
      toast.error('Não foi possível concluir a ação.');
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadDetails(selectedId);
    else { setComments([]); setEvents([]); }
  }, [selectedId, loadDetails]);

  // ----- ações -----
  async function updateField(id: string, patch: Partial<Occurrence>, action: string, msg: string) {
    try {
      const { error } = await db.from('platform_occurrences').update(patch).eq('id', id);
      if (error) throw error;
      toast.success(msg);
      await Promise.all([loadAll(), loadDetails(id)]);
      const occ = occurrences.find(o => o.id === id);
      logPlatformAction({ action, target_type: 'platform_occurrence', target_id: id, clinic_id: occ?.clinic_id || null, metadata: patch as any });
    } catch (e: any) {
      console.error(e);
      toast.error('Não foi possível concluir a ação.');
    }
  }

  async function changeStatus(id: string, status: Status) {
    await updateField(id, { status }, 'occurrence.status_changed', 'Status atualizado com sucesso.');
  }
  async function changePriority(id: string, priority: Priority) {
    await updateField(id, { priority }, 'occurrence.priority_changed', 'Prioridade atualizada com sucesso.');
  }
  async function changeAssignee(id: string, assigned_to: string | null) {
    await updateField(id, { assigned_to }, 'occurrence.assignee_changed', 'Responsável atualizado com sucesso.');
  }

  async function cancelOccurrence(id: string) {
    try {
      const { error } = await db.from('platform_occurrences').update({
        status: 'cancelada', cancelled_at: new Date().toISOString(), cancelled_by: userId,
      }).eq('id', id);
      if (error) throw error;
      toast.success('Ocorrência cancelada com sucesso.');
      await Promise.all([loadAll(), loadDetails(id)]);
      const occ = occurrences.find(o => o.id === id);
      logPlatformAction({ action: 'occurrence.cancelled', target_type: 'platform_occurrence', target_id: id, clinic_id: occ?.clinic_id || null });
    } catch {
      toast.error('Não foi possível concluir a ação.');
    }
  }

  async function addComment() {
    if (!selectedId || !newComment.trim()) return;
    setSavingComment(true);
    try {
      const { error } = await db.from('platform_occurrence_comments').insert({
        occurrence_id: selectedId, author_user_id: userId, comment: newComment.trim(), is_internal: true,
      });
      if (error) throw error;
      toast.success('Comentário adicionado com sucesso.');
      setNewComment('');
      await loadDetails(selectedId);
      const occ = selected;
      logPlatformAction({ action: 'occurrence.comment_added', target_type: 'platform_occurrence', target_id: selectedId, clinic_id: occ?.clinic_id || null });
    } catch {
      toast.error('Não foi possível concluir a ação.');
    } finally {
      setSavingComment(false);
    }
  }

  async function createOccurrence() {
    if (!form.clinic_id || form.title.trim().length < 5 || form.description.trim().length < 10 || !form.category || !form.priority) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }
    let tech: any = {};
    if (form.technical_context.trim()) {
      try { tech = JSON.parse(form.technical_context); }
      catch { toast.error('O contexto técnico precisa ser um JSON válido.'); return; }
    }
    setCreating(true);
    try {
      const payload: any = {
        clinic_id: form.clinic_id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
        status: form.status,
        assigned_to: form.assigned_to || null,
        reported_by_name: form.reported_by_name || null,
        reported_by_email: form.reported_by_email || null,
        reported_by_phone: form.reported_by_phone || null,
        module: form.module || null,
        route: form.route || null,
        error_message: form.error_message || null,
        stack_trace: form.stack_trace || null,
        technical_context: tech,
        created_by: userId,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      };
      const { data, error } = await db.from('platform_occurrences').insert(payload).select('id, code, clinic_id').maybeSingle();
      if (error) throw error;
      toast.success('Ocorrência criada com sucesso.');
      setOpenCreate(false);
      setForm({
        clinic_id: '', title: '', description: '',
        category: 'bug', priority: 'media', status: 'aberta',
        assigned_to: '', reported_by_name: '', reported_by_email: '', reported_by_phone: '',
        module: '', route: '', error_message: '', stack_trace: '', technical_context: '',
      });
      await loadAll();
      logPlatformAction({
        action: 'occurrence.created', target_type: 'platform_occurrence',
        target_id: data?.id || null, clinic_id: data?.clinic_id || null,
        metadata: { code: data?.code, category: payload.category, priority: payload.priority },
      });
    } catch (e: any) {
      console.error(e);
      toast.error('Não foi possível concluir a ação.');
    } finally {
      setCreating(false);
    }
  }

  async function resolveOccurrence() {
    if (!selectedId || !resolveForm.resolution_summary.trim()) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }
    setResolving(true);
    try {
      const { error } = await db.from('platform_occurrences').update({
        status: 'resolvida',
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
        resolution_summary: resolveForm.resolution_summary.trim(),
        root_cause: resolveForm.root_cause || null,
        corrective_action: resolveForm.corrective_action || null,
        recurrence_prevention: resolveForm.recurrence_prevention || null,
      }).eq('id', selectedId);
      if (error) throw error;
      toast.success('Ocorrência resolvida com sucesso.');
      setOpenResolve(false);
      setResolveForm({ resolution_summary: '', root_cause: '', corrective_action: '', recurrence_prevention: '' });
      await Promise.all([loadAll(), loadDetails(selectedId)]);
      const occ = selected;
      logPlatformAction({ action: 'occurrence.resolved', target_type: 'platform_occurrence', target_id: selectedId, clinic_id: occ?.clinic_id || null });
    } catch {
      toast.error('Não foi possível concluir a ação.');
    } finally {
      setResolving(false);
    }
  }

  function exportCsv() {
    const rows = [
      ['Código', 'Título', 'Clínica', 'Categoria', 'Prioridade', 'Status', 'Responsável', 'Criada em', 'Atualizada em', 'Resolvida em'],
      ...filtered.map(o => [
        o.code,
        o.title.replace(/"/g, '""'),
        (o.clinic_id ? clinicMap.get(o.clinic_id) : '') || '',
        CATEGORY_LABEL[o.category] || o.category,
        PRIORITY_LABEL[o.priority] || o.priority,
        STATUS_LABEL[o.status] || o.status,
        (o.assigned_to ? adminMap.get(o.assigned_to) : '') || '',
        fmtDate(o.created_at),
        fmtDate(o.updated_at),
        fmtDate(o.resolved_at),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ocorrencias_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    logPlatformAction({ action: 'occurrence.exported_csv', target_type: 'platform_occurrence', metadata: { count: filtered.length } });
  }

  if (loadingAuth) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!isPlatformAdmin) return <Navigate to="/app" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ocorrências e bugs</h1>
        <p className="text-sm text-muted-foreground">Triagem e acompanhamento de incidentes reportados pelas clínicas.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard icon={<AlertCircle className="h-4 w-4" />} label="Ocorrências abertas" value={kpis.open} />
        <KpiCard icon={<Bug className="h-4 w-4 text-red-600" />} label="Bugs críticos" value={kpis.criticalBugs} />
        <KpiCard icon={<Clock className="h-4 w-4 text-orange-600" />} label="Aguardando cliente" value={kpis.waitingClient} />
        <KpiCard icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} label="Resolvidas em 7 dias" value={kpis.recentResolved} />
        <KpiCard icon={<Clock className="h-4 w-4" />} label="Tempo médio (h)" value={kpis.avgHours} />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 lg:grid-cols-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título, descrição, clínica ou e-mail" className="pl-9" />
            </div>
            <Select value={fClinic} onValueChange={setFClinic}>
              <SelectTrigger><SelectValue placeholder="Clínica" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as clínicas</SelectItem>
                {clinics.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fPriority} onValueChange={setFPriority}>
              <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fCategory} onValueChange={setFCategory}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fAssignee} onValueChange={setFAssignee}>
              <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                <SelectItem value="unassigned">Sem responsável</SelectItem>
                {admins.map(a => <SelectItem key={a.user_id} value={a.user_id}>{a.full_name || a.email}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} placeholder="De" />
              <Input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} placeholder="Até" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Exportar CSV</Button>
            <Button onClick={() => setOpenCreate(true)}><Plus className="h-4 w-4 mr-2" />Nova ocorrência</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader><CardTitle className="text-base">Ocorrências ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <AlertTriangle className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p className="font-medium">Nenhuma ocorrência registrada.</p>
              <p className="text-sm">As ocorrências reportadas pelas clínicas aparecerão aqui.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Clínica</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead>Atualizada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(o => (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => setSelectedId(o.id)}>
                    <TableCell className="font-mono text-xs">{o.code}</TableCell>
                    <TableCell className="max-w-[280px] truncate font-medium">{o.title}</TableCell>
                    <TableCell className="text-sm">{(o.clinic_id && clinicMap.get(o.clinic_id)) || '—'}</TableCell>
                    <TableCell className="text-sm">{CATEGORY_LABEL[o.category]}</TableCell>
                    <TableCell><PriorityBadge priority={o.priority} /></TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-sm">{(o.assigned_to && adminMap.get(o.assigned_to)) || '—'}</TableCell>
                    <TableCell className="text-xs">{fmtDate(o.created_at)}</TableCell>
                    <TableCell className="text-xs">{fmtDate(o.updated_at)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => setSelectedId(o.id)}>Ver detalhes</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setInvestigateId(o.id)}>
                            <ShieldAlert className="h-4 w-4 mr-2" />Investigar caso
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {STATUS_OPTIONS.map(s => (
                            <DropdownMenuItem key={s} disabled={o.status === s} onClick={() => changeStatus(o.id, s)}>
                              Status: {STATUS_LABEL[s]}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled={o.priority === 'critica'} onClick={() => changePriority(o.id, 'critica')}>Marcar como crítica</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedId(o.id); setOpenResolve(true); }}>Resolver</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => cancelOccurrence(o.id)}>Cancelar ocorrência</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Drawer de detalhes */}
      <Sheet open={!!selectedId} onOpenChange={(v) => !v && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-mono text-xs text-muted-foreground">{selected.code}</div>
                    <SheetTitle className="text-left">{selected.title}</SheetTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={selected.status} />
                      <PriorityBadge priority={selected.priority} />
                      <Badge variant="outline">{CATEGORY_LABEL[selected.category]}</Badge>
                    </div>
                  </div>
                </div>
                <SheetDescription className="text-left">
                  Clínica: <strong>{(selected.clinic_id && clinicMap.get(selected.clinic_id)) || '—'}</strong>
                  {' · '}Criada em {fmtDate(selected.created_at)} · Atualizada em {fmtDate(selected.updated_at)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 flex flex-wrap gap-2">
                <Select value={selected.status} onValueChange={(v) => changeStatus(selected.id, v as Status)}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selected.priority} onValueChange={(v) => changePriority(selected.id, v as Priority)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select
                  value={selected.assigned_to || 'none'}
                  onValueChange={(v) => changeAssignee(selected.id, v === 'none' ? null : v)}
                >
                  <SelectTrigger className="w-56"><SelectValue placeholder="Responsável" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem responsável</SelectItem>
                    {admins.map(a => <SelectItem key={a.user_id} value={a.user_id}>{a.full_name || a.email}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setOpenResolve(true)} disabled={selected.status === 'resolvida'}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />Resolver
                </Button>
                <Button variant="outline" className="text-destructive" onClick={() => cancelOccurrence(selected.id)} disabled={selected.status === 'cancelada'}>
                  <XCircle className="h-4 w-4 mr-2" />Cancelar
                </Button>
              </div>

              <Tabs defaultValue="dados" className="mt-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="dados">Dados</TabsTrigger>
                  <TabsTrigger value="tecnico">Técnico</TabsTrigger>
                  <TabsTrigger value="comentarios">Comentários ({comments.length})</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="space-y-3 mt-4 text-sm">
                  <Field label="Descrição"><p className="whitespace-pre-wrap">{selected.description}</p></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Reportante">{selected.reported_by_name || '—'}</Field>
                    <Field label="E-mail">{selected.reported_by_email || '—'}</Field>
                    <Field label="Telefone">{selected.reported_by_phone || '—'}</Field>
                    <Field label="Módulo">{selected.module || '—'}</Field>
                    <Field label="Rota/tela">{selected.route || '—'}</Field>
                    <Field label="Ambiente">{selected.environment}</Field>
                  </div>
                  {selected.resolution_summary && (
                    <Field label="Resumo da solução"><p className="whitespace-pre-wrap">{selected.resolution_summary}</p></Field>
                  )}
                  {selected.root_cause && <Field label="Causa raiz">{selected.root_cause}</Field>}
                  {selected.corrective_action && <Field label="Ação corretiva">{selected.corrective_action}</Field>}
                  {selected.recurrence_prevention && <Field label="Prevenir recorrência">{selected.recurrence_prevention}</Field>}
                </TabsContent>

                <TabsContent value="tecnico" className="space-y-3 mt-4 text-sm">
                  {selected.error_message && <Field label="Mensagem de erro"><pre className="whitespace-pre-wrap rounded bg-muted p-2 text-xs">{selected.error_message}</pre></Field>}
                  {selected.stack_trace && <Field label="Stack trace"><pre className="whitespace-pre-wrap rounded bg-muted p-2 text-xs max-h-64 overflow-auto">{selected.stack_trace}</pre></Field>}
                  {selected.user_agent && <Field label="User agent"><span className="break-all text-xs">{selected.user_agent}</span></Field>}
                  {Object.keys(selected.technical_context || {}).length > 0 && (
                    <Field label="Contexto técnico"><pre className="whitespace-pre-wrap rounded bg-muted p-2 text-xs">{JSON.stringify(selected.technical_context, null, 2)}</pre></Field>
                  )}
                  <Field label="IDs relacionados">
                    <ul className="text-xs space-y-1">
                      <li>clinic_id: <code>{selected.clinic_id || '—'}</code></li>
                      <li>user_id: <code>{selected.reported_by_user_id || '—'}</code></li>
                      <li>related_entity_type: <code>{selected.related_entity_type || '—'}</code></li>
                      <li>related_entity_id: <code>{selected.related_entity_id || '—'}</code></li>
                    </ul>
                  </Field>
                </TabsContent>

                <TabsContent value="comentarios" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    {comments.length === 0 && <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>}
                    {comments.map(c => (
                      <div key={c.id} className="rounded-md border p-3 text-sm">
                        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{(c.author_user_id && adminMap.get(c.author_user_id)) || 'Sistema'}</span>
                          <span>{fmtDate(c.created_at)}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{c.comment}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Escreva um comentário interno..." rows={3} />
                    <Button onClick={addComment} disabled={savingComment || !newComment.trim()}>
                      {savingComment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                      Adicionar comentário
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="historico" className="space-y-2 mt-4">
                  {events.length === 0 && <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>}
                  {events.map(ev => (
                    <div key={ev.id} className="flex items-start gap-3 rounded-md border p-3 text-sm">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{EVENT_LABEL[ev.event_type] || ev.event_type}</span>
                          <span className="text-xs text-muted-foreground">{fmtDate(ev.created_at)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ev.actor_user_id ? (adminMap.get(ev.actor_user_id) || 'Usuário') : 'Sistema'}
                          {ev.old_value || ev.new_value ? ' · ' : ''}
                          {ev.old_value && <span>de <code>{ev.old_value}</code> </span>}
                          {ev.new_value && <span>para <code>{ev.new_value}</code></span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal nova ocorrência */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova ocorrência</DialogTitle>
            <DialogDescription>Registre uma nova ocorrência ou bug reportado por uma clínica.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Clínica *</Label>
              <Select value={form.clinic_id} onValueChange={(v) => setForm({ ...form, clinic_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a clínica" /></SelectTrigger>
                <SelectContent>
                  {clinics.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Resumo curto do problema" />
            </div>
            <div className="grid gap-1.5">
              <Label>Descrição *</Label>
              <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descreva o problema com o máximo de detalhes" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label>Categoria *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Prioridade *</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Responsável</Label>
              <Select value={form.assigned_to || 'none'} onValueChange={(v) => setForm({ ...form, assigned_to: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Sem responsável" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem responsável</SelectItem>
                  {admins.map(a => <SelectItem key={a.user_id} value={a.user_id}>{a.full_name || a.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5"><Label>Reportante</Label><Input value={form.reported_by_name} onChange={(e) => setForm({ ...form, reported_by_name: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>E-mail</Label><Input type="email" value={form.reported_by_email} onChange={(e) => setForm({ ...form, reported_by_email: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Telefone</Label><Input value={form.reported_by_phone} onChange={(e) => setForm({ ...form, reported_by_phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Módulo</Label><Input value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} placeholder="ex.: Agenda" /></div>
              <div className="grid gap-1.5"><Label>Rota/tela</Label><Input value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} placeholder="/app/agenda" /></div>
            </div>
            <div className="grid gap-1.5"><Label>Mensagem de erro</Label><Textarea rows={2} value={form.error_message} onChange={(e) => setForm({ ...form, error_message: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Stack trace</Label><Textarea rows={3} value={form.stack_trace} onChange={(e) => setForm({ ...form, stack_trace: e.target.value })} className="font-mono text-xs" /></div>
            <div className="grid gap-1.5"><Label>Contexto técnico (JSON)</Label><Textarea rows={3} value={form.technical_context} onChange={(e) => setForm({ ...form, technical_context: e.target.value })} placeholder='{"chave": "valor"}' className="font-mono text-xs" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={creating}>Cancelar</Button>
            <Button onClick={createOccurrence} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Salvar ocorrência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal resolução */}
      <Dialog open={openResolve} onOpenChange={setOpenResolve}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver ocorrência</DialogTitle>
            <DialogDescription>Registre o resumo da solução e detalhes da resolução.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5"><Label>Resumo da solução *</Label><Textarea rows={3} value={resolveForm.resolution_summary} onChange={(e) => setResolveForm({ ...resolveForm, resolution_summary: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Causa raiz</Label><Textarea rows={2} value={resolveForm.root_cause} onChange={(e) => setResolveForm({ ...resolveForm, root_cause: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Ação corretiva</Label><Textarea rows={2} value={resolveForm.corrective_action} onChange={(e) => setResolveForm({ ...resolveForm, corrective_action: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Prevenir recorrência?</Label><Textarea rows={2} value={resolveForm.recurrence_prevention} onChange={(e) => setResolveForm({ ...resolveForm, recurrence_prevention: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenResolve(false)} disabled={resolving}>Cancelar</Button>
            <Button onClick={resolveOccurrence} disabled={resolving}>
              {resolving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Marcar como resolvida
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drawer Investigar caso */}
      <InvestigationCaseDrawer
        open={!!investigateId}
        occurrenceId={investigateId}
        userId={userId}
        admins={admins}
        clinicName={
          investigateId
            ? (occurrences.find(o => o.id === investigateId)?.clinic_id
                ? clinicMap.get(occurrences.find(o => o.id === investigateId)!.clinic_id!) || null
                : null)
            : null
        }
        onClose={() => setInvestigateId(null)}
        onChanged={() => loadAll()}
      />
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          {icon}
        </div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      <div>{children}</div>
    </div>
  );
}
