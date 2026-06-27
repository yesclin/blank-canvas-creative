import { useState, useMemo } from "react";
import {
  AlertTriangle,
  PackageX,
  TrendingDown,
  CalendarClock,
  CalendarX,
  Clock,
  ArrowDownCircle,
  Package,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockPredictionAlerts } from "@/components/estoque/StockPredictionAlerts";
import { EntryFormDialog } from "@/components/estoque/EntryFormDialog";
import { useStockAlertsData } from "@/hooks/useStockAlertsData";
import { useInventoryItems } from "@/hooks/useInventoryItems";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type FilterKey = "all" | "low" | "out" | "expiring" | "expired" | "no_movement";

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "out", label: "Sem estoque" },
  { key: "low", label: "Estoque baixo" },
  { key: "expiring", label: "Vencendo" },
  { key: "expired", label: "Vencidos" },
  { key: "no_movement", label: "Sem movimentação" },
];

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return iso;
  }
}

export function AlertsTab() {
  const { data, isLoading } = useStockAlertsData();
  const { data: items = [] } = useInventoryItems();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [entryOpen, setEntryOpen] = useState(false);

  const visible = useMemo(() => {
    const empty = { out: false, low: false, expiring: false, expired: false, noMov: false };
    if (filter === "all") return { out: true, low: true, expiring: true, expired: true, noMov: true };
    return {
      ...empty,
      out: filter === "out",
      low: filter === "low",
      expiring: filter === "expiring",
      expired: filter === "expired",
      noMov: filter === "no_movement",
    };
  }, [filter]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data!;
  const hasAny =
    d.outOfStock.length || d.lowStock.length || d.expiringSoon.length || d.expired.length || d.noMovement.length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {filterOptions.map((opt) => {
          const count =
            opt.key === "out"
              ? d.outOfStock.length
              : opt.key === "low"
              ? d.lowStock.length
              : opt.key === "expiring"
              ? d.expiringSoon.length
              : opt.key === "expired"
              ? d.expired.length
              : opt.key === "no_movement"
              ? d.noMovement.length
              : d.outOfStock.length +
                d.lowStock.length +
                d.expiringSoon.length +
                d.expired.length +
                d.noMovement.length;
          return (
            <Button
              key={opt.key}
              size="sm"
              variant={filter === opt.key ? "default" : "outline"}
              onClick={() => setFilter(opt.key)}
              className="gap-1.5"
            >
              {opt.label}
              <Badge variant="secondary" className="ml-1">
                {count}
              </Badge>
            </Button>
          );
        })}
        <div className="ml-auto">
          <Button size="sm" onClick={() => setEntryOpen(true)}>
            <ArrowDownCircle className="h-4 w-4 mr-1.5" /> Registrar Entrada
          </Button>
        </div>
      </div>

      <StockPredictionAlerts />

      {/* SEM ESTOQUE */}
      {visible.out && d.outOfStock.length > 0 && (
        <Card className="border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-300">
              <PackageX className="h-5 w-5" />
              Estoque Esgotado ({d.outOfStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead>Última movimentação</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.outOfStock.map((p) => (
                  <TableRow key={p.item_id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.category || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive">0 {p.unit}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{p.minimum_stock} {p.unit}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(p.last_movement_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setEntryOpen(true)}>
                        Registrar Entrada
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ESTOQUE BAIXO */}
      {visible.low && d.lowStock.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <TrendingDown className="h-5 w-5" />
              Estoque Baixo ({d.lowStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                  <TableHead>Última movimentação</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.lowStock.map((p) => (
                  <TableRow key={p.item_id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="border-amber-500 text-amber-700">
                        {p.current_stock} {p.unit}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{p.minimum_stock} {p.unit}</TableCell>
                    <TableCell className="text-right text-amber-700">
                      {p.minimum_stock - p.current_stock} {p.unit}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(p.last_movement_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setEntryOpen(true)}>
                        Registrar Entrada
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* VENCIDOS */}
      {visible.expired && d.expired.length > 0 && (
        <Card className="border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-300">
              <CalendarX className="h-5 w-5" />
              Lotes Vencidos ({d.expired.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.expired.map((b) => (
                  <TableRow key={b.batch_id}>
                    <TableCell className="font-medium">{b.item_name}</TableCell>
                    <TableCell>{b.batch_number}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{fmtDate(b.expiry_date)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{b.quantity_available}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* VENCENDO */}
      {visible.expiring && d.expiringSoon.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/30 dark:border-orange-900 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <CalendarClock className="h-5 w-5" />
              Vencimento Próximo ({d.expiringSoon.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="text-right">Dias restantes</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.expiringSoon.map((b) => {
                  const tone =
                    b.days_to_expiry <= 7
                      ? "border-red-500 text-red-700"
                      : b.days_to_expiry <= 15
                      ? "border-orange-500 text-orange-700"
                      : "border-amber-500 text-amber-700";
                  return (
                    <TableRow key={b.batch_id}>
                      <TableCell className="font-medium">{b.item_name}</TableCell>
                      <TableCell>{b.batch_number}</TableCell>
                      <TableCell>{fmtDate(b.expiry_date)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={tone}>
                          {b.days_to_expiry} dias
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{b.quantity_available}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* SEM MOVIMENTAÇÃO */}
      {visible.noMov && d.noMovement.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Clock className="h-5 w-5" />
              Sem Movimentação (90+ dias) ({d.noMovement.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Última movimentação</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.noMovement.map((p) => (
                  <TableRow key={p.item_id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(p.last_movement_at)}</TableCell>
                    <TableCell className="text-right">{p.current_stock} {p.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!hasAny && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Nenhum alerta de estoque no momento
          </CardContent>
        </Card>
      )}

      <EntryFormDialog open={entryOpen} onOpenChange={setEntryOpen} />
    </div>
  );
}
