import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
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
  FileUp,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

interface AppointmentInfo {
  id: string;
  patient_name: string;
  professional_name: string;
  specialty_name: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  clinic_name: string;
  clinic_logo?: string;
  require_consent: boolean;
  require_precheck: boolean;
  meeting_link?: string;
}

type CheckStatus = "pending" | "checking" | "ok" | "failed";

export default function PrecheckPage() {
  const { token } = useParams<{ token: string }>();
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
      // Look up appointment by meeting_id (used as token)
      const { data: apt, error: aptError } = await supabase
        .from("appointments")
        .select(`
          id, scheduled_date, start_time, end_time, meeting_link, care_mode,
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
      setAppointmentInfo({
        id: a.id,
        patient_name: a.patients?.full_name || "Paciente",
        professional_name: a.professionals?.full_name || "Profissional",
        specialty_name: a.specialties?.name || "",
        scheduled_date: a.scheduled_date,
        start_time: a.start_time,
        end_time: a.end_time,
        clinic_name: a.clinics?.name || "Clínica",
        clinic_logo: a.clinics?.logo_url,
        require_consent: true,
        require_precheck: true,
        meeting_link: a.meeting_link,
      });
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar informações do atendimento");
    } finally {
      setLoading(false);
    }
  };

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
      // Save precheck
      await supabase.from("teleconsultation_prechecks" as any).insert({
        clinic_id: (await supabase.from("appointments").select("clinic_id").eq("id", appointmentInfo.id).single()).data?.clinic_id,
        appointment_id: appointmentInfo.id,
        patient_id: (await supabase.from("appointments").select("patient_id").eq("id", appointmentInfo.id).single()).data?.patient_id,
        camera_ok: cameraStatus === "ok",
        microphone_ok: micStatus === "ok",
        internet_ok: internetStatus === "ok",
        identity_confirmed: identityConfirmed,
        consent_accepted: consentAccepted,
        completed_at: new Date().toISOString(),
      });

      // Update appointment precheck status
      await supabase.from("appointments").update({
        precheck_status: "concluido",
        consent_telehealth_accepted: consentAccepted,
        consent_telehealth_accepted_at: new Date().toISOString(),
      }).eq("id", appointmentInfo.id);

      setCompleted(true);
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar pré-check");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnterRoom = () => {
    if (appointmentInfo?.meeting_link) {
      window.location.href = appointmentInfo.meeting_link;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-lg font-medium">{error}</p>
            <p className="text-sm text-muted-foreground">
              Verifique o link recebido ou entre em contato com a clínica.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!appointmentInfo) return null;

  const StatusIcon = ({ status }: { status: CheckStatus }) => {
    switch (status) {
      case "pending": return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />;
      case "checking": return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case "ok": return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed": return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
            <h2 className="text-xl font-bold">Pré-check concluído!</h2>
            <p className="text-sm text-muted-foreground">
              Você está pronto para a teleconsulta. Aguarde o horário da consulta para entrar na sala.
            </p>
            {appointmentInfo.meeting_link && (
              <Button onClick={handleEnterRoom} className="w-full gap-2">
                <Video className="h-4 w-4" />
                Entrar na Consulta
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-2xl mx-auto p-4 flex items-center gap-3">
          {appointmentInfo.clinic_logo && (
            <img src={appointmentInfo.clinic_logo} alt="" className="h-10 w-10 rounded-lg object-cover" />
          )}
          <div>
            <h1 className="font-bold text-lg">{appointmentInfo.clinic_name}</h1>
            <p className="text-xs text-muted-foreground">Pré-check de Teleconsulta</p>
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
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Profissional: <strong>{appointmentInfo.professional_name}</strong></span>
            </div>
            {appointmentInfo.specialty_name && (
              <div className="flex items-center gap-2 text-sm">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                <span>{appointmentInfo.specialty_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {new Date(appointmentInfo.scheduled_date + "T00:00:00").toLocaleDateString("pt-BR")} às{" "}
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
              <Button variant="outline" size="sm" onClick={runAllChecks}>
                Testar Tudo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <button onClick={testCamera} className="flex items-center gap-3 w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors">
              <StatusIcon status={cameraStatus} />
              <Video className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Câmera</span>
            </button>
            <button onClick={testMic} className="flex items-center gap-3 w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors">
              <StatusIcon status={micStatus} />
              <Mic className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Microfone</span>
            </button>
            <button onClick={testInternet} className="flex items-center gap-3 w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors">
              <StatusIcon status={internetStatus} />
              <Wifi className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Conexão com a Internet</span>
            </button>
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
              <label htmlFor="identity" className="text-sm cursor-pointer">
                Confirmo que sou <strong>{appointmentInfo.patient_name}</strong> e que os dados acima estão corretos.
              </label>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={consentAccepted}
                onCheckedChange={(v) => setConsentAccepted(v === true)}
              />
              <label htmlFor="consent" className="text-sm cursor-pointer">
                Li e aceito o <strong>Termo de Consentimento para Teleatendimento</strong>. 
                Compreendo que esta consulta será realizada de forma remota e concordo com as condições.
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
      </div>
    </div>
  );
}
