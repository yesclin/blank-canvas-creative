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
import { MoreHorizontal, Plus, Download, CheckCircle2, XCircle, Paperclip, RotateCcw } from "lucide-react";
import { usePayables, type PayableRow } from "@/hooks/finance/usePayables";
import { useCreatePayable, useSettleTransaction, useCancelTransaction, useRenegotiateTransaction } from "@/hooks/finance/useTransactionActions";
import { useFinanceCategories } from "@/hooks/useFinanceTransactions";
import { paymentMethods } from "@/types/gestao";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const today = () => new Date().toISOString().slice(0, 10);

const statusColor: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  parcial: "bg-blue-100 text-blue-800",
  pago: "bg-green-100 text-green-800",
  vencido: "bg-red-100 text-red-800",
  cancelado: "bg-gray-200 text-gray-700",
};

export function PayablesTab() {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [supplier, setSupplier] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");

  const { data = [], isLoading } = usePayables({
    status, search: search || undefined, supplier: supplier || undefined,
    costCenter: costCenter || undefined,
    startDate: startDate || undefined, endDate: endDate || undefined,
    categoryId: categoryId === "all" ? null : categoryId,
  });
  const { data: categories = [] } = useFinanceCategories();
  const expenseCats = categories.filter(c => c.uiType === "saida");
  const create = useCreatePayable();
  const settle = useSettleTransaction();
  const cancel = useCancelTransaction();
  const renegotiate = useRenegotiateTransaction();

  const [cancelTarget, setCancelTarget] = useState<PayableRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [renegTarget, setRenegTarget] = useState<PayableRow | null>(null);
  const [renegAmount, setRenegAmount] = useState("");
  const [renegDue, setRenegDue] = useState("");
  const [renegReason, setRenegReason] = useState("");

  const [openNew, setOpenNew] = useState(false);
  const [payTarget, setPayTarget] = useState<PayableRow | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [newForm, setNewForm] = useState({
    description: "", amount: "", due_date: today(), transaction_date: today(),
    supplier_name: "", cost_center: "", category_id: "", payment_method: "", recurrence: "", notes: "",
  });

  const totals = useMemo(() => {
    const t = { pendente: 0, vencido: 0, pago: 0 };
    for (const r of data) {
      if (r.status === "pago") t.pago += Number(r.amount);
      else if (r.status === "vencido" || (r.due_date && r.due_date < today() && r.status === "pendente")) t.vencido += Number(r.amount);
      else if (r.status === "pendente" || r.status === "parcial") t.pendente += Number(r.amount) - Number(r.paid_amount || 0);
    }
    return t;
  }, [data]);

  const exportCSV = () => {
    const rows = [
      ["Data", "Descrição", "Fornecedor", "Categoria", "Centro de custo", "Valor", "Pago", "Vencimento", "Status", "Forma", "Recorrência"],
      ...data.map(r => [r.transaction_date, r.description, r.supplier_name ?? "", r.finance_categories?.name ?? "", r.cost_center ?? "", String(r.amount), String(r.paid_amount), r.due_date ?? "", r.status, r.payment_method ?? "", r.recurrence ?? ""]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `contas-pagar-${today()}.csv`; a.click();
  };

  const uploadReceipt = async (id: string): Promise<string | undefined> => {
    if (!receiptFile) return undefined;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: prof } = await supabase.from("profiles").select("clinic_id").eq("user_id", user.id).maybeSingle().limit(1);
    if (!prof?.clinic_id) return;
    const path = `${prof.clinic_id}/${id}/${Date.now()}-${receiptFile.name}`;
    const { error } = await supabase.storage.from("finance-receipts").upload(path, receiptFile);
    if (error) { toast.error("Falha ao enviar comprovante: " + error.message); return; }
    return path;
  };

  const confirmPay = async () => {
    if (!payTarget) return;
    const amt = Number(payAmount);
    if (!(amt > 0)) return;
    const receipt = await uploadReceipt(payTarget.id);
    await settle.mutateAsync({
      id: payTarget.id, amount: amt,
      totalAmount: Number(payTarget.amount), currentPaid: Number(payTarget.paid_amount || 0),
      payment_method: payMethod || undefined,
      receipt_url: receipt,
    });
    setPayTarget(null); setPayAmount(""); setPayMethod(""); setReceiptFile(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">A pagar (aberto)</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-yellow-700">{fmt(totals.pendente)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Vencidas</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-red-700">{fmt(totals.vencido)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pago no período</CardTitle></CardHeader><CardContent><div className="text-xl font-bold text-green-700">{fmt(totals.pago)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex-row justify-between items-center gap-2 flex-wrap">
          <div className="flex flex-wrap gap-2 items-center">
            <Input placeholder="Descrição..." value={search} onChange={e => setSearch(e.target.value)} className="w-[180px]" />
            <Input placeholder="Fornecedor" value={supplier} onChange={e => setSupplier(e.target.value)} className="w-[150px]" />
            <Input placeholder="Centro de custo" value={costCenter} onChange={e => setCostCenter(e.target.value)} className="w-[160px]" />
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
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {expenseCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-[150px]" />
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-[150px]" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />CSV</Button>
            <Dialog open={openNew} onOpenChange={setOpenNew}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova conta</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Nova conta a pagar</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Descrição *</Label><Input value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Valor (R$) *</Label><Input type="number" min="0" step="0.01" value={newForm.amount} onChange={e => setNewForm({ ...newForm, amount: e.target.value })} /></div>
                    <div><Label>Vencimento</Label><Input type="date" value={newForm.due_date} onChange={e => setNewForm({ ...newForm, due_date: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Fornecedor</Label><Input value={newForm.supplier_name} onChange={e => setNewForm({ ...newForm, supplier_name: e.target.value })} /></div>
                    <div><Label>Centro de custo</Label><Input value={newForm.cost_center} onChange={e => setNewForm({ ...newForm, cost_center: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Categoria</Label>
                      <Select value={newForm.category_id} onValueChange={v => setNewForm({ ...newForm, category_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{expenseCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Forma de pagamento</Label>
                      <Select value={newForm.payment_method} onValueChange={v => setNewForm({ ...newForm, payment_method: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{paymentMethods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Recorrência</Label>
                    <Select value={newForm.recurrence} onValueChange={v => setNewForm({ ...newForm, recurrence: v })}>
                      <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
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
                      transaction_date: newForm.transaction_date,
                      supplier_name: newForm.supplier_name || undefined,
                      cost_center: newForm.cost_center || undefined,
                      category_id: newForm.category_id || undefined,
                      payment_method: newForm.payment_method || undefined,
                      recurrence: newForm.recurrence || undefined,
                      notes: newForm.notes || undefined,
                    });
                    setOpenNew(false);
                    setNewForm({ description: "", amount: "", due_date: today(), transaction_date: today(), supplier_name: "", cost_center: "", category_id: "", payment_method: "", recurrence: "", notes: "" });
                  }}>Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-64" /> : data.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Nenhuma conta a pagar com esses filtros.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>C.Custo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pago</TableHead>
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
                      <TableCell className="max-w-[200px] truncate">{r.description}</TableCell>
                      <TableCell>{r.supplier_name ?? "-"}</TableCell>
                      <TableCell>{r.finance_categories?.name ?? "-"}</TableCell>
                      <TableCell>{r.cost_center ?? "-"}</TableCell>
                      <TableCell>{fmt(Number(r.amount))}</TableCell>
                      <TableCell>{fmt(Number(r.paid_amount || 0))}</TableCell>
                      <TableCell>
                        <Badge className={statusColor[st] ?? ""}>{st}</Badge>
                        {r.receipt_url && <Paperclip className="inline h-3 w-3 ml-1 text-muted-foreground" />}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {r.status !== "pago" && r.status !== "cancelado" && (
                              <DropdownMenuItem onClick={() => { setPayTarget(r); setPayAmount(String(Number(r.amount) - Number(r.paid_amount || 0))); setPayMethod(r.payment_method ?? ""); }}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />Dar baixa
                              </DropdownMenuItem>
                            )}
                            {r.status !== "pago" && r.status !== "cancelado" && (
                              <DropdownMenuItem onClick={() => cancel.mutate({ id: r.id, reason: "Cancelado pelo usuário" })}>
                                <XCircle className="h-4 w-4 mr-2" />Cancelar
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

      <Dialog open={!!payTarget} onOpenChange={o => !o && setPayTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dar baixa</DialogTitle></DialogHeader>
          {payTarget && (
            <div className="grid gap-3 text-sm">
              <div>Total: <b>{fmt(Number(payTarget.amount))}</b> · Pago: {fmt(Number(payTarget.paid_amount || 0))}</div>
              <div><Label>Valor pago (R$)</Label><Input type="number" min="0" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} /></div>
              <div>
                <Label>Forma de pagamento</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{paymentMethods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Comprovante</Label><Input type="file" accept="image/*,application/pdf" onChange={e => setReceiptFile(e.target.files?.[0] ?? null)} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)}>Cancelar</Button>
            <Button disabled={settle.isPending} onClick={confirmPay}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
