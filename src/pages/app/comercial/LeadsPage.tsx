import { Users } from "lucide-react";
import { ReportEmptyState } from "@/components/relatorios/ReportEmptyState";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus contatos e potenciais clientes
          </p>
        </div>
      </div>

      <ReportEmptyState
        title="Nenhum lead cadastrado"
        description="Leads capturados de formulários, indicações e campanhas aparecerão aqui. Esta funcionalidade será habilitada em breve."
        icon={<Users className="h-8 w-8 text-muted-foreground" />}
      />
    </div>
  );
}
