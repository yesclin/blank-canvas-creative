import { PhoneCall } from "lucide-react";
import { ReportEmptyState } from "@/components/relatorios/ReportEmptyState";

export default function FollowupsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <PhoneCall className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Follow-ups</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhamentos agendados com leads e oportunidades
          </p>
        </div>
      </div>

      <ReportEmptyState
        title="Nenhum follow-up agendado"
        description="Follow-ups de ligações, mensagens e reuniões aparecerão aqui."
        icon={<PhoneCall className="h-8 w-8 text-muted-foreground" />}
      />
    </div>
  );
}
