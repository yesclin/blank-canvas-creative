import { CalendarX, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgendaEmptyStateProps {
  professionalName?: string;
  onCreateAppointment?: () => void;
}

export function AgendaEmptyState({ 
  professionalName,
  onCreateAppointment 
}: AgendaEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border rounded-lg bg-muted/20">
      <CalendarX className="h-16 w-16 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        Nenhum atendimento encontrado
      </h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {professionalName 
          ? `Não há atendimentos agendados para ${professionalName} neste período.`
          : "Não há atendimentos agendados para este período."
        }
      </p>
      {onCreateAppointment && (
        <Button onClick={onCreateAppointment}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      )}
    </div>
  );
}
