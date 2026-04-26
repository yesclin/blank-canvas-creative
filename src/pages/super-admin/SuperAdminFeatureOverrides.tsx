/**
 * Super Admin > Recursos da Clínica
 * --------------------------------------------------
 * Gerencia overrides manuais de features por clínica
 * (tabela clinic_feature_overrides). O override sempre
 * prevalece sobre a flag do plano enquanto não expirar.
 *
 * IMPORTANTE: Recursos clínicos próprios de uma especialidade
 * (odontograma, mapa facial) NÃO entram aqui — são liberados
 * pela especialidade ativa da clínica.
 */
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logPlatformAction } from '@/lib/superAdminAudit';

/**
 * Recursos elegíveis para override.
 * Os valores são exatamente como armazenados em
 * clinic_feature_overrides.feature_key (sem prefixo `feature_`)
 * — é a chave usada pela view clinic_effective_features.
 */
const OVERRIDE_FEATURES: Array<{ key: string; label: string; planFlag: string }> = [
  { key: 'whatsapp',         label: 'WhatsApp',             planFlag: 'feature_whatsapp' },
  { key: 'teleconsulta',     label: 'Teleconsulta',         planFlag: 'feature_teleconsulta' },
  { key: 'crm',              label: 'CRM Comercial',        planFlag: 'feature_crm' },
  { key: 'marketing',        label: 'Marketing',            planFlag: 'feature_marketing' },
  { key: 'automations',      label: 'Automações',           planFlag: 'feature_automations' },
  { key: 'inventory',        label: 'Estoque',              planFlag: 'feature_inventory' },
  { key: 'insurances',       label: 'Convênios',            planFlag: 'feature_insurances' },
  { key: 'advanced_reports', label: 'Relatórios avançados', planFlag: 'feature_advanced_reports' },
  { key: 'audit',            label: 'Auditoria',            planFlag: 'feature_audit' },
  { key: 'priority_support', label: 'Suporte prioritário',  planFlag: 'feature_priority_support' },
];

interface ClinicOption {
  id: string;
  name: string;
}

interface PlanInfo {
  plan_name: string | null;
  plan_slug: string | null;
  flags: Record<string, boolean>;
}

