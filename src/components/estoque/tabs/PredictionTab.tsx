import { useState, useMemo } from "react";
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Calculator,
  Info,
  Loader2,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts";
import { useStockForecast } from "@/hooks/useStockForecast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const windowOptions = [
  { value: 30, label: "30 dias" },
  { value: 60, label: "60 dias" },
  { value: 90, label: "90 dias" },
  { value: 180, label: "6 meses" },
  { value: 365, label: "12 meses" },
];

function severityBadge(sev: string, days: number | null) {
  if (days === null) return <Badge variant="outline">Sem histórico</Badge>;
  if (sev === "critical") return <Badge variant="destructive">{days} dias</Badge>;
  if (sev === "warning")
    return <Badge variant="outline" className="border-orange-500 text-orange-700">{days} dias</Badge>;
  if (sev === "info")
    return <Badge variant="outline" className="border-amber-500 text-amber-700">{days} dias</Badge>;
  return <Badge variant="outline" className="border-emerald-500 text-emerald-700">{days} dias</Badge>;
}

function exportCsv(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(";"),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(";")),
  ].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PredictionTab() {
  const [windowDays, setWindowDays] = useState(90);
  const [simQty, setSimQty] = useState<number>(10);
  const { data, isLoading } = useStockForecast(windowDays);

  const purchaseSuggestions = useMemo(
    () => (data?.forecasts ?? []).filter((f) => f.suggested_purchase > 0),
    [data]
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data!;

  if (!d.hasAnyHistory) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">📊 Ainda não há dados suficientes para gerar previsões</h3>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Conforme entradas, saídas e procedimentos forem sendo registrados, o sistema começará
            automaticamente a calcular tendências de consumo e necessidade de reposição.
          </p>
        </CardContent>
      </Card>
    );
  }

  const critical = d.forecasts.filter((f) => f.severity === "critical");
  const totalSuggestedCost = purchaseSuggestions.reduce(
    (sum, p) => sum + p.suggested_purchase * p.default_cost_price,
    0
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Período de análise:</span>
        <Select value={String(windowDays)} onValueChange={(v) => setWindowDays(Number(v))}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {windowOptions.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              exportCsv(
                d.forecasts.map((f) => ({
                  Produto: f.name,
                  Categoria: f.category || "",
                  Saldo: f.current_stock,
                  ConsumoMedioDia: f.avg_per_day.toFixed(2),
                  DiasRestantes: f.days_remaining ?? "",
                  DataTermino: f.exhaustion_date ?? "",
                  SugestaoCompra: f.suggested_purchase,
                })),
                "previsao-estoque.csv"
              )
            }
          >
            <Download className="h-4 w-4 mr-1.5" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* Critical alerts banner */}
      {critical.length > 0 && (
        <Card className="border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/20">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>{critical.length}</strong> produto(s) vão acabar em menos de 7 dias
            </p>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Movimentação dos últimos 6 meses
          </CardTitle>
          <CardDescription>Entradas, saídas e saldo líquido por mês</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={d.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="entries" name="Entradas" fill="hsl(142 76% 45%)" />
              <Bar dataKey="exits" name="Saídas" fill="hsl(0 84% 60%)" />
              <Line dataKey="balance" name="Saldo líquido" stroke="hsl(217 91% 60%)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Previsão de esgotamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Previsão de Esgotamento</CardTitle>
          <CardDescription>
            Com base no consumo dos últimos {d.windowDays} dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">Consumo/dia</TableHead>
                <TableHead className="text-right">Dias restantes</TableHead>
                <TableHead>Data prevista</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.forecasts.slice(0, 30).map((f) => (
                <TableRow key={f.item_id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="text-right">{f.current_stock} {f.unit}</TableCell>
                  <TableCell className="text-right">
                    {f.has_history ? f.avg_per_day.toFixed(2) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {severityBadge(f.severity, f.days_remaining)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {f.exhaustion_date ? format(parseISO(f.exhaustion_date), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sugestão de compra */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Sugestão de Compra
            </CardTitle>
            <CardDescription>
              Cobertura alvo: 30 dias · Custo estimado total:{" "}
              <strong>
                {totalSuggestedCost.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={!purchaseSuggestions.length}
            onClick={() =>
              exportCsv(
                purchaseSuggestions.map((f) => ({
                  Produto: f.name,
                  SaldoAtual: f.current_stock,
                  ConsumoMensal: Math.round(f.avg_per_day * 30),
                  QuantidadeSugerida: f.suggested_purchase,
                  CustoUnitario: f.default_cost_price,
                  TotalEstimado: (f.suggested_purchase * f.default_cost_price).toFixed(2),
                })),
                "lista-de-compras.csv"
              )
            }
          >
            <Download className="h-4 w-4 mr-1.5" /> Lista de compras
          </Button>
        </CardHeader>
        <CardContent>
          {purchaseSuggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma compra sugerida no momento.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Consumo/mês</TableHead>
                  <TableHead className="text-right">Sugerido comprar</TableHead>
                  <TableHead className="text-right">Custo estimado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseSuggestions.slice(0, 30).map((f) => (
                  <TableRow key={f.item_id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell className="text-right">{f.current_stock} {f.unit}</TableCell>
                    <TableCell className="text-right">{Math.round(f.avg_per_day * 30)}</TableCell>
                    <TableCell className="text-right">
                      <Badge>{f.suggested_purchase} {f.unit}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {(f.suggested_purchase * f.default_cost_price).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Simulação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Simulação de Consumo
          </CardTitle>
          <CardDescription>
            Quantos dias o estoque atual aguenta se o consumo médio for multiplicado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Se eu realizar</span>
            <input
              type="number"
              min={1}
              value={simQty}
              onChange={(e) => setSimQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
            <span className="text-sm text-muted-foreground">
              vezes o volume atual de procedimentos por mês:
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Necessário/mês</TableHead>
                <TableHead className="text-right">Saldo atual</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.forecasts
                .filter((f) => f.has_history)
                .slice(0, 15)
                .map((f) => {
                  const need = Math.ceil(f.avg_per_day * 30 * simQty);
                  const diff = f.current_stock - need;
                  return (
                    <TableRow key={f.item_id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell className="text-right">{need} {f.unit}</TableCell>
                      <TableCell className="text-right">{f.current_stock} {f.unit}</TableCell>
                      <TableCell className="text-right">
                        {diff < 0 ? (
                          <Badge variant="destructive">faltam {Math.abs(diff)}</Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-500 text-emerald-700">
                            sobra {diff}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="py-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Previsões calculadas a partir das saídas registradas (consumo em procedimentos,
            baixas manuais, perdas, vendas). Quanto mais movimentações registradas, mais
            precisas serão as projeções.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
