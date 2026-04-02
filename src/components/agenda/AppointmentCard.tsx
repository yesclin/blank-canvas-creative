import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  MoreHorizontal, 
  CheckCircle2, 
  Bell, 
  CalendarClock, 
  Play, 
  Square,
  UserX,
  XCircle,
  AlertTriangle,
  DollarSign,
  RotateCcw,
  Sparkles,
  ShoppingCart,
  Package,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Appointment, MeetingStatus } from "@/types/agenda";
import { statusLabels, statusColors, typeLabels, meetingStatusLabels, precheckStatusLabels } from "@/types/agenda";
import { usePermissions } from "@/hooks/usePermissions";
import { useFinancialAccessControl } from "@/hooks/useFinancialAccessControl";
import { PatientAvatar } from "./PatientAvatar";
import { AppointmentPaymentBadge } from "./AppointmentPaymentBadge";
import { AppointmentHoverPreview } from "./AppointmentHoverPreview";
import { useAppointmentFinancialStatus } from "@/hooks/useAppointmentFinancialStatus";
import { getAppointmentSourceLabel } from "@/utils/appointmentSource";

interface AppointmentCardProps {
  appointment: Appointment;
  compact?: boolean;
  onStatusChange?: (id: string, status: Appointment['status']) => void;
  onReschedule?: (appointment: Appointment) => void;
  onClick?: (appointment: Appointment) => void;
  onLaunchSale?: (appointment: Appointment) => void;
}

