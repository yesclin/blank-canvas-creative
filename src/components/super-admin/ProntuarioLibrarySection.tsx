/**
 * Super Admin > Recursos da Clínica > Biblioteca
 * Painel moderno em Accordion (categorias colapsadas), grid de cards,
 * busca global, filtros, ações em massa e Drawer lateral de preview.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui/accordion';
import {
  Search, Loader2, Library, Eye, Boxes, Lock, Sparkles, CheckCircle2, XCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logPlatformAction } from '@/lib/superAdminAudit';
import { cn } from '@/lib/utils';

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

type SectionKey =
  | 'funcionalidades' | 'anamnese' | 'evolucao' | 'plano' | 'documentos' | 'escalas';

const SECTIONS: { key: SectionKey; label: string; types: string[]; hint: string }[] = [
  { key: 'funcionalidades', label: 'Funcionalidades do Prontuário', types: ['aba', 'funcao'], hint: 'Abas e funções nativas (Fotos, Mapa Facial, Antes/Depois, Escalas, etc.).' },
  { key: 'anamnese',        label: 'Modelos de Anamnese',           types: ['anamnese'],       hint: 'Apenas modelos de anamnese.' },
  { key: 'evolucao',        label: 'Modelos de Evolução',           types: ['evolution', 'evolucao'], hint: 'Modelos de evolução clínica.' },
  { key: 'plano',           label: 'Modelos de Plano / Conduta',    types: ['custom_form', 'plano', 'conduta'], hint: 'Modelos de plano terapêutico e conduta.' },
  { key: 'documentos',      label: 'Modelos de Documentos',         types: ['documento', 'termo', 'receita', 'atestado'], hint: 'Receitas, atestados, termos, declarações.' },
  { key: 'escalas',         label: 'Escalas Clínicas',              types: ['escala', 'scale'], hint: 'PHQ-9, GAD-7, EVA, Mini Mental, etc.' },
];

const SPECIALTY_LABEL: Record<string, string> = {
  other_specialty: 'Atendimento Geral', aesthetics: 'Estética', psychology: 'Psicologia',
  dentistry: 'Odontologia', nutrition: 'Nutrição', physiotherapy: 'Fisioterapia',
  pediatrics: 'Pediatria', dermatology: 'Dermatologia', chiropractic: 'Quiropraxia',
  medical_general: 'Clínica Médica', pilates: 'Pilates',
};
const TYPE_LABEL: Record<string, string> = {
  anamnese: 'Anamnese', evolucao: 'Evolução', evolution: 'Evolução',
  documento: 'Documento', aba: 'Aba', funcao: 'Função',
  termo: 'Termo', escala: 'Escala', scale: 'Escala',
  custom_form: 'Plano/Conduta', plano: 'Plano', conduta: 'Conduta',
  receita: 'Receita', atestado: 'Atestado',
};
const labelSpecialty = (s: string | null) => (s ? SPECIALTY_LABEL[s] ?? s : 'Global');
const labelType = (t: string) => TYPE_LABEL[t] ?? t;

interface Props {
  clinicId: string;
  /** Conteúdo do primeiro accordion: "Módulos do Sistema" (gerenciado fora). */
  modulesContent: ReactNode;
  /** Resumo de Módulos para o cabeçalho. */
  modulesSummary?: { total: number; enabled: number };
}

