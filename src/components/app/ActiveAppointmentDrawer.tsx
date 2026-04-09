import { useState, useCallback } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalActiveAppointment } from "@/contexts/GlobalActiveAppointmentContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useAppointmentFinancialStatus } from "@/hooks/useAppointmentFinancialStatus";
import { useAppointmentSession, usePauseSession, useResumeSession, useFinalizeSession } from "@/hooks/useAppointmentSession";
import { useUpdateAppointmentStatus } from "@/hooks/useAppointments";
import { useTissGuideGeneration } from "@/hooks/useTissGuideGeneration";
import { SessionTimerBadge } from "@/components/agenda/SessionTimerBadge";
import { PatientAvatar } from "@/components/agenda/PatientAvatar";
import { AppointmentPaymentBadge } from "@/components/agenda/AppointmentPaymentBadge";
import { AppointmentReceivePaymentDialog } from "@/components/agenda/AppointmentReceivePaymentDialog";
import { AppointmentMaterialsDialog } from "@/components/agenda/AppointmentMaterialsDialog";
import { TissGuideGenerationDialog, GeneratedGuideData } from "@/components/agenda/TissGuideGenerationDialog";
import { calculateAgeFromDateOnly, formatDateOnly } from "@/utils/dateUtils";
import { statusLabels, statusColors, typeLabels, careModeLabels, paymentTypeLabels } from "@/types/agenda";
import { getAppointmentSourceLabel } from "@/utils/appointmentSource";
import type { Appointment } from "@/types/agenda";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { QuickClinicalSummary } from "./QuickClinicalSummary";

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
  const updateStatusMutation = useUpdateAppointmentStatus();
  const { pendingAppointment, setPendingAppointment, generateGuide } = useTissGuideGeneration();

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [materialsDialogOpen, setMaterialsDialogOpen] = useState(false);
  const [tissDialogOpen, setTissDialogOpen] = useState(false);
  const [finalizingAppointment, setFinalizingAppointment] = useState<Appointment | null>(null);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["global-active-appointments"] });
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
    queryClient.invalidateQueries({ queryKey: ["active-appointment"] });
    refresh();
  }, [queryClient, refresh]);

  // Step 1: Click "Finalizar" → finalize session summary → open materials dialog
  const handleFinalize = useCallback(async () => {
    if (!appointment) return;
    try {
      await finalizeSession.mutateAsync({ appointmentId: appointment.id });
    } catch (e) {
      console.error("Error finalizing session:", e);
    }
    setFinalizingAppointment(appointment);
    setMaterialsDialogOpen(true);
  }, [appointment, finalizeSession]);

  // Step 2: Materials confirmed → update status → check TISS
  const handleMaterialsConfirm = useCallback(async () => {
    setMaterialsDialogOpen(false);
    if (!finalizingAppointment) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: finalizingAppointment.id,
        status: "finalizado",
      });

      toast.success("Atendimento finalizado com sucesso");

      // Check if TISS guide is needed
      if (finalizingAppointment.payment_type === "convenio" && finalizingAppointment.insurance) {
        const finalizedApt: Appointment = { ...finalizingAppointment, status: "finalizado" };
        setPendingAppointment(finalizedApt);
        setTissDialogOpen(true);
      } else {
        invalidateAll();
        closeDrawer();
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao finalizar atendimento");
    }

    setFinalizingAppointment(null);
  }, [finalizingAppointment, updateStatusMutation, setPendingAppointment, invalidateAll, closeDrawer]);

  const handleMaterialsCancel = useCallback(() => {
    setMaterialsDialogOpen(false);
    setFinalizingAppointment(null);
  }, []);

  // Step 3 (optional): TISS guide confirmed or skipped
  const handleTissGuideConfirm = useCallback(async (guideData: GeneratedGuideData) => {
    await generateGuide(guideData);
    setPendingAppointment(null);
    setTissDialogOpen(false);
    invalidateAll();
    closeDrawer();
  }, [generateGuide, setPendingAppointment, invalidateAll, closeDrawer]);

  const handleTissGuideSkip = useCallback(() => {
    setPendingAppointment(null);
    setTissDialogOpen(false);
    invalidateAll();
    closeDrawer();
  }, [setPendingAppointment, invalidateAll, closeDrawer]);

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
              disabled={finalizeSession.isPending || materialsDialogOpen}
            >
              <Square className="h-4 w-4" />
              {finalizeSession.isPending ? "Preparando..." : "Finalizar Atendimento"}
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
                    navigate(`/app/pacientes`);
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

      {/* Materials Dialog — same as Agenda flow */}
      <AppointmentMaterialsDialog
        open={materialsDialogOpen}
        onOpenChange={setMaterialsDialogOpen}
        appointmentId={finalizingAppointment?.id || appointment.id}
        procedureName={finalizingAppointment?.procedure?.name || procedure?.name}
        onConfirm={handleMaterialsConfirm}
        onCancel={handleMaterialsCancel}
      />

      {/* TISS Guide Dialog — same as Agenda flow */}
      <TissGuideGenerationDialog
        open={tissDialogOpen}
        onOpenChange={setTissDialogOpen}
        appointment={pendingAppointment}
        onConfirm={handleTissGuideConfirm}
        onSkip={handleTissGuideSkip}
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
