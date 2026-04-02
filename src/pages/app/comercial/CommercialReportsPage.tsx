import { BarChart3 } from "lucide-react";
import { ReportEmptyState } from "@/components/relatorios/ReportEmptyState";

export default function CommercialReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Relatórios Comerciais</h1>
          <p className="text-sm text-muted-foreground">
            Análises de funil, conversão e desempenho comercial
          </p>
        </div>
      </div>

      <ReportEmptyState
        title="Sem dados para relatórios"
        description="Relatórios de funil, taxa de conversão e desempenho comercial aparecerão aqui quando houver dados."
        icon={<BarChart3 className="h-8 w-8 text-muted-foreground" />}
      />
    </div>
  );
}