export function ProntuarioLibrarySection({ clinicId, modulesContent, modulesSummary }: Props) {
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'enabled' | 'disabled' | 'padrao' | 'override'>('all');
  const [specialty, setSpecialty] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [reason, setReason] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<Resource | null>(null);
  const [openSections, setOpenSections] = useState<string[]>([]);

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

  const allSpecialties = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => s.add(i.specialty_slug ?? 'global'));
    return Array.from(s).sort();
  }, [items]);

  const applyFilters = (list: Resource[]) => {
    const q = globalSearch.trim().toLowerCase();
    return list.filter((i) => {
      if (q && !i.title.toLowerCase().includes(q) &&
          !(i.description ?? '').toLowerCase().includes(q)) return false;
      if (specialty !== 'all' && (i.specialty_slug ?? 'global') !== specialty) return false;
      if (categoryFilter !== 'all' && i.resource_type !== categoryFilter) return false;
      if (quickFilter === 'enabled' && !i.enabled) return false;
      if (quickFilter === 'disabled' && i.enabled) return false;
      if (quickFilter === 'padrao' && i.has_override) return false;
      if (quickFilter === 'override' && !i.has_override) return false;
      return true;
    });
  };

  // Auto-expande seções com resultado quando busca global está ativa.
  useEffect(() => {
    if (!globalSearch.trim()) return;
    const matches = SECTIONS
      .filter((s) => applyFilters(items.filter((i) => s.types.includes(i.resource_type))).length > 0)
      .map((s) => s.key);
    setOpenSections((prev) => Array.from(new Set([...prev, ...matches])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSearch]);

  // Header summary
  const summary = useMemo(() => {
    const functionalityTypes = SECTIONS.find((s) => s.key === 'funcionalidades')!.types;
    return {
      total: items.length,
      enabled: items.filter((i) => i.enabled).length,
      disabled: items.filter((i) => !i.enabled).length,
      functionalities: items.filter((i) => functionalityTypes.includes(i.resource_type)).length,
      templates: items.filter((i) => !functionalityTypes.includes(i.resource_type)).length,
    };
  }, [items]);

  const writeOne = async (r: Resource, enabled: boolean) => {
    if (!reason.trim()) { toast.error('Informe o motivo antes de alterar.'); return; }
    const payload = {
      clinic_id: clinicId, resource_key: r.resource_key,
      template_id: r.source_id, template_kind: r.resource_type,
      enabled, reason: reason.trim(),
    };
    console.log('[Recursos] Clínica:', clinicId);
    console.log('[Recursos] Ação:', enabled ? 'liberar' : 'bloquear', 'individual');
    console.log('[Recursos] Payload:', payload);
    await supabase.from('clinic_template_overrides').delete()
      .eq('clinic_id', clinicId).eq('resource_key', r.resource_key);
    const { error } = await supabase.from('clinic_template_overrides').insert(payload);
    if (error) {
      console.error('[Recursos] Erro Supabase:', { message: error.message, details: error.details, code: error.code, hint: error.hint });
      toast.error(`Erro ao salvar: ${error.message}`); return;
    }
    await logPlatformAction({
      action: enabled ? 'resource_override.enable' : 'resource_override.disable',
      target_type: 'prontuario_resource', clinic_id: clinicId,
      metadata: { resource_key: r.resource_key, reason: reason.trim() },
    });
    toast.success(enabled ? 'Recurso liberado.' : 'Recurso bloqueado.');
    load();
  };

  const bulkSection = async (sectionKey: SectionKey, enabled: boolean, scope: 'filtered' | 'selected') => {
    if (!reason.trim()) { toast.error('Informe o motivo antes de alterar em massa.'); return; }
    const def = SECTIONS.find((s) => s.key === sectionKey)!;
    const sectionFiltered = applyFilters(items.filter((i) => def.types.includes(i.resource_type)));
    const list = scope === 'selected'
      ? sectionFiltered.filter((i) => selected[i.resource_key])
      : sectionFiltered;

    console.log('[Recursos] Clínica:', clinicId);
    console.log('[Recursos] Filtro atual:', { globalSearch, specialty, categoryFilter, quickFilter, sectionKey });
    console.log('[Recursos] Itens visíveis:', sectionFiltered.map((i) => i.resource_key));
    console.log('[Recursos] Itens selecionados:', Object.keys(selected).filter((k) => selected[k]));
    console.log('[Recursos] Ação:', enabled ? 'liberar' : 'bloquear', scope);

    if (scope === 'selected' && list.length === 0) {
      toast.error('Selecione ao menos um recurso desta categoria.');
      return;
    }
    if (list.length === 0) { toast.error('Nenhum recurso elegível.'); return; }

    const keys = list
      .map((i) => i.resource_key)
      .filter((k): k is string => typeof k === 'string' && k.length > 0);
    if (keys.length === 0) { toast.error('IDs inválidos na seleção.'); return; }

    const { error: delError } = await supabase
      .from('clinic_template_overrides')
      .delete()
      .eq('clinic_id', clinicId)
      .in('resource_key', keys);
    if (delError) {
      console.error('[BulkAction] delete error:', delError);
      toast.error(`Erro ao limpar overrides: ${delError.message}`);
      return;
    }

    const rows = list.map((r) => ({
      clinic_id: clinicId,
      resource_key: r.resource_key,
      template_id: r.source_id, // pode ser null para abas/funções
      template_kind: r.resource_type,
      enabled,
      reason: reason.trim(),
    }));
    console.log('[BulkAction] payload:', rows);

    const { error } = await supabase.from('clinic_template_overrides').insert(rows);
    if (error) {
      console.error('[BulkAction] insert error:', {
        message: error.message, details: error.details, code: error.code, hint: error.hint,
      });
      toast.error(`Erro ao salvar: ${error.message}${error.hint ? ` (${error.hint})` : ''}`);
      return;
    }

    await logPlatformAction({
      action: enabled ? 'resource_override.bulk_enable' : 'resource_override.bulk_disable',
      target_type: 'prontuario_resource', clinic_id: clinicId,
      metadata: { count: rows.length, section: sectionKey, scope, reason: reason.trim() },
    });
    toast.success(
      enabled
        ? `${rows.length} modelo(s) liberado(s) com sucesso.`
        : `${rows.length} modelo(s) bloqueado(s) com sucesso.`,
    );
    if (scope === 'selected') {
      setSelected((prev) => {
        const next = { ...prev };
        keys.forEach((k) => { delete next[k]; });
        return next;
      });
    }
    load();
  };

  const resetSection = async (sectionKey: SectionKey) => {
    const def = SECTIONS.find((s) => s.key === sectionKey)!;
    const sectionFiltered = applyFilters(items.filter((i) => def.types.includes(i.resource_type)));
    const list = sectionFiltered.filter((i) => selected[i.resource_key]);
    const keys = (list.length > 0 ? list : sectionFiltered).map((i) => i.resource_key);
    if (keys.length === 0) { toast.error('Nenhum recurso para restaurar.'); return; }
    await supabase.from('clinic_template_overrides').delete()
      .eq('clinic_id', clinicId).in('resource_key', keys);
    await logPlatformAction({
      action: 'resource_override.reset', target_type: 'prontuario_resource',
      clinic_id: clinicId, metadata: { count: keys.length, section: sectionKey },
    });
    toast.success('Recursos restaurados ao padrão.');
    load();
  };

  const ResourceCard = ({ r }: { r: Resource }) => {
    const isPadrao = !r.has_override;
    return (
      <div className="group relative flex flex-col rounded-lg border bg-card p-4 text-sm shadow-sm transition hover:shadow-md hover:border-primary/40">
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <Checkbox
            checked={!!selected[r.resource_key]}
            onCheckedChange={(v) => setSelected((s) => ({ ...s, [r.resource_key]: Boolean(v) }))}
          />
        </div>
        <div className="pr-10">
          <div className="font-semibold leading-tight line-clamp-2">{r.title}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-[10px]">{labelSpecialty(r.specialty_slug)}</Badge>
            <Badge variant="outline" className="text-[10px]">{labelType(r.resource_type)}</Badge>
            {isPadrao ? (
              <Badge className="bg-slate-500 hover:bg-slate-500 text-white text-[10px]">Padrão</Badge>
            ) : (
              <Badge className="bg-violet-600 hover:bg-violet-600 text-white text-[10px]">Override</Badge>
            )}
          </div>
          {r.description && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setPreview(r)}>
            <Eye className="h-3.5 w-3.5 mr-1" /> Visualizar
          </Button>
          <div className="flex items-center gap-2">
            <span className={cn('text-[11px] font-medium',
              r.enabled ? 'text-emerald-600' : 'text-muted-foreground')}>
              {r.enabled ? 'Liberado' : 'Bloqueado'}
            </span>
            <Switch checked={r.enabled} onCheckedChange={(v) => writeOne(r, v)} />
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (def: typeof SECTIONS[number]) => {
    const sectionItems = items.filter((i) => def.types.includes(i.resource_type));
    const filtered = applyFilters(sectionItems);
    const selectedInSection = filtered.filter((i) => selected[i.resource_key]).length;
    const hasSelection = selectedInSection > 0;
    return (
      <AccordionContent className="px-4 pb-4 pt-2">
        <p className="text-xs text-muted-foreground mb-3">{def.hint}</p>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="secondary" className="text-[10px]">
            {selectedInSection} selecionado(s) de {filtered.length} visível(is)
          </Badge>
          <Button size="sm" variant="outline" onClick={() => bulkSection(def.key, true, 'filtered')} disabled={filtered.length === 0}>Liberar todos visíveis</Button>
          <Button size="sm" variant="outline" onClick={() => bulkSection(def.key, false, 'filtered')} disabled={filtered.length === 0}>Bloquear todos visíveis</Button>
          <Button size="sm" variant="outline" onClick={() => bulkSection(def.key, true, 'selected')} disabled={!hasSelection}>Liberar selecionados</Button>
          <Button size="sm" variant="outline" onClick={() => bulkSection(def.key, false, 'selected')} disabled={!hasSelection}>Bloquear selecionados</Button>
          <Button size="sm" variant="ghost" onClick={() => resetSection(def.key)} disabled={filtered.length === 0}>Restaurar padrão</Button>
          {hasSelection && (
            <Button size="sm" variant="ghost" onClick={() => {
              const next = { ...selected };
              filtered.forEach((i) => { delete next[i.resource_key]; });
              setSelected(next);
            }}>Limpar seleção</Button>
          )}
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum recurso encontrado com os filtros atuais.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((r) => <ResourceCard key={r.resource_key} r={r} />)}
          </div>
        )}
      </AccordionContent>
    );
  };

  const SummaryCard = ({ icon: Icon, label, value, tone }: {
    icon: typeof Boxes; label: string; value: number | string; tone?: string;
  }) => (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-md', tone ?? 'bg-muted')}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold leading-none">{value}</div>
      </div>
    </div>
  );

  const quickFilters: { key: typeof quickFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'enabled', label: 'Liberados' },
    { key: 'disabled', label: 'Bloqueados' },
    { key: 'padrao', label: 'Padrão' },
    { key: 'override', label: 'Override' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Library className="h-4 w-4" /> Catálogo de Recursos da Clínica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard icon={Boxes} label="Disponíveis" value={summary.total + (modulesSummary?.total ?? 0)} />
          <SummaryCard icon={CheckCircle2} label="Liberados" value={summary.enabled + (modulesSummary?.enabled ?? 0)} tone="bg-emerald-100 text-emerald-700" />
          <SummaryCard icon={XCircle} label="Bloqueados" value={summary.disabled + ((modulesSummary?.total ?? 0) - (modulesSummary?.enabled ?? 0))} tone="bg-rose-100 text-rose-700" />
          <SummaryCard icon={Sparkles} label="Modelos" value={summary.templates} tone="bg-violet-100 text-violet-700" />
          <SummaryCard icon={Lock} label="Funcionalidades" value={summary.functionalities} tone="bg-sky-100 text-sky-700" />
        </div>

        {/* Busca global + filtros rápidos */}
        <div className="grid gap-2 md:grid-cols-[1fr_200px_200px]">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              className="pl-9 h-10"
              placeholder="Pesquisar em todas as categorias..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Especialidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas especialidades</SelectItem>
              {allSpecialties.map((sp) => (
                <SelectItem key={sp} value={sp}>{labelSpecialty(sp === 'global' ? null : sp)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {Array.from(new Set(items.map((i) => i.resource_type))).sort().map((t) => (
                <SelectItem key={t} value={t}>{labelType(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickFilters.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={quickFilter === f.key ? 'default' : 'outline'}
              className="h-7 px-3 text-xs"
              onClick={() => setQuickFilter(f.key)}
            >{f.label}</Button>
          ))}
        </div>

        {/* Motivo obrigatório */}
        <Textarea
          rows={1}
          placeholder="Motivo (obrigatório para qualquer alteração)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {/* Accordion único de categorias (colapsado por padrão) */}
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="space-y-2">
            <AccordionItem value="modulos" className="border rounded-lg bg-background">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex flex-1 items-center justify-between pr-2">
                  <span className="font-semibold text-sm">Módulos do Sistema</span>
                  {modulesSummary && (
                    <Badge variant="secondary" className="text-[10px]">
                      {modulesSummary.enabled}/{modulesSummary.total} ativos
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2">{modulesContent}</AccordionContent>
            </AccordionItem>

            {SECTIONS.map((def) => {
              const sectionItems = items.filter((i) => def.types.includes(i.resource_type));
              const filtered = applyFilters(sectionItems);
              return (
                <AccordionItem key={def.key} value={def.key} className="border rounded-lg bg-background">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex flex-1 items-center justify-between pr-2">
                      <span className="font-semibold text-sm">{def.label}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{filtered.length} de {sectionItems.length}</Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  {renderSection(def)}
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* Drawer lateral de preview */}
        <Sheet open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{preview?.title}</SheetTitle>
              <SheetDescription>
                {labelSpecialty(preview?.specialty_slug ?? null)} • {labelType(preview?.resource_type ?? '')}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-4 text-sm">
              {preview?.description && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Descrição</div>
                  <p>{preview.description}</p>
                </div>
              )}
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">Status</div>
                <Badge className={preview?.enabled ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-rose-600 hover:bg-rose-600'}>
                  {preview?.enabled ? 'Liberado' : 'Bloqueado'}
                </Badge>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">Prévia / Campos</div>
                <pre className="rounded border bg-muted/30 p-3 whitespace-pre-wrap break-words text-xs max-h-80 overflow-auto">
{JSON.stringify(preview?.preview_payload ?? { info: 'Sem prévia estruturada.' }, null, 2)}
                </pre>
              </div>
              <div className="text-xs text-muted-foreground">
                Identificador: <code>{preview?.resource_key}</code>
              </div>
            </div>
            {preview && (
              <SheetFooter className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => { writeOne(preview, false); setPreview(null); }}
                >Bloquear</Button>
                <Button
                  onClick={() => { writeOne(preview, true); setPreview(null); }}
                >Liberar</Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}
