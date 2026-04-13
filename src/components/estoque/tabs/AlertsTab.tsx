import { AlertTriangle, TrendingDown, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInventoryItems } from "@/hooks/useInventoryItems";
import { useExpiringBatches, useExpiredBatches } from "@/hooks/useInventoryBatches";
import { StockPredictionAlerts } from "@/components/estoque/StockPredictionAlerts";

export function AlertsTab() {
  const { data: items = [] } = useInventoryItems();
  const { data: expiringBatches = [] } = useExpiringBatches(30);
  const { data: expiredBatches = [] } = useExpiredBatches();

  // Derive low stock items
  // Note: inventory_items doesn't have current_stock field yet – this will need
  // to be computed from movements in a future iteration. For now we show batch-based alerts.

  return (
    <div className="space-y-4">
      <StockPredictionAlerts />

      {expiredBatches.length > 0 && (
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Lotes Vencidos ({expiredBatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {expiredBatches.map(b => (
              <div key={b.id} className="flex items-center justify-between p-2 bg-red-100 rounded-md">
                <div>
                  <span className="text-sm font-medium text-red-800">{(b as any).inventory_items?.name}</span>
                  <span className="text-xs text-red-600 ml-2">Lote: {b.batch_number}</span>
                </div>
                <Badge variant="destructive">Vencido</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {expiringBatches.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              Lotes Próximos do Vencimento ({expiringBatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {expiringBatches.map(b => (
              <div key={b.id} className="flex items-center justify-between p-2 bg-orange-100 rounded-md">
                <div>
                  <span className="text-sm font-medium text-orange-800">{(b as any).inventory_items?.name}</span>
                  <span className="text-xs text-orange-600 ml-2">Lote: {b.batch_number} — Vence: {b.expiry_date}</span>
                </div>
                <Badge variant="outline" className="border-orange-500 text-orange-600">Vencendo</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {expiredBatches.length === 0 && expiringBatches.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Nenhum alerta de estoque no momento
          </CardContent>
        </Card>
      )}
    </div>
  );
}
