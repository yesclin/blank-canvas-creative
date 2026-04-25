import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Edit2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logPlatformAction } from '@/lib/superAdminAudit';

const FEATURES: Array<{ key: string; label: string }> = [
  { key: 'feature_whatsapp', label: 'WhatsApp' },
  { key: 'feature_teleconsulta', label: 'Teleconsulta' },
  { key: 'feature_crm', label: 'CRM' },
  { key: 'feature_marketing', label: 'Marketing' },
  { key: 'feature_automations', label: 'Automações' },
  { key: 'feature_inventory', label: 'Estoque' },
  { key: 'feature_insurances', label: 'Convênios' },
  { key: 'feature_advanced_reports', label: 'Relatórios avançados' },
  { key: 'feature_audit', label: 'Auditoria' },
  { key: 'feature_odontogram', label: 'Odontograma' },
  { key: 'feature_facial_map', label: 'Mapa facial' },
  { key: 'feature_priority_support', label: 'Suporte prioritário' },
];

const LIMITS: Array<{ key: string; label: string }> = [
  { key: 'max_professionals', label: 'Máx. profissionais' },
  { key: 'max_patients', label: 'Máx. pacientes' },
  { key: 'max_specialties', label: 'Máx. especialidades' },
  { key: 'max_appointments_monthly', label: 'Máx. agendamentos/mês' },
  { key: 'max_whatsapp_instances', label: 'Máx. instâncias WhatsApp' },
];

const emptyPlan = () => ({
  name: '', slug: '', description: '',
  price_monthly: 0, price_yearly: 0,
  max_professionals: null, max_patients: null, max_specialties: null,
  max_appointments_monthly: null, max_whatsapp_instances: 1,
  is_active: true,
  ...Object.fromEntries(FEATURES.map(f => [f.key, false])),
} as any);

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('subscription_plans').select('*').order('sort_order');
    setPlans(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.name || !editing.slug) { toast.error('Nome e slug são obrigatórios.'); return; }
    setSaving(true);
    const payload = { ...editing };
    LIMITS.forEach(({ key }) => { if (payload[key] === '' || payload[key] === undefined) payload[key] = null; });

    const { error } = editing.id
      ? await supabase.from('subscription_plans').update(payload).eq('id', editing.id)
      : await supabase.from('subscription_plans').insert(payload);

    setSaving(false);
    if (error) { toast.error('Erro ao salvar plano.'); console.error(error); return; }
    await logPlatformAction({ action: editing.id ? 'plan.update' : 'plan.create', target_type: 'subscription_plan', target_id: editing.id ?? null, metadata: { name: editing.name } });
    toast.success('Plano salvo.');
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planos</h1>
          <p className="text-sm text-muted-foreground">Catálogo de planos SaaS, limites e flags de recursos.</p>
        </div>
        <Button onClick={() => setEditing(emptyPlan())}><Plus className="h-4 w-4 mr-1" />Novo plano</Button>
      </div>

      {loading ? (
        <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{p.slug}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {p.is_active ? <Badge>Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}
                    <Button size="icon" variant="ghost" onClick={() => setEditing(p)}><Edit2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{p.description}</p>
                <div className="font-semibold text-base">R$ {Number(p.price_monthly).toFixed(2)}/mês</div>
                <div className="text-xs text-muted-foreground">R$ {Number(p.price_yearly).toFixed(2)}/ano</div>
                <div className="flex flex-wrap gap-1 pt-2">
                  {FEATURES.filter(f => p[f.key]).map(f => <Badge key={f.key} variant="secondary" className="text-[10px]">{f.label}</Badge>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar plano' : 'Novo plano'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Nome</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
                <div className="space-y-1"><Label>Slug</Label><Input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} /></div>
              </div>
              <div className="space-y-1"><Label>Descrição</Label><Textarea rows={2} value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Preço mensal (R$)</Label><Input type="number" step="0.01" value={editing.price_monthly} onChange={e => setEditing({ ...editing, price_monthly: Number(e.target.value) })} /></div>
                <div className="space-y-1"><Label>Preço anual (R$)</Label><Input type="number" step="0.01" value={editing.price_yearly} onChange={e => setEditing({ ...editing, price_yearly: Number(e.target.value) })} /></div>
              </div>

              <div className="pt-2"><h4 className="text-sm font-semibold mb-2">Limites (vazio = ilimitado)</h4>
                <div className="grid grid-cols-2 gap-3">
                  {LIMITS.map(l => (
                    <div key={l.key} className="space-y-1">
                      <Label className="text-xs">{l.label}</Label>
                      <Input type="number" value={editing[l.key] ?? ''} onChange={e => setEditing({ ...editing, [l.key]: e.target.value === '' ? null : Number(e.target.value) })} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2"><h4 className="text-sm font-semibold mb-2">Recursos habilitados</h4>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURES.map(f => (
                    <label key={f.key} className="flex items-center justify-between rounded border p-2 text-sm">
                      <span>{f.label}</span>
                      <Switch checked={!!editing[f.key]} onCheckedChange={v => setEditing({ ...editing, [f.key]: v })} />
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between rounded border p-2 text-sm">
                <span>Plano ativo (disponível para novas assinaturas)</span>
                <Switch checked={!!editing.is_active} onCheckedChange={v => setEditing({ ...editing, is_active: v })} />
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
