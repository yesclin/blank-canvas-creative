import { useState } from "react";
import { calculateAgeFromDateOnly, formatDateOnly } from "@/utils/dateUtils";
import { useNavigate } from "react-router-dom";
import { PreRegistrationSection } from "@/components/agenda/PreRegistrationSection";
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
  Power,
  Phone,
  Mail,
  Calendar,
  FolderOpen,
  MessageSquare,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Appointment, AppointmentStatus, MeetingStatus } from "@/types/agenda";
import { statusLabels, statusColors, typeLabels, careModeLabels, meetingStatusLabels, precheckStatusLabels, paymentTypeLabels } from "@/types/agenda";
import { getAppointmentSourceLabel } from "@/utils/appointmentSource";
import { useTeleconsultaActions, useTeleconsultaSession } from "@/hooks/useTeleconsulta";
import { usePermissions } from "@/hooks/usePermissions";
import { useAppointmentFinancialStatus } from "@/hooks/useAppointmentFinancialStatus";
import { PatientAvatar } from "./PatientAvatar";
import { AppointmentPaymentBadge } from "./AppointmentPaymentBadge";
import { AppointmentReceivePaymentDialog } from "./AppointmentReceivePaymentDialog";
import { AppointmentPaymentsHistory } from "./AppointmentPaymentsHistory";
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
  const { calculateAgeFromDateOnly } = require("@/utils/dateUtils");
  return calculateAgeFromDateOnly(birthDate) ?? undefined;
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
  const { role, can } = usePermissions();
  const financial = useAppointmentFinancialStatus(appointment);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
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
    const actions: { label: string; icon: typeof CheckCircle2; status: AppointmentStatus }[] = [];
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
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
        {/* ───── Header ───── */}
        <div className="sticky top-0 z-10 bg-background border-b px-5 pt-5 pb-4">
          <SheetHeader className="p-0">
            <div className="flex items-center gap-3">
              <PatientAvatar
                name={patient?.full_name}
                avatarUrl={patient?.avatar_url}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-left text-base truncate leading-tight">
                  {patient?.full_name || "Paciente"}
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {start_time.slice(0, 5)} – {end_time.slice(0, 5)}
                  {patientAge !== undefined && ` • ${patientAge} anos`}
                </p>
              </div>
            </div>
          </SheetHeader>

          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap mt-3">
            <Badge className={cn("text-[10px] px-2 py-0.5", statusColors[status])}>
              {statusLabels[status]}
            </Badge>
            <AppointmentPaymentBadge paymentStatus={financial.paymentStatus} paymentType={payment_type} showType />
            {is_first_visit && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                <Sparkles className="h-2.5 w-2.5" /> 1ª
              </Badge>
            )}
            {is_return && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                <RotateCcw className="h-2.5 w-2.5" /> Retorno
              </Badge>
            )}
            {is_fit_in && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Encaixe</Badge>
            )}
            {isTeleconsulta && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                <Video className="h-2.5 w-2.5" /> Tele
              </Badge>
            )}
          </div>

          {/* Primary action in header */}
          {statusActions.length > 0 && (
            <div className="mt-3">
              {statusActions.map((action) => (
                <Button key={action.status} className="w-full gap-2" size="sm" onClick={() => handleAction(action.status)}>
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* ───── Body ───── */}
        <div className="px-5 py-4 space-y-5">

          {/* Clinical Alert */}
          {!isReceptionist && patient?.has_clinical_alert && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-destructive">Alerta Clínico</p>
                <p className="text-xs text-destructive/80 mt-0.5">{patient.clinical_alert_text}</p>
              </div>
            </div>
          )}

          {/* ── Section: Atendimento ── */}
          <Section title="Atendimento" icon={Stethoscope}>
            <InfoRow label="Horário" value={`${start_time.slice(0, 5)} – ${end_time.slice(0, 5)}`} />
            <InfoRow label="Profissional" value={professional?.full_name} />
            {specialty && <InfoRow label="Especialidade" value={specialty.name} />}
            {procedure && <InfoRow label="Procedimento" value={procedure.name} />}
            {room && <InfoRow label="Sala" value={room.name} />}
            {insurance && <InfoRow label="Convênio" value={insurance.name} />}
            <InfoRow label="Tipo" value={typeLabels[appointment_type]} />
            {care_mode && <InfoRow label="Modalidade" value={careModeLabels[care_mode] || care_mode} />}
            {(() => {
              const sourceLabel = getAppointmentSourceLabel(appointment);
              return sourceLabel ? <InfoRow label="Origem" value={sourceLabel} /> : null;
            })()}
          </Section>

          <Separator />

          {/* ── Section: Financeiro ── */}
          <Section title="Financeiro" icon={DollarSign}>
            <InfoRow label="Pagamento" value={paymentTypeLabels[payment_type] || payment_type || "—"} />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <AppointmentPaymentBadge paymentStatus={financial.paymentStatus} />
            </div>

            {/* Financial summary cards */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Previsto</p>
                <p className="text-xs font-semibold">{formatCurrency(financial.amountExpected)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Recebido</p>
                <p className="text-xs font-semibold text-green-600">{formatCurrency(financial.amountReceived)}</p>
              </div>
              <div className={cn("rounded-lg p-2 text-center", financial.amountDue > 0 ? "bg-destructive/5" : "bg-muted/50")}>
                <p className="text-[10px] text-muted-foreground">Pendente</p>
                <p className={cn("text-xs font-semibold", financial.amountDue > 0 ? "text-red-600" : "text-muted-foreground")}>
                  {formatCurrency(financial.amountDue)}
                </p>
              </div>
            </div>

            {/* Payment action */}
            {(() => {
              const canFinance = can("financeiro", "create") || can("agenda", "edit");
              const ps = financial.paymentStatus;
              
              if (ps === "pago") {
                return (
                  <Badge variant="outline" className="w-full justify-center py-1.5 text-xs text-green-700 border-green-300 bg-green-50 dark:bg-green-950 dark:text-green-300 dark:border-green-800 mt-2">
                    ✓ Pagamento concluído
                  </Badge>
                );
              }
              if (ps === "isento") {
                return (
                  <Badge variant="outline" className="w-full justify-center py-1.5 text-xs mt-2">Isento</Badge>
                );
              }
              if (ps === "faturar_convenio") {
                return (
                  <Badge variant="outline" className="w-full justify-center py-1.5 text-xs text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 mt-2">
                    Faturar convênio
                  </Badge>
                );
              }
              if ((ps === "pendente" || ps === "parcial") && canFinance) {
                return (
                  <Button variant="default" size="sm" className="w-full gap-2 mt-2" onClick={() => setPaymentDialogOpen(true)}>
                    <DollarSign className="h-4 w-4" />
                    {ps === "parcial" ? "Receber Restante" : "Receber Pagamento"}
                  </Button>
                );
              }
              return null;
            })()}
          </Section>

          {/* Payment History */}
          <AppointmentPaymentsHistory appointmentId={appointment.id} clinicId={appointment.clinic_id} />

          {/* ── Section: Contato ── */}
          {(patient?.phone || patient?.email || patient?.birth_date) && (
            <>
              <Separator />
              <Section title="Contato" icon={Phone}>
                {patient?.phone && <InfoRow label="Telefone" value={patient.phone} />}
                {patient?.email && <InfoRow label="E-mail" value={patient.email} />}
                {patient?.birth_date && (
                  <InfoRow 
                    label="Nascimento" 
                    value={`${new Date(patient.birth_date).toLocaleDateString("pt-BR")}${patientAge !== undefined ? ` (${patientAge} anos)` : ''}`} 
                  />
                )}
              </Section>
            </>
          )}

          {/* ── Section: Teleconsulta ── */}
          {isTeleconsulta && (() => {
            const hasSession = !!teleSession;
            const sessionStatus = teleSession?.status ?? null;
            const isSessionActive = hasSession && sessionStatus !== 'encerrada' && sessionStatus !== 'falhou';
            const isSessionEnded = sessionStatus === 'encerrada';

            let sessionLabel = "Não Gerada";
            let sessionLabelColor = "text-muted-foreground";

            if (hasSession) {
              switch (sessionStatus) {
                case 'nao_iniciada':
                  sessionLabel = "Sala Gerada"; sessionLabelColor = "text-blue-600"; break;
                case 'aguardando_paciente':
                  sessionLabel = "Aguardando Paciente"; sessionLabelColor = "text-amber-600"; break;
                case 'em_andamento':
                  sessionLabel = "Em Andamento"; sessionLabelColor = "text-green-600"; break;
                case 'encerrada':
                  sessionLabel = "Encerrada"; sessionLabelColor = "text-muted-foreground"; break;
                case 'falhou':
                  sessionLabel = "Falha"; sessionLabelColor = "text-destructive"; break;
                default:
                  sessionLabel = meetingStatusLabels[meeting_status as MeetingStatus] || sessionStatus || "Gerada";
                  sessionLabelColor = getMeetingStatusColor(meeting_status);
              }
            }

            return (
              <>
                <Separator />
                <Section title="Teleconsulta" icon={Video}>
                  <InfoRow label="Sessão" value={sessionLabel} valueClassName={sessionLabelColor} />
                  <InfoRow label="Pré-check" value={precheckStatusLabels[precheck_status] || precheck_status} valueClassName={getPrecheckStatusColor(precheck_status)} />
                  <InfoRow label="Termo aceito" value={consent_telehealth_accepted ? "Sim" : "Pendente"} valueClassName={consent_telehealth_accepted ? "text-green-600" : ""} />
                  {meeting_provider && <InfoRow label="Provedor" value={meeting_provider} />}
                  {technical_issue_count > 0 && <InfoRow label="Intercorrências" value={`${technical_issue_count}`} />}
                  {meeting_started_at && <InfoRow label="Início sessão" value={formatTimestamp(meeting_started_at) || ""} />}
                  {meeting_ended_at && <InfoRow label="Fim sessão" value={formatTimestamp(meeting_ended_at) || ""} />}

                  {meeting_link && hasSession && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-xs mt-1">
                      <Video className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{meeting_link}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {!hasSession && (
                      <Button variant="outline" size="sm" className="gap-1" disabled={generateRoom.isPending}
                        onClick={() => generateRoom.mutate({
                          appointmentId: appointment.id,
                          patientId: appointment.patient_id,
                          professionalId: appointment.professional_id,
                        })}>
                        <Video className="h-3.5 w-3.5" /> Gerar Sala
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
                              <Copy className="h-3.5 w-3.5" /> Copiar Link
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.success("Link reenviado ao paciente")}>
                              <Send className="h-3.5 w-3.5" /> Reenviar
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
                          <Wifi className="h-3.5 w-3.5" /> Registrar Falha
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1 text-destructive"
                          onClick={() => endSession.mutate({
                            appointmentId: appointment.id,
                            sessionId: teleSession!.id,
                          })}>
                          <Power className="h-3.5 w-3.5" /> Encerrar
                        </Button>
                      </>
                    )}
                    {!isSessionEnded && (
                      <Button variant="outline" size="sm" className="gap-1"
                        onClick={() => convertToPresencial.mutate({ appointmentId: appointment.id })}>
                        <ArrowRightLeft className="h-3.5 w-3.5" /> Presencial
                      </Button>
                    )}
                  </div>
                </Section>
              </>
            );
          })()}

          {/* ── Section: Observações ── */}
          {notes && (
            <>
              <Separator />
              <Section title="Observações" icon={MessageSquare}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">{notes}</p>
              </Section>
            </>
          )}

          {/* ── Section: Histórico de status ── */}
          {(arrived_at || started_at || finished_at) && (
            <>
              <Separator />
              <Section title="Histórico" icon={History}>
                <div className="space-y-1.5">
                  {arrived_at && <p className="text-xs text-muted-foreground">✓ Chegou às {formatTimestamp(arrived_at)}</p>}
                  {started_at && <p className="text-xs text-muted-foreground">▶ Atendimento iniciado às {formatTimestamp(started_at)}</p>}
                  {finished_at && <p className="text-xs text-muted-foreground">■ Finalizado às {formatTimestamp(finished_at)}</p>}
                </div>
              </Section>
            </>
          )}

          {/* ── Section: Pré-cadastro ── */}
          <Separator />
          <Section title="Pré-cadastro" icon={FileText}>
            <PreRegistrationSection
              appointmentId={appointment.id}
              clinicId={appointment.clinic_id}
              patientId={appointment.patient_id}
              patientName={patient?.full_name}
              patientPhone={patient?.phone}
              patientEmail={patient?.email}
            />
          </Section>

          {/* ── Actions ── */}
          <Separator />
          <div className="space-y-2 pb-2">
            {/* Secondary actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                onOpenChange(false);
                onLaunchSale?.(appointment);
              }}>
                <ShoppingCart className="h-3.5 w-3.5" /> Venda
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                onOpenChange(false);
                onReschedule?.(appointment);
              }}>
                <CalendarClock className="h-3.5 w-3.5" /> Reagendar
              </Button>
            </div>

            {/* Patient navigation */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                onOpenChange(false);
                navigate(`/app/pacientes/${appointment.patient_id}`);
              }}>
                <User className="h-3.5 w-3.5" /> Perfil
              </Button>
              {!isReceptionist && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                  onOpenChange(false);
                  navigate(`/app/prontuario/${appointment.patient_id}`);
                }}>
                  <FolderOpen className="h-3.5 w-3.5" /> Prontuário
                </Button>
              )}
            </div>

            {/* Destructive actions - visually separated */}
            {!isTerminal && (
              <div className="grid grid-cols-2 gap-2 pt-3 mt-1 border-t border-dashed border-border">
                <Button variant="outline" size="sm" className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950"
                  onClick={() => { onStatusChange?.(appointment.id, "faltou"); onOpenChange(false); }}>
                  <UserX className="h-3.5 w-3.5" /> Falta
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/20 hover:bg-destructive/5"
                  onClick={() => { onStatusChange?.(appointment.id, "cancelado"); onOpenChange(false); }}>
                  <XCircle className="h-3.5 w-3.5" /> Cancelar
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>

      {/* Payment Dialog */}
      <AppointmentReceivePaymentDialog
        appointment={appointment}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        financialStatus={financial}
      />
    </Sheet>
  );
}

/* ── Shared UI pieces ── */

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Clock; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      <div className="space-y-1.5">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, valueClassName }: { label: string; value?: string | null; valueClassName?: string }) {
  return (
    <div className="flex items-center justify-between text-sm gap-2">
      <span className="text-muted-foreground text-xs shrink-0">{label}</span>
      <span className={cn("font-medium text-xs truncate text-right", valueClassName)}>{value || "—"}</span>
    </div>
  );
}
