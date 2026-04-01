import { useState, useEffect } from "react";
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
  const [professionalName, setProfessionalName] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    loadRoom();
  }, [token]);

  useEffect(() => {
    if (status !== "active" || !startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [status, startTime]);

  const loadRoom = async () => {
    if (!token) {
      setError("Token inválido");
      setStatus("error");
      return;
    }

    try {
      const { data: apt, error: aptError } = await supabase
        .from("appointments")
        .select(`
          id, meeting_status, meeting_link, care_mode,
          professionals:professional_id(full_name)
        `)
        .eq("meeting_id", token)
        .eq("care_mode", "teleconsulta")
        .maybeSingle();

      if (aptError) throw aptError;
      if (!apt) {
        setError("Sala não encontrada");
        setStatus("error");
        return;
      }

      const a = apt as any;
      setAppointmentId(a.id);
      setProfessionalName(a.professionals?.full_name || "Profissional");

      // Log patient entry
      await supabase.from("appointments").update({
        meeting_status: a.meeting_status === "em_andamento" ? "em_andamento" : "paciente_entrou",
      }).eq("id", a.id);

      if (a.meeting_status === "em_andamento") {
        setStatus("active");
        setStartTime(new Date());
      } else {
        setStatus("waiting");
        // Poll for status changes
        pollStatus(a.id);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar a sala");
      setStatus("error");
    }
  };

  const pollStatus = (aptId: string) => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("appointments")
        .select("meeting_status")
        .eq("id", aptId)
        .single();

      const ms = (data as any)?.meeting_status;
      if (ms === "em_andamento") {
        setStatus("active");
        setStartTime(new Date());
        clearInterval(interval);
      } else if (ms === "encerrada") {
        setStatus("ended");
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  const handleLeave = async () => {
    if (appointmentId) {
      await supabase.from("teleconsultation_events" as any).insert({
        clinic_id: (await supabase.from("appointments").select("clinic_id").eq("id", appointmentId).single()).data?.clinic_id,
        teleconsultation_session_id: appointmentId,
        appointment_id: appointmentId,
        event_type: "patient_left",
        actor_type: "patient",
      }).catch(() => {});
    }
    setStatus("ended");
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-lg font-medium">{error}</p>
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
              Obrigado por utilizar a teleconsulta. Caso precise, entre em contato com a clínica.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Video area */}
      <div className="flex-1 relative flex items-center justify-center">
        {status === "waiting" ? (
          <div className="text-center text-white space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <h2 className="text-xl font-medium">Aguardando o profissional...</h2>
            <p className="text-sm text-white/60">
              Dr(a). {professionalName} entrará em breve
            </p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {/* Placeholder for actual video integration */}
            <div className="text-center text-white/40 space-y-2">
              <Video className="h-16 w-16 mx-auto" />
              <p className="text-sm">Vídeo da teleconsulta em andamento</p>
              <p className="text-xs text-white/30">
                A integração com provedor de vídeo será configurada nas configurações da clínica
              </p>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 bg-white/10 text-white border-0">
              <User className="h-3 w-3" />
              Dr(a). {professionalName}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {status === "active" && (
              <Badge variant="secondary" className="gap-1 bg-red-500/80 text-white border-0">
                <Clock className="h-3 w-3" />
                {formatTime(elapsed)}
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1 bg-white/10 text-white border-0">
              {status === "active" ? <Wifi className="h-3 w-3 text-green-400" /> : <WifiOff className="h-3 w-3 text-yellow-400" />}
            </Badge>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-black/90 border-t border-white/10">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="lg"
            className={`rounded-full h-14 w-14 ${cameraOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
            onClick={() => setCameraOn(!cameraOn)}
          >
            {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className={`rounded-full h-14 w-14 ${micOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
            onClick={() => setMicOn(!micOn)}
          >
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="rounded-full h-14 w-14 bg-red-600 hover:bg-red-700 text-white"
            onClick={handleLeave}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
