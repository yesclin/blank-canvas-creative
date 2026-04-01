import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  AlertTriangle,
  Wifi,
  WifiOff,
  Clock,
  User,
  Stethoscope,
  Calendar,
  Shield,
} from "lucide-react";

type RoomStatus = "loading" | "invalid" | "waiting" | "active" | "reconnecting" | "ended" | "error";

interface RoomData {
  appointmentId: string;
  clinicId: string;
  clinicName: string;
  clinicLogo: string | null;
  professionalName: string;
  specialtyName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  meetingStatus: string;
}

export default function PatientRoomPage() {
  const { token } = useParams<{ token: string }>();

  const [status, setStatus] = useState<RoomStatus>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load room on mount ──
  useEffect(() => {
    loadRoom();
    return () => {
      stopStream();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [token]);

  // ── Elapsed timer ──
  useEffect(() => {
    if (status !== "active" || !startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [status, startTime]);

  // ── Start stream when status allows it ──
  useEffect(() => {
    if (status === "waiting" || status === "active") {
      initStream();
    }
  }, [status]);

  // ── Stream helpers ──
  const initStream = async () => {
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.warn("Não foi possível acessar câmera/microfone:", err);
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const toggleCamera = useCallback(() => {
    streamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !cameraOn;
    });
    setCameraOn((p) => !p);
  }, [cameraOn]);

  const toggleMic = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !micOn;
    });
    setMicOn((p) => !p);
  }, [micOn]);

  // ── Load appointment by token ──
  const loadRoom = async () => {
    if (!token) {
      setErrorMsg("Link inválido");
      setStatus("invalid");
      return;
    }
    try {
      const { data: apt, error: aptError } = await supabase
        .from("appointments")
        .select(`
          id, clinic_id, meeting_status, care_mode, scheduled_date, start_time, end_time,
          professionals:professional_id(full_name),
          specialties:specialty_id(name),
          clinics:clinic_id(name, logo_url)
        `)
        .eq("meeting_id", token)
        .eq("care_mode", "teleconsulta")
        .maybeSingle();

      if (aptError) throw aptError;
      if (!apt) {
        setErrorMsg("Sala não encontrada ou link expirado");
        setStatus("invalid");
        return;
      }

      const a = apt as any;

      // Check if already ended
      if (a.meeting_status === "encerrada") {
        setRoomData(buildRoomData(a));
        setStatus("ended");
        return;
      }

      setRoomData(buildRoomData(a));

      // Update meeting_status to paciente_entrou
      await supabase
        .from("appointments")
        .update({
          meeting_status: a.meeting_status === "em_andamento" ? "em_andamento" : "paciente_entrou",
        })
        .eq("id", a.id);

      logEvent(a.id, a.clinic_id, "paciente_entrou");

      if (a.meeting_status === "em_andamento") {
        setStatus("active");
        setStartTime(new Date());
      } else {
        setStatus("waiting");
        pollForStatus(a.id, a.clinic_id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao carregar a sala");
      setStatus("error");
    }
  };

  const buildRoomData = (a: any): RoomData => ({
    appointmentId: a.id,
    clinicId: a.clinic_id,
    clinicName: a.clinics?.name || "Clínica",
    clinicLogo: a.clinics?.logo_url || null,
    professionalName: a.professionals?.full_name || "Profissional",
    specialtyName: a.specialties?.name || "",
    scheduledDate: a.scheduled_date,
    startTime: a.start_time,
    endTime: a.end_time,
    meetingStatus: a.meeting_status,
  });

  const logEvent = async (aptId: string, cId: string, eventType: string) => {
    await supabase
      .from("teleconsultation_events" as any)
      .insert({
        clinic_id: cId,
        teleconsultation_session_id: aptId,
        appointment_id: aptId,
        event_type: eventType,
        actor_type: "patient",
      })
      .catch(() => {});
  };

  const pollForStatus = (aptId: string, cId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await supabase
          .from("appointments")
          .select("meeting_status")
          .eq("id", aptId)
          .single();

        const ms = (data as any)?.meeting_status;
        if (ms === "em_andamento") {
          setStatus("active");
          setStartTime(new Date());
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (ms === "encerrada") {
          setStatus("ended");
          stopStream();
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Reconnecting state on poll failure
        setStatus("reconnecting");
        setTimeout(() => {
          if (status !== "ended") setStatus("waiting");
        }, 3000);
      }
    }, 4000);
  };

  const confirmLeave = async () => {
    stopStream();
    if (roomData) {
      logEvent(roomData.appointmentId, roomData.clinicId, "paciente_saiu");
    }
    if (pollRef.current) clearInterval(pollRef.current);
    setShowLeaveDialog(false);
    setStatus("ended");
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return date;
    }
  };

  const statusLabel: Record<string, string> = {
    loading: "Conectando...",
    waiting: "Aguardando profissional",
    active: "Consulta em andamento",
    reconnecting: "Reconectando...",
    ended: "Consulta encerrada",
  };

  // ══════════════════════════════════════════
  // RENDER — Loading
  // ══════════════════════════════════════════
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Conectando à sala de consulta...</p>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER — Invalid / Error
  // ══════════════════════════════════════════
  if (status === "invalid" || status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-sm w-full shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {status === "invalid" ? "Acesso Inválido" : "Erro"}
            </h2>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <p className="text-xs text-muted-foreground">
              Verifique o link recebido ou entre em contato com a clínica.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER — Ended
  // ══════════════════════════════════════════
  if (status === "ended") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-sm w-full shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-5">
            {roomData?.clinicLogo && (
              <img src={roomData.clinicLogo} alt="" className="h-12 w-12 rounded-lg object-cover mx-auto" />
            )}
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Video className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Consulta encerrada</h2>
            <p className="text-sm text-muted-foreground">
              Obrigado por utilizar a teleconsulta
              {roomData?.clinicName ? ` da ${roomData.clinicName}` : ""}.
            </p>
            <p className="text-xs text-muted-foreground">
              Caso precise, entre em contato com a clínica.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER — Active Room (waiting / active / reconnecting)
  // ══════════════════════════════════════════
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* ── Clinic header ── */}
      <div className="px-4 py-2 bg-black/80 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {roomData?.clinicLogo && (
            <img src={roomData.clinicLogo} alt="" className="h-7 w-7 rounded object-cover" />
          )}
          <span className="text-white/80 text-sm font-medium">{roomData?.clinicName}</span>
        </div>
        <Badge
          variant="secondary"
          className={`text-xs border-0 ${
            status === "active"
              ? "bg-green-500/20 text-green-400"
              : status === "reconnecting"
              ? "bg-amber-500/20 text-amber-400"
              : "bg-white/10 text-white/70"
          }`}
        >
          {status === "reconnecting" ? (
            <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Reconectando</>
          ) : (
            statusLabel[status]
          )}
        </Badge>
      </div>

      {/* ── Video area ── */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Self-video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${!cameraOn ? "hidden" : ""}`}
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Camera off avatar */}
        {!cameraOn && (
          <div className="flex flex-col items-center gap-3 text-white/40 z-[5]">
            <div className="h-24 w-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <User className="h-12 w-12" />
            </div>
            <p className="text-sm">Câmera desligada</p>
          </div>
        )}

        {/* Waiting overlay */}
        {status === "waiting" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <div className="text-center text-white space-y-4 max-w-xs">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
              <h2 className="text-lg font-medium">Aguardando o profissional...</h2>
              <p className="text-sm text-white/50">
                Dr(a). {roomData?.professionalName} entrará em breve.
              </p>
              <p className="text-xs text-white/30">
                Mantenha sua câmera e microfone ligados.
              </p>
            </div>
          </div>
        )}

        {/* Top info bar */}
        <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent z-20">
          <Badge variant="secondary" className="gap-1.5 bg-white/10 text-white border-0 text-xs">
            <User className="h-3 w-3" />
            Dr(a). {roomData?.professionalName}
          </Badge>
          <div className="flex items-center gap-2">
            {status === "active" && (
              <Badge className="gap-1 bg-destructive text-destructive-foreground border-0 text-xs">
                <Clock className="h-3 w-3" />
                {formatTime(elapsed)}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-white/10 text-white border-0 text-xs">
              {status === "active" ? (
                <Wifi className="h-3 w-3 text-green-400" />
              ) : (
                <WifiOff className="h-3 w-3 text-amber-400" />
              )}
            </Badge>
          </div>
        </div>

        {/* Bottom context card (mobile-friendly) */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 w-auto max-w-[90vw]">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-3 text-white/70 text-xs">
            {roomData?.specialtyName && (
              <span className="flex items-center gap-1">
                <Stethoscope className="h-3 w-3" />
                {roomData.specialtyName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {roomData?.startTime?.slice(0, 5)} – {roomData?.endTime?.slice(0, 5)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="p-4 bg-black border-t border-white/10">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="lg"
            className={`rounded-full h-14 w-14 transition-colors ${
              cameraOn
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            }`}
            onClick={toggleCamera}
            title={cameraOn ? "Desligar câmera" : "Ligar câmera"}
          >
            {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className={`rounded-full h-14 w-14 transition-colors ${
              micOn
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            }`}
            onClick={toggleMic}
            title={micOn ? "Desligar microfone" : "Ligar microfone"}
          >
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="rounded-full h-14 w-14 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            onClick={() => setShowLeaveDialog(true)}
            title="Sair da sala"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* ── Leave confirmation ── */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da consulta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair da sala de teleconsulta? Você poderá retornar usando o mesmo link enquanto a consulta estiver ativa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sair da Sala
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
