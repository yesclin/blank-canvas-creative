import { History, Link2, Package, Settings2 } from "lucide-react";
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

const moduleHighlights = [
  {
    icon: Package,
    title: "Cadastro-base único",
    description: "Crie o item uma vez e concentre estoque, custo, preço e status no mesmo lugar.",
  },
  {
    icon: Link2,
    title: "Uso clínico posterior",
    description: "Nos vínculos clínicos você apenas conecta itens já existentes aos procedimentos.",
  },
  {
    icon: Settings2,
    title: "Operação assistida",
    description: "Baixa automática, kits e alertas continuam no mesmo macro-módulo operacional.",
  },
];

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
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-6">
            <div className="space-y-3">
              <Badge variant="outline" className="w-fit">
                Macro-módulo unificado
              </Badge>
              <div className="space-y-2">
                <h1 id="inventory-module-title" className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  Itens e Estoque
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                  Um único lugar para cadastrar itens, controlar estoque real e configurar o uso clínico sem duplicidade entre produto e material.
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
          </div>

          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
            {moduleHighlights.map((highlight) => (
              <div key={highlight.title} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-border bg-background p-2">
                    <highlight.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{highlight.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {highlight.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}