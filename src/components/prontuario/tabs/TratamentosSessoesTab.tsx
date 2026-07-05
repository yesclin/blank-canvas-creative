import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Calendar, CheckCircle, X, Eye, CalendarPlus } from "lucide-react";
import { usePatientPackagesFull } from "@/hooks/finance/useTreatmentPackageIntegration";
import { usePackageSessions, usePackagePayments, useUpdatePackageStatus } from "@/hooks/finance/useTreatmentPackagesFull";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d?: string | null) => {
  if (!d) return "-";
  try { return format(parseISO(d), "dd/MM/yyyy", { locale: ptBR }); } catch { return d; }
};

const statusColor: Record<string, string> = {
  ativo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  concluido: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  cancelado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  expirado: "bg-gray-200 text-gray-800",
};
const statusLabel: Record<string, string> = {
  ativo: "Ativo", concluido: "Concluído", cancelado: "Cancelado", expirado: "Expirado",
};

interface Props {
  patientId: string;
  canEdit?: boolean;
}

function PackageCard({ pkg, onOpen, onSchedule, canEdit }: {
  pkg: any;
  onOpen: () => void;
  onSchedule: () => void;
  canEdit: boolean;
}) {
  const update = useUpdatePackageStatus();
  const total = Number(pkg.total_sessions ?? 0);
  const used = Number(pkg.used_sessions ?? 0);
  const pct = total > 0 ? (used / total) * 100 : 0;
  const balance = Number(pkg.total_amount ?? 0) - Number(pkg.paid_amount ?? 0);
  const financeLabel = balance <= 0.009 ? "Quitado" : Number(pkg.paid_amount ?? 0) > 0 ? "Parcial" : "Em aberto";
  const financeClass = balance <= 0.009 ? "text-emerald-600" : "text-amber-600";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="truncate">{pkg.name}</span>
            </CardTitle>
            <div className="text-xs text-muted-foreground mt-0.5">
              {pkg.procedures?.name ?? "Sem procedimento"} · {pkg.professionals?.full_name ?? "Qualquer profissional"}
            </div>
          </div>
          <Badge className={statusColor[pkg.status] ?? ""}>{statusLabel[pkg.status] ?? pkg.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Sessões: <strong>{used}/{total}</strong></span>
            <span className={financeClass}>{financeLabel} · saldo {fmt(balance)}</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onOpen}>
            <Eye className="h-3.5 w-3.5 mr-1" /> Ver detalhes
          </Button>
          {pkg.status === "ativo" && used < total && (
            <Button size="sm" onClick={onSchedule}>
              <CalendarPlus className="h-3.5 w-3.5 mr-1" /> Agendar próxima sessão
            </Button>
          )}
          {canEdit && pkg.status === "ativo" && (
            <>
              <Button size="sm" variant="outline" onClick={() => update.mutate({ id: pkg.id, status: "concluido" })}>
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Concluir
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                const reason = window.prompt("Motivo do cancelamento:");
                if (reason) update.mutate({ id: pkg.id, status: "cancelado", reason });
              }}>
                <X className="h-3.5 w-3.5 mr-1" /> Cancelar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PackageDrawer({ pkg, onClose }: { pkg: any | null; onClose: () => void }) {
  const sessions = usePackageSessions(pkg?.id ?? null);
  const payments = usePackagePayments(pkg?.id ?? null);
  if (!pkg) return null;
  const total = Number(pkg.total_amount ?? 0);
  const paid = Number(pkg.paid_amount ?? 0);
  const balance = total - paid;

  return (
    <Sheet open={!!pkg} onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" /> {pkg.name}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Procedimento:</span> {pkg.procedures?.name ?? "-"}</div>
            <div><span className="text-muted-foreground">Profissional:</span> {pkg.professionals?.full_name ?? "Qualquer"}</div>
            <div><span className="text-muted-foreground">Status:</span> <Badge className={statusColor[pkg.status] ?? ""}>{statusLabel[pkg.status] ?? pkg.status}</Badge></div>
            <div><span className="text-muted-foreground">Sessões:</span> {pkg.used_sessions}/{pkg.total_sessions}</div>
            <div><span className="text-muted-foreground">Total:</span> {fmt(total)}</div>
            <div><span className="text-muted-foreground">Pago:</span> <span className="text-emerald-600">{fmt(paid)}</span></div>
            <div><span className="text-muted-foreground">Saldo:</span> <span className="text-amber-600">{fmt(balance)}</span></div>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Histórico de sessões</CardTitle></CardHeader>
            <CardContent>
              {(sessions.data ?? []).length === 0 ? (
                <div className="text-xs text-muted-foreground py-3 text-center">Nenhuma sessão vinculada.</div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Hora</TableHead><TableHead>Profissional</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>{sessions.data!.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell>{fmtDate(s.scheduled_date)}</TableCell>
                      <TableCell>{s.start_time?.slice(0, 5)}</TableCell>
                      <TableCell>{s.professionals?.full_name ?? "-"}</TableCell>
                      <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Pagamentos / parcelas</CardTitle></CardHeader>
            <CardContent>
              {(payments.data ?? []).length === 0 ? (
                <div className="text-xs text-muted-foreground py-3 text-center">Sem cobranças vinculadas.</div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Parcela</TableHead><TableHead>Vencimento</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>{payments.data!.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.installment_number ?? "-"}/{t.total_installments ?? "-"}</TableCell>
                      <TableCell>{fmtDate(t.due_date)}</TableCell>
                      <TableCell>{fmt(Number(t.amount))}</TableCell>
                      <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function TratamentosSessoesTab({ patientId, canEdit = true }: Props) {
  const navigate = useNavigate();
  const { data = [], isLoading } = usePatientPackagesFull(patientId);
  const [selected, setSelected] = useState<any | null>(null);

  const grouped = {
    ativo: data.filter((p: any) => p.status === "ativo"),
    concluido: data.filter((p: any) => p.status === "concluido"),
    cancelado: data.filter((p: any) => ["cancelado", "expirado"].includes(p.status)),
  };

  const goSchedule = (pkg: any) => {
    const params = new URLSearchParams();
    params.set("patient_id", patientId);
    params.set("package_id", pkg.id);
    if (pkg.procedure_id) params.set("procedure_id", pkg.procedure_id);
    if (pkg.professional_id) params.set("professional_id", pkg.professional_id);
    navigate(`/app/agenda?${params.toString()}`);
  };

  if (isLoading) return <div className="text-sm text-muted-foreground py-6 text-center">Carregando pacotes…</div>;

  const renderList = (list: any[]) => {
    if (list.length === 0) {
      return <div className="text-sm text-muted-foreground py-8 text-center">Nenhum pacote nesta categoria.</div>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {list.map((p: any) => (
          <PackageCard
            key={p.id}
            pkg={p}
            canEdit={canEdit}
            onOpen={() => setSelected(p)}
            onSchedule={() => goSchedule(p)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Tratamentos / Sessões</h2>
      </div>

      <Tabs defaultValue="ativo">
        <TabsList>
          <TabsTrigger value="ativo">Ativos <Badge variant="secondary" className="ml-2">{grouped.ativo.length}</Badge></TabsTrigger>
          <TabsTrigger value="concluido">Concluídos <Badge variant="secondary" className="ml-2">{grouped.concluido.length}</Badge></TabsTrigger>
          <TabsTrigger value="cancelado">Cancelados <Badge variant="secondary" className="ml-2">{grouped.cancelado.length}</Badge></TabsTrigger>
        </TabsList>
        <TabsContent value="ativo" className="mt-4">{renderList(grouped.ativo)}</TabsContent>
        <TabsContent value="concluido" className="mt-4">{renderList(grouped.concluido)}</TabsContent>
        <TabsContent value="cancelado" className="mt-4">{renderList(grouped.cancelado)}</TabsContent>
      </Tabs>

      <PackageDrawer pkg={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default TratamentosSessoesTab;
