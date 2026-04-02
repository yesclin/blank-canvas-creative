import { useNavigate } from "react-router-dom";
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
  Video,
  Copy,
  Send,
  ExternalLink,
  Wifi,
  ArrowRightLeft,
  ClipboardCheck,
  Power,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  UserCog,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Appointment, AppointmentStatus, MeetingStatus } from "@/types/agenda";
import { statusLabels, statusColors, typeLabels, careModeLabels, meetingStatusLabels, precheckStatusLabels, paymentStatusLabels, paymentTypeLabels, bookingSourceLabels } from "@/types/agenda";
import { getAppointmentSourceLabel } from "@/utils/appointmentSource";
import { useTeleconsultaActions, useTeleconsultaSession } from "@/hooks/useTeleconsulta";
import { usePermissions } from "@/hooks/usePermissions";
import { useAppointmentFinancialStatus } from "@/hooks/useAppointmentFinancialStatus";
import { PatientAvatar } from "./PatientAvatar";
import { AppointmentPaymentBadge } from "./AppointmentPaymentBadge";
import { toast } from "sonner";

interface AppointmentDetailDrawerProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (id: string, status: AppointmentStatus) => void;
  onReschedule?: (appointment: Appointment) => void;
  onLaunchSale?: (appointment: Appointment) => void;
  onStartAtendimento?: (appointment: Appointment) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function calculateAge(birthDate?: string): number | undefined {
  if (!birthDate) return undefined;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
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
  const navigate = useNavigate();
  const { role } = usePermissions();
  const financial = useAppointmentFinancialStatus(appointment);
  const isTeleconsulta = appointment?.care_mode === 'teleconsulta';
  const { data: teleSession } = useTeleconsultaSession(isTeleconsulta ? appointment?.id ?? null : null);
  const { generateRoom, copyLink, endSession, reportTechnicalIssue, convertToPresencial } = useTeleconsultaActions();

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
    care_mode,
    meeting_link,
    meeting_status,
    precheck_status,
    consent_telehealth_accepted,
    technical_issue_count,
    meeting_provider,
    meeting_started_at,
    meeting_ended_at,
  } = appointment;

  const statusActions = getStatusActions(status);
  const isTerminal = status === "finalizado" || status === "faltou" || status === "cancelado";
  const isReceptionist = role === 'recepcionista';
  const patientAge = calculateAge(patient?.birth_date);

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

  const handleAction = (newStatus: AppointmentStatus) => {
    if (newStatus === "em_atendimento") {
      onStartAtendimento?.(appointment);
    } else {
      onStatusChange?.(appointment.id, newStatus);
    }
  };

  const handleEnterRoom = () => {
    if (isReceptionist) {
      if (meeting_link) copyLink(meeting_link);
      return;
    }
    navigate(`/app/teleconsulta/${appointment.id}/sala`);
  };

  const formatTimestamp = (ts?: string) => {
    if (!ts) return null;
    try {
      return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch { return null; }
  };

  const getMeetingStatusColor = (ms: string) => {
    switch (ms) {
      case 'nao_gerada': return 'text-muted-foreground';
      case 'gerada': case 'enviada': return 'text-blue-600';
      case 'paciente_entrou': case 'profissional_entrou': return 'text-amber-600';
      case 'em_andamento': return 'text-green-600';
      case 'encerrada': return 'text-muted-foreground';
      case 'falhou': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getPrecheckStatusColor = (ps: string) => {
    switch (ps) {
      case 'pendente': return 'text-muted-foreground';
      case 'em_progresso': return 'text-amber-600';
      case 'concluido': return 'text-green-600';
      case 'falhou': return 'text-destructive';
      case 'parcialmente_concluido': return 'text-amber-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          {/* Patient header with avatar */}
          <div className="flex items-center gap-3">
            <PatientAvatar
              name={patient?.full_name}
              avatarUrl={patient?.avatar_url}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-left text-lg truncate">
                {patient?.full_name || "Paciente"}
              </SheetTitle>
              {patientAge !== undefined && (
                <p className="text-xs text-muted-foreground">{patientAge} anos</p>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <Badge className={cn("text-xs", statusColors[status])}>
              {statusLabels[status]}
            </Badge>
            <AppointmentPaymentBadge
              paymentStatus={financial.paymentStatus}
              paymentType={payment_type}
              showType
            />
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
            {isTeleconsulta && (
              <Badge variant="secondary" className="text-xs gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                <Video className="h-3 w-3" />
                Teleconsulta
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-5">
          {/* Alerts - hidden for receptionist */}
          {!isReceptionist && patient?.has_clinical_alert && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Alerta Clínico</p>
                <p className="text-xs text-destructive/80">{patient.clinical_alert_text}</p>
              </div>
            </div>
          )}

          {/* Patient Contact */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Paciente</p>
            {patient?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{patient.email}</span>
              </div>
            )}
            {patient?.birth_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{new Date(patient.birth_date).toLocaleDateString("pt-BR")}{patientAge !== undefined ? ` (${patientAge} anos)` : ''}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Appointment Details */}
          <div className="space-y-3">
            <DetailRow icon={Clock} label="Horário" value={`${start_time.slice(0, 5)} – ${end_time.slice(0, 5)}`} />
            <DetailRow icon={User} label="Profissional" value={professional?.full_name} />
            {specialty && <DetailRow icon={Stethoscope} label="Especialidade" value={specialty.name} />}
            {procedure && <DetailRow icon={FileText} label="Procedimento" value={procedure.name} />}
            {room && <DetailRow icon={DoorOpen} label="Sala" value={room.name} />}
            {insurance && <DetailRow icon={CreditCard} label="Convênio" value={insurance.name} />}
            <DetailRow icon={FileText} label="Tipo" value={typeLabels[appointment_type]} />
            {care_mode && <DetailRow icon={Video} label="Modalidade" value={careModeLabels[care_mode] || care_mode} />}
          </div>

          <Separator />

          {/* Financial Section */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Financeiro</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pagamento</span>
              <span className="font-medium">{paymentTypeLabels[payment_type] || payment_type || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <AppointmentPaymentBadge paymentStatus={financial.paymentStatus} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor previsto</span>
              <span className="font-medium">{formatCurrency(financial.amountExpected)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Recebido</span>
              <span className="font-medium text-green-600">{formatCurrency(financial.amountReceived)}</span>
            </div>
            {financial.amountDue > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pendente</span>
                <span className="font-medium text-red-600">{formatCurrency(financial.amountDue)}</span>
              </div>
            )}
          </div>

          {/* Teleconsulta Section */}
          {isTeleconsulta && (() => {
            const hasSession = !!teleSession;
            const sessionStatus = teleSession?.status ?? null;
            const isSessionActive = hasSession && sessionStatus !== 'encerrada' && sessionStatus !== 'falhou';
            const isSessionEnded = sessionStatus === 'encerrada';

            let sessionLabel = "Não Gerada";
            let sessionText = "Sala não gerada";
            let sessionLabelColor = "text-muted-foreground";

            if (hasSession) {
              switch (sessionStatus) {
                case 'nao_iniciada':
                  sessionLabel = "Sala Gerada"; sessionText = "Sala gerada e pronta para uso"; sessionLabelColor = "text-blue-600"; break;
                case 'aguardando_paciente':
                  sessionLabel = "Aguardando Paciente"; sessionText = "Sala gerada aguardando entrada do paciente"; sessionLabelColor = "text-amber-600"; break;
                case 'em_andamento':
                  sessionLabel = "Em Andamento"; sessionText = "Teleconsulta em andamento"; sessionLabelColor = "text-green-600"; break;
                case 'encerrada':
                  sessionLabel = "Encerrada"; sessionText = "Teleconsulta encerrada"; sessionLabelColor = "text-muted-foreground"; break;
                case 'falhou':
                  sessionLabel = "Falha"; sessionText = "Sessão com falha técnica"; sessionLabelColor = "text-destructive"; break;
                default:
                  sessionLabel = meetingStatusLabels[meeting_status as MeetingStatus] || sessionStatus || "Gerada";
                  sessionText = `Status da sessão: ${sessionStatus}`;
                  sessionLabelColor = getMeetingStatusColor(meeting_status);
              }
            }

            return (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Video className="h-4 w-4 text-blue-600" />
                    Teleconsulta
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sessão</span>
                      <span className={cn("font-medium", sessionLabelColor)}>{sessionLabel}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pré-check</span>
                      <span className={cn("font-medium", getPrecheckStatusColor(precheck_status))}>
                        {precheckStatusLabels[precheck_status] || precheck_status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Termo aceito</span>
                      <span className={cn("font-medium", consent_telehealth_accepted ? "text-green-600" : "text-muted-foreground")}>
                        {consent_telehealth_accepted ? "Sim" : "Pendente"}
                      </span>
                    </div>
                    {meeting_provider && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Provedor</span>
                        <span className="font-medium capitalize">{meeting_provider}</span>
                      </div>
                    )}
                    {technical_issue_count > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Intercorrências</span>
                        <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                          {technical_issue_count} registrada{technical_issue_count > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    )}
                    {meeting_started_at && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Início sessão</span>
                        <span className="text-xs">{formatTimestamp(meeting_started_at)}</span>
                      </div>
                    )}
                    {meeting_ended_at && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Fim sessão</span>
                        <span className="text-xs">{formatTimestamp(meeting_ended_at)}</span>
                      </div>
                    )}
                    <p className={cn("text-sm italic", hasSession ? "text-foreground" : "text-muted-foreground")}>
                      {sessionText}
                    </p>
                    {meeting_link && hasSession && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-sm">
                        <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate flex-1 text-xs">{meeting_link}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {!hasSession && (
                        <Button variant="outline" size="sm" className="gap-1" disabled={generateRoom.isPending}
                          onClick={() => generateRoom.mutate({
                            appointmentId: appointment.id,
                            patientId: appointment.patient_id,
                            professionalId: appointment.professional_id,
                          })}>
                          <Video className="h-3.5 w-3.5" />
                          Gerar Sala
                        </Button>
                      )}
                      {hasSession && !isSessionEnded && (
                        <>
                          <Button variant="default" size="sm" className="gap-1" onClick={handleEnterRoom}>
                            <ExternalLink className="h-3.5 w-3.5" />
                            {isReceptionist ? 'Copiar' : 'Abrir Sala'}
                          </Button>
                          {meeting_link && (
                            <>
                              <Button variant="outline" size="sm" className="gap-1" onClick={() => copyLink(meeting_link)}>
                                <Copy className="h-3.5 w-3.5" />
                                Copiar Link
                              </Button>
                              <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.success("Link reenviado ao paciente")}>
                                <Send className="h-3.5 w-3.5" />
                                Reenviar
                              </Button>
                            </>
                          )}
                        </>
                      )}
                      {hasSession && isSessionActive && (
                        <>
                          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-amber-600"
                            onClick={() => reportTechnicalIssue.mutate({
                              appointmentId: appointment.id,
                              sessionId: teleSession!.id,
                              description: "Falha técnica reportada",
                            })}>
                            <Wifi className="h-3.5 w-3.5" />
                            Registrar Falha
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1 text-destructive"
                            onClick={() => endSession.mutate({
                              appointmentId: appointment.id,
                              sessionId: teleSession!.id,
                            })}>
                            <Power className="h-3.5 w-3.5" />
                            Encerrar
                          </Button>
                        </>
                      )}
                      {!isSessionEnded && (
                        <Button variant="outline" size="sm" className="gap-1"
                          onClick={() => convertToPresencial.mutate({ appointmentId: appointment.id })}>
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                          Presencial
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

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
              <Button key={action.status} className="w-full" onClick={() => handleAction(action.status)}>
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </Button>
            ))}

            {/* Quick navigation actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                onOpenChange(false);
                onLaunchSale?.(appointment);
              }}>
                <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                Venda
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                onOpenChange(false);
                onReschedule?.(appointment);
              }}>
                <CalendarClock className="mr-1 h-3.5 w-3.5" />
                Reagendar
              </Button>
            </div>

            {/* Patient quick actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                onOpenChange(false);
                navigate(`/app/pacientes/${appointment.patient_id}`);
              }}>
                <User className="mr-1 h-3.5 w-3.5" />
                Perfil
              </Button>
              {!isReceptionist && (
                <Button variant="outline" size="sm" onClick={() => {
                  onOpenChange(false);
                  navigate(`/app/prontuario/${appointment.patient_id}`);
                }}>
                  <FolderOpen className="mr-1 h-3.5 w-3.5" />
                  Prontuário
                </Button>
              )}
            </div>

            {/* Destructive actions */}
            {!isTerminal && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 hover:bg-amber-50"
                  onClick={() => { onStatusChange?.(appointment.id, "faltou"); onOpenChange(false); }}>
                  <UserX className="mr-1 h-3.5 w-3.5" />
                  Falta
                </Button>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => { onStatusChange?.(appointment.id, "cancelado"); onOpenChange(false); }}>
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
