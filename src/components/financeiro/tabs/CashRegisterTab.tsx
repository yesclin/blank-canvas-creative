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
import { Wallet, ArrowUpCircle, ArrowDownCircle, Lock, Unlock } from "lucide-react";
import { useOpenCashRegister, useCashHistory, useCashMovements, useOpenCash, useCloseCash, useAddCashMovement } from "@/hooks/finance/useCashRegister";
import { paymentMethods } from "@/types/gestao";
import { format } from "date-fns";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export function CashRegisterTab() {
  const { data: openReg, isLoading: loadOpen } = useOpenCashRegister();
  const { data: history = [] } = useCashHistory();
  const { data: movements = [] } = useCashMovements(openReg?.id);
  const openCash = useOpenCash();
  const closeCash = useCloseCash();
  const addMov = useAddCashMovement();

  const [openDialog, setOpenDialog] = useState(false);
  const [openAmount, setOpenAmount] = useState("0");
  const [closeDialog, setCloseDialog] = useState(false);
  const [closingAmount, setClosingAmount] = useState("");
  const [closingNotes, setClosingNotes] = useState("");

  const [movDialog, setMovDialog] = useState<null | "sangria" | "suprimento">(null);
  const [movAmount, setMovAmount] = useState("");
  const [movDesc, setMovDesc] = useState("");
  const [movMethod, setMovMethod] = useState("dinheiro");

  const summary = useMemo(() => {
    let entradas = 0, saidas = 0;
    const byMethod: Record<string, number> = {};
    for (const m of movements as any[]) {
      const v = Number(m.amount || 0);
      if (m.type === "suprimento" || m.type === "pagamento") entradas += v;
      if (m.type === "sangria") saidas += v;
      const key = m.payment_method || "outros";
      byMethod[key] = (byMethod[key] || 0) + (m.type === "sangria" ? -v : v);
    }
    const opening = Number(openReg?.opening_amount || 0);
    const current = opening + entradas - saidas;
    return { entradas, saidas, opening, current, byMethod };
  }, [movements, openReg]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Caixa atual</CardTitle>
            {openReg && <p className="text-xs text-muted-foreground mt-1">Aberto em {format(new Date((openReg as any).opened_at), "dd/MM/yyyy HH:mm")}</p>}
          </div>
          <div className="flex gap-2">
            {!openReg && (
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild><Button><Unlock className="h-4 w-4 mr-1" />Abrir caixa</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Abrir caixa</DialogTitle></DialogHeader>
                  <div className="grid gap-2"><Label>Valor de abertura (R$)</Label><Input type="number" min="0" step="0.01" value={openAmount} onChange={e => setOpenAmount(e.target.value)} /></div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button disabled={openCash.isPending} onClick={async () => { await openCash.mutateAsync(Number(openAmount) || 0); setOpenDialog(false); setOpenAmount("0"); }}>Abrir</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {openReg && (
              <>
                <Button variant="outline" onClick={() => setMovDialog("suprimento")}><ArrowDownCircle className="h-4 w-4 mr-1" />Suprimento</Button>
                <Button variant="outline" onClick={() => setMovDialog("sangria")}><ArrowUpCircle className="h-4 w-4 mr-1" />Sangria</Button>
                <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
                  <DialogTrigger asChild><Button variant="destructive"><Lock className="h-4 w-4 mr-1" />Fechar caixa</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Fechar caixa · Conferência</DialogTitle></DialogHeader>
                    <div className="grid gap-3 text-sm">
                      <div>Saldo esperado (sistema): <b>{fmt(summary.current)}</b></div>
                      <div><Label>Valor conferido em caixa (R$)</Label><Input type="number" min="0" step="0.01" value={closingAmount} onChange={e => setClosingAmount(e.target.value)} /></div>
                      {closingAmount && <div className={Number(closingAmount) === summary.current ? "text-green-600" : "text-orange-600"}>Divergência: {fmt(Number(closingAmount) - summary.current)}</div>}
                      <div><Label>Observações</Label><Textarea value={closingNotes} onChange={e => setClosingNotes(e.target.value)} /></div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCloseDialog(false)}>Cancelar</Button>
                      <Button disabled={!closingAmount || closeCash.isPending} onClick={async () => {
                        await closeCash.mutateAsync({ id: (openReg as any).id, closing_amount: Number(closingAmount), notes: closingNotes });
                        setCloseDialog(false); setClosingAmount(""); setClosingNotes("");
                      }}>Fechar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadOpen ? <Skeleton className="h-24" /> : !openReg ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Nenhum caixa aberto no momento.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><div className="text-xs text-muted-foreground">Abertura</div><div className="text-lg font-semibold">{fmt(summary.opening)}</div></div>
              <div><div className="text-xs text-muted-foreground">Entradas</div><div className="text-lg font-semibold text-green-600">{fmt(summary.entradas)}</div></div>
              <div><div className="text-xs text-muted-foreground">Sangrias</div><div className="text-lg font-semibold text-red-600">{fmt(summary.saidas)}</div></div>
              <div><div className="text-xs text-muted-foreground">Saldo atual</div><div className="text-xl font-bold">{fmt(summary.current)}</div></div>
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
                    {Object.entries(summary.byMethod).map(([k, v]) => (
                      <TableRow key={k}><TableCell>{paymentMethods.find(m => m.value === k)?.label ?? k}</TableCell><TableCell className="text-right">{fmt(v)}</TableCell></TableRow>
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
                  <TableHeader><TableRow><TableHead>Hora</TableHead><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(movements as any[]).map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs">{format(new Date(m.created_at), "HH:mm")}</TableCell>
                        <TableCell><Badge variant="outline">{m.type}</Badge></TableCell>
                        <TableCell className="text-xs">{m.description ?? "-"}</TableCell>
                        <TableCell className={"text-right " + (m.type === "sangria" ? "text-red-600" : "text-green-600")}>{fmt(Number(m.amount))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Histórico de caixas</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? <div className="text-sm text-muted-foreground">Sem histórico.</div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Abertura</TableHead><TableHead>Fechamento</TableHead><TableHead>Abertura R$</TableHead><TableHead>Fechamento R$</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {(history as any[]).map(h => (
                  <TableRow key={h.id}>
                    <TableCell>{format(new Date(h.opened_at), "dd/MM/yyyy HH:mm")}</TableCell>
                    <TableCell>{h.closed_at ? format(new Date(h.closed_at), "dd/MM/yyyy HH:mm") : "-"}</TableCell>
                    <TableCell>{fmt(Number(h.opening_amount))}</TableCell>
                    <TableCell>{h.closing_amount != null ? fmt(Number(h.closing_amount)) : "-"}</TableCell>
                    <TableCell><Badge variant={h.status === "aberto" ? "default" : "secondary"}>{h.status}</Badge></TableCell>
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
          <DialogHeader><DialogTitle>{movDialog === "sangria" ? "Sangria" : "Suprimento"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Valor (R$)</Label><Input type="number" min="0" step="0.01" value={movAmount} onChange={e => setMovAmount(e.target.value)} /></div>
            <div>
              <Label>Forma</Label>
              <Select value={movMethod} onValueChange={setMovMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{paymentMethods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Textarea value={movDesc} onChange={e => setMovDesc(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovDialog(null)}>Cancelar</Button>
            <Button disabled={!movAmount || addMov.isPending} onClick={async () => {
              if (!openReg || !movDialog) return;
              await addMov.mutateAsync({ cash_register_id: (openReg as any).id, type: movDialog, amount: Number(movAmount), description: movDesc, payment_method: movMethod });
              setMovDialog(null); setMovAmount(""); setMovDesc("");
            }}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
