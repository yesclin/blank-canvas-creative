/**
 * Super Admin > Recursos da Clínica > Biblioteca
 * Layout unificado: TODOS os departamentos usam o mesmo card
 * (padrão "Módulos do Sistema") com Nome + Descrição + Toggle Ativo/Inativo.
 * Toggle abre um modal de auditoria obrigatório (motivo + data efetiva +
 * expiração opcional). A alteração só é salva após a confirmação.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui/accordion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Loader2, Library, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logPlatformAction } from '@/lib/superAdminAudit';
import { cn } from '@/lib/utils';
import type { Json } from '@/integrations/supabase/types';

interface Resource {
  resource_key: string;
  resource_type: string;
  specialty_slug: string | null;
  title: string;
  description: string | null;
  source_table: string | null;
  source_id: string | null;
  preview_payload: Json | null;
  enabled: boolean;
  has_override: boolean;
  override_reason: string | null;
}

interface ClinicResourceAuditRow extends AuditMeta {
  resource_key: string;
}

interface AuditMeta {
  reason: string | null;
  updated_at: string | null;
  updated_by: string | null;
  expires_at: string | null;
  effective_at: string | null;
}

const ANAMNESIS_RESOURCE_TYPES = new Set(['anamnese', 'anamnesis_model']);
const GENERIC_SPECIALTY_SLUGS = new Set([
  'geral',
  'other_specialty',
  'outras_especialidades',
  'atendimento_geral',
  'custom',
]);

const normalizeResourceType = (type: string) => (
  ANAMNESIS_RESOURCE_TYPES.has(type) ? 'anamnesis_model' : type
);

const extractUuidFromResourceKey = (key: string | null | undefined) => {
  if (!key) return null;
  const match = key.match(/([0-9a-f-]{36})$/i);
  return match?.[1] ?? null;
};

type SectionKey =
  | 'funcionalidades' | 'anamnese' | 'evolucao' | 'plano' | 'documentos'
  | 'escalas' | 'procedimentos' | 'especialidades' | 'alertas'
  | 'anexos' | 'historico';

const SECTIONS: { key: SectionKey; label: string; types: string[] }[] = [
  { key: 'funcionalidades', label: 'Funcionalidades do Prontuário', types: ['aba', 'funcao'] },
  { key: 'anamnese',        label: 'Modelos de Anamnese',           types: ['anamnese', 'anamnesis_model'] },
  { key: 'evolucao',        label: 'Modelos de Evolução',           types: ['evolution', 'evolucao'] },
  { key: 'plano',           label: 'Modelos de Plano / Conduta',    types: ['custom_form', 'plano', 'conduta'] },
  { key: 'documentos',      label: 'Modelos de Documentos',         types: ['documento', 'termo', 'receita', 'atestado'] },
  { key: 'escalas',         label: 'Escalas Clínicas',              types: ['escala', 'scale'] },
  { key: 'procedimentos',   label: 'Procedimentos',                 types: ['procedimento', 'procedure'] },
  { key: 'especialidades',  label: 'Especialidades',                types: ['especialidade', 'specialty'] },
  { key: 'alertas',         label: 'Alertas',                       types: ['alerta', 'alert'] },
  { key: 'anexos',          label: 'Anexos',                        types: ['anexo', 'attachment'] },
  { key: 'historico',       label: 'Histórico',                     types: ['historico', 'history'] },
];

const SPECIALTY_LABEL: Record<string, string> = {
  other_specialty: 'Atendimento Geral', aesthetics: 'Estética', psychology: 'Psicologia',
  dentistry: 'Odontologia', nutrition: 'Nutrição', physiotherapy: 'Fisioterapia',
  pediatrics: 'Pediatria', dermatology: 'Dermatologia', chiropractic: 'Quiropraxia',
  medical_general: 'Clínica Médica', pilates: 'Pilates',
};
const labelSpecialty = (s: string | null) => (s ? SPECIALTY_LABEL[s] ?? s : 'Global');

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('pt-BR'); } catch { return iso; }
};
const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface Props {
  clinicId: string;
  modulesContent: ReactNode;
  modulesSummary?: { total: number; enabled: number };
}

interface PendingChange {
  resource: Resource;
  nextEnabled: boolean;
}

function DetailsPopover({ audit }: { audit: AuditMeta | undefined }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" title="Detalhes / Histórico">
          <Info className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-xs space-y-1.5" align="end">
        <div className="font-semibold text-sm">Detalhes da liberação</div>
        {audit ? (
          <>
            <div><span className="text-muted-foreground">Última alteração:</span> {fmtDate(audit.updated_at)}</div>
            <div><span className="text-muted-foreground">Efetiva em:</span> {fmtDate(audit.effective_at)}</div>
            <div><span className="text-muted-foreground">Expira em:</span> {audit.expires_at ? fmtDate(audit.expires_at) : 'Sem expiração'}</div>
            <div><span className="text-muted-foreground">Responsável:</span> {audit.updated_by ? <code className="text-[10px]">{audit.updated_by.slice(0, 8)}…</code> : '—'}</div>
            <div>
              <div className="text-muted-foreground">Motivo:</div>
              <div className="rounded border bg-muted/30 p-2 mt-1 whitespace-pre-wrap">{audit.reason || '—'}</div>
            </div>
          </>
        ) : (
          <div className="text-muted-foreground">Sem registro manual — usando padrão do sistema.</div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ResourceCard({
  r, audit, onRequestToggle,
}: {
  r: Resource;
  audit: AuditMeta | undefined;
  onRequestToggle: (nextEnabled: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-card p-4 shadow-sm transition hover:shadow-md">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-semibold text-sm leading-tight truncate">{r.title}</div>
          <Badge
            className={cn(
              'text-[10px] shrink-0',
              r.enabled
                ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted',
            )}
          >
            {r.enabled ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {r.description || labelSpecialty(r.specialty_slug)}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <DetailsPopover audit={audit} />
        <Switch checked={r.enabled} onCheckedChange={onRequestToggle} />
      </div>
    </div>
  );
}

export function ProntuarioLibrarySection({ clinicId, modulesContent, modulesSummary }: Props) {
  const [items, setItems] = useState<Resource[]>([]);
  const [auditByKey, setAuditByKey] = useState<Record<string, AuditMeta>>({});
  const [loading, setLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [openSections, setOpenSections] = useState<string[]>([]);

  // Audit modal state
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [reason, setReason] = useState('');
  const [effectiveAt, setEffectiveAt] = useState(() => toLocalInput(new Date()));
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    const [catalog, overrides] = await Promise.all([
      supabase.rpc('get_prontuario_resource_catalog', { p_clinic_id: clinicId }),
      supabase
        .from('clinic_resources')
        .select('resource_key, reason, updated_at, updated_by, expires_at, effective_at')
        .eq('clinic_id', clinicId),
    ]);
    if (catalog.error) { console.error(catalog.error); toast.error('Erro ao carregar a biblioteca.'); }
    setItems((catalog.data ?? []) as Resource[]);
    const map: Record<string, AuditMeta> = {};
    ((overrides.data ?? []) as ClinicResourceAuditRow[]).forEach((row) => {
      map[row.resource_key] = {
        reason: row.reason, updated_at: row.updated_at, updated_by: row.updated_by,
        expires_at: row.expires_at, effective_at: row.effective_at,
      };
    });
    setAuditByKey(map);
    setLoading(false);
  }, [clinicId]);
  useEffect(() => { void load(); }, [load]);

  const applyFilter = (list: Resource[]) => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((i) =>
      i.title.toLowerCase().includes(q) ||
      (i.description ?? '').toLowerCase().includes(q),
    );
  };

  useEffect(() => {
    if (!globalSearch.trim()) return;
    const matches = SECTIONS
      .filter((s) => applyFilter(items.filter((i) => s.types.includes(i.resource_type))).length > 0)
      .map((s) => s.key);
    setOpenSections((prev) => Array.from(new Set([...prev, ...matches])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSearch]);

  const requestToggle = (r: Resource, nextEnabled: boolean) => {
    if (!clinicId) {
      toast.error('Selecione uma clínica antes de alterar recursos.');
      return;
    }
    setPending({ resource: r, nextEnabled });
    setReason('');
    setEffectiveAt(toLocalInput(new Date()));
    setExpiresAt('');
  };

  const resolveClinicSpecialtyId = async (r: Resource): Promise<string | null> => {
    const normalizedResourceType = normalizeResourceType(r.resource_type);
    if (!r.specialty_slug && !ANAMNESIS_RESOURCE_TYPES.has(r.resource_type)) return null;

    const { data: resolvedId, error: rpcError } = await supabase.rpc(
      'resolve_clinic_resource_specialty_id',
      {
        p_clinic_id: clinicId,
        p_resource_specialty_slug: r.specialty_slug,
        p_resource_type: normalizedResourceType,
      },
    );

    if (!rpcError && resolvedId) return resolvedId;
    if (rpcError) console.error('[Recursos] erro ao resolver especialidade via RPC:', rpcError);

    const { data, error } = await supabase
      .from('specialties')
      .select('id, slug, is_active')
      .eq('clinic_id', clinicId);

    if (error) {
      console.error('[Recursos] erro ao resolver especialidade:', error);
      return null;
    }

    const specialties = data ?? [];
    const direct = specialties.find((s) => s.slug === r.specialty_slug);
    if (direct?.id) {
      // Reativar se estiver inativa (Super Admin está criando o vínculo)
      if (!direct.is_active) {
        await supabase.from('specialties').update({ is_active: true }).eq('id', direct.id);
      }
      return direct.id;
    }

    if (ANAMNESIS_RESOURCE_TYPES.has(r.resource_type) && GENERIC_SPECIALTY_SLUGS.has(r.specialty_slug)) {
      const generic = specialties.find((s) => GENERIC_SPECIALTY_SLUGS.has(s.slug ?? ''));
      if (generic?.id) {
        if (!generic.is_active) {
          await supabase.from('specialties').update({ is_active: true }).eq('id', generic.id);
        }
        return generic.id;
      }
    }

    // Auto-vincular: criar a especialidade nesta clínica
    const { data: created, error: insertError } = await supabase
      .from('specialties')
      .insert({
        clinic_id: clinicId,
        name: labelSpecialty(r.specialty_slug) || r.specialty_slug,
        slug: r.specialty_slug,
        is_active: true,
      })
      .select('id')
      .maybeSingle();

    if (insertError) {
      console.error('[Recursos] erro ao criar especialidade:', insertError);
      return null;
    }
    return created?.id ?? null;
  };

  const confirmChange = async () => {
    if (!pending) return;
    if (!reason.trim()) { toast.error('Informe o motivo da alteração.'); return; }
    setSaving(true);
    const { resource: r, nextEnabled } = pending;
    const previous = r.enabled;
    const normalizedResourceType = normalizeResourceType(r.resource_type);
    const resourceId = r.source_id ?? extractUuidFromResourceKey(r.resource_key);
    const specialtyId = await resolveClinicSpecialtyId(r);
    // Super Admin pode liberar mesmo sem especialidade vinculada; não bloquear.

    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id ?? null;

    if (import.meta.env.DEV && normalizedResourceType === 'anamnesis_model') {
      console.log('[Recursos][Anamnese] salvando liberação manual', {
        clinic_id: clinicId,
        specialty_id_atual: specialtyId,
        base_specialty_id: specialtyId,
        resource_type_consultado: normalizedResourceType,
        ids_dos_modelos_liberados_encontrados: resourceId ? [resourceId] : [],
        quantidade_de_modelos_carregados: resourceId ? 1 : 0,
        resource_key: r.resource_key,
        enabled: nextEnabled,
      });
    }

    const { error } = await supabase
      .from('clinic_resources')
      .upsert({
        clinic_id: clinicId,
        resource_type: normalizedResourceType,
        resource_key: r.resource_key,
        resource_id: resourceId,
        specialty_id: specialtyId,
        specialty_slug: r.specialty_slug,
        enabled: nextEnabled,
        reason: reason.trim(),
        effective_at: new Date(effectiveAt).toISOString(),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        updated_by: userId,
      }, { onConflict: 'clinic_id,resource_type,resource_key' });

    if (error) {
      console.error('[Recursos] erro:', error);
      toast.error(`Erro ao salvar: ${error.message}`);
      setSaving(false);
      return;
    }

    await logPlatformAction({
      action: nextEnabled ? 'clinic_resource.enable' : 'clinic_resource.disable',
      target_type: 'clinic_resource',
      clinic_id: clinicId,
      metadata: {
        resource_key: r.resource_key,
        resource_type: normalizedResourceType,
        resource_id: resourceId,
        specialty_id: specialtyId,
        specialty_slug: r.specialty_slug,
        previous_status: previous ? 'active' : 'inactive',
        new_status: nextEnabled ? 'active' : 'inactive',
        reason: reason.trim(),
        effective_at: new Date(effectiveAt).toISOString(),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      },
    });

    toast.success(nextEnabled ? 'Recurso liberado.' : 'Recurso bloqueado.');
    setSaving(false);
    setPending(null);
    load();
  };

  const sectionCounts = useMemo(() => {
    const map: Record<string, { total: number; enabled: number }> = {};
    SECTIONS.forEach((s) => {
      const list = items.filter((i) => s.types.includes(i.resource_type));
      map[s.key] = { total: list.length, enabled: list.filter((i) => i.enabled).length };
    });
    return map;
  }, [items]);

  const isEnabling = pending?.nextEnabled === true;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Library className="h-4 w-4" /> Recursos da Clínica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            className="pl-9 h-10"
            placeholder="Pesquisar em todos os departamentos..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
        </div>

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
              const filtered = applyFilter(sectionItems);
              const counts = sectionCounts[def.key];
              return (
                <AccordionItem key={def.key} value={def.key} className="border rounded-lg bg-background">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex flex-1 items-center justify-between pr-2">
                      <span className="font-semibold text-sm">{def.label}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {counts.enabled}/{counts.total} ativos
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2">
                    {filtered.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {sectionItems.length === 0
                          ? 'Nenhum recurso disponível neste departamento.'
                          : 'Nenhum resultado para a busca.'}
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((r) => (
                          <ResourceCard
                            key={r.resource_key}
                            r={r}
                            audit={auditByKey[r.resource_key]}
                            onRequestToggle={(v) => requestToggle(r, v)}
                          />
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* Modal de auditoria obrigatório */}
        <Dialog open={!!pending} onOpenChange={(o) => { if (!o && !saving) setPending(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEnabling ? 'Liberar recurso manualmente' : 'Bloquear recurso'}
              </DialogTitle>
              <DialogDescription>
                {pending?.resource.title} — {labelSpecialty(pending?.resource.specialty_slug ?? null)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Data da alteração</Label>
                  <Input
                    type="datetime-local"
                    value={effectiveAt}
                    onChange={(e) => setEffectiveAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Expira em {isEnabling ? '(opcional)' : ''}
                  </Label>
                  <Input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    disabled={!isEnabling}
                  />
                </div>
              </div>

              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {isEnabling ? 'Liberar recurso manualmente' : 'Bloquear recurso manualmente'}
                  </div>
                  <div className="text-muted-foreground">
                    A liberação manual prevalece sobre o padrão até expirar.
                  </div>
                </div>
                <Switch checked={isEnabling} disabled />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">
                  Motivo <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  rows={3}
                  placeholder="Ex.: cortesia comercial, teste de recurso..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPending(null)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={confirmChange} disabled={saving || !reason.trim()}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar liberação manual
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
