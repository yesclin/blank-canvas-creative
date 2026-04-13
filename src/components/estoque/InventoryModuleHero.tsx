import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface InventoryModuleHeroProps {
  totalItems: number;
  sellableCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
  expiredBatchCount: number;
}

export function InventoryModuleHero({
  totalItems,
  sellableCount,
  lowStockCount,
  outOfStockCount,
  expiringCount,
  expiredBatchCount,
}: InventoryModuleHeroProps) {
  const metrics = [
    { label: "Total de Itens", value: totalItems },
    { label: "Vendáveis", value: sellableCount },
    { label: "Estoque baixo", value: lowStockCount },
    { label: "Sem estoque", value: outOfStockCount },
    { label: "Próx. vencimento", value: expiringCount },
    { label: "Lotes vencidos", value: expiredBatchCount },
  ];

  return (
    <section aria-labelledby="inventory-module-title">
      <Card className="overflow-hidden border-border bg-card">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit">Módulo operacional</Badge>
            <div className="space-y-2">
              <h1 id="inventory-module-title" className="text-3xl font-semibold tracking-tight text-foreground">
                Estoque
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Cadastre itens, controle saldo operacional, registre entradas, saídas e ajustes, e monitore alertas.
                O vínculo clínico e o consumo por procedimento são configurados em{" "}
                <strong>Configurações → Catálogo Clínico</strong>.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{metric.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