export function AppointmentCard({ 
  appointment, 
  compact = false,
  onStatusChange,
  onReschedule,
  onClick,
  onLaunchSale,
}: AppointmentCardProps) {
  const { 
    patient, 
    professional, 
    start_time, 
    end_time, 
    status, 
    appointment_type,
    is_first_visit,
    is_return,
    has_pending_payment,
    is_fit_in,
    notes,
    procedure_cost,
  } = appointment;

  const { role } = usePermissions();
  const { canViewCost } = useFinancialAccessControl();
  const financial = useAppointmentFinancialStatus(appointment);
  const isReceptionist = role === 'recepcionista';
  const sourceLabel = getAppointmentSourceLabel(appointment);

  const getStatusActions = () => {
    switch (status) {
      case 'nao_confirmado':
        return [
          { label: 'Confirmar', icon: CheckCircle2, status: 'confirmado' as const },
          { label: 'Enviar Lembrete', icon: Bell, action: 'reminder' },
        ];
      case 'confirmado':
        return [
          { label: 'Marcar Chegada', icon: CheckCircle2, status: 'chegou' as const },
        ];
      case 'chegou':
        return [
          { label: 'Iniciar Atendimento', icon: Play, status: 'em_atendimento' as const },
        ];
      case 'em_atendimento':
        return [
          { label: 'Finalizar', icon: Square, status: 'finalizado' as const },
        ];
      default:
        return [];
    }
  };

  const statusActions = getStatusActions();

  if (compact) {
    return (
      <AppointmentHoverPreview appointment={appointment}>
        <div 
          className={cn(
            "p-2 rounded-md border cursor-pointer hover:shadow-sm transition-shadow",
            statusColors[status]
          )}
          onClick={() => onClick?.(appointment)}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <PatientAvatar name={patient?.full_name} avatarUrl={patient?.avatar_url} size="sm" />
              <span className="text-xs font-medium truncate">{patient?.full_name}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <AppointmentPaymentBadge paymentStatus={financial.paymentStatus} compact />
              <span className="text-xs">{start_time.slice(0, 5)}</span>
            </div>
          </div>
        </div>
      </AppointmentHoverPreview>
    );
  }

  return (
    <AppointmentHoverPreview appointment={appointment}>
      <div 
        className={cn(
          "p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer",
          "bg-card"
        )}
        onClick={() => onClick?.(appointment)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Time & Status */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">
                {start_time.slice(0, 5)} - {end_time.slice(0, 5)}
              </span>
              <Badge variant="outline" className={cn("text-xs", statusColors[status])}>
                {statusLabels[status]}
              </Badge>
              <AppointmentPaymentBadge paymentStatus={financial.paymentStatus} />
            </div>
            
            {/* Patient with avatar */}
            <div className="flex items-center gap-2 mb-0.5">
              <PatientAvatar name={patient?.full_name} avatarUrl={patient?.avatar_url} size="sm" />
              <p className="font-medium truncate">{patient?.full_name}</p>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {appointment.procedure?.name || professional?.full_name}
            </p>
            
            {/* Flags */}
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {is_first_visit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Sparkles className="h-3 w-3" />
                      1ª Consulta
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Primeira consulta do paciente</TooltipContent>
                </Tooltip>
              )}
              
              {is_return && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <RotateCcw className="h-3 w-3" />
                      Retorno
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Consulta de retorno</TooltipContent>
                </Tooltip>
              )}
              
              {/* Clinical alert - hidden for receptionist */}
              {!isReceptionist && patient?.has_clinical_alert && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="destructive" className="text-xs gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Alerta
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>{patient.clinical_alert_text}</TooltipContent>
                </Tooltip>
              )}
              
              {has_pending_payment && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300">
                      <DollarSign className="h-3 w-3" />
                      Pendente
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Pagamento pendente</TooltipContent>
                </Tooltip>
              )}
              
              {is_fit_in && (
                <Badge variant="secondary" className="text-xs">
                  Encaixe
                </Badge>
              )}
              
              {appointment.care_mode === 'teleconsulta' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      <Video className="h-3 w-3" />
                      Teleconsulta
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {meetingStatusLabels[appointment.meeting_status as MeetingStatus] || appointment.meeting_status}
                    {appointment.precheck_status && appointment.precheck_status !== 'pendente' && (
                      <> • Pré-check: {precheckStatusLabels[appointment.precheck_status] || appointment.precheck_status}</>
                    )}
                  </TooltipContent>
                </Tooltip>
              )}
              
              {appointment.care_mode === 'teleconsulta' && appointment.meeting_status === 'nao_gerada' && (
                <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300">
                  Sem sala
                </Badge>
              )}
              
              {appointment.care_mode === 'teleconsulta' && appointment.technical_issue_count > 0 && (
                <Badge variant="outline" className="text-xs gap-1 text-red-600 border-red-300">
                  {appointment.technical_issue_count} falha(s)
                </Badge>
              )}
              
              <Badge variant="outline" className="text-xs">
                {typeLabels[appointment_type]}
              </Badge>
              
              {sourceLabel && sourceLabel !== 'Manual' && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {sourceLabel}
                </Badge>
              )}
              
              {/* Show procedure cost for finalized appointments - only for authorized users */}
              {status === 'finalizado' && canViewCost && procedure_cost !== undefined && procedure_cost !== null && procedure_cost > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs gap-1 text-emerald-600 border-emerald-300">
                      <Package className="h-3 w-3" />
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(procedure_cost)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Custo do procedimento (materiais consumidos)</TooltipContent>
                </Tooltip>
              )}
            </div>
            
            {notes && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                {notes}
              </p>
            )}
          </div>
          
          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {statusActions.map((action, idx) => (
                <DropdownMenuItem 
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    if ('status' in action && action.status) {
                      onStatusChange?.(appointment.id, action.status);
                    }
                  }}
                >
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.label}
                </DropdownMenuItem>
              ))}
              
              {statusActions.length > 0 && <DropdownMenuSeparator />}
              
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onLaunchSale?.(appointment);
              }}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Lançar Venda
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onReschedule?.(appointment);
              }}>
                <CalendarClock className="mr-2 h-4 w-4" />
                Reagendar
              </DropdownMenuItem>
              
              {status !== 'faltou' && status !== 'cancelado' && status !== 'finalizado' && (
                <>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange?.(appointment.id, 'faltou');
                  }}>
                    <UserX className="mr-2 h-4 w-4" />
                    Marcar como Falta
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange?.(appointment.id, 'cancelado');
                    }}
                    className="text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </AppointmentHoverPreview>
  );
}
