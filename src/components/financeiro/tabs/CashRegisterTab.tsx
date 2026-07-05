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
import { Wallet, ArrowUpCircle, ArrowDownCircle, Lock, Unlock, RotateCw, Wrench } from "lucide-react";
import {
  useMyOpenCashRegister, useCashHistory, useCashMovements,
  useOpenCash, useCloseCash, useReopenCash, useAddCashMovement,
  usePaymentMethodsActive, type MovementType,
} from "@/hooks/finance/useCashRegister";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const movLabels: Record<string, string> = {
  recebimento: "Recebimento", sangria: "Sangria", suprimento: "Suprimento",
  despesa: "Despesa rápida", ajuste: "Ajuste", pagamento: "Pagamento",
};
const movSign: Record<string, 1 | -1> = {
  recebimento: 1, suprimento: 1, pagamento: 1,
  sangria: -1, despesa: -1, ajuste: 1, // ajuste can be positive by default; UI allows negative via signed amount
};

export function CashRegisterTab() {
  const { isOwner, isAdmin } = usePermissions();
  const canAdmin = isOwner || isAdmin;

  const { data: openReg, isLoading: loadOpen } = useMyOpenCashRegister();
  const { data: methods = [] } = usePaymentMethodsActive();

  const [histFilters, setHistFilters] = useState<{ startDate?: string; endDate?: string; status?: string }>({ status: "all" });
  const { data: history = [] } = useCashHistory(histFilters);
  const { data: movements = [] } = useCashMovements(openReg?.id);

  const openCash = useOpenCash();
  const closeCash = useCloseCash();
  const reopen = useReopenCash();
  const addMov = useAddCashMovement();

  const [openDialog, setOpenDialog] = useState(false);
  const [openForm, setOpenForm] = useState({ opening_amount: "0", notes: "" });

  const [closeDialog, setCloseDialog] = useState(false);
  const [closingAmount, setClosingAmount] = useState("");
  const [closingNotes, setClosingNotes] = useState("");

  const [movDialog, setMovDialog] = useState<null | MovementType>(null);
  const [movForm, setMovForm] = useState({ amount: "", description: "", payment_method_id: "" });

  const [detailReg, setDetailReg] = useState<any | null>(null);
  const { data: detailMovs = [] } = useCashMovements(detailReg?.id);

  const summary = useMemo(() => {
    let entradas = 0, saidas = 0;
    const byMethod: Record<string, { name: string; total: number }> = {};
    for (const m of movements as any[]) {
      const sign = movSign[m.movement_type] ?? 1;
      const v = Number(m.amount || 0) * sign;
      if (v >= 0) entradas += v; else saidas += -v;
      const key = m.payment_methods?.id ?? "sem-forma";
      const name = m.payment_methods?.name ?? "Sem forma";
      byMethod[key] = byMethod[key] ?? { name, total: 0 };
      byMethod[key].total += v;
    }
    const opening = Number(openReg?.opening_amount || 0);
    const expected = opening + entradas - saidas;
    return { entradas, saidas, opening, expected, byMethod };
  }, [movements, openReg]);

  const submitOpen = async () => {
    await openCash.mutateAsync({ opening_amount: Number(openForm.opening_amount) || 0, notes: openForm.notes || undefined });
    setOpenDialog(false); setOpenForm({ opening_amount: "0", notes: "" });
  };

  const submitClose = async () => {
    if (!openReg) return;
    const informed = Number(closingAmount);
    const diff = informed - summary.expected;
    if (Math.abs(diff) > 0.009 && !closingNotes.trim()) return;
    const byMethodPayload: Record<string, number> = {};
    Object.values(summary.byMethod).forEach(b => { byMethodPayload[b.name] = b.total; });
    await closeCash.mutateAsync({
      id: (openReg as any).id,
      expected_amount: summary.expected,
      closing_amount: informed,
      summary_by_method: byMethodPayload,
      notes: closingNotes || undefined,
    });
    setCloseDialog(false); setClosingAmount(""); setClosingNotes("");
  };

  const submitMov = async () => {
    if (!openReg || !movDialog) return;
    await addMov.mutateAsync({
      cash_register_id: (openReg as any).id,
      movement_type: movDialog,
      amount: Number(movForm.amount),
      description: movForm.description || undefined,
      payment_method_id: movForm.payment_method_id || undefined,
    });
    setMovDialog(null); setMovForm({ amount: "", description: "", payment_method_id: "" });
  };

  const divergence = closingAmount ? Number(closingAmount) - summary.expected : 0;

  return (
    <div className="space-y-4">
      {/* Header / open state */}
      <Card>
        <CardHeader className="flex-row justify-between items-center flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Caixa atual</CardTitle>
            {openReg && <p className="text-xs text-muted-foreground mt-1">Aberto em {format(new Date((openReg as any).opened_at), "dd/MM/yyyy HH:mm")}</p>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {!openReg && (
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild><Button><Unlock className="h-4 w-4 mr-1" />Abrir Caixa</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Abrir caixa</DialogTitle></DialogHeader>
                  <div className="grid gap-3">
                    <div><Label>Saldo inicial (R$)</Label><Input type="number" min="0" step="0.01" value={openForm.opening_amount} onChange={e => setOpenForm({ ...openForm, opening_amount: e.target.value })} /></div>
                    <div><Label>Observações</Label><Textarea value={openForm.notes} onChange={e => setOpenForm({ ...openForm, notes: e.target.value })} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button disabled={openCash.isPending} onClick={submitOpen}>Abrir</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {openReg && (
              <>
                <Button variant="outline" onClick={() => setMovDialog("suprimento")}><ArrowDownCircle className="h-4 w-4 mr-1" />Suprimento</Button>
                <Button variant="outline" onClick={() => setMovDialog("sangria")}><ArrowUpCircle className="h-4 w-4 mr-1" />Sangria</Button>
                <Button variant="outline" onClick={() => setMovDialog("despesa")}><Wrench className="h-4 w-4 mr-1" />Despesa rápida</Button>
                <Button variant="outline" onClick={() => setMovDialog("ajuste")}><Wrench className="h-4 w-4 mr-1" />Ajuste</Button>
                <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
                  <DialogTrigger asChild><Button variant="destructive"><Lock className="h-4 w-4 mr-1" />Fechar Caixa</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Fechar caixa · Conferência</DialogTitle></DialogHeader>
                    <div className="grid gap-3 text-sm">
                      <div className="flex justify-between border rounded-md p-3 bg-muted/40">
                        <div>Total esperado</div><div className="font-semibold">{fmt(summary.expected)}</div>
                      </div>
                      <div><Label>Total informado em caixa (R$)</Label><Input type="number" min="0" step="0.01" value={closingAmount} onChange={e => setClosingAmount(e.target.value)} /></div>
                      {closingAmount && (
                        <div className={"flex justify-between border rounded-md p-3 " + (Math.abs(divergence) < 0.01 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50")}>
                          <div>Diferença</div><div className="font-semibold">{fmt(divergence)}</div>
                        </div>
                      )}
                      <div>
                        <Label>Observações {Math.abs(divergence) > 0.009 && <span className="text-red-600">*obrigatória</span>}</Label>
                        <Textarea value={closingNotes} onChange={e => setClosingNotes(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCloseDialog(false)}>Cancelar</Button>
                      <Button disabled={!closingAmount || closeCash.isPending || (Math.abs(divergence) > 0.009 && !closingNotes.trim())} onClick={submitClose}>Fechar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadOpen ? <Skeleton className="h-24" /> : !openReg ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Nenhum caixa aberto no momento. Clique em <b>Abrir Caixa</b> para começar.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><div className="text-xs text-muted-foreground">Abertura</div><div className="text-lg font-semibold">{fmt(summary.opening)}</div></div>
              <div><div className="text-xs text-muted-foreground">Entradas</div><div className="text-lg font-semibold text-green-600">{fmt(summary.entradas)}</div></div>
              <div><div className="text-xs text-muted-foreground">Saídas</div><div className="text-lg font-semibold text-red-600">{fmt(summary.saidas)}</div></div>
              <div><div className="text-xs text-muted-foreground">Saldo esperado</div><div className="text-xl font-bold">{fmt(summary.expected)}</div></div>
            </div>
          )}
        </CardContent>
      </Card>

      {openReg && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Resumo por forma de pagamento</CardTitle></CardHeader>
            <CardContent>
              {Object.keys(summary.byMethod).length === 0 ? <div className="text-sm text-muted-foreground">Sem movimentos.</div> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Forma</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {Object.values(summary.byMethod).map((b, i) => (
                      <TableRow key={i}><TableCell>{b.name}</TableCell><TableCell className="text-right">{fmt(b.total)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Movimentos do caixa</CardTitle></CardHeader>
            <CardContent>
              {movements.length === 0 ? <div className="text-sm text-muted-foreground">Sem movimentos.</div> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Hora</TableHead><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead><TableHead>Forma</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(movements as any[]).map(m => {
                      const sign = movSign[m.movement_type] ?? 1;
                      const v = Number(m.amount) * sign;
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="text-xs">{format(new Date(m.performed_at), "HH:mm")}</TableCell>
                          <TableCell><Badge variant="outline">{movLabels[m.movement_type] ?? m.movement_type}</Badge></TableCell>
                          <TableCell className="text-xs">{m.description ?? "-"}</TableCell>
                          <TableCell className="text-xs">{m.payment_methods?.name ?? "-"}</TableCell>
                          <TableCell className={"text-right " + (v >= 0 ? "text-green-600" : "text-red-600")}>{fmt(v)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* History */}
      <Card>
        <CardHeader className="flex-row justify-between items-center gap-2 flex-wrap">
          <CardTitle className="text-base">Histórico de caixas</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Input type="date" value={histFilters.startDate ?? ""} onChange={e => setHistFilters(f => ({ ...f, startDate: e.target.value || undefined }))} className="w-[150px]" />
            <Input type="date" value={histFilters.endDate ?? ""} onChange={e => setHistFilters(f => ({ ...f, endDate: e.target.value || undefined }))} className="w-[150px]" />
            <Select value={histFilters.status ?? "all"} onValueChange={v => setHistFilters(f => ({ ...f, status: v }))}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? <div className="text-sm text-muted-foreground py-6 text-center">Nenhum caixa no período.</div> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Abertura</TableHead><TableHead>Fechamento</TableHead>
                <TableHead>Abertura R$</TableHead><TableHead>Esperado</TableHead>
                <TableHead>Informado</TableHead><TableHead>Diferença</TableHead>
                <TableHead>Status</TableHead><TableHead />
              </TableRow></TableHeader>
              <TableBody>
                {(history as any[]).map(h => (
                  <TableRow key={h.id}>
                    <TableCell>{format(new Date(h.opened_at), "dd/MM/yyyy HH:mm")}</TableCell>
                    <TableCell>{h.closed_at ? format(new Date(h.closed_at), "dd/MM/yyyy HH:mm") : "-"}</TableCell>
                    <TableCell>{fmt(Number(h.opening_amount))}</TableCell>
                    <TableCell>{h.expected_amount != null ? fmt(Number(h.expected_amount)) : "-"}</TableCell>
                    <TableCell>{h.closing_amount != null ? fmt(Number(h.closing_amount)) : "-"}</TableCell>
                    <TableCell className={h.difference_amount ? (Math.abs(Number(h.difference_amount)) > 0.009 ? "text-orange-600" : "") : ""}>
                      {h.difference_amount != null ? fmt(Number(h.difference_amount)) : "-"}
                    </TableCell>
                    <TableCell><Badge variant={h.status === "aberto" ? "default" : "secondary"}>{h.status}</Badge></TableCell>
                    <TableCell className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setDetailReg(h)}>Detalhes</Button>
                      {canAdmin && h.status === "fechado" && (
                        <Button size="sm" variant="ghost" onClick={() => {
                          const reason = prompt("Motivo da reabertura:");
                          if (reason) reopen.mutate({ id: h.id, reason });
                        }}><RotateCw className="h-3.5 w-3.5" /></Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Movement dialog */}
      <Dialog open={!!movDialog} onOpenChange={o => !o && setMovDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{movDialog ? movLabels[movDialog] : ""}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Valor (R$)</Label><Input type="number" min="0" step="0.01" value={movForm.amount} onChange={e => setMovForm({ ...movForm, amount: e.target.value })} /></div>
            <div>
              <Label>Forma de pagamento</Label>
              <Select value={movForm.payment_method_id} onValueChange={v => setMovForm({ ...movForm, payment_method_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>{methods.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Textarea value={movForm.description} onChange={e => setMovForm({ ...movForm, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovDialog(null)}>Cancelar</Button>
            <Button disabled={!movForm.amount || addMov.isPending} onClick={submitMov}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detailReg} onOpenChange={o => !o && setDetailReg(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalhe do caixa</DialogTitle></DialogHeader>
          {detailReg && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>Abertura: {format(new Date(detailReg.opened_at), "dd/MM/yyyy HH:mm")}</div>
                <div>Fechamento: {detailReg.closed_at ? format(new Date(detailReg.closed_at), "dd/MM/yyyy HH:mm") : "-"}</div>
                <div>Saldo inicial: {fmt(Number(detailReg.opening_amount))}</div>
                <div>Esperado: {detailReg.expected_amount != null ? fmt(Number(detailReg.expected_amount)) : "-"}</div>
                <div>Informado: {detailReg.closing_amount != null ? fmt(Number(detailReg.closing_amount)) : "-"}</div>
                <div>Diferença: {detailReg.difference_amount != null ? fmt(Number(detailReg.difference_amount)) : "-"}</div>
              </div>
              {detailReg.notes && <div className="p-2 bg-muted rounded text-xs">Obs: {detailReg.notes}</div>}
              {detailReg.reopen_reason && <div className="p-2 bg-orange-50 text-orange-700 rounded text-xs">Reaberto: {detailReg.reopen_reason}</div>}
              <div>
                <div className="font-medium mb-2">Movimentos ({detailMovs.length})</div>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Hora</TableHead><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {(detailMovs as any[]).map(m => (
                        <TableRow key={m.id}>
                          <TableCell className="text-xs">{format(new Date(m.performed_at), "HH:mm")}</TableCell>
                          <TableCell>{movLabels[m.movement_type] ?? m.movement_type}</TableCell>
                          <TableCell className="text-xs">{m.description ?? "-"}</TableCell>
                          <TableCell className="text-right">{fmt(Number(m.amount) * (movSign[m.movement_type] ?? 1))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