interface Override {
  id: string;
  feature_key: string;
  enabled: boolean;
  reason: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function SuperAdminFeatureOverrides() {
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [clinicId, setClinicId] = useState<string>('');
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // formulário de novo/edit override
  const [draftKey, setDraftKey] = useState<string>(OVERRIDE_FEATURES[0].key);
  const [draftEnabled, setDraftEnabled] = useState(true);
  const [draftReason, setDraftReason] = useState('');
  const [draftExpires, setDraftExpires] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingClinics(true);
      const { data } = await supabase
        .from('clinics')
        .select('id, name')
        .order('name');
      setClinics(data ?? []);
      setLoadingClinics(false);
    })();
  }, []);

  const loadDetails = async (id: string) => {
    if (!id) {
      setPlan(null);
      setOverrides([]);
      return;
    }
    setLoadingDetails(true);
    const [{ data: eff }, { data: ovs }] = await Promise.all([
      supabase
        .from('clinic_effective_features')
        .select('*')
        .eq('clinic_id', id)
        .maybeSingle(),
      supabase
        .from('clinic_feature_overrides')
        .select('id, feature_key, enabled, reason, expires_at, created_at')
        .eq('clinic_id', id)
        .order('created_at', { ascending: false }),
    ]);

    if (eff) {
      const flags: Record<string, boolean> = {};
      OVERRIDE_FEATURES.forEach((f) => {
        flags[f.planFlag] = Boolean((eff as any)[f.planFlag]);
      });
      setPlan({
        plan_name: (eff as any).plan_name ?? null,
        plan_slug: (eff as any).plan_slug ?? null,
        flags,
      });
    } else {
      setPlan({ plan_name: null, plan_slug: null, flags: {} });
    }

    setOverrides((ovs ?? []) as Override[]);
    setLoadingDetails(false);
  };

  useEffect(() => {
    loadDetails(clinicId);
  }, [clinicId]);

  const overrideByKey = useMemo(() => {
    const m: Record<string, Override | undefined> = {};
    overrides.forEach((o) => {
      // pega o mais recente por feature_key (já está ordenado desc)
      if (!m[o.feature_key]) m[o.feature_key] = o;
    });
    return m;
  }, [overrides]);

  const saveOverride = async () => {
    if (!clinicId) {
      toast.error('Selecione uma clínica.');
      return;
    }
    setSaving(true);
    const payload = {
      clinic_id: clinicId,
      feature_key: draftKey,
      enabled: draftEnabled,
      reason: draftReason.trim() || null,
      expires_at: draftExpires ? new Date(draftExpires).toISOString() : null,
    };

    // Upsert manual: remove qualquer override antigo dessa feature
    // antes de inserir o novo, para evitar duplicidade na view.
    await supabase
      .from('clinic_feature_overrides')
      .delete()
      .eq('clinic_id', clinicId)
      .eq('feature_key', draftKey);

    const { error } = await supabase
      .from('clinic_feature_overrides')
      .insert(payload);

    setSaving(false);

    if (error) {
      console.error(error);
      toast.error('Erro ao salvar override.');
      return;
    }

    await logPlatformAction({
      action: draftEnabled ? 'feature_override.enable' : 'feature_override.disable',
      target_type: 'clinic_feature_override',
      clinic_id: clinicId,
      metadata: payload,
    });

    toast.success('Override salvo.');
    setDraftReason('');
    setDraftExpires('');
    loadDetails(clinicId);
  };

  const removeOverride = async (o: Override) => {
    const { error } = await supabase
      .from('clinic_feature_overrides')
      .delete()
      .eq('id', o.id);

    if (error) {
      toast.error('Erro ao remover override.');
      return;
    }

    await logPlatformAction({
      action: 'feature_override.remove',
      target_type: 'clinic_feature_override',
      target_id: o.id,
      clinic_id: clinicId,
      metadata: { feature_key: o.feature_key },
    });

    toast.success('Override removido. Sistema voltou ao plano original.');
    loadDetails(clinicId);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recursos da Clínica</h1>
        <p className="text-sm text-muted-foreground">
          Liberar ou bloquear recursos manualmente para uma clínica específica
          (sobrepõe o plano).
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Selecionar clínica</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={clinicId} onValueChange={setClinicId} disabled={loadingClinics}>
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder={loadingClinics ? 'Carregando...' : 'Escolha uma clínica'} />
            </SelectTrigger>
            <SelectContent>
              {clinics.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {clinicId && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Plano atual
                {plan?.plan_name ? (
                  <Badge variant="secondary">{plan.plan_name}</Badge>
                ) : (
                  <Badge variant="outline">Sem assinatura</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDetails ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {OVERRIDE_FEATURES.map((f) => {
                    const planValue = plan?.flags[f.planFlag] ?? false;
                    const ov = overrideByKey[f.key];
                    const effective = ov ? ov.enabled : planValue;
                    return (
                      <div
                        key={f.key}
                        className="flex items-center justify-between rounded border bg-card p-2 text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{f.label}</span>
                          <span className="text-xs text-muted-foreground">
                            Plano: {planValue ? 'liberado' : 'bloqueado'}
                            {ov && (
                              <> · Override: {ov.enabled ? 'liberado' : 'bloqueado'}</>
                            )}
                          </span>
                        </div>
                        <Badge variant={effective ? 'default' : 'outline'}>
                          {effective ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Criar / atualizar override</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Recurso</Label>
                  <Select value={draftKey} onValueChange={setDraftKey}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OVERRIDE_FEATURES.map((f) => (
                        <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Expira em (opcional)</Label>
                  <Input
                    type="datetime-local"
                    value={draftExpires}
                    onChange={(e) => setDraftExpires(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {draftEnabled ? 'Liberar recurso manualmente' : 'Bloquear recurso manualmente'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    O override prevalece sobre o plano até expirar.
                  </p>
                </div>
                <Switch checked={draftEnabled} onCheckedChange={setDraftEnabled} />
              </div>

              <div className="space-y-1">
                <Label>Motivo (auditoria)</Label>
                <Textarea
                  rows={2}
                  value={draftReason}
                  onChange={(e) => setDraftReason(e.target.value)}
                  placeholder="Ex.: cortesia comercial, teste de feature, suporte premium..."
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={saveOverride} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar override
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Overrides ativos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingDetails ? (
                <div className="p-6 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : overrides.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">
                  Nenhum override. A clínica está apenas com o plano.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Expira</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overrides.map((o) => {
                      const meta = OVERRIDE_FEATURES.find((f) => f.key === o.feature_key);
                      return (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium">
                            {meta?.label ?? o.feature_key}
                          </TableCell>
                          <TableCell>
                            <Badge variant={o.enabled ? 'default' : 'outline'}>
                              {o.enabled ? 'Liberado' : 'Bloqueado'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {o.reason ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {o.expires_at
                              ? new Date(o.expires_at).toLocaleString('pt-BR')
                              : 'Sem expiração'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeOverride(o)}
                              aria-label="Remover override"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
