import { useState } from "react";
import { Stethoscope, Package, Boxes, Link2, Settings, Calculator } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProcedureConsumptionTab } from "@/components/catalogo-clinico/ProcedureConsumptionTab";
import { InventoryKitsTab } from "@/components/catalogo-clinico/InventoryKitsTab";
import { MaterialConsumptionSettings } from "@/components/cadastros-clinicos/MaterialConsumptionSettings";
import { CatalogoClincioCostTab } from "@/components/catalogo-clinico/CostTab";
import { CatalogoClinicoItemsTab } from "@/components/catalogo-clinico/ItemsTab";

const tabs = [
  { value: "items", label: "Itens Assistenciais", icon: Package, description: "Itens cadastrados com perfil assistencial/clínico" },
  { value: "kits", label: "Kits Clínicos", icon: Boxes, description: "Kits montados com itens para uso em procedimentos" },
  { value: "consumo", label: "Consumo por Procedimento", icon: Link2, description: "Vincule itens ao consumo de cada procedimento" },
  { value: "baixa", label: "Regras de Baixa", icon: Settings, description: "Configure baixa automática de estoque" },
  { value: "custo", label: "Custo de Procedimentos", icon: Calculator, description: "Visualize o custo operacional por procedimento" },
];

export default function CatalogoClinico() {
  const [activeTab, setActiveTab] = useState("items");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-border bg-primary/10 p-2">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Catálogo Clínico</h1>
            <p className="text-muted-foreground text-sm">
              Configure o uso assistencial dos itens: vínculos com procedimentos, kits clínicos, regras de baixa e custos.
            </p>
          </div>
        </div>
      </div>

      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          Os itens são cadastrados em <strong>Gestão → Estoque</strong>. Aqui você configura apenas o uso clínico desses itens nos procedimentos.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="grid h-auto w-full gap-2 bg-transparent p-0 sm:grid-cols-2 lg:grid-cols-5">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-col items-start gap-1 whitespace-normal rounded-lg border border-border bg-card p-3 text-left text-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <div className="flex items-center gap-2">
                <tab.icon className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{tab.label}</span>
              </div>
              <span className="text-xs text-muted-foreground leading-relaxed">{tab.description}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <CatalogoClinicoItemsTab />
        </TabsContent>

        <TabsContent value="kits" className="space-y-4">
          <Alert>
            <Boxes className="h-4 w-4" />
            <AlertDescription>
              Monte kits clínicos ou comerciais com itens do cadastro mestre. Kits podem ser vinculados a procedimentos.
            </AlertDescription>
          </Alert>
          <InventoryKitsTab />
        </TabsContent>

        <TabsContent value="consumo" className="space-y-4">
          <Alert>
            <Link2 className="h-4 w-4" />
            <AlertDescription>
              Configure quais itens são consumidos em cada procedimento, com quantidades, exigência de lote e permissão de edição na finalização.
            </AlertDescription>
          </Alert>
          <ProcedureConsumptionTab />
        </TabsContent>

        <TabsContent value="baixa" className="space-y-4">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Configure a baixa automática de estoque ao finalizar atendimentos.
            </AlertDescription>
          </Alert>
          <MaterialConsumptionSettings />
        </TabsContent>

        <TabsContent value="custo" className="space-y-4">
          <Alert>
            <Calculator className="h-4 w-4" />
            <AlertDescription>
              Visualize o custo operacional de cada procedimento com base nos itens vinculados.
            </AlertDescription>
          </Alert>
          <CatalogoClincioCostTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
