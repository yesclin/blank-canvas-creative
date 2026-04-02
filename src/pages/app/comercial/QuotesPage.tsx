import { FileText } from "lucide-react";
import { ReportEmptyState } from "@/components/relatorios/ReportEmptyState";

export default function QuotesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">
            Propostas e orçamentos para pacientes e leads
          </p>
        </div>
      </div>

      <ReportEmptyState
        title="Nenhum orçamento criado"
        description="Orçamentos vinculados a oportunidades e pacientes aparecerão aqui."
        icon={<FileText className="h-8 w-8 text-muted-foreground" />}
      />
    </div>
  );
}
