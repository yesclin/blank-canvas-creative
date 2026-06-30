/**
 * Super Admin > Recursos da Clínica > Prontuários
 * Liberar/bloquear modelos de prontuário (sistema) por clínica.
 */
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, ChevronDown, Search, Loader2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logPlatformAction } from '@/lib/superAdminAudit';

interface CatalogItem {
  template_id: string;
  template_kind: 'medical_record' | 'anamnesis';
  title: string;
  specialty_id: string | null;
  specialty_slug: string | null;
  specialty_name: string;
  is_active: boolean;
}
interface OverrideRow {
  id: string;
  template_id: string;
  template_kind: string;
  specialty_id: string | null;
  enabled: boolean;
  reason: string | null;
  expires_at: string | null;
}

const isExpired = (d: string | null) => !!d && new Date(d).getTime() <= Date.now();

export function TemplateOverridesSection({ clinicId }: { clinicId: string }) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const load = async () => {
    if (!clinicId) return;
    setLoading(true);
    const [{ data: cat, error: ce }, { data: ov, error: oe }] = await Promise.all([
      supabase.rpc('get_super_admin_template_catalog', { p_clinic_id: clinicId }),
      supabase
        .from('clinic_template_overrides')
        .select('id, template_id, template_kind, specialty_id, enabled, reason, expires_at')
        .eq('clinic_id', clinicId),
    ]);
    if (ce) console.error(ce);
    if (oe) console.error(oe);
    setCatalog((cat ?? []) as CatalogItem[]);
    setOverrides((ov ?? []) as OverrideRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [clinicId]);

  const overrideByTpl = useMemo(() => {
    const m: Record<string, OverrideRow> = {};
    overrides.forEach((o) => { if (!isExpired(o.expires_at)) m[o.template_id] = o; });
    return m;
  }, [overrides]);

  const isEnabled = (t: CatalogItem) => {
    const ov = overrideByTpl[t.template_id];
    if (ov) return ov.enabled;
    return true; // padrão: liberado
  };

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? catalog.filter((t) => t.title.toLowerCase().includes(q) || t.specialty_name.toLowerCase().includes(q))
      : catalog;
    const map = new Map<string, { name: string; items: CatalogItem[] }>();
    filtered.forEach((t) => {
      const key = t.specialty_id ?? '__none__';
      if (!map.has(key)) map.set(key, { name: t.specialty_name, items: [] });
      map.get(key)!.items.push(t);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [catalog, search]);

  // Auto-expandir grupos ao pesquisar
  useEffect(() => {
    if (search.trim()) {
      const next: Record<string, boolean> = {};
      grouped.forEach(([k]) => { next[k] = true; });
      setOpenGroups(next);
    }
  }, [search, grouped]);

  const writeOverride = async (t: CatalogItem, enabled: boolean) => {
    if (!reason.trim()) { toast.error('Informe o motivo antes de alterar.'); return; }
    const payload = {
      clinic_id: clinicId,
      template_id: t.template_id,
      template_kind: t.template_kind,
      specialty_id: t.specialty_id,
      enabled,
      reason: reason.trim(),
    };
    // upsert manual: delete + insert (UNIQUE em clinic+template)
    await supabase.from('clinic_template_overrides').delete()
      .eq('clinic_id', clinicId).eq('template_id', t.template_id);
    const { error } = await supabase.from('clinic_template_overrides').insert(payload);
    if (error) { toast.error('Erro ao salvar.'); console.error(error); return; }
    await logPlatformAction({
      action: enabled ? 'template_override.enable' : 'template_override.disable',
      target_type: 'clinic_template_override',
      clinic_id: clinicId,
      metadata: payload,
    });
    toast.success(enabled ? 'Modelo liberado.' : 'Modelo bloqueado.');
    load();
  };

  const bulk = async (items: CatalogItem[], enabled: boolean) => {
    if (!reason.trim()) { toast.error('Informe o motivo antes de alterar em massa.'); return; }
    const ids = items.map((i) => i.template_id);
    await supabase.from('clinic_template_overrides').delete()
      .eq('clinic_id', clinicId).in('template_id', ids);
    const rows = items.map((t) => ({
      clinic_id: clinicId,
      template_id: t.template_id,
      template_kind: t.template_kind,
      specialty_id: t.specialty_id,
      enabled,
      reason: reason.trim(),
    }));
    const { error } = await supabase.from('clinic_template_overrides').insert(rows);
    if (error) { toast.error('Erro ao salvar em massa.'); console.error(error); return; }
    await logPlatformAction({
      action: enabled ? 'template_override.bulk_enable' : 'template_override.bulk_disable',
      target_type: 'clinic_template_override',
      clinic_id: clinicId,
      metadata: { count: rows.length, reason: reason.trim() },
    });
    toast.success(`${rows.length} modelos atualizados.`);
    load();
  };

  const resetGroup = async (items: CatalogItem[]) => {
    const ids = items.map((i) => i.template_id);
    await supabase.from('clinic_template_overrides').delete()
      .eq('clinic_id', clinicId).in('template_id', ids);
    await logPlatformAction({
      action: 'template_override.reset_group',
      target_type: 'clinic_template_override',
      clinic_id: clinicId,
      metadata: { count: ids.length },
    });
    toast.success('Grupo restaurado ao padrão.');
    load();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" /> Prontuários — Modelos liberados para a clínica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Pesquisar modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Textarea
            rows={1}
            placeholder="Motivo (obrigatório para qualquer alteração)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 text-center">
            Nenhum modelo de sistema encontrado para esta clínica.
          </p>
        ) : (
          <div className="space-y-2">
            {grouped.map(([key, group]) => {
              const open = openGroups[key] ?? false;
              const enabledCount = group.items.filter(isEnabled).length;
              return (
                <Collapsible
                  key={key}
                  open={open}
                  onOpenChange={(v) => setOpenGroups((s) => ({ ...s, [key]: v }))}
                >
                  <div className="flex items-center gap-2 rounded border bg-muted/30 px-3 py-2">
                    <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-medium">{group.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {enabledCount}/{group.items.length} liberados
                      </Badge>
                    </CollapsibleTrigger>
                    <Button size="sm" variant="outline" onClick={() => bulk(group.items, true)}>
                      Liberar todos
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => bulk(group.items, false)}>
                      Bloquear todos
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => resetGroup(group.items)}>
                      Padrão
                    </Button>
                  </div>
                  <CollapsibleContent>
                    <div className="grid gap-1 px-3 py-2 md:grid-cols-2">
                      {group.items.map((t) => {
                        const ov = overrideByTpl[t.template_id];
                        const enabled = isEnabled(t);
                        return (
                          <div
                            key={t.template_id}
                            className="flex items-center justify-between gap-2 rounded border p-2 text-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium">{t.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {t.template_kind === 'anamnesis' ? 'Anamnese' : 'Prontuário'}
                                {ov ? ' • override ativo' : ' • padrão do plano'}
                              </div>
                            </div>
                            <Switch
                              checked={enabled}
                              onCheckedChange={(v) => writeOverride(t, v)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
