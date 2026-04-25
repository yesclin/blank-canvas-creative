import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logPlatformAction } from '@/lib/superAdminAudit';

const STATUSES = ['trial', 'active', 'overdue', 'blocked', 'canceled'];

export default function SuperAdminSubscriptions() {
  const [rows, setRows] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: subs }, { data: ps }] = await Promise.all([
      supabase.from('clinic_subscriptions').select('*, clinics(name), subscription_plans(name, slug)').order('created_at', { ascending: false }),
      supabase.from('subscription_plans').select('id, name').order('sort_order'),
    ]);
    setRows(subs ?? []);
    setPlans(ps ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: any, action: string) => {
    const { error } = await supabase.from('clinic_subscriptions').update(patch).eq('id', id);
    if (error) { toast.error('Erro ao atualizar.'); return; }
    await logPlatformAction({ action, target_type: 'clinic_subscription', target_id: id, metadata: patch });
    toast.success('Assinatura atualizada.');
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assinaturas</h1>
        <p className="text-sm text-muted-foreground">Vínculos entre clínicas e planos.</p>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{rows.length} assinatura(s)</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clínica</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Vence em</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.clinics?.name ?? '—'}</TableCell>
                    <TableCell>
                      <Select defaultValue={s.plan_id} onValueChange={(v) => update(s.id, { plan_id: v }, 'subscription.change_plan')}>
                        <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select defaultValue={s.status} onValueChange={(v) => update(s.id, { status: v }, `subscription.status.${v}`)}>
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUSES.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Badge variant="outline">{s.cycle}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString('pt-BR') : '—'}</TableCell>
                    <TableCell className="text-sm">{s.contracted_amount ? `R$ ${Number(s.contracted_amount).toFixed(2)}` : '—'}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Nenhuma assinatura.</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
