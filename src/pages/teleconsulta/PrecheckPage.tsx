import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Video,
  Mic,
  Wifi,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Clock,
  Stethoscope,
  ShieldCheck,
  AlertTriangle,
  Shield,
  RefreshCw,
} from "lucide-react";

interface AppointmentInfo {
  id: string;
  clinic_id: string;
  patient_id: string;
  patient_name: string;
  professional_name: string;
  specialty_name: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  clinic_name: string;
  clinic_logo?: string;
  meeting_link?: string;
  meeting_status: string;
}

type CheckStatus = "pending" | "checking" | "ok" | "failed";

export default function PrecheckPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointmentInfo, setAppointmentInfo] = useState<AppointmentInfo | null>(null);

  const [cameraStatus, setCameraStatus] = useState<CheckStatus>("pending");
  const [micStatus, setMicStatus] = useState<CheckStatus>("pending");
  const [internetStatus, setInternetStatus] = useState<CheckStatus>("pending");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadAppointmentByToken();
  }, [token]);

  const loadAppointmentByToken = async () => {
    if (!token) {
      setError("Token inválido");
      setLoading(false);
      return;
    }

    try {
      const { data: apt, error: aptError } = await supabase
        .from("appointments")
        .select(`
          id, clinic_id, patient_id, scheduled_date, start_time, end_time,
          meeting_link, meeting_status, care_mode,
          patients:patient_id(full_name),
          professionals:professional_id(full_name),
          specialties:specialty_id(name),
          clinics:clinic_id(name, logo_url)
        `)
        .eq("meeting_id", token)
        .eq("care_mode", "teleconsulta")
        .maybeSingle();

      if (aptError) throw aptError;
      if (!apt) {
        setError("Agendamento não encontrado ou link inválido");
        setLoading(false);
        return;
      }

      const a = apt as any;

      // If already ended, block access
      if (a.meeting_status === "encerrada") {
        setError("Esta consulta já foi encerrada");
        setLoading(false);
        return;
      }

      // If precheck already done, skip to completed
      const { data: existingPrecheck } = await supabase
        .from("teleconsultation_prechecks")
        .select("id")
        .eq("appointment_id", a.id)
        .maybeSingle();

      if (existingPrecheck) {
        setAppointmentInfo(buildInfo(a));
        setCompleted(true);
        setLoading(false);
        return;
      }

      setAppointmentInfo(buildInfo(a));
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar informações do atendimento");
    } finally {
      setLoading(false);
    }
  };

  const buildInfo = (a: any): AppointmentInfo => ({
    id: a.id,
    clinic_id: a.clinic_id,
    patient_id: a.patient_id,
    patient_name: a.patients?.full_name || "Paciente",
    professional_name: a.professionals?.full_name || "Profissional",
    specialty_name: a.specialties?.name || "",
    scheduled_date: a.scheduled_date,
    start_time: a.start_time,
    end_time: a.end_time,
    clinic_name: a.clinics?.name || "Clínica",
    clinic_logo: a.clinics?.logo_url,
    meeting_link: a.meeting_link,
    meeting_status: a.meeting_status,
  });

  // ── Device tests ──

  const testCamera = useCallback(async () => {
    setCameraStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCameraStatus("ok");
    } catch {
      setCameraStatus("failed");
    }
  }, []);

  const testMic = useCallback(async () => {
    setMicStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicStatus("ok");
    } catch {
      setMicStatus("failed");
    }
  }, []);

  const testInternet = useCallback(async () => {
    setInternetStatus("checking");
    try {
      const start = Date.now();
      await fetch("https://www.google.com/generate_204", { mode: "no-cors" });
      const latency = Date.now() - start;
      setInternetStatus(latency < 5000 ? "ok" : "failed");
    } catch {
      setInternetStatus("failed");
    }
  }, []);

  const runAllChecks = () => {
    testCamera();
    testMic();
    testInternet();
  };

  const allChecksOk = cameraStatus === "ok" && micStatus === "ok" && internetStatus === "ok";
  const canProceed = allChecksOk && consentAccepted && identityConfirmed;

  const handleSubmit = async () => {
    if (!appointmentInfo || !token) return;
    setSubmitting(true);
    try {
      await supabase.from("teleconsultation_prechecks").insert({
        clinic_id: appointmentInfo.clinic_id,
        appointment_id: appointmentInfo.id,
        patient_id: appointmentInfo.patient_id,
        camera_ok: cameraStatus === "ok",
        microphone_ok: micStatus === "ok",
        internet_ok: internetStatus === "ok",
        identity_confirmed: identityConfirmed,
        consent_accepted: consentAccepted,
        completed_at: new Date().toISOString(),
      });

      await supabase
        .from("appointments")
        .update({
          precheck_status: "concluido",
          consent_telehealth_accepted: consentAccepted,
          consent_telehealth_accepted_at: new Date().toISOString(),
        })
        .eq("id", appointmentInfo.id);

      setCompleted(true);
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar pré-check");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnterRoom = () => {
    if (token) {
      navigate(`/teleconsulta/${token}/sala`);
    }
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      });
    } catch {
      return date;
    }
  };

  // ── Status icon component ──
  const StatusIcon = ({ status }: { status: CheckStatus }) => {
    switch (status) {
      case "pending":
        return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />;
      case "checking":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case "ok":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const statusLabel = (status: CheckStatus) => {
    switch (status) {
      case "pending": return "Não testado";
      case "checking": return "Testando...";
      case "ok": return "Funcionando";
      case "failed": return "Falhou";
    }
  };

  // ══════════════════════════════════════════
  // RENDER — Loading
  // ══════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando pré-check...</p>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER — Error
  // ══════════════════════════════════════════
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Shield className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold">{error}</h2>
            <p className="text-sm text-muted-foreground">
              Verifique o link recebido ou entre em contato com a clínica.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!appointmentInfo) return null;

  // ══════════════════════════════════════════
  // RENDER — Completed
  // ══════════════════════════════════════════
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-5">
            {appointmentInfo.clinic_logo && (
              <img
                src={appointmentInfo.clinic_logo}
                alt=""
                className="h-12 w-12 rounded-lg object-cover mx-auto"
              />
            )}
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Pré-check concluído!</h2>
            <p className="text-sm text-muted-foreground">
              Você está pronto(a) para a teleconsulta com{" "}
              <strong>Dr(a). {appointmentInfo.professional_name}</strong>.
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(appointmentInfo.scheduled_date)} às{" "}
              {appointmentInfo.start_time.slice(0, 5)}
            </p>
            <Button onClick={handleEnterRoom} className="w-full gap-2" size="lg">
              <Video className="h-4 w-4" />
              Entrar na Sala de Consulta
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER — Precheck form
  // ══════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-2xl mx-auto p-4 flex items-center gap-3">
          {appointmentInfo.clinic_logo && (
            <img
              src={appointmentInfo.clinic_logo}
              alt=""
              className="h-10 w-10 rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="font-bold text-lg">{appointmentInfo.clinic_name}</h1>
            <p className="text-xs text-muted-foreground">
              Pré-check de Teleconsulta
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Appointment Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados do Atendimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                Profissional: <strong>Dr(a). {appointmentInfo.professional_name}</strong>
              </span>
            </div>
            {appointmentInfo.specialty_name && (
              <div className="flex items-center gap-2 text-sm">
                <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{appointmentInfo.specialty_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                {formatDate(appointmentInfo.scheduled_date)} às{" "}
                {appointmentInfo.start_time.slice(0, 5)}
              </span>
            </div>
            <Badge variant="secondary" className="gap-1 mt-2">
              <Video className="h-3 w-3" />
              Teleconsulta
            </Badge>
          </CardContent>
        </Card>

        {/* Technical Checks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Verificação Técnica</CardTitle>
              <Button variant="outline" size="sm" onClick={runAllChecks} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Testar Tudo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Clique em cada item ou em "Testar Tudo" para verificar seus dispositivos.
            </p>
          </CardHeader>
          <CardContent className="space-y-1">
            <CheckRow
              icon={Video}
              label="Câmera"
              status={cameraStatus}
              statusLabel={statusLabel(cameraStatus)}
              onClick={testCamera}
              StatusIcon={StatusIcon}
            />
            <CheckRow
              icon={Mic}
              label="Microfone"
              status={micStatus}
              statusLabel={statusLabel(micStatus)}
              onClick={testMic}
              StatusIcon={StatusIcon}
            />
            <CheckRow
              icon={Wifi}
              label="Conexão com a Internet"
              status={internetStatus}
              statusLabel={statusLabel(internetStatus)}
              onClick={testInternet}
              StatusIcon={StatusIcon}
            />

            {(cameraStatus === "failed" || micStatus === "failed" || internetStatus === "failed") && (
              <div className="flex items-start gap-2 mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive">
                  Um ou mais testes falharam. Verifique as permissões do navegador e tente novamente.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Identity & Consent */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Consentimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="identity"
                checked={identityConfirmed}
                onCheckedChange={(v) => setIdentityConfirmed(v === true)}
              />
              <label htmlFor="identity" className="text-sm cursor-pointer leading-relaxed">
                Confirmo que sou <strong>{appointmentInfo.patient_name}</strong> e
                que os dados acima estão corretos.
              </label>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={consentAccepted}
                onCheckedChange={(v) => setConsentAccepted(v === true)}
              />
              <label htmlFor="consent" className="text-sm cursor-pointer leading-relaxed">
                Li e aceito o{" "}
                <strong>Termo de Consentimento para Teleatendimento</strong>.
                Compreendo que esta consulta será realizada de forma remota e
                concordo com as condições.
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!canProceed || submitting}
          className="w-full gap-2"
          size="lg"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Concluir Pré-Check
        </Button>

        {!canProceed && (
          <p className="text-xs text-center text-muted-foreground">
            Complete todos os testes técnicos e aceite os termos para continuar.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Subcomponent ──

function CheckRow({
  icon: Icon,
  label,
  status,
  statusLabel,
  onClick,
  StatusIcon,
}: {
  icon: typeof Video;
  label: string;
  status: CheckStatus;
  statusLabel: string;
  onClick: () => void;
  StatusIcon: React.ComponentType<{ status: CheckStatus }>;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full text-left p-2.5 rounded-md hover:bg-muted/50 transition-colors"
    >
      <StatusIcon status={status} />
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm flex-1">{label}</span>
      <span
        className={`text-xs ${
          status === "ok"
            ? "text-green-600"
            : status === "failed"
            ? "text-destructive"
            : "text-muted-foreground"
        }`}
      >
        {statusLabel}
      </span>
    </button>
  );
}
