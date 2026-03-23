import { useMemo } from "react";
import { Calendar, Clock, User, Stethoscope } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePatientAppointments, type PatientAppointment } from "@/hooks/usePatientAppointments";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { statusLabels, typeLabels } from "@/types/agenda";
import { Skeleton } from "@/components/ui/skeleton";

interface AppointmentSaleSelectorProps {
  patientId: string | null | undefined;
  selectedAppointmentId: string | null;
  onSelect: (appointmentId: string | null) => void;
  disabled?: boolean;
}

export function AppointmentSaleSelector({
  patientId,
  selectedAppointmentId,
  onSelect,
  disabled = false,
}: AppointmentSaleSelectorProps) {
  const { data: appointments = [], isLoading } = usePatientAppointments(patientId);

  // Format appointment for display
  const formatAppointmentLabel = (apt: PatientAppointment) => {
    const date = format(parseISO(apt.scheduled_date), "dd/MM/yyyy", { locale: ptBR });
    const time = apt.start_time.substring(0, 5);
    const type = typeLabels[apt.appointment_type as keyof typeof typeLabels] || apt.appointment_type;
    const professional = apt.professional?.full_name || "";
    const procedure = apt.procedure?.name || "";
    
    let label = `${date} ${time} - ${type}`;
    if (procedure) label += ` - ${procedure}`;
    if (professional) label += ` (${professional})`;
    
    return label;
  };

  // Get status badge color
  const getStatusClass = (status: string) => {
    switch (status) {
      case "finalizado":
        return "text-green-600";
      case "em_atendimento":
        return "text-purple-600";
      case "chegou":
        return "text-yellow-600";
      case "confirmado":
        return "text-blue-600";
      default:
        return "text-muted-foreground";
    }
  };

  // Memoize selected appointment details
  const selectedAppointment = useMemo(() => 
    appointments.find(apt => apt.id === selectedAppointmentId),
    [appointments, selectedAppointmentId]
  );

  // Don't render if no patient is selected
  if (!patientId) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="grid gap-2">
        <Label>Atendimento (opcional)</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // No appointments available
  if (appointments.length === 0) {
    return (
      <div className="grid gap-2">
        <Label className="text-muted-foreground">Atendimento</Label>
        <p className="text-sm text-muted-foreground italic">
          Nenhum atendimento recente encontrado para este paciente.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="appointment-select">Atendimento (opcional)</Label>
      <Select
        value={selectedAppointmentId || "none"}
        onValueChange={(value) => onSelect(value === "none" ? null : value)}
        disabled={disabled}
      >
        <SelectTrigger id="appointment-select">
          <SelectValue placeholder="Vincular a um atendimento...">
            {selectedAppointment ? (
              <span className="flex items-center gap-2 truncate">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{formatAppointmentLabel(selectedAppointment)}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Vincular a um atendimento...</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          <SelectItem value="none">
            <span className="text-muted-foreground">Sem vínculo com atendimento</span>
          </SelectItem>
          {appointments.map((apt) => (
            <SelectItem key={apt.id} value={apt.id}>
              <div className="flex flex-col py-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">
                    {format(parseISO(apt.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  <Clock className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                  <span>{apt.start_time.substring(0, 5)}</span>
                  <span className={`text-xs ${getStatusClass(apt.status)}`}>
                    ({statusLabels[apt.status as keyof typeof statusLabels] || apt.status})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {apt.procedure && (
                    <>
                      <Stethoscope className="h-3 w-3" />
                      <span>{apt.procedure.name}</span>
                    </>
                  )}
                  {apt.professional && (
                    <>
                      <User className="h-3 w-3 ml-1" />
                      <span>{apt.professional.full_name}</span>
                    </>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Vincule esta venda a um atendimento recente do paciente
      </p>
    </div>
  );
}
