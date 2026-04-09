import { useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Square,
  Clock,
  Stethoscope,
  DollarSign,
  Phone,
  User,
  FolderOpen,
  ShoppingCart,
  Calendar,
  Pause,
  PlayCircle,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalActiveAppointment } from "@/contexts/GlobalActiveAppointmentContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useAppointmentFinancialStatus } from "@/hooks/useAppointmentFinancialStatus";
import { useAppointmentSession, usePauseSession, useResumeSession, useFinalizeSession } from "@/hooks/useAppointmentSession";
import { SessionTimerBadge } from "@/components/agenda/SessionTimerBadge";
import { PatientAvatar } from "@/components/agenda/PatientAvatar";
import { AppointmentPaymentBadge } from "@/components/agenda/AppointmentPaymentBadge";
import { AppointmentReceivePaymentDialog } from "@/components/agenda/AppointmentReceivePaymentDialog";
import { calculateAgeFromDateOnly, formatDateOnly } from "@/utils/dateUtils";
import { statusLabels, statusColors, typeLabels, careModeLabels, paymentTypeLabels } from "@/types/agenda";
import { getAppointmentSourceLabel } from "@/utils/appointmentSource";
import type { Appointment, AppointmentStatus } from "@/types/agenda";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function ActiveAppointmentDrawer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, canAccessClinicalContent } = usePermissions();
  const {
    appointments,
    selectedAppointment: appointment,
    setSelectedAppointment,
    drawerOpen,
    closeDrawer,
    refresh,
  } = useGlobalActiveAppointment();

  const financial = useAppointmentFinancialStatus(appointment);
  const { data: session } = useAppointmentSession(appointment?.id);
  const pauseSession = usePauseSession();
  const resumeSession = useResumeSession();
  const finalizeSession = useFinalizeSession();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const isReceptionist = role === "recepcionista";

  const handleFinalize = async () => {
    if (!appointment) return;
    setFinalizing(true);
    try {
      // Generate session summary
      await finalizeSession.mutateAsync({ appointmentId: appointment.id });

      // Update appointment status
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "finalizado",
          finished_at: new Date().toISOString(),
        })
        .eq("id", appointment.id);

      if (error) throw error;

      toast.success("Atendimento finalizado com sucesso");
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["global-active-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["active-appointment"] });
      
      refresh();
      closeDrawer();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao finalizar atendimento");
    } finally {
      setFinalizing(false);
    }
  };

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
    started_at,
    care_mode,
  } = appointment;

  const patientAge = patient?.birth_date
    ? calculateAgeFromDateOnly(patient.birth_date) ?? undefined
    : undefined;

  return (
    <>
      <Sheet open={drawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col" side="right">
          {/* ── Multi-appointment selector ── */}
          {appointments.length > 1 && (
            <div className="border-b px-4 py-2 bg-muted/30">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                {appointments.length} atendimentos ativos
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {appointments.map((apt) => (
                  <button
                    key={apt.id}
                    onClick={() => setSelectedAppointment(apt)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors whitespace-nowrap",
                      apt.id === appointment.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    )}
                  >
                    <PatientAvatar name={apt.patient?.full_name} avatarUrl={apt.patient?.avatar_url} size="sm" />
                    <span className="truncate max-w-[120px]">{apt.patient?.full_name || "Paciente"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Header ── */}
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
              {is_first_visit && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">1ª consulta</Badge>}
              {is_return && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Retorno</Badge>}
              {is_fit_in && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Encaixe</Badge>}
            </div>

            {/* Timer + Pause/Resume */}
            {started_at && (
              <div className="mt-3 flex items-center justify-between">
                <SessionTimerBadge
                  startedAt={started_at}
                  isPaused={session?.is_paused || false}
                  totalPausedSeconds={session?.total_paused_seconds || 0}
                  currentPauseStartedAt={session?.current_pause_started_at}
                  size="lg"
                />
                <div className="flex gap-1.5">
                  {session?.is_paused ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => resumeSession.mutate({ appointmentId: appointment.id })}
                      disabled={resumeSession.isPending}
                    >
                      <PlayCircle className="h-4 w-4" />
                      Retomar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => pauseSession.mutate({ appointmentId: appointment.id })}
                      disabled={pauseSession.isPending}
                    >
                      <Pause className="h-4 w-4" />
                      Pausar
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Finalize button */}
            <Button
              className="w-full gap-2 mt-3"
              size="sm"
              onClick={handleFinalize}
              disabled={finalizing}
            >
              <Square className="h-4 w-4" />
              {finalizing ? "Finalizando..." : "Finalizar Atendimento"}
            </Button>
          </div>

          {/* ── Body ── */}
          <ScrollArea className="flex-1">
            <div className="px-5 py-4 space-y-5">

              {/* Clinical Alert */}
              {canAccessClinicalContent && patient?.has_clinical_alert && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-destructive">Alerta Clínico</p>
                    <p className="text-xs text-destructive/80 mt-0.5">{patient.clinical_alert_text}</p>
                  </div>
                </div>
              )}

              {/* Section: Atendimento */}
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

              {/* Section: Financeiro */}
              <Section title="Financeiro" icon={DollarSign}>
                <InfoRow label="Pagamento" value={paymentTypeLabels[payment_type] || payment_type || "—"} />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground text-xs">Status</span>
                  <AppointmentPaymentBadge paymentStatus={financial.paymentStatus} />
                </div>

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
                    <p className={cn("text-xs font-semibold", financial.amountDue > 0 ? "text-destructive" : "text-muted-foreground")}>
                      {formatCurrency(financial.amountDue)}
                    </p>
                  </div>
                </div>

                {(financial.paymentStatus === "pendente" || financial.paymentStatus === "parcial") && (
                  <Button variant="default" size="sm" className="w-full gap-2 mt-2" onClick={() => setPaymentDialogOpen(true)}>
                    <DollarSign className="h-4 w-4" />
                    {financial.paymentStatus === "parcial" ? "Receber Restante" : "Receber Pagamento"}
                  </Button>
                )}
              </Section>

              {/* Section: Contato */}
              {(patient?.phone || patient?.email) && (
                <>
                  <Separator />
                  <Section title="Contato" icon={Phone}>
                    {patient?.phone && <InfoRow label="Telefone" value={patient.phone} />}
                    {patient?.email && <InfoRow label="E-mail" value={patient.email} />}
                    {patient?.birth_date && (
                      <InfoRow
                        label="Nascimento"
                        value={`${formatDateOnly(patient.birth_date)}${patientAge !== undefined ? ` (${patientAge} anos)` : ""}`}
                      />
                    )}
                  </Section>
                </>
              )}

              {/* Section: Observações */}
              {notes && (
                <>
                  <Separator />
                  <Section title="Observações" icon={Clock}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">{notes}</p>
                  </Section>
                </>
              )}

              <Separator />

              {/* Atalhos rápidos */}
              <div className="space-y-2 pb-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Atalhos</p>
                <div className="grid grid-cols-2 gap-2">
                  {canAccessClinicalContent && (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                      closeDrawer();
                      navigate(`/app/prontuario/${appointment.patient_id}?appointmentId=${appointment.id}`);
                    }}>
                      <FolderOpen className="h-3.5 w-3.5" /> Prontuário
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                    closeDrawer();
                    navigate(`/app/pacientes/${appointment.patient_id}`);
                  }}>
                    <User className="h-3.5 w-3.5" /> Paciente
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                    closeDrawer();
                    navigate("/app/agenda");
                  }}>
                    <Calendar className="h-3.5 w-3.5" /> Agenda
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                    closeDrawer();
                    // Navigate to sales if available
                    toast.info("Abrir venda para o atendimento");
                  }}>
                    <ShoppingCart className="h-3.5 w-3.5" /> Venda
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Payment Dialog */}
      <AppointmentReceivePaymentDialog
        appointment={appointment}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        financialStatus={financial}
      />
    </>
  );
}

/* ── Shared UI ── */

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Clock; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
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
