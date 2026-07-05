import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, DollarSign } from "lucide-react";
import { useCommissions, CommissionStatus } from "@/hooks/finance/useCommissions";

const fmt = (v: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v ?? 0));

const STATUS_LABEL: Record<CommissionStatus, string> = {
  pendente: "Pendente", aprovado: "Aprovada", pago: "Paga",
  cancelado: "Cancelada", estornada: "Estornada", bloqueada: "Bloqueada",
};

export function MyCommissionsPanel({
  professionalId,
  dateRange,
}: {
  professionalId: string;
  dateRange: { start: Date; end: Date };
}) {
  const { data: rows = [], isLoading } = useCommissions({
    onlyOwn: true,
    ownProfessionalId: professionalId,
    startDate: format(dateRange.start, "yyyy-MM-dd"),
    endDate: format(dateRange.end, "yyyy-MM-dd"),
  });

  const totals = useMemo(() => {
    let toReceive = 0, received = 0;
    for (const r of rows) {
      if (r.status === "pago") received += Number(r.commission_amount || 0);
      else if (r.status === "pendente" || r.status === "aprovado") toReceive += Number(r.commission_amount || 0);
    }
    return { toReceive, received };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">A receber</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold text-orange-600">{fmt(totals.toReceive)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Recebido</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold text-green-600">{fmt(totals.received)}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Minhas Comissões</CardTitle>
          <CardDescription>Comissões geradas pelos seus atendimentos</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="animate-spin h-5 w-5" /></div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma comissão encontrada no período.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">%/Fixo</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">
                        {r.reference_date ? format(new Date(r.reference_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </TableCell>
                      <TableCell>{r.patient?.full_name ?? "-"}</TableCell>
                      <TableCell>{r.procedure?.name ?? "-"}</TableCell>
                      <TableCell className="text-right">{fmt(r.base_amount)}</TableCell>
                      <TableCell className="text-right text-xs">
                        {r.percent_applied ? `${r.percent_applied}%` : r.fixed_applied ? fmt(r.fixed_applied) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmt(r.commission_amount)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {r.due_date ? format(new Date(r.due_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </TableCell>
                      <TableCell><Badge variant="outline">{STATUS_LABEL[r.status]}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
