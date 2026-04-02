import { TrendingUp } from "lucide-react";
import { ReportEmptyState } from "@/components/relatorios/ReportEmptyState";

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Metas Comerciais</h1>
          <p className="text-sm text-muted-foreground">
            Defina e acompanhe metas de receita, conversão e atendimento
          </p>
        </div>
      </div>

      <ReportEmptyState
        title="Nenhuma meta definida"
        description="Metas de receita, leads e conversão por período aparecerão aqui."
        icon={<TrendingUp className="h-8 w-8 text-muted-foreground" />}
      />
    </div>
  );
}
