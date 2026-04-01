import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Upload,
  FileText,
  Trash2,
  ArrowRight,
  ArrowLeft,
  LogIn,
  LogOut,
} from "lucide-react";

// ── Types ──

interface AppointmentInfo {
  id: string;
  clinic_id: string;
  patient_id: string;
  patient_name: string;
  patient_birth_date: string | null;
  professional_name: string;
  specialty_name: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  clinic_name: string;
  clinic_logo?: string;
  meeting_link?: string;
  meeting_status: string;
  precheck_status: string;
}

type CheckStatus = "pending" | "checking" | "ok" | "failed";
type PrecheckStep = "info" | "identity" | "consent" | "technical" | "files" | "ready";

const STEPS: PrecheckStep[] = ["info", "identity", "consent", "technical", "files", "ready"];
const STEP_LABELS: Record<PrecheckStep, string> = {
  info: "Atendimento",
  identity: "Identificação",
  consent: "Consentimento",
  technical: "Teste Técnico",
  files: "Arquivos",
  ready: "Entrar",
};

// ══════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════

export default function PrecheckPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // ── Core state ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"invalid" | "ended" | "outside_window" | "generic">("generic");
  const [appointmentInfo, setAppointmentInfo] = useState<AppointmentInfo | null>(null);
  const [currentStep, setCurrentStep] = useState<PrecheckStep>("info");
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Identity step ──
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [birthDateInput, setBirthDateInput] = useState("");
  const [birthDateError, setBirthDateError] = useState<string | null>(null);

  // ── Consent step ──
  const [consentAccepted, setConsentAccepted] = useState(false);

  // ── Technical checks step ──
  const [cameraStatus, setCameraStatus] = useState<CheckStatus>("pending");
  const [micStatus, setMicStatus] = useState<CheckStatus>("pending");
  const [internetStatus, setInternetStatus] = useState<CheckStatus>("pending");

  // ── Files step ──
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: number; path: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load appointment on mount ──
  useEffect(() => {
    loadAppointmentByToken();
  }, [token]);

  const loadAppointmentByToken = async () => {
    if (!token) {
      setError("Token inválido");
      setErrorType("invalid");
      setLoading(false);
      return;
    }

    try {
      const { data: apt, error: aptError } = await supabase
        .from("appointments")
        .select(`
          id, clinic_id, patient_id, scheduled_date, start_time, end_time,
          meeting_link, meeting_status, care_mode, precheck_status,
          patients:patient_id(full_name, birth_date),
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
        setErrorType("invalid");
        setLoading(false);
        return;
      }

      const a = apt as any;

      // Consulta encerrada
      if (a.meeting_status === "encerrada") {
        setError("Esta consulta já foi encerrada");
        setErrorType("ended");
        setLoading(false);
        return;
      }

      // Precheck already completed → skip to ready
      if (a.precheck_status === "concluido") {
        setAppointmentInfo(buildInfo(a));
        setCompleted(true);
        setLoading(false);
        return;
      }

      // Also check via prechecks table for safety
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

      // Log token validation event
      logEvent(a.id, a.clinic_id, "token_validado");
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar informações do atendimento");
      setErrorType("generic");
    } finally {
      setLoading(false);
    }
  };

  const buildInfo = (a: any): AppointmentInfo => ({
    id: a.id,
    clinic_id: a.clinic_id,
    patient_id: a.patient_id,
    patient_name: a.patients?.full_name || "Paciente",
    patient_birth_date: a.patients?.birth_date || null,
    professional_name: a.professionals?.full_name || "Profissional",
    specialty_name: a.specialties?.name || "",
    scheduled_date: a.scheduled_date,
    start_time: a.start_time,
    end_time: a.end_time,
    clinic_name: a.clinics?.name || "Clínica",
    clinic_logo: a.clinics?.logo_url,
    meeting_link: a.meeting_link,
    meeting_status: a.meeting_status,
    precheck_status: a.precheck_status || "pendente",
  });

  // ── Event logging helper ──
  const logEvent = async (aptId: string, clinicId: string, eventType: string, payload?: Record<string, unknown>) => {
    try {
      await supabase.from("teleconsultation_events").insert({
        clinic_id: clinicId,
        teleconsultation_session_id: aptId,
        appointment_id: aptId,
        event_type: eventType,
        actor_type: "patient",
        payload: payload || null,
      });
    } catch {
      // Non-blocking
    }
  };

  // ── Device tests ──
  const testCamera = useCallback(async () => {
    setCameraStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCameraStatus("ok");
      if (appointmentInfo) logEvent(appointmentInfo.id, appointmentInfo.clinic_id, "camera_testada", { result: "ok" });
    } catch {
      setCameraStatus("failed");
      if (appointmentInfo) logEvent(appointmentInfo.id, appointmentInfo.clinic_id, "camera_testada", { result: "failed" });
    }
  }, [appointmentInfo]);

  const testMic = useCallback(async () => {
    setMicStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicStatus("ok");
      if (appointmentInfo) logEvent(appointmentInfo.id, appointmentInfo.clinic_id, "microfone_testado", { result: "ok" });
    } catch {
      setMicStatus("failed");
      if (appointmentInfo) logEvent(appointmentInfo.id, appointmentInfo.clinic_id, "microfone_testado", { result: "failed" });
    }
  }, [appointmentInfo]);

  const testInternet = useCallback(async () => {
    setInternetStatus("checking");
    try {
      const start = Date.now();
      await fetch("https://www.google.com/generate_204", { mode: "no-cors" });
      const latency = Date.now() - start;
      const ok = latency < 5000;
      setInternetStatus(ok ? "ok" : "failed");
      if (appointmentInfo) logEvent(appointmentInfo.id, appointmentInfo.clinic_id, "conexao_testada", { result: ok ? "ok" : "failed", latency });
    } catch {
      setInternetStatus("failed");
      if (appointmentInfo) logEvent(appointmentInfo.id, appointmentInfo.clinic_id, "conexao_testada", { result: "failed" });
    }
  }, [appointmentInfo]);

  const runAllChecks = () => {
    testCamera();
    testMic();
    testInternet();
  };

  // ── File upload ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !appointmentInfo) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          continue; // Skip files > 10MB silently
        }

        const filePath = `teleconsulta/${appointmentInfo.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("clinical-media")
          .upload(filePath, file);

        if (!uploadError) {
          setUploadedFiles((prev) => [...prev, { name: file.name, size: file.size, path: filePath }]);
          logEvent(appointmentInfo.id, appointmentInfo.clinic_id, "arquivo_enviado", { fileName: file.name });
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = async (filePath: string, fileName: string) => {
    if (!appointmentInfo) return;
    try {
      await supabase.storage.from("clinical-media").remove([filePath]);
      setUploadedFiles((prev) => prev.filter((f) => f.path !== filePath));
      logEvent(appointmentInfo.id, appointmentInfo.clinic_id, "arquivo_removido", { fileName });
    } catch {
      // Non-blocking
    }
  };

  // ── Identity validation ──
  const validateIdentity = () => {
    if (!appointmentInfo?.patient_birth_date) {
      // No birth date on file — just confirm name
      return identityConfirmed;
    }

    if (!birthDateInput) {
      setBirthDateError("Informe sua data de nascimento");
      return false;
    }

    // Parse input as dd/mm/yyyy
    const parts = birthDateInput.replace(/\D/g, "");
    if (parts.length !== 8) {
      setBirthDateError("Formato inválido. Use dd/mm/aaaa");
      return false;
    }
    const day = parts.slice(0, 2);
    const month = parts.slice(2, 4);
    const year = parts.slice(4, 8);
    const inputDate = `${year}-${month}-${day}`;

    if (inputDate !== appointmentInfo.patient_birth_date) {
      setBirthDateError("Data de nascimento não confere com o cadastro");
      return false;
    }

    setBirthDateError(null);
    return identityConfirmed;
  };

  // ── Step navigation ──
  const currentStepIndex = STEPS.indexOf(currentStep);
  const progressPercent = ((currentStepIndex + 1) / STEPS.length) * 100;

  const allChecksOk = cameraStatus === "ok" && micStatus === "ok" && internetStatus === "ok";

  const canAdvanceFromStep = (step: PrecheckStep): boolean => {
    switch (step) {
      case "info": return true;
      case "identity": return validateIdentity();
      case "consent": return consentAccepted;
      case "technical": return allChecksOk;
      case "files": return true; // optional step
      case "ready": return true;
      default: return false;
    }
  };

  const goNext = () => {
    if (currentStep === "identity") {
      const valid = validateIdentity();
      if (!valid) return;
      if (appointmentInfo) logEvent(appointmentInfo.id, appointmentInfo.clinic_id, "identificacao_confirmada");
    }
    if (currentStep === "consent") {
      if (!consentAccepted) return;
      if (appointmentInfo) logEvent(appointmentInfo.id, appointmentInfo.clinic_id, "termo_aceito");
    }

    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1]);
      // Update appointment precheck to in-progress
      if (appointmentInfo && currentStep === "info") {
        supabase.from("appointments").update({ precheck_status: "em_progresso" }).eq("id", appointmentInfo.id);
      }
    }
  };

  const goBack = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1]);
  };

  // ── Submit precheck ──
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
        notes: uploadedFiles.length > 0 ? `${uploadedFiles.length} arquivo(s) enviado(s)` : null,
      });

      await supabase
        .from("appointments")
        .update({
          precheck_status: "concluido",
          consent_telehealth_accepted: consentAccepted,
          consent_telehealth_accepted_at: consentAccepted ? new Date().toISOString() : null,
        })
        .eq("id", appointmentInfo.id);

      logEvent(appointmentInfo.id, appointmentInfo.clinic_id, "precheck_concluido");
      setCompleted(true);
    } catch (err) {
      console.error(err);
      logEvent(appointmentInfo.id, appointmentInfo.clinic_id, "precheck_falhou");
      setError("Erro ao salvar pré-check");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnterRoom = () => {
    if (token && appointmentInfo) {
      logEvent(appointmentInfo.id, appointmentInfo.clinic_id, "entrada_liberada");
      navigate(`/teleconsulta/${token}/sala`);
    }
  };

  // ── Helpers ──
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ══════════════════════════════════════════
  // RENDER — Loading
  // ══════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verificando acesso...</p>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER — Error states
  // ══════════════════════════════════════════
  if (error) {
    const errorIcons: Record<string, typeof Shield> = {
      invalid: Shield,
      ended: Video,
      outside_window: Clock,
      generic: AlertTriangle,
    };
    const ErrorIcon = errorIcons[errorType] || AlertTriangle;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <ErrorIcon className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold">{error}</h2>
            <p className="text-sm text-muted-foreground">
              {errorType === "ended"
                ? "Esta consulta já foi finalizada pelo profissional."
                : errorType === "outside_window"
                ? "O pré-check só pode ser realizado próximo ao horário da consulta."
                : "Verifique o link recebido ou entre em contato com a clínica."}
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
      <div className="min-h-screen bg-background">
        <ClinicHeader logo={appointmentInfo.clinic_logo} name={appointmentInfo.clinic_name} />
        <div className="max-w-lg mx-auto p-4 flex items-center justify-center" style={{ minHeight: "calc(100vh - 72px)" }}>
          <Card className="w-full shadow-lg">
            <CardContent className="pt-8 pb-8 text-center space-y-5">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-9 w-9 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Pré-check concluído!</h2>
              <p className="text-sm text-muted-foreground">
                Você está pronto(a) para a teleconsulta com{" "}
                <strong>Dr(a). {appointmentInfo.professional_name}</strong>.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {formatDate(appointmentInfo.scheduled_date)} às {appointmentInfo.start_time.slice(0, 5)}
                </span>
              </div>
              <Button onClick={handleEnterRoom} className="w-full gap-2" size="lg">
                <LogIn className="h-4 w-4" />
                Entrar na Sala de Consulta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER — Main precheck flow
  // ══════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">
      <ClinicHeader logo={appointmentInfo.clinic_logo} name={appointmentInfo.clinic_name} />

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Stepper / Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Etapa {currentStepIndex + 1} de {STEPS.length}</span>
            <span>{STEP_LABELS[currentStep]}</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
          <div className="flex gap-1">
            {STEPS.map((step, i) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= currentStepIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* ── Step 1: Appointment Info ── */}
        {currentStep === "info" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dados do Atendimento</CardTitle>
              <p className="text-xs text-muted-foreground">
                Revise as informações abaixo e prossiga para concluir o pré-check antes da consulta.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={User} label="Profissional" value={`Dr(a). ${appointmentInfo.professional_name}`} />
              {appointmentInfo.specialty_name && (
                <InfoRow icon={Stethoscope} label="Especialidade" value={appointmentInfo.specialty_name} />
              )}
              <InfoRow
                icon={Clock}
                label="Horário"
                value={`${formatDate(appointmentInfo.scheduled_date)} às ${appointmentInfo.start_time.slice(0, 5)}`}
              />
              <Badge variant="secondary" className="gap-1 mt-2">
                <Video className="h-3 w-3" />
                Teleconsulta
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Identity ── */}
        {currentStep === "identity" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Confirmação de Identidade
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Confirme seus dados para garantir a segurança do atendimento.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="identity"
                  checked={identityConfirmed}
                  onCheckedChange={(v) => setIdentityConfirmed(v === true)}
                />
                <label htmlFor="identity" className="text-sm cursor-pointer leading-relaxed">
                  Confirmo que sou <strong>{appointmentInfo.patient_name}</strong> e que os dados do atendimento estão corretos.
                </label>
              </div>

              {appointmentInfo.patient_birth_date && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="text-sm">
                      Data de nascimento (dd/mm/aaaa)
                    </Label>
                    <Input
                      id="birthDate"
                      placeholder="dd/mm/aaaa"
                      maxLength={10}
                      value={birthDateInput}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "");
                        if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2);
                        if (val.length > 5) val = val.slice(0, 5) + "/" + val.slice(5, 9);
                        setBirthDateInput(val);
                        setBirthDateError(null);
                      }}
                    />
                    {birthDateError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {birthDateError}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: Consent ── */}
        {currentStep === "consent" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Termo de Consentimento
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Leia e aceite o termo de consentimento para teleatendimento.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground leading-relaxed max-h-48 overflow-y-auto">
                <p className="font-medium text-foreground mb-2">Termo de Consentimento para Teleconsulta</p>
                <p>
                  Declaro estar ciente de que esta consulta será realizada de forma remota, por meio de
                  tecnologia de telecomunicação, conforme previsto na legislação vigente.
                </p>
                <p className="mt-2">
                  Autorizo a realização do atendimento por videoconferência, compreendo que a qualidade
                  da transmissão depende das condições tecnológicas de ambas as partes e que, caso
                  necessário, o profissional poderá solicitar atendimento presencial.
                </p>
                <p className="mt-2">
                  Estou de acordo com as políticas de privacidade e proteção de dados da clínica,
                  em conformidade com a Lei Geral de Proteção de Dados (LGPD).
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={consentAccepted}
                  onCheckedChange={(v) => setConsentAccepted(v === true)}
                />
                <label htmlFor="consent" className="text-sm cursor-pointer leading-relaxed">
                  Li e aceito o <strong>Termo de Consentimento para Teleatendimento</strong>. Compreendo que esta
                  consulta será realizada de forma remota e concordo com as condições.
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 4: Technical Checks ── */}
        {currentStep === "technical" && (
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
                statusText={statusLabel(cameraStatus)}
                onClick={testCamera}
              />
              <CheckRow
                icon={Mic}
                label="Microfone"
                status={micStatus}
                statusText={statusLabel(micStatus)}
                onClick={testMic}
              />
              <CheckRow
                icon={Wifi}
                label="Conexão com a Internet"
                status={internetStatus}
                statusText={statusLabel(internetStatus)}
                onClick={testInternet}
              />

              {/* Bind the camera click separately since CheckRow onClick isn't wired above */}

              {(cameraStatus === "failed" || micStatus === "failed" || internetStatus === "failed") && (
                <div className="flex items-start gap-2 mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div className="text-xs text-destructive space-y-1">
                    <p>Um ou mais testes falharam. Verifique as permissões do navegador.</p>
                    <p>Dicas: permita acesso à câmera e ao microfone nas configurações do navegador e tente novamente.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Step 5: Files ── */}
        {currentStep === "files" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Envio de Arquivos (Opcional)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Caso tenha exames, laudos ou documentos relevantes, envie-os aqui antes da consulta. Máximo 10MB por arquivo.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={handleFileUpload}
              />

              <Button
                variant="outline"
                className="w-full gap-2 border-dashed h-20"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "Enviando..." : "Selecionar Arquivos"}
              </Button>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {uploadedFiles.length} arquivo(s) enviado(s)
                  </p>
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.path}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveFile(file.path, file.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Step 6: Ready ── */}
        {currentStep === "ready" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Resumo do Pré-Check
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow label="Identidade confirmada" ok={identityConfirmed} />
              <SummaryRow label="Termo aceito" ok={consentAccepted} />
              <SummaryRow label="Câmera" ok={cameraStatus === "ok"} />
              <SummaryRow label="Microfone" ok={micStatus === "ok"} />
              <SummaryRow label="Conexão" ok={internetStatus === "ok"} />
              {uploadedFiles.length > 0 && (
                <SummaryRow label={`${uploadedFiles.length} arquivo(s) enviado(s)`} ok />
              )}
              <Separator className="my-3" />
              <p className="text-xs text-muted-foreground text-center">
                Ao concluir, você poderá entrar na sala de teleconsulta.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Navigation buttons ── */}
        <div className="flex gap-3">
          {currentStepIndex > 0 && (
            <Button variant="outline" onClick={goBack} className="gap-1.5 flex-1 sm:flex-none">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
          <div className="flex-1" />
          {currentStep !== "ready" ? (
            <Button
              onClick={goNext}
              disabled={!canAdvanceFromStep(currentStep)}
              className="gap-1.5 flex-1 sm:flex-none"
            >
              Próximo
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-1.5 flex-1 sm:flex-none"
              size="lg"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Concluir Pré-Check
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// Sub-components
// ══════════════════════════════════════════

function ClinicHeader({ logo, name }: { logo?: string; name: string }) {
  return (
    <div className="border-b bg-card">
      <div className="max-w-2xl mx-auto p-4 flex items-center gap-3">
        {logo && <img src={logo} alt="" className="h-10 w-10 rounded-lg object-cover" />}
        <div>
          <h1 className="font-bold text-lg">{name}</h1>
          <p className="text-xs text-muted-foreground">Pré-check de Teleconsulta</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span>
        {label}: <strong>{value}</strong>
      </span>
    </div>
  );
}

type CheckStatus2 = "pending" | "checking" | "ok" | "failed";

function statusLabel(status: CheckStatus2) {
  switch (status) {
    case "pending": return "Não testado";
    case "checking": return "Testando...";
    case "ok": return "Funcionando";
    case "failed": return "Falhou";
  }
}

function CheckRow({
  icon: Icon,
  label,
  status,
  statusText,
  onClick,
}: {
  icon: typeof Video;
  label: string;
  status: CheckStatus2;
  statusText: string;
  onClick?: () => void;
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
            ? "text-primary"
            : status === "failed"
            ? "text-destructive"
            : "text-muted-foreground"
        }`}
      >
        {statusText}
      </span>
    </button>
  );
}

function StatusIcon({ status }: { status: CheckStatus2 }) {
  switch (status) {
    case "pending":
      return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />;
    case "checking":
      return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    case "ok":
      return <CheckCircle2 className="h-5 w-5 text-primary" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-destructive" />;
  }
}

function SummaryRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-destructive shrink-0" />
      )}
      <span className={ok ? "text-foreground" : "text-destructive"}>{label}</span>
    </div>
  );
}
