/**
 * Super Admin > Recursos da Clínica > Biblioteca de Prontuário
 * Catálogo global de modelos, abas e funções liberáveis por clínica.
 */
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Search, Loader2, Library, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logPlatformAction } from '@/lib/superAdminAudit';

interface Resource {
  resource_key: string;
  resource_type: string;
  specialty_slug: string | null;
  title: string;
  description: string | null;
  source_table: string | null;
  source_id: string | null;
  preview_payload: any;
  enabled: boolean;
  has_override: boolean;
  override_reason: string | null;
}

const SPECIALTY_LABEL: Record<string, string> = {
  other_specialty: 'Atendimento Geral',
  aesthetics: 'Estética',
  psychology: 'Psicologia',
  dentistry: 'Odontologia',
  nutrition: 'Nutrição',
  physiotherapy: 'Fisioterapia',
  pediatrics: 'Pediatria',
  dermatology: 'Dermatologia',
  chiropractic: 'Quiropraxia',
  medical_general: 'Clínica Médica',
  pilates: 'Pilates',
};
const TYPE_LABEL: Record<string, string> = {
  anamnese: 'Anamnese',
  evolucao: 'Evolução',
  avaliacao: 'Avaliação',
  documento: 'Documento',
  aba: 'Aba',
  funcao: 'Função',
  procedimento: 'Procedimento',
  termo: 'Termo',
  mapa: 'Mapa',
  foto: 'Foto',
  escala: 'Escala',
};

const labelSpecialty = (s: string | null) => (s ? SPECIALTY_LABEL[s] ?? s : 'Global');
const labelType = (t: string) => TYPE_LABEL[t] ?? t;

