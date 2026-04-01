import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  FileText,
  FilePlus,
  ClipboardList,
  Copy,
  AlertTriangle,
  Stethoscope,
  Calendar,
  Send,
  MessageSquare,
} from "lucide-react";
import { useTeleconsultaActions, useTeleconsultaSession } from "@/hooks/useTeleconsulta";
import { toast } from "sonner";

export default function TeleconsultaSala() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { data: teleSession, isLoading: sessionLoading } = useTeleconsultaSession(appointmentId ?? null);
  const { startSession, endSession, copyLink, reportTechnicalIssue } = useTeleconsultaActions();

  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load appointment
  useEffect(() => {
    if (!appointmentId) return;
    loadAppointment();
    return () => stopStream();
  }, [appointmentId]);

  // Timer
  useEffect(() => {
    const startedAt = appointment?.meeting_started_at || appointment?.started_at;
    if (!startedAt) return;
    const startDate = new Date(startedAt);
    const tick = () => setElapsed(Math.floor((Date.now() - startDate.getTime()) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [appointment?.meeting_started_at, appointment?.started_at]);

  // Camera stream
  useEffect(() => {
    if (loading) return;
    startStream();
  }, [loading, cameraOn, micOn]);

  const startStream = async () => {
    stopStream();
    if (!cameraOn && !micOn) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: cameraOn,
        audio: micOn,
      });
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
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !cameraOn));
    setCameraOn((p) => !p);
  }, [cameraOn]);

  const toggleMic = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn((p) => !p);
  }, [micOn]);

  const loadAppointment = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        patients:patient_id(id, full_name, phone, email, birth_date, has_clinical_alert, clinical_alert_text),
        professionals:professional_id(full_name),
        specialties:specialty_id(name),
        procedures:procedure_id(name)
      `)
      .eq("id", appointmentId!)
      .single();

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar agendamento");
      return;
    }
    setAppointment(data);
    setLoading(false);
  };

  const handleStartSession = () => {
    if (!teleSession || !appointmentId) return;
    startSession.mutate(
      { appointmentId, sessionId: teleSession.id },
      { onSuccess: () => loadAppointment() }
    );
  };

  const handleEndSession = () => {
    if (!teleSession || !appointmentId) return;
    endSession.mutate(
      { appointmentId, sessionId: teleSession.id },
      {
        onSuccess: () => {
          stopStream();
          toast.success("Teleconsulta encerrada. Redirecionando...");
          setTimeout(() => navigate("/app/agenda"), 1500);
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
    if (h > 0)
      return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading || sessionLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando sala...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
            <p className="font-medium">Agendamento não encontrado</p>
            <Button variant="outline" onClick={() => navigate("/app/agenda")}>
              Voltar à Agenda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const a = appointment as any;
  const isActive = a.meeting_status === "em_andamento";
  const isEnded = a.meeting_status === "encerrada";
  const hasAlert = a.patients?.has_clinical_alert;

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0">
      {/* Main: Video */}
      <div className="flex-1 flex flex-col bg-black rounded-l-xl overflow-hidden">
        {/* Video area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {/* Self video */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${!cameraOn ? "hidden" : ""}`}
            style={{ transform: "scaleX(-1)" }}
          />

          {/* Camera off */}
          {!cameraOn && (
            <div className="flex flex-col items-center gap-3 text-white/50">
              <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center">
                <User className="h-10 w-10" />
              </div>
              <p className="text-sm">Câmera desligada</p>
            </div>
          )}

          {/* Ended overlay */}
          {isEnded && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
              <div className="text-center text-white space-y-3">
                <Video className="h-10 w-10 mx-auto text-white/40" />
                <p className="text-lg font-medium">Sessão encerrada</p>
              </div>
            </div>
          )}

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent z-20">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1 bg-white/10 text-white border-0 text-xs">
                <User className="h-3 w-3" />
                {a.patients?.full_name}
              </Badge>
              {a.specialties?.name && (
                <Badge variant="secondary" className="bg-white/10 text-white border-0 text-xs">
                  <Stethoscope className="h-3 w-3 mr-1" />
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
              <Badge variant="secondary" className="gap-1 bg-white/10 text-white border-0 text-xs">
                <Wifi className="h-3 w-3 text-green-400" />
              </Badge>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-3 bg-black border-t border-white/10 flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            className={`rounded-full h-12 w-12 ${
              cameraOn
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }`}
            onClick={toggleCamera}
          >
            {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            className={`rounded-full h-12 w-12 ${
              micOn
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }`}
            onClick={toggleMic}
          >
            {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>

          {!isActive && !isEnded && teleSession && (
            <Button
              className="rounded-full h-12 px-6 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleStartSession}
              disabled={startSession.isPending}
            >
              {startSession.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Video className="h-4 w-4 mr-2" />
              )}
              Iniciar Sessão
            </Button>
          )}

          {isActive && (
            <Button
              className="rounded-full h-12 w-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleEndSession}
              disabled={endSession.isPending}
            >
              {endSession.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PhoneOff className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 shrink-0 border-l bg-card flex flex-col rounded-r-xl overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            {/* Clinical alert */}
            {hasAlert && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-destructive">Alerta Clínico</p>
                  <p className="text-xs text-destructive/80">{a.patients?.clinical_alert_text}</p>
                </div>
              </div>
            )}

            {/* Patient card */}
            <Card>
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Paciente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-1">
                <p className="font-semibold text-sm">{a.patients?.full_name}</p>
                {a.patients?.phone && (
                  <p className="text-xs text-muted-foreground">{a.patients.phone}</p>
                )}
                {a.patients?.email && (
                  <p className="text-xs text-muted-foreground truncate">{a.patients.email}</p>
                )}
              </CardContent>
            </Card>

            {/* Appointment details */}
            <Card>
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Atendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horário</span>
                  <span className="font-medium">
                    {a.start_time?.slice(0, 5)} – {a.end_time?.slice(0, 5)}
                  </span>
                </div>
                {a.specialties?.name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Especialidade</span>
                    <span className="font-medium">{a.specialties.name}</span>
                  </div>
                )}
                {a.procedures?.name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Procedimento</span>
                    <span className="font-medium">{a.procedures.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {a.meeting_status || "—"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provedor</span>
                  <span className="font-medium">{a.meeting_provider || "manual"}</span>
                </div>
                {teleSession?.started_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Início</span>
                    <span className="font-medium">
                      {new Date(teleSession.started_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground px-1">Ações Clínicas</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-8 text-xs"
                onClick={handleOpenProntuario}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Abrir Prontuário
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-8 text-xs"
                onClick={handleOpenProntuario}
              >
                <FilePlus className="h-3.5 w-3.5" />
                Nova Evolução
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-8 text-xs"
                onClick={handleOpenProntuario}
              >
                <FileText className="h-3.5 w-3.5" />
                Emitir Receita
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-8 text-xs"
                onClick={handleOpenProntuario}
              >
                <FileText className="h-3.5 w-3.5" />
                Emitir Atestado
              </Button>
            </div>

            <Separator />

            {/* Session Actions */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground px-1">Sessão</p>
              {a.meeting_link && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 h-8 text-xs"
                  onClick={() => copyLink(a.meeting_link)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar Link do Paciente
                </Button>
              )}
              {a.meeting_link && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 h-8 text-xs"
                  onClick={() => {
                    // Reenviar link via comunicação
                    toast.info("Funcionalidade de reenvio será integrada ao módulo de comunicação");
                  }}
                >
                  <Send className="h-3.5 w-3.5" />
                  Reenviar Link
                </Button>
              )}
              {teleSession && teleSession.status !== "encerrada" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 h-8 text-xs text-amber-600 hover:text-amber-700"
                  onClick={() =>
                    reportTechnicalIssue.mutate({
                      appointmentId: appointmentId!,
                      sessionId: teleSession.id,
                      description: "Falha técnica reportada pelo profissional",
                    })
                  }
                  disabled={reportTechnicalIssue.isPending}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Registrar Falha Técnica
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
