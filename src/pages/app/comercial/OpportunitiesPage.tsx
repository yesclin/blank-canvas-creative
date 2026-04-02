import { Target } from "lucide-react";
import { ReportEmptyState } from "@/components/relatorios/ReportEmptyState";

export default function OpportunitiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Oportunidades</h1>
          <p className="text-sm text-muted-foreground">
            Pipeline de vendas e oportunidades de negócio
          </p>
        </div>
      </div>

      <ReportEmptyState
        title="Nenhuma oportunidade registrada"
        description="Oportunidades de vendas criadas a partir de leads ou diretamente aparecerão aqui com o pipeline visual."
        icon={<Target className="h-8 w-8 text-muted-foreground" />}
      />
    </div>
  );
}
