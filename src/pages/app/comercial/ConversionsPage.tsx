import { RefreshCw } from "lucide-react";
import { ReportEmptyState } from "@/components/relatorios/ReportEmptyState";

export default function ConversionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <RefreshCw className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Conversões</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhamento de conversões de leads em pacientes
          </p>
        </div>
      </div>

      <ReportEmptyState
        title="Nenhuma conversão registrada"
        description="Conversões de leads em pacientes e oportunidades fechadas aparecerão aqui."
        icon={<RefreshCw className="h-8 w-8 text-muted-foreground" />}
      />
    </div>
  );
}
