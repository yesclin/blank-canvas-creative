import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Settings2, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useActiveClinicScope } from "@/hooks/useActiveClinicScope";
import { usePermissions } from "@/hooks/usePermissions";
import {
  useCommissions, useCommissionActions, CommissionStatus,
} from "@/hooks/finance/useCommissions";
import {
  useCommissionRules, useCommissionRuleActions, CommissionRule, CommissionRuleKind,
} from "@/hooks/finance/useCommissionRules";

const fmt = (v: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v ?? 0));

const STATUS_LABEL: Record<CommissionStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovada",
  pago: "Paga",
  cancelado: "Cancelada",
  estornada: "Estornada",
  bloqueada: "Bloqueada",
};
const STATUS_VARIANT: Record<CommissionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "secondary",
  aprovado: "outline",
  pago: "default",
  cancelado: "destructive",
  estornada: "destructive",
  bloqueada: "outline",
};

export function CommissionsTab() {
  const { isOwner, isAdmin } = usePermissions();
  const canManage = isOwner || isAdmin;

  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [status, setStatus] = useState<CommissionStatus | "todos">("todos");
  const [professionalId, setProfessionalId] = useState<string>("all");
  const [procedureId, setProcedureId] = useState<string>("all");

  const { data: professionals = [] } = useQuery({
    queryKey: ["commissions-professionals"],
    queryFn: async () => {
      const { data } = await supabase.from("professionals").select("id, full_name").order("full_name");
      return data ?? [];
    },
  });
  const { data: procedures = [] } = useQuery({
    queryKey: ["commissions-procedures"],
    queryFn: async () => {
      const { data } = await supabase.from("procedures").select("id, name").order("name");
      return data ?? [];
    },
  });

  const { data: rows = [], isLoading } = useCommissions({
    startDate, endDate,
    status,
    professionalId: professionalId === "all" ? undefined : professionalId,
    procedureId: procedureId === "all" ? undefined : procedureId,
  });

  const { markPaid, cancel, refund } = useCommissionActions();
  const [reasonOpen, setReasonOpen] = useState<{ id: string; mode: "cancel" | "refund" } | null>(null);
  const [reason, setReason] = useState("");

  const totals = useMemo(() => {
    const t = { pending: 0, paid: 0, cancelled: 0, count: rows.length };
    for (const r of rows) {
      if (r.status === "pago") t.paid += Number(r.commission_amount || 0);
      else if (r.status === "cancelado" || r.status === "estornada") t.cancelled += Number(r.commission_amount || 0);
      else t.pending += Number(r.commission_amount || 0);
    }
    return t;
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">A pagar</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold text-orange-600">{fmt(totals.pending)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pagas</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold text-green-600">{fmt(totals.paid)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Canceladas/Estornadas</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold text-muted-foreground">{fmt(totals.cancelled)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Registros</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{totals.count}</CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">Comissões</CardTitle>
          {canManage && <RulesDialog professionals={professionals as any} procedures={procedures as any} />}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div><Label className="text-xs">Início</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><Label className="text-xs">Fim</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {(Object.keys(STATUS_LABEL) as CommissionStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Profissional</Label>
              <Select value={professionalId} onValueChange={setProfessionalId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(professionals as any[]).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Procedimento</Label>
              <Select value={procedureId} onValueChange={setProcedureId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(procedures as any[]).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="animate-spin h-5 w-5" /></div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Nenhuma comissão no período.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead className="text-right">Bruto</TableHead>
                    <TableHead className="text-right">Recebido</TableHead>
                    <TableHead className="text-right">%/Fixo</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">
                        {r.reference_date ? format(new Date(r.reference_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </TableCell>
                      <TableCell>{r.professional?.full_name ?? "-"}</TableCell>
                      <TableCell>{r.patient?.full_name ?? "-"}</TableCell>
                      <TableCell>{r.procedure?.name ?? "-"}</TableCell>
                      <TableCell className="text-right">{fmt(r.gross_amount)}</TableCell>
                      <TableCell className="text-right">{fmt(r.received_amount)}</TableCell>
                      <TableCell className="text-right text-xs">
                        {r.percent_applied ? `${r.percent_applied}%` : r.fixed_applied ? fmt(r.fixed_applied) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmt(r.commission_amount)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {r.due_date ? format(new Date(r.due_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      </TableCell>
                      <TableCell>
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(r.status === "pendente" || r.status === "aprovado") && (
                                <DropdownMenuItem onClick={() => markPaid.mutate(r.id)}>
                                  Marcar como paga
                                </DropdownMenuItem>
                              )}
                              {(r.status === "pendente" || r.status === "aprovado" || r.status === "bloqueada") && (
                                <DropdownMenuItem onClick={() => { setReasonOpen({ id: r.id, mode: "cancel" }); setReason(""); }}>
                                  Cancelar
                                </DropdownMenuItem>
                              )}
                              {r.status === "pago" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => { setReasonOpen({ id: r.id, mode: "refund" }); setReason(""); }}>
                                    Estornar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!reasonOpen} onOpenChange={(o) => !o && setReasonOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reasonOpen?.mode === "refund" ? "Estornar comissão" : "Cancelar comissão"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReasonOpen(null)}>Fechar</Button>
            <Button
              onClick={() => {
                if (!reasonOpen || !reason.trim()) return;
                const action = reasonOpen.mode === "refund" ? refund : cancel;
                action.mutate({ id: reasonOpen.id, reason: reason.trim() }, {
                  onSuccess: () => setReasonOpen(null),
                });
              }}
              disabled={!reason.trim()}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Sub-componente: Regras
// ============================================================
function RulesDialog({
  professionals, procedures,
}: {
  professionals: Array<{ id: string; full_name: string }>;
  procedures: Array<{ id: string; name: string }>;
}) {
  const { clinicId } = useActiveClinicScope();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<CommissionRule> | null>(null);
  const { data: rules = [], isLoading } = useCommissionRules();
  const { upsert, remove, toggleActive } = useCommissionRuleActions();

  const { data: insurances = [] } = useQuery({
    queryKey: ["commissions-insurances"],
    queryFn: async () => {
      const { data } = await supabase.from("insurances").select("id, name").order("name");
      return data ?? [];
    },
  });

  const emptyRule = (): Partial<CommissionRule> => ({
    kind: "percentual",
    percentual: 10,
    valor_fixo: null,
    pay_trigger: "on_finish",
    priority: 0,
    is_active: true,
    applies_to_particular: false,
    applies_to_convenio: false,
  });

  const save = () => {
    if (!editing || !clinicId) return;
    upsert.mutate(
      {
        ...(editing as any),
        clinic_id: clinicId,
        kind: (editing.kind ?? "percentual") as CommissionRuleKind,
      },
      { onSuccess: () => setEditing(null) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Settings2 className="h-4 w-4 mr-1" />Regras</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Regras de Comissão</DialogTitle></DialogHeader>

        <div className="flex justify-end mb-2">
          <Button size="sm" onClick={() => setEditing(emptyRule())}>
            <Plus className="h-4 w-4 mr-1" /> Nova regra
          </Button>
        </div>

        {isLoading ? (
          <div className="py-6 flex justify-center"><Loader2 className="animate-spin h-5 w-5" /></div>
        ) : rules.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Nenhuma regra cadastrada.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Alvo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Gatilho</TableHead>
                <TableHead>Ativa</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{r.kind}</TableCell>
                  <TableCell className="text-xs">
                    {r.professional?.full_name && <div>👤 {r.professional.full_name}</div>}
                    {r.procedure?.name && <div>🩺 {r.procedure.name}</div>}
                    {r.insurance?.name && <div>🏥 {r.insurance.name}</div>}
                    {r.applies_to_particular && <div>💵 Particular</div>}
                    {r.applies_to_convenio && <div>🏥 Todos convênios</div>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.percentual ? `${r.percentual}%` : r.valor_fixo ? fmt(r.valor_fixo) : "-"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.pay_trigger === "on_payment" ? "No recebimento" : "Ao finalizar"}
                  </TableCell>
                  <TableCell>
                    <Switch checked={r.is_active}
                      onCheckedChange={(v) => toggleActive.mutate({ id: r.id, is_active: v })} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>Editar</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id)}>Excluir</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {editing && (
          <div className="border-t pt-4 space-y-3">
            <div className="text-sm font-semibold">{editing.id ? "Editar" : "Nova"} regra</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={editing.kind ?? "percentual"} onValueChange={(v) => setEditing({ ...editing, kind: v as CommissionRuleKind })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentual">Percentual</SelectItem>
                    <SelectItem value="fixo">Valor fixo</SelectItem>
                    <SelectItem value="por_procedimento">Por procedimento</SelectItem>
                    <SelectItem value="por_especialidade">Por especialidade</SelectItem>
                    <SelectItem value="por_convenio">Por convênio</SelectItem>
                    <SelectItem value="por_particular">Por particular</SelectItem>
                    <SelectItem value="por_pacote">Por pacote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Gatilho</Label>
                <Select value={editing.pay_trigger ?? "on_finish"} onValueChange={(v) => setEditing({ ...editing, pay_trigger: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_finish">Ao finalizar atendimento</SelectItem>
                    <SelectItem value="on_payment">Quando o pagamento for recebido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Percentual (%)</Label>
                <Input type="number" step="0.01" value={editing.percentual ?? ""} onChange={(e) => setEditing({ ...editing, percentual: e.target.value === "" ? null : Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Valor fixo (R$)</Label>
                <Input type="number" step="0.01" value={editing.valor_fixo ?? ""} onChange={(e) => setEditing({ ...editing, valor_fixo: e.target.value === "" ? null : Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Profissional</Label>
                <Select value={editing.professional_id ?? "any"} onValueChange={(v) => setEditing({ ...editing, professional_id: v === "any" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer</SelectItem>
                    {professionals.map((p) => (<SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Procedimento</Label>
                <Select value={editing.procedure_id ?? "any"} onValueChange={(v) => setEditing({ ...editing, procedure_id: v === "any" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer</SelectItem>
                    {procedures.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Convênio</Label>
                <Select value={editing.insurance_id ?? "any"} onValueChange={(v) => setEditing({ ...editing, insurance_id: v === "any" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer</SelectItem>
                    {(insurances as any[]).map((i) => (<SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Prioridade</Label>
                <Input type="number" value={editing.priority ?? 0} onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!editing.applies_to_particular} onCheckedChange={(v) => setEditing({ ...editing, applies_to_particular: v })} />
                <Label className="text-xs">Aplicar a particular</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!editing.applies_to_convenio} onCheckedChange={(v) => setEditing({ ...editing, applies_to_convenio: v })} />
                <Label className="text-xs">Aplicar a todos os convênios</Label>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Observações</Label>
                <Textarea rows={2} value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={save} disabled={upsert.isPending}>
                {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Salvar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
