import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Play,
  Square,
  UserX,
  XCircle,
  CalendarClock,
  Clock,
  User,
  Stethoscope,
  DoorOpen,
  CreditCard,
  FileText,
  ShoppingCart,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Appointment, AppointmentStatus } from "@/types/agenda";
import { statusLabels, statusColors, typeLabels } from "@/types/agenda";

interface AppointmentDetailDrawerProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (id: string, status: AppointmentStatus) => void;
  onReschedule?: (appointment: Appointment) => void;
  onLaunchSale?: (appointment: Appointment) => void;
  onStartAtendimento?: (appointment: Appointment) => void;
}

export function AppointmentDetailDrawer({
  appointment,
  open,
  onOpenChange,
  onStatusChange,
  onReschedule,
  onLaunchSale,
  onStartAtendimento,
}: AppointmentDetailDrawerProps) {
  if (!appointment) return null;

  const {
    patient,
    professional,
    specialty,
    procedure,
    room,
    insurance,
    start_time,
    end_time,
    status,
    appointment_type,
    payment_type,
    notes,
    is_first_visit,
    is_return,
    has_pending_payment,
    is_fit_in,
    arrived_at,
    started_at,
    finished_at,
  } = appointment;

  const statusActions = getStatusActions(status);

  function getStatusActions(currentStatus: AppointmentStatus) {
    const actions: { label: string; icon: typeof CheckCircle2; status: AppointmentStatus; variant?: "default" | "destructive" | "outline" }[] = [];

    switch (currentStatus) {
      case "nao_confirmado":
        actions.push({ label: "Confirmar", icon: CheckCircle2, status: "confirmado" });
        break;
      case "confirmado":
        actions.push({ label: "Marcar Chegada", icon: CheckCircle2, status: "chegou" });
        break;
      case "chegou":
        actions.push({ label: "Iniciar Atendimento", icon: Play, status: "em_atendimento" });
        break;
      case "em_atendimento":
        actions.push({ label: "Finalizar Atendimento", icon: Square, status: "finalizado" });
        break;
    }

    return actions;
  }

  const isTerminal = status === "finalizado" || status === "faltou" || status === "cancelado";

  const handleAction = (newStatus: AppointmentStatus) => {
    if (newStatus === "em_atendimento") {
      onStartAtendimento?.(appointment);
    } else {
      onStatusChange?.(appointment.id, newStatus);
    }
  };

  const paymentLabels: Record<string, string> = {
    particular: "Particular",
    convenio: "Convênio",
  };

  const formatTimestamp = (ts?: string) => {
    if (!ts) return null;
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", statusColors[status])}>
              {statusLabels[status]}
            </Badge>
            {is_first_visit && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                1ª Consulta
              </Badge>
            )}
            {is_return && (
              <Badge variant="secondary" className="text-xs gap-1">
                <RotateCcw className="h-3 w-3" />
                Retorno
              </Badge>
            )}
            {is_fit_in && (
              <Badge variant="secondary" className="text-xs">Encaixe</Badge>
            )}
          </div>
          <SheetTitle className="text-left text-lg">
            {patient?.full_name || "Paciente"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Alerts */}
          {patient?.has_clinical_alert && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Alerta Clínico</p>
                <p className="text-xs text-destructive/80">{patient.clinical_alert_text}</p>
              </div>
            </div>
          )}

          {has_pending_payment && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <DollarSign className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm font-medium text-amber-700">Pagamento pendente</p>
            </div>
          )}

          {/* Details */}
          <div className="space-y-3">
            <DetailRow icon={Clock} label="Horário" value={`${start_time.slice(0, 5)} – ${end_time.slice(0, 5)}`} />
            <DetailRow icon={User} label="Profissional" value={professional?.full_name} />
            {specialty && <DetailRow icon={Stethoscope} label="Especialidade" value={specialty.name} />}
            {procedure && <DetailRow icon={FileText} label="Procedimento" value={procedure.name} />}
            {room && <DetailRow icon={DoorOpen} label="Sala" value={room.name} />}
            {insurance && <DetailRow icon={CreditCard} label="Convênio" value={insurance.name} />}
            <DetailRow icon={CreditCard} label="Pagamento" value={payment_type ? paymentLabels[payment_type] || payment_type : "—"} />
            <DetailRow icon={FileText} label="Tipo" value={typeLabels[appointment_type]} />
          </div>

          {/* Notes */}
          {notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
                <p className="text-sm whitespace-pre-wrap">{notes}</p>
              </div>
            </>
          )}

          {/* Timestamps */}
          {(arrived_at || started_at || finished_at) && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-2">Histórico</p>
                {arrived_at && <p className="text-xs text-muted-foreground">Chegou às {formatTimestamp(arrived_at)}</p>}
                {started_at && <p className="text-xs text-muted-foreground">Atendimento iniciado às {formatTimestamp(started_at)}</p>}
                {finished_at && <p className="text-xs text-muted-foreground">Finalizado às {formatTimestamp(finished_at)}</p>}
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="space-y-2">
            {/* Primary status action */}
            {statusActions.map((action) => (
              <Button
                key={action.status}
                className="w-full"
                onClick={() => handleAction(action.status)}
              >
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </Button>
            ))}

            {/* Secondary actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onLaunchSale?.(appointment);
                }}
              >
                <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                Venda
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onReschedule?.(appointment);
                }}
              >
                <CalendarClock className="mr-1 h-3.5 w-3.5" />
                Reagendar
              </Button>
            </div>

            {/* Destructive actions */}
            {!isTerminal && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-600 border-amber-300 hover:bg-amber-50"
                  onClick={() => {
                    onStatusChange?.(appointment.id, "faltou");
                    onOpenChange(false);
                  }}
                >
                  <UserX className="mr-1 h-3.5 w-3.5" />
                  Falta
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => {
                    onStatusChange?.(appointment.id, "cancelado");
                    onOpenChange(false);
                  }}
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="text-sm font-medium truncate">{value || "—"}</p>
      </div>
    </div>
  );
}
