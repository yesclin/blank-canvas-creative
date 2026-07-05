import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Package as PackageIcon, X, CheckCircle, CalendarPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useActiveClinicScope } from "@/hooks/useActiveClinicScope";
import {
  useTreatmentPackages,
  useCreateTreatmentPackage,
  useUpdatePackageStatus,
  usePackageSessions,
  usePackagePayments,
  usePackageSummary,
  type PackageStatusExt,
  type TreatmentPackageRow,
} from "@/hooks/finance/useTreatmentPackagesFull";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const statusLabel: Record<PackageStatusExt, string> = { ativo: "Ativo", concluido: "Concluído", cancelado: "Cancelado", expirado: "Expirado" };
const statusColor: Record<PackageStatusExt, string> = {
  ativo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  concluido: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  cancelado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  expirado: "bg-gray-200 text-gray-800",
};

function useLookups() {
  const { scope } = useActiveClinicScope();
  const patients = useQuery({
    queryKey: ["lookup-patients", scope.clinicId],
    enabled: !!scope.clinicId,
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("id, full_name").eq("clinic_id", scope.clinicId!).eq("is_active", true).order("full_name").limit(500);
      return data ?? [];
    },
  });
  const procedures = useQuery({
    queryKey: ["lookup-procedures", scope.clinicId],
    enabled: !!scope.clinicId,
    queryFn: async () => {
      const { data } = await supabase.from("procedures").select("id, name, price, duration_minutes").eq("clinic_id", scope.clinicId!).eq("is_active", true).order("name").limit(500);
      return data ?? [];
    },
  });
  const professionals = useQuery({
    queryKey: ["lookup-professionals", scope.clinicId],
    enabled: !!scope.clinicId,
    queryFn: async () => {
      const { data } = await supabase.from("professionals").select("id, full_name").eq("clinic_id", scope.clinicId!).eq("is_active", true).order("full_name").limit(500);
      return data ?? [];
    },
  });
  return { patients, procedures, professionals };
}

function CreatePackageDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const { patients, procedures, professionals } = useLookups();
  const create = useCreateTreatmentPackage();
  const [form, setForm] = useState({
    patient_id: "", procedure_id: "", professional_id: "",
    name: "", total_sessions: 10, total_amount: 0,
    session_interval_days: 7, installments: 1,
    payment_method: "pix", valid_until: "", notes: "",
    first_due_date: new Date().toISOString().slice(0, 10),
  });

  const onProc = (id: string) => {
    const p = procedures.data?.find((x: any) => x.id === id);
    setForm(f => ({
      ...f,
      procedure_id: id,
      name: f.name || (p?.name ?? ""),
      total_amount: f.total_amount || Number(p?.price ?? 0) * f.total_sessions,
    }));
  };

  const submit = async () => {
    if (!form.patient_id || !form.name || form.total_sessions <= 0 || form.total_amount <= 0) return;
    await create.mutateAsync({
      patient_id: form.patient_id,
      procedure_id: form.procedure_id || null,
      professional_id: form.professional_id || null,
      name: form.name,
      total_sessions: Number(form.total_sessions),
      total_amount: Number(form.total_amount),
      session_interval_days: Number(form.session_interval_days) || null,
      installments: Number(form.installments) || 1,
      payment_method: form.payment_method,
      valid_until: form.valid_until || null,
      notes: form.notes || null,
      first_due_date: form.first_due_date,
    });
    setOpen(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Vender pacote</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Novo pacote de tratamento</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Paciente *</Label>
            <Select value={form.patient_id} onValueChange={v => setForm(f => ({ ...f, patient_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{patients.data?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Procedimento</Label>
            <Select value={form.procedure_id} onValueChange={onProc}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{procedures.data?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Profissional</Label>
            <Select value={form.professional_id} onValueChange={v => setForm(f => ({ ...f, professional_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Qualquer" /></SelectTrigger>
              <SelectContent>{professionals.data?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Nome do pacote *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><Label>Nº sessões *</Label><Input type="number" min={1} value={form.total_sessions} onChange={e => setForm(f => ({ ...f, total_sessions: Number(e.target.value) }))} /></div>
          <div><Label>Intervalo (dias)</Label><Input type="number" min={0} value={form.session_interval_days} onChange={e => setForm(f => ({ ...f, session_interval_days: Number(e.target.value) }))} /></div>
          <div><Label>Valor total (R$) *</Label><Input type="number" step="0.01" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: Number(e.target.value) }))} /></div>
          <div><Label>Parcelas</Label><Input type="number" min={1} max={36} value={form.installments} onChange={e => setForm(f => ({ ...f, installments: Number(e.target.value) }))} /></div>
          <div>
            <Label>Forma de pagamento</Label>
            <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cartao_credito">Cartão de crédito</SelectItem>
                <SelectItem value="cartao_debito">Cartão de débito</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>1º vencimento</Label><Input type="date" value={form.first_due_date} onChange={e => setForm(f => ({ ...f, first_due_date: e.target.value }))} /></div>
          <div><Label>Validade</Label><Input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} /></div>
          <div className="col-span-2"><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={create.isPending}>Criar pacote</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PackageDetailSheet({ pkg, onClose }: { pkg: TreatmentPackageRow | null; onClose: () => void }) {
  const sessions = usePackageSessions(pkg?.id ?? null);
  const payments = usePackagePayments(pkg?.id ?? null);
  const summary = usePackageSummary(pkg?.id ?? null);
  const update = useUpdatePackageStatus();

  if (!pkg) return null;
  const remaining = Math.max(0, pkg.total_sessions - pkg.used_sessions);
  const balance = Number(pkg.total_amount) - Number(pkg.paid_amount);

  return (
    <Sheet open={!!pkg} onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader><SheetTitle className="flex items-center gap-2"><PackageIcon className="h-4 w-4" />{pkg.name}</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Paciente:</span> {pkg.patients?.full_name ?? "-"}</div>
            <div><span className="text-muted-foreground">Procedimento:</span> {pkg.procedures?.name ?? "-"}</div>
            <div><span className="text-muted-foreground">Profissional:</span> {pkg.professionals?.full_name ?? "Qualquer"}</div>
            <div><span className="text-muted-foreground">Status:</span> <Badge className={statusColor[pkg.status]}>{statusLabel[pkg.status]}</Badge></div>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sessões</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">Realizadas {pkg.used_sessions} de {pkg.total_sessions} — restantes {remaining}</div>
              <Progress value={pkg.total_sessions > 0 ? (pkg.used_sessions / pkg.total_sessions) * 100 : 0} className="h-1.5" />
              {summary.data && (
                <div className="grid grid-cols-4 gap-2 text-xs pt-2">
                  <div className="p-2 rounded bg-muted"><div className="text-muted-foreground">Agendadas</div><div className="font-semibold">{summary.data.agendado}</div></div>
                  <div className="p-2 rounded bg-muted"><div className="text-muted-foreground">Realizadas</div><div className="font-semibold">{summary.data.finalizado}</div></div>
                  <div className="p-2 rounded bg-muted"><div className="text-muted-foreground">Faltas</div><div className="font-semibold">{summary.data.faltou}</div></div>
                  <div className="p-2 rounded bg-muted"><div className="text-muted-foreground">Canceladas</div><div className="font-semibold">{summary.data.cancelado}</div></div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Financeiro</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div><div className="text-muted-foreground text-xs">Total</div><div className="font-semibold">{fmt(Number(pkg.total_amount))}</div></div>
                <div><div className="text-muted-foreground text-xs">Pago</div><div className="font-semibold text-emerald-600">{fmt(Number(pkg.paid_amount))}</div></div>
                <div><div className="text-muted-foreground text-xs">Saldo</div><div className="font-semibold text-amber-600">{fmt(balance)}</div></div>
              </div>
              {payments.data && payments.data.length > 0 && (
                <Table className="mt-3">
                  <TableHeader><TableRow><TableHead>Parcela</TableHead><TableHead>Vencimento</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>{payments.data.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.installment_number ?? "-"}/{t.total_installments ?? "-"}</TableCell>
                      <TableCell>{t.due_date}</TableCell>
                      <TableCell>{fmt(Number(t.amount))}</TableCell>
                      <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sessões vinculadas</CardTitle></CardHeader>
            <CardContent>
              {(sessions.data ?? []).length === 0 ? (
                <div className="text-xs text-muted-foreground py-4 text-center">Nenhuma sessão vinculada ainda. Ao criar um agendamento, informe este pacote.</div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Hora</TableHead><TableHead>Profissional</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>{sessions.data!.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.scheduled_date}</TableCell>
                      <TableCell>{s.start_time?.slice(0, 5)}</TableCell>
                      <TableCell>{s.professionals?.full_name ?? "-"}</TableCell>
                      <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {pkg.status === "ativo" && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => update.mutate({ id: pkg.id, status: "concluido" })}>
                <CheckCircle className="h-4 w-4 mr-1" /> Concluir tratamento
              </Button>
              <Button variant="destructive" size="sm" onClick={() => {
                const reason = window.prompt("Motivo do cancelamento:");
                if (reason) update.mutate({ id: pkg.id, status: "cancelado", reason });
              }}>
                <X className="h-4 w-4 mr-1" /> Cancelar pacote
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function PackagesTab() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PackageStatusExt | "all">("all");
  const [selected, setSelected] = useState<TreatmentPackageRow | null>(null);
  const { data = [], isLoading, refetch } = useTreatmentPackages({
    status: status === "all" ? undefined : status,
    search: search || undefined,
  });

  const totals = useMemo(() => data.reduce((acc, p) => ({
    total: acc.total + Number(p.total_amount),
    paid: acc.paid + Number(p.paid_amount),
    balance: acc.balance + (Number(p.total_amount) - Number(p.paid_amount)),
  }), { total: 0, paid: 0, balance: 0 }), [data]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Faturamento em pacotes</div><div className="text-lg font-bold">{fmt(totals.total)}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Recebido</div><div className="text-lg font-bold text-emerald-600">{fmt(totals.paid)}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">A receber</div><div className="text-lg font-bold text-amber-600">{fmt(totals.balance)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Pacotes / Sessões</CardTitle>
          <CreatePackageDialog onDone={() => refetch()} />
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input className="pl-8" placeholder="Buscar por nome do pacote" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={status} onValueChange={v => setStatus(v as any)}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="concluido">Concluídos</SelectItem>
                <SelectItem value="cancelado">Cancelados</SelectItem>
                <SelectItem value="expirado">Expirados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Carregando…</div>
          ) : data.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Nenhum pacote encontrado.</div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Paciente</TableHead><TableHead>Pacote</TableHead><TableHead>Sessões</TableHead>
                <TableHead>Total</TableHead><TableHead>Pago</TableHead><TableHead>Saldo</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.map(p => {
                  const pct = p.total_sessions > 0 ? (p.used_sessions / p.total_sessions) * 100 : 0;
                  const balance = Number(p.total_amount) - Number(p.paid_amount);
                  return (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(p)}>
                      <TableCell>{p.patients?.full_name ?? "-"}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="w-[180px]">
                        <div className="text-xs">{p.used_sessions}/{p.total_sessions}</div>
                        <Progress value={pct} className="h-1.5 mt-1" />
                      </TableCell>
                      <TableCell>{fmt(Number(p.total_amount))}</TableCell>
                      <TableCell className="text-emerald-600">{fmt(Number(p.paid_amount))}</TableCell>
                      <TableCell className="text-amber-600">{fmt(balance)}</TableCell>
                      <TableCell><Badge className={statusColor[p.status]}>{statusLabel[p.status]}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PackageDetailSheet pkg={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default PackagesTab;
