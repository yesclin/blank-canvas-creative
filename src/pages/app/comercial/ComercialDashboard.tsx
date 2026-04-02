import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, Users, Target, FileText, Package,
  RefreshCw, PhoneCall, BarChart3, TrendingUp, Plus, LayoutGrid, List
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OpportunityKanbanBoard } from "@/components/comercial/kanban/OpportunityKanbanBoard";
import { OpportunityFormDialog } from "@/components/comercial/OpportunityFormDialog";

const sections = [
  { title: "Leads", description: "Contatos e potenciais clientes", icon: Users, path: "/app/comercial/leads", color: "text-blue-600" },
  { title: "Oportunidades", description: "Pipeline de vendas", icon: Target, path: "/app/comercial/oportunidades", color: "text-emerald-600" },
  { title: "Orçamentos", description: "Propostas e orçamentos", icon: FileText, path: "/app/comercial/orcamentos", color: "text-amber-600" },
  { title: "Pacotes", description: "Pacotes comerciais", icon: Package, path: "/app/comercial/pacotes", color: "text-purple-600" },
  { title: "Conversões", description: "Acompanhamento de conversões", icon: RefreshCw, path: "/app/comercial/conversoes", color: "text-rose-600" },
  { title: "Follow-ups", description: "Acompanhamentos agendados", icon: PhoneCall, path: "/app/comercial/follow-ups", color: "text-cyan-600" },
  { title: "Metas", description: "Metas comerciais e progresso", icon: TrendingUp, path: "/app/comercial/metas", color: "text-orange-600" },
  { title: "Relatórios", description: "Relatórios comerciais", icon: BarChart3, path: "/app/comercial/relatorios", color: "text-indigo-600" },
];

export default function ComercialDashboard() {
  const navigate = useNavigate();
  const [newOppOpen, setNewOppOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Comercial</h1>
            <p className="text-sm text-muted-foreground">
              Pipeline de vendas e oportunidades de negócio
            </p>
          </div>
        </div>
        <Button onClick={() => setNewOppOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Oportunidade
        </Button>
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline" className="gap-1.5">
            <LayoutGrid className="h-4 w-4" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="modulos" className="gap-1.5">
            <List className="h-4 w-4" /> Módulos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4">
          <OpportunityKanbanBoard />
        </TabsContent>

        <TabsContent value="modulos" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sections.map((section) => (
              <Card
                key={section.path}
                className="cursor-pointer hover:shadow-md transition-shadow border hover:border-primary/30"
                onClick={() => navigate(section.path)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <section.icon className={`h-5 w-5 ${section.color}`} />
                    <CardTitle className="text-base">{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{section.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <OpportunityFormDialog
        open={newOppOpen}
        onOpenChange={setNewOppOpen}
      />
    </div>
  );
}
