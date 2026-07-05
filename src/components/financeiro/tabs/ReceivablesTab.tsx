import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Download, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { useReceivables, type ReceivableRow } from "@/hooks/finance/useReceivables";
import { useSettleTransaction, useCancelTransaction, useReverseTransaction, useCreateReceivable, useRenegotiateTransaction } from "@/hooks/finance/useTransactionActions";
import { paymentMethods } from "@/types/gestao";
import { format } from "date-fns";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const today = () => new Date().toISOString().slice(0, 10);

const statusColor: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  parcial: "bg-blue-100 text-blue-800",
  pago: "bg-green-100 text-green-800",
  vencido: "bg-red-100 text-red-800",
  cancelado: "bg-gray-200 text-gray-700",
};

export function ReceivablesTab() {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("all");

  const { data = [], isLoading } = useReceivables({
    status,
    search: search || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    paymentMethod: paymentMethod === "all" ? null : paymentMethod,
  });

  const settle = useSettleTransaction();
  const cancel = useCancelTransaction();
  const reverse = useReverseTransaction();
  const create = useCreateReceivable();
  const renegotiate = useRenegotiateTransaction();

  const [openNew, setOpenNew] = useState(false);
  const [payTarget, setPayTarget] = useState<ReceivableRow | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [reverseTarget, setReverseTarget] = useState<ReceivableRow | null>(null);
  const [reverseReason, setReverseReason] = useState("");
  const [cancelTarget, setCancelTarget] = useState<ReceivableRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [renegTarget, setRenegTarget] = useState<ReceivableRow | null>(null);
  const [renegAmount, setRenegAmount] = useState("");
  const [renegDue, setRenegDue] = useState("");
  const [renegReason, setRenegReason] = useState("");

  const [newForm, setNewForm] = useState({ description: "", amount: "", due_date: today(), installments: "1", payment_method: "", notes: "" });

  const totals = useMemo(() => {
    const t = { pendente: 0, pago: 0, vencido: 0, parcial: 0 };
    for (const r of data) {
      if (r.status === "pago") t.pago += Number(r.amount);
      else if (r.status === "parcial") t.parcial += Number(r.amount) - Number(r.paid_amount);
      else if (r.status === "vencido" || (r.due_date && r.due_date < today() && r.status === "pendente")) t.vencido += Number(r.amount);
      else if (r.status === "pendente") t.pendente += Number(r.amount);
    }
    return t;
  }, [data]);

  const exportCSV = () => {
    const rows = [
      ["Data", "Descrição", "Paciente", "Profissional", "Procedimento", "Valor", "Pago", "Vencimento", "Status", "Forma"],
      ...data.map(r => [
        r.transaction_date, r.description, r.patients?.full_name ?? "", r.professionals?.full_name ?? "",
        r.procedures?.name ?? "", String(r.amount), String(r.paid_amount), r.due_date ?? "", r.status, r.payment_method ?? "",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `contas-receber-${today()}.csv`; a.click();
  };

  const confirmPay = async () => {
    if (!payTarget) return;
    const amt = Number(payAmount);
    if (!(amt > 0)) return;
    await settle.mutateAsync({
      id: payTarget.id,
      amount: amt,
      totalAmount: Number(payTarget.amount),
      currentPaid: Number(payTarget.paid_amount || 0),
      payment_method: payMethod || undefined,
    });
    setPayTarget(null); setPayAmount(""); setPayMethod("");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pendentes</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-yellow-700">{fmt(totals.pendente)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Parcial (a receber)</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-blue-700">{fmt(totals.parcial)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Vencidas</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-red-700">{fmt(totals.vencido)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Recebido no período</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-green-700">{fmt(totals.pago)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex-row justify-between items-center gap-2 flex-wrap">
          <div className="flex flex-wrap gap-2 items-center">
            <Input placeholder="Buscar descrição..." value={search} onChange={e => setSearch(e.target.value)} className="w-[200px]" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Forma pagamento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas formas</SelectItem>
                {paymentMethods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-[150px]" />
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-[150px]" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />CSV</Button>
            <Dialog open={openNew} onOpenChange={setOpenNew}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova conta</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova conta a receber</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Descrição *</Label><Input value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Valor total (R$) *</Label><Input type="number" min="0" step="0.01" value={newForm.amount} onChange={e => setNewForm({ ...newForm, amount: e.target.value })} /></div>
                    <div><Label>Parcelas</Label><Input type="number" min="1" max="60" value={newForm.installments} onChange={e => setNewForm({ ...newForm, installments: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>1º Vencimento</Label><Input type="date" value={newForm.due_date} onChange={e => setNewForm({ ...newForm, due_date: e.target.value })} /></div>
                    <div>
                      <Label>Forma de pagamento</Label>
                      <Select value={newForm.payment_method} onValueChange={v => setNewForm({ ...newForm, payment_method: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{paymentMethods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Observações</Label><Textarea value={newForm.notes} onChange={e => setNewForm({ ...newForm, notes: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
                  <Button disabled={!newForm.description || !newForm.amount || create.isPending} onClick={async () => {
                    await create.mutateAsync({
                      description: newForm.description,
                      amount: Number(newForm.amount),
                      due_date: newForm.due_date,
                      transaction_date: today(),
                      installments: Number(newForm.installments) || 1,
                      payment_method: newForm.payment_method || undefined,
                      notes: newForm.notes || undefined,
                    });
                    setOpenNew(false);
                    setNewForm({ description: "", amount: "", due_date: today(), installments: "1", payment_method: "", notes: "" });
                  }}>Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-64" /> : data.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Nenhuma conta a receber com esses filtros.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map(r => {
                  const overdue = r.due_date && r.due_date < today() && r.status === "pendente";
                  const st = overdue ? "vencido" : r.status;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.due_date ? format(new Date(r.due_date + "T12:00:00"), "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {r.description}
                        {r.installment_total && <span className="ml-1 text-xs text-muted-foreground">({r.installment_number}/{r.installment_total})</span>}
                      </TableCell>
                      <TableCell>{r.patients?.full_name ?? "-"}</TableCell>
                      <TableCell>{r.professionals?.full_name ?? "-"}</TableCell>
                      <TableCell>{r.procedures?.name ?? "-"}</TableCell>
                      <TableCell>{fmt(Number(r.amount))}</TableCell>
                      <TableCell>{fmt(Number(r.paid_amount || 0))}</TableCell>
                      <TableCell className="text-xs">{paymentMethods.find(m => m.value === r.payment_method)?.label ?? "-"}</TableCell>
                      <TableCell><Badge className={statusColor[st] ?? ""}>{st}</Badge></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {r.status !== "pago" && r.status !== "cancelado" && (
                              <DropdownMenuItem onClick={() => { setPayTarget(r); setPayAmount(String(Number(r.amount) - Number(r.paid_amount || 0))); setPayMethod(r.payment_method ?? ""); }}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />Receber / baixar
                              </DropdownMenuItem>
                            )}
                            {r.status !== "cancelado" && (r.status === "pago" || r.status === "parcial") && (
                              <DropdownMenuItem onClick={() => setReverseTarget(r)}>
                                <RotateCcw className="h-4 w-4 mr-2" />Estornar
                              </DropdownMenuItem>
                            )}
                            {(r.status === "pendente" || r.status === "parcial") && (
                              <DropdownMenuItem onClick={() => {
                                setRenegTarget(r);
                                setRenegAmount(String(Number(r.amount)));
                                setRenegDue(r.due_date ?? today());
                                setRenegReason("");
                              }}>
                                <RotateCcw className="h-4 w-4 mr-2" />Renegociar
                              </DropdownMenuItem>
                            )}
                            {r.status !== "pago" && r.status !== "cancelado" && (
                              <DropdownMenuItem onClick={() => { setCancelTarget(r); setCancelReason(""); }}>
                                <XCircle className="h-4 w-4 mr-2" />Cancelar cobrança
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pay dialog */}
      <Dialog open={!!payTarget} onOpenChange={o => !o && setPayTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Baixar recebimento</DialogTitle></DialogHeader>
          {payTarget && (
            <div className="grid gap-3 text-sm">
              <div>Total: <b>{fmt(Number(payTarget.amount))}</b> · Pago: {fmt(Number(payTarget.paid_amount || 0))}</div>
              <div><Label>Valor recebido (R$)</Label><Input type="number" min="0" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} /></div>
              <div>
                <Label>Forma de pagamento</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{paymentMethods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)}>Cancelar</Button>
            <Button disabled={settle.isPending} onClick={confirmPay}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reverse dialog */}
      <Dialog open={!!reverseTarget} onOpenChange={o => !o && setReverseTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Estornar cobrança</DialogTitle></DialogHeader>
          <div className="grid gap-3 text-sm">
            <div>Um lançamento de estorno será criado e a cobrança original marcada como cancelada.</div>
            <div><Label>Motivo</Label><Textarea value={reverseReason} onChange={e => setReverseReason(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReverseTarget(null)}>Cancelar</Button>
            <Button disabled={!reverseReason || reverse.isPending} onClick={async () => {
              if (!reverseTarget) return;
              await reverse.mutateAsync({ parent: { ...reverseTarget, type: "receita" }, reason: reverseReason });
              setReverseTarget(null); setReverseReason("");
            }}>Estornar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
