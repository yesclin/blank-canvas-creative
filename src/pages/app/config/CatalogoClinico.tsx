import { useState } from "react";
import { Stethoscope, Package, Boxes, Link2, Settings, Calculator } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProcedureMaterialsTab } from "@/components/cadastros-clinicos/ProcedureMaterialsTab";
import { MaterialConsumptionSettings } from "@/components/cadastros-clinicos/MaterialConsumptionSettings";
import { ProductKitsTab } from "@/components/estoque/ProductKitsTab";
import { CatalogoClincioCostTab } from "@/components/catalogo-clinico/CostTab";
import { CatalogoClinicoItemsTab } from "@/components/catalogo-clinico/ItemsTab";

const tabs = [
  { value: "items", label: "Itens Assistenciais", icon: Package, description: "Itens cadastrados com perfil assistencial/clínico" },
  { value: "kits", label: "Kits Clínicos", icon: Boxes, description: "Kits montados com itens para uso em procedimentos" },
  { value: "consumo", label: "Consumo por Procedimento", icon: Link2, description: "Vincule itens e kits aos procedimentos" },
  { value: "baixa", label: "Regras de Baixa", icon: Settings, description: "Configure baixa automática de estoque" },
  { value: "custo", label: "Custo de Procedimentos", icon: Calculator, description: "Visualize o custo operacional por procedimento" },
];

export default function CatalogoClinico() {
  const [activeTab, setActiveTab] = useState("items");

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline">Configuração técnica</Badge>
          <Badge variant="outline">Vínculos assistenciais</Badge>
          <Badge variant="outline">Sem duplicar cadastro</Badge>
        </div>
      </div>

      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          Os itens são cadastrados em <strong>Gestão → Estoque</strong>. Aqui você configura apenas o uso clínico desses itens nos procedimentos.
        </AlertDescription>
      </Alert>

      {/* Tabs */}
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
              <span className="text-xs text-muted-foreground leading-relaxed">
                {tab.description}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Itens Assistenciais */}
        <TabsContent value="items" className="space-y-4">
          <CatalogoClinicoItemsTab />
        </TabsContent>

        {/* Kits Clínicos */}
        <TabsContent value="kits" className="space-y-4">
          <Alert>
            <Boxes className="h-4 w-4" />
            <AlertDescription>
              Monte kits clínicos reutilizáveis com itens já cadastrados no estoque. Kits podem ser vinculados a procedimentos na aba <strong>Consumo por Procedimento</strong>.
            </AlertDescription>
          </Alert>
          <ProductKitsTab />
        </TabsContent>

        {/* Consumo por Procedimento */}
        <TabsContent value="consumo" className="space-y-4">
          <Alert>
            <Link2 className="h-4 w-4" />
            <AlertDescription>
              Configure quais itens são consumidos em cada procedimento e suas quantidades. Itens novos devem ser cadastrados em <strong>Gestão → Estoque</strong>.
            </AlertDescription>
          </Alert>
          <ProcedureMaterialsTab />
        </TabsContent>

        {/* Regras de Baixa */}
        <TabsContent value="baixa" className="space-y-4">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Configure a baixa automática de estoque ao finalizar atendimentos. Os itens consumidos são definidos na aba <strong>Consumo por Procedimento</strong>.
            </AlertDescription>
          </Alert>
          <MaterialConsumptionSettings />
        </TabsContent>

        {/* Custo de Procedimentos */}
        <TabsContent value="custo" className="space-y-4">
          <Alert>
            <Calculator className="h-4 w-4" />
            <AlertDescription>
              Visualize o custo operacional de cada procedimento com base nos itens e kits vinculados.
            </AlertDescription>
          </Alert>
          <CatalogoClincioCostTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
