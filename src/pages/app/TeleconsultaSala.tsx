import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  ExternalLink,
  Copy,
  AlertTriangle,
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

  useEffect(() => {
    if (!appointmentId) return;
    loadAppointment();
  }, [appointmentId]);

  useEffect(() => {
    if (!appointment?.started_at) return;
    const startDate = new Date(appointment.started_at);
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startDate.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [appointment?.started_at]);

  const loadAppointment = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *, 
        patients:patient_id(full_name, phone, email),
        professionals:professional_id(full_name),
        specialties:specialty_id(name)
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
    startSession.mutate({ appointmentId, sessionId: teleSession.id });
  };

  const handleEndSession = () => {
    if (!teleSession || !appointmentId) return;
    endSession.mutate({ appointmentId, sessionId: teleSession.id }, {
      onSuccess: () => navigate("/app/agenda"),
    });
  };

  const handleOpenProntuario = () => {
    if (appointment?.patient_id) {
      navigate(`/app/prontuario/${appointment.patient_id}`);
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading || sessionLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
            <p>Agendamento não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const a = appointment as any;
  const isActive = a.meeting_status === "em_andamento";

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Video Section */}
      <div className="flex-1 flex flex-col bg-black rounded-xl overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative flex items-center justify-center">
          <div className="text-center text-white/40 space-y-2">
            <Video className="h-16 w-16 mx-auto" />
            <p className="text-sm">
              {isActive ? "Teleconsulta em andamento" : "Sala pronta — inicie a sessão"}
            </p>
          </div>

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1 bg-white/10 text-white border-0 text-xs">
                <User className="h-3 w-3" />
                {a.patients?.full_name}
              </Badge>
              {a.specialties?.name && (
                <Badge variant="secondary" className="bg-white/10 text-white border-0 text-xs">
                  {a.specialties.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isActive && (
                <Badge className="gap-1 bg-red-500 text-white border-0 text-xs">
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
        <div className="p-3 bg-black/90 border-t border-white/10 flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            className={`rounded-full h-12 w-12 ${cameraOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500 text-white hover:bg-red-600"}`}
            onClick={() => setCameraOn(!cameraOn)}
          >
            {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            className={`rounded-full h-12 w-12 ${micOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500 text-white hover:bg-red-600"}`}
            onClick={() => setMicOn(!micOn)}
          >
            {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>

          {!isActive && teleSession && (
            <Button
              className="rounded-full h-12 px-6 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleStartSession}
              disabled={startSession.isPending}
            >
              {startSession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar Sessão"}
            </Button>
          )}

          {isActive && (
            <Button
              className="rounded-full h-12 w-12 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleEndSession}
              disabled={endSession.isPending}
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 shrink-0 space-y-3 overflow-y-auto">
        {/* Patient Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium text-sm">{a.patients?.full_name}</p>
            {a.patients?.phone && <p className="text-xs text-muted-foreground">{a.patients.phone}</p>}
            <p className="text-xs text-muted-foreground">
              {a.start_time?.slice(0, 5)} – {a.end_time?.slice(0, 5)}
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={handleOpenProntuario}>
              <ClipboardList className="h-3.5 w-3.5" />
              Abrir Prontuário
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={handleOpenProntuario}>
              <FilePlus className="h-3.5 w-3.5" />
              Nova Evolução
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={handleOpenProntuario}>
              <FileText className="h-3.5 w-3.5" />
              Emitir Receita
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={handleOpenProntuario}>
              <FileText className="h-3.5 w-3.5" />
              Emitir Atestado
            </Button>
            <Separator />
            {a.meeting_link && (
              <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => copyLink(a.meeting_link)}>
                <Copy className="h-3.5 w-3.5" />
                Copiar Link
              </Button>
            )}
            {teleSession && teleSession.status !== "encerrada" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-amber-600"
                onClick={() => reportTechnicalIssue.mutate({
                  appointmentId: appointmentId!,
                  sessionId: teleSession.id,
                  description: "Falha reportada pelo profissional",
                })}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Registrar Falha
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Connection Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sessão</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>Status: <Badge variant="secondary" className="text-xs ml-1">{a.meeting_status || "—"}</Badge></p>
            <p>Provedor: {a.meeting_provider || "manual"}</p>
            {teleSession?.started_at && <p>Início: {new Date(teleSession.started_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
