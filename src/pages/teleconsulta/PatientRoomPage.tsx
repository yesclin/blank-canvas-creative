import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

type RoomStatus = "loading" | "waiting" | "active" | "reconnecting" | "ended" | "error";

export default function PatientRoomPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<RoomStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [professionalName, setProfessionalName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load room on mount
  useEffect(() => {
    loadRoom();
    return () => {
      stopStream();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [token]);

  // Timer
  useEffect(() => {
    if (status !== "active" || !startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [status, startTime]);

  // Start/stop camera based on toggle
  useEffect(() => {
    if (status === "loading" || status === "error" || status === "ended") return;
    if (cameraOn || micOn) {
      startStream();
    } else {
      stopStream();
    }
  }, [cameraOn, micOn, status]);

  const startStream = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: cameraOn,
        audio: micOn,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Não foi possível acessar câmera/microfone:", err);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = useCallback(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((t) => (t.enabled = !cameraOn ? true : false));
    }
    setCameraOn((prev) => !prev);
  }, [cameraOn]);

  const toggleMic = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((t) => (t.enabled = !micOn ? true : false));
    }
    setMicOn((prev) => !prev);
  }, [micOn]);

  const loadRoom = async () => {
    if (!token) {
      setError("Link inválido");
      setStatus("error");
      return;
    }

    try {
      const { data: apt, error: aptError } = await supabase
        .from("appointments")
        .select(`
          id, clinic_id, meeting_status, meeting_link, care_mode,
          professionals:professional_id(full_name),
          clinics:clinic_id(name)
        `)
        .eq("meeting_id", token)
        .eq("care_mode", "teleconsulta")
        .maybeSingle();

      if (aptError) throw aptError;
      if (!apt) {
        setError("Sala não encontrada ou link expirado");
        setStatus("error");
        return;
      }

      const a = apt as any;
      setAppointmentId(a.id);
      setClinicId(a.clinic_id);
      setProfessionalName(a.professionals?.full_name || "Profissional");
      setClinicName(a.clinics?.name || "");

      // Log patient entry event
      await supabase
        .from("appointments")
        .update({
          meeting_status:
            a.meeting_status === "em_andamento"
              ? "em_andamento"
              : "paciente_entrou",
        })
        .eq("id", a.id);

      // Log event
      logEvent(a.id, a.clinic_id, "patient_entered");

      if (a.meeting_status === "em_andamento") {
        setStatus("active");
        setStartTime(new Date());
      } else {
        setStatus("waiting");
        pollForStatus(a.id);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar a sala de consulta");
      setStatus("error");
    }
  };

  const logEvent = async (
    aptId: string,
    cId: string,
    eventType: string
  ) => {
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

  const pollForStatus = (aptId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
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
    }, 4000);
  };

  const handleLeave = async () => {
    stopStream();
    if (appointmentId && clinicId) {
      logEvent(appointmentId, clinicId, "patient_left");
    }
    setStatus("ended");
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // === RENDER STATES ===

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-white/60">Conectando à sala...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold">{error}</h2>
            <p className="text-sm text-muted-foreground">
              Verifique o link recebido ou entre em contato com a clínica.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "ended") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <Video className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold">Consulta encerrada</h2>
            <p className="text-sm text-muted-foreground">
              Obrigado por utilizar a teleconsulta
              {clinicName ? ` da ${clinicName}` : ""}.
            </p>
            <p className="text-xs text-muted-foreground">
              Caso precise, entre em contato com a clínica.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Video area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Self-video preview */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            !cameraOn ? "hidden" : ""
          }`}
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Camera off placeholder */}
        {!cameraOn && (
          <div className="flex flex-col items-center gap-3 text-white/50">
            <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center">
              <User className="h-12 w-12" />
            </div>
            <p className="text-sm">Câmera desligada</p>
          </div>
        )}

        {/* Waiting overlay */}
        {status === "waiting" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <div className="text-center text-white space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <h2 className="text-lg font-medium">Aguardando o profissional...</h2>
              <p className="text-sm text-white/60">
                Dr(a). {professionalName} entrará em breve
              </p>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent z-20">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="gap-1 bg-white/10 text-white border-0 text-xs"
            >
              <User className="h-3 w-3" />
              Dr(a). {professionalName}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {status === "active" && (
              <Badge className="gap-1 bg-destructive text-destructive-foreground border-0 text-xs">
                <Clock className="h-3 w-3" />
                {formatTime(elapsed)}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="gap-1 bg-white/10 text-white border-0 text-xs"
            >
              {status === "active" ? (
                <Wifi className="h-3 w-3 text-green-400" />
              ) : (
                <WifiOff className="h-3 w-3 text-yellow-400" />
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="p-4 bg-black border-t border-white/10">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="lg"
            className={`rounded-full h-14 w-14 ${
              cameraOn
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            }`}
            onClick={toggleCamera}
          >
            {cameraOn ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className={`rounded-full h-14 w-14 ${
              micOn
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            }`}
            onClick={toggleMic}
          >
            {micOn ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="rounded-full h-14 w-14 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            onClick={handleLeave}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
