import {
  AlertTriangle,
  History,
  Package,
  type LucideIcon,
} from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InventorySection {
  value: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const inventorySections: InventorySection[] = [
  {
    value: "items",
    title: "Itens",
    description: "Cadastro-base, saldo operacional, custo, preço e status.",
    icon: Package,
  },
  {
    value: "movements",
    title: "Movimentações",
    description: "Entradas, saídas, ajustes, vendas e consumo por atendimento.",
    icon: History,
  },
  {
    value: "alerts",
    title: "Alertas e Previsão",
    description: "Estoque crítico, vencimento próximo e previsão de ruptura.",
    icon: AlertTriangle,
  },
];

export function InventorySectionTabs() {
  return (
    <TabsList className="grid h-auto w-full gap-3 bg-transparent p-0 md:grid-cols-3">
      {inventorySections.map((section) => (
        <TabsTrigger
          key={section.value}
          value={section.value}
          className="group w-full min-h-[100px] flex-col items-start justify-between whitespace-normal rounded-xl border border-border bg-card p-4 text-left text-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-border bg-muted/60 p-2 group-data-[state=active]:border-primary/30 group-data-[state=active]:bg-background">
              <section.icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">{section.title}</span>
          </div>

          <span className="text-xs leading-relaxed text-muted-foreground group-data-[state=active]:text-primary/80">
            {section.description}
          </span>
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
