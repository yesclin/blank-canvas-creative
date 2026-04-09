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
  MessageSquare,
  Zap,
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

  // Compact card for monthly/small slots
  if (compact) {
    return (
      <AppointmentHoverPreview appointment={appointment}>
        <div 
          className={cn(
            "px-2 py-1.5 rounded-md border cursor-pointer transition-all duration-150",
            "hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]",
            statusColors[status]
          )}
          onClick={() => onClick?.(appointment)}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <PatientAvatar name={patient?.full_name} avatarUrl={patient?.avatar_url} size="sm" />
              <span className="text-xs font-medium truncate">{patient?.full_name}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <AppointmentPaymentBadge paymentStatus={financial.paymentStatus} compact />
              <span className="text-[10px] text-muted-foreground font-mono">{start_time.slice(0, 5)}</span>
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
          "group relative p-3 rounded-lg border bg-card transition-all duration-150 cursor-pointer",
          "hover:shadow-md hover:border-primary/20 active:scale-[0.995]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        onClick={() => onClick?.(appointment)}
        tabIndex={0}
        role="button"
      >
        {/* Top row: avatar + name + time + menu */}
        <div className="flex items-start gap-2.5">
          <PatientAvatar 
            name={patient?.full_name} 
            avatarUrl={patient?.avatar_url} 
            size="sm" 
          />
          
          <div className="flex-1 min-w-0">
            {/* Name + time row */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold truncate leading-tight">
                {patient?.full_name}
              </p>
              <span className="text-xs text-muted-foreground font-mono shrink-0">
                {start_time.slice(0, 5)}–{end_time.slice(0, 5)}
              </span>
            </div>

            {/* Secondary info: procedure/professional */}
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {appointment.procedure?.name || appointment.specialty?.name || professional?.full_name}
            </p>

            {/* Status + financial badges row */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-medium", statusColors[status])}>
                {statusLabels[status]}
              </Badge>
              <AppointmentPaymentBadge paymentStatus={financial.paymentStatus} />
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                {typeLabels[appointment_type]}
              </Badge>
            </div>

            {/* Indicator icons row */}
            <div className="flex items-center gap-1 mt-1.5">
              {status === 'em_atendimento' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700 px-2 py-0.5 rounded-full animate-pulse hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClick?.(appointment);
                      }}
                    >
                      <Play className="h-3 w-3 fill-current" />
                      Em atendimento
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Abrir painel do atendimento ativo</TooltipContent>
                </Tooltip>
              )}
              {is_first_visit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Primeira consulta</TooltipContent>
                </Tooltip>
              )}
              {is_return && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <RotateCcw className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Retorno</TooltipContent>
                </Tooltip>
              )}
              {is_fit_in && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Encaixe</TooltipContent>
                </Tooltip>
              )}
              {!isReceptionist && patient?.has_clinical_alert && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-destructive/10">
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{patient.clinical_alert_text}</TooltipContent>
                </Tooltip>
              )}
              {has_pending_payment && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <DollarSign className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Pagamento pendente</TooltipContent>
                </Tooltip>
              )}
              {appointment.care_mode === 'teleconsulta' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Video className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Teleconsulta • {meetingStatusLabels[appointment.meeting_status as MeetingStatus] || appointment.meeting_status}
                  </TooltipContent>
                </Tooltip>
              )}
              {notes && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px]">
                    <p className="line-clamp-3 text-xs">{notes}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {sourceLabel && sourceLabel !== 'Manual' && (
                <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {sourceLabel}
                </span>
              )}
              {status === 'finalizado' && canViewCost && procedure_cost !== undefined && procedure_cost !== null && procedure_cost > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                      <Package className="h-3 w-3" />
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(procedure_cost)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Custo do procedimento</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          
          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
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
                  <DropdownMenuSeparator />
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
                    className="text-destructive focus:text-destructive"
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
