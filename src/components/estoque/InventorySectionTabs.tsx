import {
  AlertTriangle,
  Boxes,
  History,
  Link2,
  Package,
  Settings,
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
    description: "Cadastro-base único, estoque real, custo, preço e status operacional.",
    icon: Package,
  },
  {
    value: "movements",
    title: "Movimentações",
    description: "Entradas, saídas, ajustes, vendas e consumo por atendimento.",
    icon: History,
  },
  {
    value: "kits",
    title: "Kits",
    description: "Agrupadores reutilizáveis montados com itens já existentes.",
    icon: Boxes,
  },
  {
    value: "links",
    title: "Uso clínico",
    description: "Vincule itens existentes aos procedimentos sem criar um novo cadastro.",
    icon: Link2,
  },
  {
    value: "auto-consumption",
    title: "Baixa automática",
    description: "Defina as regras de consumo ao finalizar atendimentos e procedimentos.",
    icon: Settings,
  },
  {
    value: "alerts",
    title: "Alertas e previsão",
    description: "Monitore estoque crítico, vencimento próximo e agenda futura.",
    icon: AlertTriangle,
  },
];

export function InventorySectionTabs() {
  return (
    <section aria-label="Seções do macro-módulo" className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Navegação do macro-módulo</p>
        <p className="text-sm text-muted-foreground">
          Separe cadastro-base, uso clínico e automação sem recriar o mesmo item em telas diferentes.
        </p>
      </div>

      <TabsList className="grid h-auto w-full gap-3 bg-transparent p-0 md:grid-cols-2 xl:grid-cols-3">
        {inventorySections.map((section) => (
          <TabsTrigger
            key={section.value}
            value={section.value}
            className="group w-full min-h-[124px] flex-col items-start justify-between whitespace-normal rounded-xl border border-border bg-card p-4 text-left text-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
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
    </section>
  );
}