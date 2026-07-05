import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { useFinanceReports } from "@/hooks/finance/useFinanceReports";
import { toCSV, toPDF, fmtMoney } from "@/utils/financeExport";

type Row = Record<string, any>;

function groupSum<T>(items: T[], keyFn: (t: T) => string, labelFn: (t: T) => string, valueFn: (t: T) => number) {
  const map = new Map<string, { key: string; label: string; total: number; count: number }>();
  for (const it of items) {
    const k = keyFn(it) || "—";
    const cur = map.get(k) ?? { key: k, label: labelFn(it) || "—", total: 0, count: 0 };
    cur.total += valueFn(it) || 0;
    cur.count += 1;
    map.set(k, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function ReportTable({
  title,
  rows,
  columns,
  emptyMessage = "Sem dados no período.",
  exportName,
}: {
  title: string;
  rows: Row[];
  columns: { key: string; label: string; format?: (v: any, r: Row) => string }[];
  emptyMessage?: string;
  exportName: string;
}) {
  const exportRows = rows.map((r) => {
    const out: Row = {};
    columns.forEach((c) => (out[c.label] = c.format ? c.format(r[c.key], r) : r[c.key]));
    return out;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => toCSV(exportRows, `${exportName}.csv`)}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => toPDF(title, exportRows, `${exportName}.pdf`)}>
            <FileText className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8 flex flex-col items-center gap-2">
            <AlertCircle className="h-6 w-6 text-muted-foreground/60" />
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {columns.map((c) => (
                    <th key={c.key} className="text-left py-2 px-2 font-medium text-muted-foreground">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b hover:bg-muted/40">
                    {columns.map((c) => (
                      <td key={c.key} className="py-2 px-2">
                        {c.format ? c.format(r[c.key], r) : r[c.key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ReportsTab() {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(first);
  const [endDate, setEndDate] = useState(last);
  const [subtab, setSubtab] = useState("dre");

  const { data, isLoading, error } = useFinanceReports({ startDate, endDate });

  const transactions = data?.transactions ?? [];
  const commissions = data?.commissions ?? [];
  const packages = data?.packages ?? [];

  const receitas = transactions.filter((t) => t.type === "receita");
  const despesas = transactions.filter((t) => t.type === "despesa");
  const totalReceita = receitas.reduce((s, t) => s + (Number(t.paid_amount) || 0), 0);
  const totalDespesa = despesas.reduce((s, t) => s + (Number(t.paid_amount) || 0), 0);
  const totalPendente = receitas
    .filter((t) => ["pendente", "parcial", "vencido"].includes(t.status))
    .reduce((s, t) => s + ((Number(t.amount) || 0) - (Number(t.paid_amount) || 0)), 0);

  const cashFlow = useMemo(() => {
    const byDay = new Map<string, { date: string; entradas: number; saidas: number; saldo: number }>();
    for (const t of transactions) {
      const d = (t.paid_at || t.transaction_date || "").slice(0, 10);
      if (!d || !t.paid_amount) continue;
      const cur = byDay.get(d) ?? { date: d, entradas: 0, saidas: 0, saldo: 0 };
      if (t.type === "receita") cur.entradas += Number(t.paid_amount);
      else cur.saidas += Number(t.paid_amount);
      cur.saldo = cur.entradas - cur.saidas;
      byDay.set(d, cur);
    }
    return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions]);

  const byProfessional = useMemo(
    () => groupSum(receitas, (t) => t.professional_id ?? "", (t) => t.professionals?.full_name ?? "Sem profissional", (t) => Number(t.paid_amount) || 0),
    [receitas]
  );
  const byProcedure = useMemo(
    () => groupSum(receitas, (t) => t.procedure_id ?? "", (t) => t.procedures?.name ?? "Sem procedimento", (t) => Number(t.paid_amount) || 0),
    [receitas]
  );
  const byPatient = useMemo(
    () => groupSum(receitas, (t) => t.patient_id ?? "", (t) => t.patients?.full_name ?? "Sem paciente", (t) => Number(t.paid_amount) || 0),
    [receitas]
  );
  const bySpecialty = useMemo(
    () =>
      groupSum(
        receitas,
        (t) => t.professionals?.specialty_id ?? "",
        (t) => t.professionals?.specialties?.name ?? "Sem especialidade",
        (t) => Number(t.paid_amount) || 0
      ),
    [receitas]
  );

  const overdue = receitas.filter((t) => {
    if (!t.due_date) return false;
    if (t.status === "pago" || t.status === "cancelado") return false;
    return new Date(t.due_date) < new Date() && (Number(t.amount) - Number(t.paid_amount || 0) > 0);
  });
  const paid = receitas.filter((t) => t.status === "pago");
  const toReceive = receitas.filter((t) => ["pendente", "parcial"].includes(t.status));
  const toPay = despesas.filter((t) => ["pendente", "parcial", "vencido"].includes(t.status));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive">
          Erro ao carregar relatórios: {(error as Error).message}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>De</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>Até</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <div className="grid grid-cols-3 gap-3 w-full text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Receita</div>
                <div className="font-semibold text-emerald-600">{fmtMoney(totalReceita)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Despesa</div>
                <div className="font-semibold text-rose-600">{fmtMoney(totalDespesa)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Resultado</div>
                <div className="font-semibold flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {fmtMoney(totalReceita - totalDespesa)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={subtab} onValueChange={setSubtab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="cash">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="prof">Profissional</TabsTrigger>
          <TabsTrigger value="proc">Procedimento</TabsTrigger>
          <TabsTrigger value="pat">Paciente</TabsTrigger>
          <TabsTrigger value="spec">Especialidade</TabsTrigger>
          <TabsTrigger value="overdue">Vencidas</TabsTrigger>
          <TabsTrigger value="paid">Pagas</TabsTrigger>
          <TabsTrigger value="toreceive">A Receber</TabsTrigger>
          <TabsTrigger value="topay">A Pagar</TabsTrigger>
          <TabsTrigger value="comm">Comissões</TabsTrigger>
          <TabsTrigger value="pkg">Pacotes</TabsTrigger>
        </TabsList>

        <TabsContent value="dre">
          <ReportTable
            title="DRE Simplificada"
            exportName="dre-simplificada"
            rows={[
              { linha: "Receita bruta", valor: totalReceita },
              { linha: "Despesas", valor: -totalDespesa },
              { linha: "Resultado líquido", valor: totalReceita - totalDespesa },
              { linha: "A receber (pendente)", valor: totalPendente },
            ]}
            columns={[
              { key: "linha", label: "Linha" },
              { key: "valor", label: "Valor", format: (v) => fmtMoney(Number(v)) },
            ]}
          />
        </TabsContent>

        <TabsContent value="cash">
          <ReportTable
            title="Fluxo de Caixa (por dia)"
            exportName="fluxo-caixa"
            rows={cashFlow}
            columns={[
              { key: "date", label: "Data" },
              { key: "entradas", label: "Entradas", format: (v) => fmtMoney(Number(v)) },
              { key: "saidas", label: "Saídas", format: (v) => fmtMoney(Number(v)) },
              { key: "saldo", label: "Saldo", format: (v) => fmtMoney(Number(v)) },
            ]}
          />
        </TabsContent>

        <TabsContent value="prof">
          <ReportTable
            title="Receita por Profissional"
            exportName="receita-profissional"
            rows={byProfessional}
            columns={[
              { key: "label", label: "Profissional" },
              { key: "count", label: "Lançamentos" },
              { key: "total", label: "Total", format: (v) => fmtMoney(Number(v)) },
            ]}
          />
        </TabsContent>

        <TabsContent value="proc">
          <ReportTable
            title="Receita por Procedimento"
            exportName="receita-procedimento"
            rows={byProcedure}
            columns={[
              { key: "label", label: "Procedimento" },
              { key: "count", label: "Qtd" },
              { key: "total", label: "Total", format: (v) => fmtMoney(Number(v)) },
            ]}
          />
        </TabsContent>

        <TabsContent value="pat">
          <ReportTable
            title="Receita por Paciente"
            exportName="receita-paciente"
            rows={byPatient}
            columns={[
              { key: "label", label: "Paciente" },
              { key: "count", label: "Lançamentos" },
              { key: "total", label: "Total", format: (v) => fmtMoney(Number(v)) },
            ]}
          />
        </TabsContent>

        <TabsContent value="spec">
          <ReportTable
            title="Receita por Especialidade"
            exportName="receita-especialidade"
            rows={bySpecialty}
            columns={[
              { key: "label", label: "Especialidade" },
              { key: "count", label: "Lançamentos" },
              { key: "total", label: "Total", format: (v) => fmtMoney(Number(v)) },
            ]}
          />
        </TabsContent>

        <TabsContent value="overdue">
          <ReportTable
            title="Contas Vencidas"
            exportName="contas-vencidas"
            rows={overdue}
            columns={[
              { key: "due_date", label: "Vencimento" },
              { key: "description", label: "Descrição" },
              { key: "patients", label: "Paciente", format: (v) => v?.full_name ?? "—" },
              { key: "amount", label: "Valor", format: (v) => fmtMoney(Number(v)) },
              { key: "paid_amount", label: "Pago", format: (v) => fmtMoney(Number(v)) },
              { key: "status", label: "Status", format: (v) => <Badge variant="destructive">{v}</Badge> as any },
            ]}
          />
        </TabsContent>

        <TabsContent value="paid">
          <ReportTable
            title="Contas Pagas"
            exportName="contas-pagas"
            rows={paid}
            columns={[
              { key: "paid_at", label: "Pago em", format: (v) => (v ? new Date(v).toLocaleDateString("pt-BR") : "—") },
              { key: "description", label: "Descrição" },
              { key: "patients", label: "Paciente", format: (v) => v?.full_name ?? "—" },
              { key: "payment_method", label: "Forma" },
              { key: "paid_amount", label: "Valor", format: (v) => fmtMoney(Number(v)) },
            ]}
          />
        </TabsContent>

        <TabsContent value="toreceive">
          <ReportTable
            title="Contas a Receber"
            exportName="contas-a-receber"
            rows={toReceive}
            columns={[
              { key: "due_date", label: "Vencimento" },
              { key: "description", label: "Descrição" },
              { key: "patients", label: "Paciente", format: (v) => v?.full_name ?? "—" },
              { key: "amount", label: "Valor", format: (v) => fmtMoney(Number(v)) },
              { key: "paid_amount", label: "Pago", format: (v) => fmtMoney(Number(v)) },
              { key: "status", label: "Status" },
            ]}
          />
        </TabsContent>

        <TabsContent value="topay">
          <ReportTable
            title="Contas a Pagar"
            exportName="contas-a-pagar"
            rows={toPay}
            columns={[
              { key: "due_date", label: "Vencimento" },
              { key: "description", label: "Descrição" },
              { key: "amount", label: "Valor", format: (v) => fmtMoney(Number(v)) },
              { key: "paid_amount", label: "Pago", format: (v) => fmtMoney(Number(v)) },
              { key: "status", label: "Status" },
            ]}
          />
        </TabsContent>

        <TabsContent value="comm">
          <ReportTable
            title="Comissões"
            exportName="comissoes"
            rows={commissions}
            columns={[
              { key: "generated_at", label: "Gerada em", format: (v) => (v ? new Date(v).toLocaleDateString("pt-BR") : "—") },
              { key: "professionals", label: "Profissional", format: (v) => v?.full_name ?? "—" },
              { key: "gross_amount", label: "Base", format: (v) => fmtMoney(Number(v)) },
              { key: "commission_amount", label: "Comissão", format: (v) => fmtMoney(Number(v)) },
              { key: "status", label: "Status" },
              { key: "paid_at", label: "Paga em", format: (v) => (v ? new Date(v).toLocaleDateString("pt-BR") : "—") },
            ]}
          />
        </TabsContent>

        <TabsContent value="pkg">
          <ReportTable
            title="Pacotes / Sessões"
            exportName="pacotes-sessoes"
            rows={packages}
            columns={[
              { key: "created_at", label: "Criado", format: (v) => (v ? new Date(v).toLocaleDateString("pt-BR") : "—") },
              { key: "patients", label: "Paciente", format: (v) => v?.full_name ?? "—" },
              { key: "procedures", label: "Procedimento", format: (v) => v?.name ?? "—" },
              { key: "professionals", label: "Profissional", format: (v) => v?.full_name ?? "—" },
              { key: "completed_sessions", label: "Sessões", format: (v, r) => `${v ?? 0}/${r.total_sessions ?? 0}` },
              { key: "paid_amount", label: "Pago", format: (v) => fmtMoney(Number(v)) },
              { key: "total_amount", label: "Total", format: (v) => fmtMoney(Number(v)) },
              { key: "status", label: "Status" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
