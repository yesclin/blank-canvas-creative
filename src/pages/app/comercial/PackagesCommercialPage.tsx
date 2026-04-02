import { Package } from "lucide-react";
import { ReportEmptyState } from "@/components/relatorios/ReportEmptyState";

export default function PackagesCommercialPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Pacotes Comerciais</h1>
          <p className="text-sm text-muted-foreground">
            Pacotes de procedimentos e ofertas comerciais
          </p>
        </div>
      </div>

      <ReportEmptyState
        title="Nenhum pacote comercial"
        description="Pacotes de procedimentos agrupados para venda comercial aparecerão aqui."
        icon={<Package className="h-8 w-8 text-muted-foreground" />}
      />
    </div>
  );
}