export function ProntuarioLibrarySection({ clinicId }: { clinicId: string }) {
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState<string>('all');
  const [type, setType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [reason, setReason] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<Resource | null>(null);

  const load = async () => {
    if (!clinicId) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('get_prontuario_resource_catalog', {
      p_clinic_id: clinicId,
    });
    if (error) { console.error(error); toast.error('Erro ao carregar a biblioteca.'); }
    setItems((data ?? []) as Resource[]);
    setSelected({});
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [clinicId]);

  const specialties = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => s.add(i.specialty_slug ?? 'global'));
    return Array.from(s).sort();
  }, [items]);
  const types = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => s.add(i.resource_type));
    return Array.from(s).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (q && !i.title.toLowerCase().includes(q) &&
          !(i.description ?? '').toLowerCase().includes(q)) return false;
      if (specialty !== 'all' && (i.specialty_slug ?? 'global') !== specialty) return false;
      if (type !== 'all' && i.resource_type !== type) return false;
      if (status === 'enabled' && !i.enabled) return false;
      if (status === 'disabled' && i.enabled) return false;
      return true;
    });
  }, [items, search, specialty, type, status]);

  const selectedItems = useMemo(
    () => filtered.filter((i) => selected[i.resource_key]),
    [filtered, selected],
  );

  const writeOne = async (r: Resource, enabled: boolean) => {
    if (!reason.trim()) { toast.error('Informe o motivo antes de alterar.'); return; }
    await supabase.from('clinic_template_overrides').delete()
      .eq('clinic_id', clinicId).eq('resource_key', r.resource_key);
    const { error } = await supabase.from('clinic_template_overrides').insert({
      clinic_id: clinicId,
      resource_key: r.resource_key,
      template_id: r.source_id, // pode ser null para funções/abas
      template_kind: r.resource_type,
      enabled,
      reason: reason.trim(),
    });
    if (error) { console.error(error); toast.error('Erro ao salvar.'); return; }
    await logPlatformAction({
      action: enabled ? 'resource_override.enable' : 'resource_override.disable',
      target_type: 'prontuario_resource',
      clinic_id: clinicId,
      metadata: { resource_key: r.resource_key, reason: reason.trim() },
    });
    toast.success(enabled ? 'Recurso liberado.' : 'Recurso bloqueado.');
    load();
  };

  const bulk = async (enabled: boolean, scope: 'selected' | 'filtered') => {
    if (!reason.trim()) { toast.error('Informe o motivo antes de alterar em massa.'); return; }
    const list = scope === 'selected' ? selectedItems : filtered;
    if (list.length === 0) { toast.error('Nenhum recurso elegível.'); return; }
    const keys = list.map((i) => i.resource_key);
    await supabase.from('clinic_template_overrides').delete()
      .eq('clinic_id', clinicId).in('resource_key', keys);
    const rows = list.map((r) => ({
      clinic_id: clinicId,
      resource_key: r.resource_key,
      template_id: r.source_id,
      template_kind: r.resource_type,
      enabled,
      reason: reason.trim(),
    }));
    const { error } = await supabase.from('clinic_template_overrides').insert(rows);
    if (error) { console.error(error); toast.error('Erro ao salvar em massa.'); return; }
    await logPlatformAction({
      action: enabled ? 'resource_override.bulk_enable' : 'resource_override.bulk_disable',
      target_type: 'prontuario_resource',
      clinic_id: clinicId,
      metadata: { count: rows.length, scope, reason: reason.trim() },
    });
    toast.success(`${rows.length} recursos atualizados.`);
    load();
  };

  const resetSelected = async () => {
    const keys = selectedItems.map((i) => i.resource_key);
    if (keys.length === 0) { toast.error('Selecione recursos para restaurar.'); return; }
    await supabase.from('clinic_template_overrides').delete()
      .eq('clinic_id', clinicId).in('resource_key', keys);
    await logPlatformAction({
      action: 'resource_override.reset',
      target_type: 'prontuario_resource',
      clinic_id: clinicId,
      metadata: { count: keys.length },
    });
    toast.success('Recursos restaurados ao padrão.');
    load();
  };

  const allSelected = filtered.length > 0 && filtered.every((i) => selected[i.resource_key]);
  const toggleAll = (v: boolean) => {
    const next: Record<string, boolean> = { ...selected };
    filtered.forEach((i) => { next[i.resource_key] = v; });
    setSelected(next);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Library className="h-4 w-4" /> Biblioteca de Prontuário — todos os recursos do sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_160px]">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
            <Input className="pl-8" placeholder="Pesquisar recurso..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger><SelectValue placeholder="Especialidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas especialidades</SelectItem>
              {specialties.map((s) => (
                <SelectItem key={s} value={s}>{labelSpecialty(s === 'global' ? null : s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>{labelType(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="enabled">Apenas liberados</SelectItem>
              <SelectItem value="disabled">Apenas bloqueados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Textarea rows={1}
          placeholder="Motivo (obrigatório para qualquer alteração)..."
          value={reason} onChange={(e) => setReason(e.target.value)} />

        <div className="flex flex-wrap items-center gap-2 rounded border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2 mr-2">
            <Checkbox checked={allSelected} onCheckedChange={(v) => toggleAll(Boolean(v))} />
            <span className="text-xs text-muted-foreground">
              {selectedItems.length} selecionado(s) • {filtered.length} no filtro
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={() => bulk(true, 'selected')}>Liberar selecionados</Button>
          <Button size="sm" variant="outline" onClick={() => bulk(false, 'selected')}>Bloquear selecionados</Button>
          <Button size="sm" variant="outline" onClick={() => bulk(true, 'filtered')}>Liberar todos do filtro</Button>
          <Button size="sm" variant="outline" onClick={() => bulk(false, 'filtered')}>Bloquear todos do filtro</Button>
          <Button size="sm" variant="ghost" onClick={resetSelected}>Restaurar padrão</Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 text-center">
            Nenhum recurso encontrado para os filtros atuais.
          </p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {filtered.map((r) => (
              <div key={r.resource_key} className="rounded border p-3 text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={!!selected[r.resource_key]}
                    onCheckedChange={(v) => setSelected((s) => ({ ...s, [r.resource_key]: Boolean(v) }))}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.title}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary">{labelSpecialty(r.specialty_slug)}</Badge>
                      <Badge variant="outline">{labelType(r.resource_type)}</Badge>
                      {r.has_override && (
                        <Badge className="bg-violet-600 text-white hover:bg-violet-600">Override</Badge>
                      )}
                    </div>
                    {r.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                    )}
                  </div>
                  <Switch checked={r.enabled} onCheckedChange={(v) => writeOne(r, v)} />
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setPreview(r)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Ver modelo
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{preview?.title}</DialogTitle>
              <DialogDescription>
                {labelSpecialty(preview?.specialty_slug ?? null)} • {labelType(preview?.resource_type ?? '')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              {preview?.description && (
                <p className="text-muted-foreground">{preview.description}</p>
              )}
              <div className="rounded border bg-muted/30 p-3">
                <div className="text-xs font-semibold mb-1 text-muted-foreground">Prévia</div>
                <pre className="whitespace-pre-wrap break-words text-xs max-h-80 overflow-auto">
{JSON.stringify(preview?.preview_payload ?? { info: 'Sem prévia estruturada.' }, null, 2)}
                </pre>
              </div>
              <div className="text-xs text-muted-foreground">
                Identificador: <code>{preview?.resource_key}</code>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
