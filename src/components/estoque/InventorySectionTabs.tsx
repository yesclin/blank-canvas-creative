import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  Calendar,
  History,
  Layers,
  Package,
  Settings2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface InventorySection {
  value: string;
  title: string;
  icon: LucideIcon;
}

const inventorySections: InventorySection[] = [
  { value: "items", title: "Itens", icon: Package },
  { value: "batches", title: "Lotes", icon: Layers },
  { value: "entries", title: "Entradas", icon: ArrowDownCircle },
  { value: "exits", title: "Saídas", icon: ArrowUpCircle },
  { value: "adjustments", title: "Ajustes", icon: Settings2 },
  { value: "kits", title: "Kits", icon: Boxes },
  { value: "alerts", title: "Alertas", icon: AlertTriangle },
  { value: "expiry", title: "Validade", icon: Calendar },
  { value: "prediction", title: "Previsão", icon: TrendingUp },
  { value: "history", title: "Histórico", icon: History },
];

interface InventorySectionTabsProps {
  onCreateItem?: () => void;
}

export function InventorySectionTabs({ onCreateItem }: InventorySectionTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {onCreateItem && (
        <Button onClick={onCreateItem} className="mr-2">
          <Package className="mr-2 h-4 w-4" />
          Novo Item
        </Button>
      )}
      <TabsList className="flex h-auto w-auto gap-1.5 flex-wrap bg-transparent p-0">
        {inventorySections.map((section) => (
          <TabsTrigger
            key={section.value}
            value={section.value}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <section.icon className="h-4 w-4" />
            <span className="font-medium">{section.title}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}
