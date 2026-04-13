import { History, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface InventoryModuleHeroProps {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
  onCreateItem: () => void;
  onOpenMovement: () => void;
}

export function InventoryModuleHero({
  totalItems,
  lowStockCount,
  outOfStockCount,
  expiringCount,
  onCreateItem,
  onOpenMovement,
}: InventoryModuleHeroProps) {
  const metrics = [
    { label: "Itens cadastrados", value: totalItems },
    { label: "Estoque baixo", value: lowStockCount },
    { label: "Sem estoque", value: outOfStockCount },
    { label: "Próx. vencimento", value: expiringCount },
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
                Cadastre itens, controle saldo operacional, registre movimentações e monitore alertas.
                O uso clínico e vínculo com procedimentos é configurado em{" "}
                <strong>Configurações → Catálogo Clínico</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onCreateItem}>
              <Package className="mr-2 h-4 w-4" />
              Novo Item
            </Button>
            <Button variant="outline" onClick={onOpenMovement}>
              <History className="mr-2 h-4 w-4" />
              Registrar Movimentação
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
