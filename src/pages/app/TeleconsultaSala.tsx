import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Loader2,
  User,
  Clock,
  Wifi,
  WifiOff,
  FileText,
  FilePlus,
  ClipboardList,
  Copy,
  AlertTriangle,
  Stethoscope,
  Calendar,
  Send,
  ShieldX,
  ArrowLeft,
  Monitor,
} from "lucide-react";
import { useTeleconsultaActions, useTeleconsultaSession } from "@/hooks/useTeleconsulta";
import { toast } from "sonner";

type ProfRoomStatus = "loading" | "denied" | "not_found" | "not_teleconsulta" | "waiting_patient" | "active" | "reconnecting" | "ended" | "technical_failure";

export default function TeleconsultaSala() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { data: teleSession, isLoading: sessionLoading } = useTeleconsultaSession(appointmentId ?? null);
  const { startSession, endSession, copyLink, reportTechnicalIssue } = useTeleconsultaActions();

  const [roomStatus, setRoomStatus] = useState<ProfRoomStatus>("loading");
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load appointment ──
  useEffect(() => {
    if (!appointmentId) return;
    loadAppointment();
    return () => {
      stopStream();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [appointmentId]);

  // ── Timer ──
  useEffect(() => {
    const startedAt = appointment?.meeting_started_at || appointment?.started_at;
    if (!startedAt || roomStatus !== "active") return;
    const startDate = new Date(startedAt);
    const tick = () => setElapsed(Math.floor((Date.now() - startDate.getTime()) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [appointment?.meeting_started_at, appointment?.started_at, roomStatus]);

  // ── Init stream once loaded ──
  useEffect(() => {
    if (loading || roomStatus === "denied" || roomStatus === "not_found" || roomStatus === "not_teleconsulta") return;
    initStream();
  }, [loading, roomStatus]);

  // ── Stream helpers ──
  const initStream = async () => {
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.warn("Erro ao acessar dispositivos:", err);
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const toggleCamera = useCallback(() => {
    streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !cameraOn; });
    setCameraOn((p) => !p);
  }, [cameraOn]);

  const toggleMic = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !micOn; });
    setMicOn((p) => !p);
  }, [micOn]);

  // ── Load ──
  const loadAppointment = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patients:patient_id(id, full_name, phone, email, birth_date, has_clinical_alert, clinical_alert_text),
          professionals:professional_id(full_name),
          specialties:specialty_id(name),
          procedures:procedure_id(name),
          insurances:insurance_id(name)
        `)
        .eq("id", appointmentId!)
        .single();

      if (error || !data) {
        setRoomStatus("not_found");
        setLoading(false);
        return;
      }

      const a = data as any;

      // Validate teleconsulta
      if (a.care_mode !== "teleconsulta") {
        setRoomStatus("not_teleconsulta");
        setLoading(false);
        return;
      }

      setAppointment(a);

      // Log professional entry
      await supabase
        .from("appointments")
        .update({
          meeting_status: a.meeting_status === "em_andamento" ? "em_andamento" : "profissional_entrou",
        })
        .eq("id", a.id);

      logEvent(a.id, a.clinic_id, "profissional_entrou");

      // Determine room status
      if (a.meeting_status === "encerrada") {
        setRoomStatus("ended");
      } else if (a.meeting_status === "em_andamento") {
        setRoomStatus("active");
      } else if (a.meeting_status === "paciente_entrou" || a.meeting_status === "profissional_entrou") {
        setRoomStatus("waiting_patient"); // Both may be in but session not started
      } else {
        setRoomStatus("waiting_patient");
        pollForPatient(a.id);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setRoomStatus("not_found");
      setLoading(false);
    }
  };

  const logEvent = async (aptId: string, cId: string, eventType: string) => {
    await supabase
      .from("teleconsultation_events" as any)
      .insert({
        clinic_id: cId,
        teleconsultation_session_id: aptId,
        appointment_id: aptId,
        event_type: eventType,
        actor_type: "professional",
      })
      .catch(() => {});
  };

  const pollForPatient = (aptId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from("appointments")
        .select("meeting_status")
        .eq("id", aptId)
        .single();
      const ms = (data as any)?.meeting_status;
      if (ms === "paciente_entrou") {
        // Patient is ready, we can start
        setRoomStatus("waiting_patient");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 5000);
  };

  // ── Actions ──
  const handleStartSession = () => {
    if (!teleSession || !appointmentId) return;
    startSession.mutate(
      { appointmentId, sessionId: teleSession.id },
      {
        onSuccess: () => {
          setRoomStatus("active");
          loadAppointment();
        },
      }
    );
  };

  const handleEndSession = () => {
    if (!teleSession || !appointmentId) return;
    endSession.mutate(
      { appointmentId, sessionId: teleSession.id },
      {
        onSuccess: () => {
          stopStream();
          if (pollRef.current) clearInterval(pollRef.current);
          setRoomStatus("ended");
          toast.success("Teleconsulta encerrada");
          setTimeout(() => navigate("/app/agenda"), 2000);
        },
      }
    );
  };

  const handleOpenProntuario = () => {
    if (appointment?.patients?.id) {
      window.open(`/app/prontuario/${appointment.patients.id}`, "_blank");
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    return calculateAgeFromDateOnly(birthDate);
  };

  // ══════════════════════════════════════════
  // RENDER — Loading
  // ══════════════════════════════════════════
  if (loading || sessionLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando sala de teleconsulta...</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER — Access Denied / Not Found / Not Teleconsulta
  // ══════════════════════════════════════════
  if (roomStatus === "denied" || roomStatus === "not_found" || roomStatus === "not_teleconsulta") {
    const messages: Record<string, { icon: typeof ShieldX; title: string; desc: string }> = {
      denied: { icon: ShieldX, title: "Acesso Negado", desc: "Você não tem permissão para acessar esta sala de teleconsulta." },
      not_found: { icon: AlertTriangle, title: "Agendamento Não Encontrado", desc: "O agendamento informado não existe ou não está acessível." },
      not_teleconsulta: { icon: Monitor, title: "Não é Teleconsulta", desc: "Este agendamento é presencial e não possui sala de teleconsulta." },
    };
    const msg = messages[roomStatus];
    const Icon = msg.icon;

    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Card className="max-w-sm shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Icon className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold">{msg.title}</h2>
            <p className="text-sm text-muted-foreground">{msg.desc}</p>
            <Button variant="outline" onClick={() => navigate("/app/agenda")} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar à Agenda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER — Ended
  // ══════════════════════════════════════════
  if (roomStatus === "ended") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Card className="max-w-sm shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Video className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Sessão Encerrada</h2>
            <p className="text-sm text-muted-foreground">
              A teleconsulta com {appointment?.patients?.full_name} foi encerrada.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate("/app/agenda")} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Agenda
              </Button>
              <Button onClick={handleOpenProntuario} className="gap-2">
                <ClipboardList className="h-4 w-4" /> Prontuário
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER — Active Room
  // ══════════════════════════════════════════
  const a = appointment as any;
  const isActive = roomStatus === "active";
  const hasAlert = a?.patients?.has_clinical_alert;
  const patientAge = calculateAge(a?.patients?.birth_date);

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0">
      {/* ── Main: Video ── */}
      <div className="flex-1 flex flex-col bg-black rounded-l-xl overflow-hidden">
        {/* Video area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${!cameraOn ? "hidden" : ""}`}
            style={{ transform: "scaleX(-1)" }}
          />

          {!cameraOn && (
            <div className="flex flex-col items-center gap-3 text-white/40 z-[5]">
              <div className="h-20 w-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <User className="h-10 w-10" />
              </div>
              <p className="text-sm">Câmera desligada</p>
            </div>
          )}

          {/* Waiting patient overlay */}
          {roomStatus === "waiting_patient" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="text-center text-white space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <h2 className="text-lg font-medium">Aguardando paciente...</h2>
                <p className="text-sm text-white/50">{a?.patients?.full_name}</p>
              </div>
            </div>
          )}

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent z-20">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1 bg-white/10 text-white border-0 text-xs">
                <User className="h-3 w-3" />
                {a?.patients?.full_name}
                {patientAge !== null && <span className="ml-1 opacity-60">{patientAge}a</span>}
              </Badge>
              {a?.specialties?.name && (
                <Badge variant="secondary" className="bg-white/10 text-white border-0 text-xs gap-1">
                  <Stethoscope className="h-3 w-3" />
                  {a.specialties.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isActive && (
                <Badge className="gap-1 bg-destructive text-destructive-foreground border-0 text-xs animate-pulse">
                  <Clock className="h-3 w-3" />
                  {formatTime(elapsed)}
                </Badge>
              )}
              <Badge variant="secondary" className="bg-white/10 text-white border-0 text-xs">
                {isActive ? <Wifi className="h-3 w-3 text-green-400" /> : <WifiOff className="h-3 w-3 text-amber-400" />}
              </Badge>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-3 bg-black border-t border-white/10 flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            className={`rounded-full h-12 w-12 transition-colors ${
              cameraOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }`}
            onClick={toggleCamera}
            title={cameraOn ? "Desligar câmera" : "Ligar câmera"}
          >
            {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            className={`rounded-full h-12 w-12 transition-colors ${
              micOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }`}
            onClick={toggleMic}
            title={micOn ? "Desligar microfone" : "Ligar microfone"}
          >
            {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>

          {!isActive && teleSession && (
            <Button
              className="rounded-full h-12 px-6 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleStartSession}
              disabled={startSession.isPending}
            >
              {startSession.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Video className="h-4 w-4 mr-2" />}
              Iniciar Sessão
            </Button>
          )}

          {isActive && (
            <Button
              className="rounded-full h-12 w-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => setShowEndDialog(true)}
              title="Encerrar teleconsulta"
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div className="w-80 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            {/* Clinical alert */}
            {hasAlert && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-destructive">Alerta Clínico</p>
                  <p className="text-xs text-destructive/80">{a?.patients?.clinical_alert_text}</p>
                </div>
              </div>
            )}

            {/* Patient */}
            <Card>
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Paciente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-1">
                <p className="font-semibold text-sm">{a?.patients?.full_name}</p>
                {patientAge !== null && <p className="text-xs text-muted-foreground">{patientAge} anos</p>}
                {a?.patients?.phone && <p className="text-xs text-muted-foreground">{a.patients.phone}</p>}
                {a?.insurances?.name && (
                  <Badge variant="secondary" className="text-[10px] mt-1">{a.insurances.name}</Badge>
                )}
              </CardContent>
            </Card>

            {/* Appointment */}
            <Card>
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Atendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-1.5 text-xs">
                <Row label="Horário" value={`${a?.start_time?.slice(0, 5)} – ${a?.end_time?.slice(0, 5)}`} />
                {a?.specialties?.name && <Row label="Especialidade" value={a.specialties.name} />}
                {a?.procedures?.name && <Row label="Procedimento" value={a.procedures.name} />}
                <Row label="Provedor" value={a?.meeting_provider || "manual"} />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="secondary" className="text-[10px] h-5">{a?.meeting_status || "—"}</Badge>
                </div>
                {teleSession?.started_at && (
                  <Row
                    label="Início"
                    value={new Date(teleSession.started_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  />
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Clinical Actions */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground px-1">Ações Clínicas</p>
              <SidebarButton icon={ClipboardList} label="Abrir Prontuário" onClick={handleOpenProntuario} />
              <SidebarButton icon={FilePlus} label="Nova Evolução" onClick={handleOpenProntuario} />
              <SidebarButton icon={FileText} label="Emitir Receita" onClick={handleOpenProntuario} />
              <SidebarButton icon={FileText} label="Emitir Atestado" onClick={handleOpenProntuario} />
            </div>

            <Separator />

            {/* Session Actions */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground px-1">Sessão</p>
              {a?.meeting_link && (
                <SidebarButton icon={Copy} label="Copiar Link do Paciente" onClick={() => copyLink(a.meeting_link)} />
              )}
              {a?.meeting_link && (
                <SidebarButton
                  icon={Send}
                  label="Reenviar Link"
                  onClick={() => toast.info("Reenvio será integrado ao módulo de comunicação")}
                />
              )}
              {teleSession && teleSession.status !== "encerrada" && (
                <SidebarButton
                  icon={AlertTriangle}
                  label="Registrar Falha Técnica"
                  className="text-amber-600 hover:text-amber-700"
                  onClick={() =>
                    reportTechnicalIssue.mutate({
                      appointmentId: appointmentId!,
                      sessionId: teleSession.id,
                      description: "Falha técnica reportada pelo profissional",
                    })
                  }
                  disabled={reportTechnicalIssue.isPending}
                />
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* ── End session confirmation ── */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar teleconsulta?</AlertDialogTitle>
            <AlertDialogDescription>
              A sessão será finalizada para ambas as partes. O paciente verá que a consulta foi encerrada. Você poderá continuar o registro no prontuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={endSession.isPending}
            >
              {endSession.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Encerrar Sessão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Subcomponents ──

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SidebarButton({
  icon: Icon,
  label,
  onClick,
  className = "",
  disabled = false,
}: {
  icon: typeof ClipboardList;
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={`w-full justify-start gap-2 h-8 text-xs ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
