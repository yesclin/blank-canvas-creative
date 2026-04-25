import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, ShieldAlert, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { startSupportSession } from '@/lib/supportSession';
import { logPlatformAction } from '@/lib/superAdminAudit';

interface ClinicRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  subscription_status: string | null;
  plan_name: string | null;
  subscription_id: string | null;
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  trial: { label: 'Trial', variant: 'secondary' },
  active: { label: 'Ativa', variant: 'default' },
  overdue: { label: 'Em atraso', variant: 'outline' },
  blocked: { label: 'Bloqueada', variant: 'destructive' },
  canceled: { label: 'Cancelada', variant: 'outline' },
};

export default function SuperAdminClinics() {
  const [rows, setRows] = useState<ClinicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [supportOpen, setSupportOpen] = useState<ClinicRow | null>(null);
  const [reason, setReason] = useState('');
  const [working, setWorking] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: clinics } = await supabase
      .from('clinics')
      .select('id, name, email, phone, created_at')
      .order('created_at', { ascending: false });
    const { data: subs } = await supabase
      .from('clinic_subscriptions')
      .select('id, clinic_id, status, plan_id, subscription_plans(name)');

    const subMap = new Map<string, any>();
    (subs ?? []).forEach((s: any) => subMap.set(s.clinic_id, s));

    const merged: ClinicRow[] = (clinics ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      created_at: c.created_at,
      subscription_status: subMap.get(c.id)?.status ?? null,
      plan_name: subMap.get(c.id)?.subscription_plans?.name ?? null,
      subscription_id: subMap.get(c.id)?.id ?? null,
    }));
    setRows(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q);
  });

  const updateStatus = async (sub_id: string | null, clinicId: string, status: string) => {
    if (!sub_id) {
      toast.error('Clínica sem assinatura. Crie uma assinatura primeiro.');
      return;
    }
    const { error } = await supabase
      .from('clinic_subscriptions')
      .update({
        status,
        blocked_at: status === 'blocked' ? new Date().toISOString() : null,
        canceled_at: status === 'canceled' ? new Date().toISOString() : null,
      })
      .eq('id', sub_id);
    if (error) {
      toast.error('Erro ao alterar status.');
      return;
    }
    await logPlatformAction({
      action: `subscription.status.${status}`,
      target_type: 'clinic_subscription',
      target_id: sub_id,
      clinic_id: clinicId,
    });
    toast.success('Status atualizado.');
    load();
  };

  const handleStartSupport = async () => {
    if (!supportOpen) return;
    setWorking(true);
    try {
      await startSupportSession({ clinicId: supportOpen.id, reason });
      toast.success('Modo suporte iniciado.');
      setSupportOpen(null);
      setReason('');
      // Vai para o app no contexto da clínica impersonada
      window.location.assign('/app');
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao iniciar modo suporte.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clínicas</h1>
          <p className="text-sm text-muted-foreground">Listagem global de todas as clínicas da plataforma.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar por nome ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            {filtered.length} clínica(s)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clínica</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const cfg = STATUS_LABELS[r.subscription_status ?? ''] ?? { label: '—', variant: 'outline' as const };
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>{r.email ?? '—'}</div>
                        <div>{r.phone ?? ''}</div>
                      </TableCell>
                      <TableCell>{r.plan_name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Select onValueChange={(v) => updateStatus(r.subscription_id, r.id, v)}>
                            <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="trial">Trial</SelectItem>
                              <SelectItem value="active">Ativar</SelectItem>
                              <SelectItem value="overdue">Em atraso</SelectItem>
                              <SelectItem value="blocked">Bloquear</SelectItem>
                              <SelectItem value="canceled">Cancelar</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="outline" onClick={() => setSupportOpen(r)}>
                            <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                            Suporte
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Nenhuma clínica encontrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!supportOpen} onOpenChange={(o) => { if (!o) { setSupportOpen(null); setReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrar como suporte</DialogTitle>
            <DialogDescription>
              Você vai navegar dentro da clínica <strong>{supportOpen?.name}</strong> com sua identidade real.
              Toda ação ficará registrada em auditoria. Um banner vermelho ficará visível em toda a interface.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (obrigatório)</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Investigar erro reportado em ticket #123" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSupportOpen(null)}>Cancelar</Button>
            <Button onClick={handleStartSupport} disabled={working || reason.trim().length < 5}>
              {working && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Iniciar sessão de suporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
