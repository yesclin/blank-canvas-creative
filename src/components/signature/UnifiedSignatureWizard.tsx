/**
 * UnifiedSignatureWizard
 *
 * Single signature modal used across Prontuário and Atendimento.
 *
 * Pipeline (4 steps — Assinatura Avançada YesClin):
 *  Step 1 — Revisão     (document summary + irreversibility checkboxes)
 *  Step 2 — Assinatura  (saved signature OR handwritten on canvas)
 *  Step 3 — Selfie      (verification selfie via getUserMedia)
 *  Step 4 — Geo + Senha (geolocation capture + password reauth + final submit)
 *
 * On confirm, calls `useUnifiedDocumentSigning.signDocument()`, which handles
 * hash, snapshot, evidence upload (signature + selfie), source-table lock,
 * geolocation persistence, and event log.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  FileCheck,
  Lock,
  Clock,
  FileText,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  PenTool,
  Eraser,
  CheckCircle2,
  ImageIcon,
  Camera,
  RefreshCw,
  MapPin,
  Globe,
  XCircle,
  Bug,
  Copy,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useUnifiedDocumentSigning,
  logSignatureEvent,
  type SignableDocumentContext,
  type SignDocumentResult,
  type GeolocationEvidence,
} from "@/hooks/useUnifiedDocumentSigning";
import {
  useProfessionalSignature,
  fetchSignatureAsDataUrl,
} from "@/hooks/useProfessionalSignature";

interface UnifiedSignatureWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: SignableDocumentContext | null;
  patientName?: string;
  generatedAt?: string | null;
  /** Optional callback fired after a successful signature. */
  onSigned?: (result: SignDocumentResult) => void;
}

type Mode = "saved" | "handwritten";
type Step = "review" | "sign" | "selfie" | "confirm";

const CANVAS_WIDTH = 520;
const CANVAS_HEIGHT = 180;

const STEPS: { key: Step; label: string }[] = [
  { key: "review", label: "Revisão" },
  { key: "sign", label: "Assinatura" },
  { key: "selfie", label: "Selfie" },
  { key: "confirm", label: "Geo + Senha" },
];

function fmt(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

export function UnifiedSignatureWizard({
  open,
  onOpenChange,
  context,
  patientName,
  generatedAt,
  onSigned,
}: UnifiedSignatureWizardProps) {
  const { signing, signDocument } = useUnifiedDocumentSigning();
  const {
    signature: savedSig,
    signedUrl: savedSigUrl,
    hasSavedSignature,
    saveSignature,
    saving: savingSig,
    loading: loadingSig,
  } = useProfessionalSignature();

  const [step, setStep] = useState<Step>("review");
  const [mode, setMode] = useState<Mode>("saved");
  const [confirmIrreversible, setConfirmIrreversible] = useState(false);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [hasInk, setHasInk] = useState(false);

  // Selfie state
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const selfieCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Geolocation state
  const [geolocation, setGeolocation] = useState<GeolocationEvidence | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Reset on open/close
  useEffect(() => {
    if (!open) {
      setStep("review");
      setMode("saved");
      setConfirmIrreversible(false);
      setConfirmAccuracy(false);
      setPassword("");
      setShowPassword(false);
      setSetAsDefault(false);
      setHasInk(false);
      setSelfieDataUrl(null);
      setCameraError(null);
      setCameraReady(false);
      setGeolocation(null);
      setGeoLoading(false);
      // ensure camera released
      stopCamera();
    } else if (context?.clinic_id) {
      logSignatureEvent(null, context.clinic_id, "signature_started", {
        document_id: context.document_id,
        document_type: context.document_type,
        patient_id: context.patient_id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, context?.clinic_id, context?.document_id, context?.document_type, context?.patient_id]);

  // Default mode = saved if available, else handwritten
  useEffect(() => {
    if (open && !loadingSig) {
      setMode(hasSavedSignature ? "saved" : "handwritten");
    }
  }, [open, loadingSig, hasSavedSignature]);

  // ─── Signature canvas refs ─────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  const initCanvas = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = CANVAS_WIDTH;
    c.height = CANVAS_HEIGHT;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setHasInk(false);
  };

  useEffect(() => {
    if (step === "sign" && mode === "handwritten") {
      setTimeout(initCanvas, 0);
    }
  }, [step, mode]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current;
    if (!c) return null;
    const r = c.getBoundingClientRect();
    const sx = c.width / r.width;
    const sy = c.height / r.height;
    if ("touches" in e) {
      const t = e.touches[0];
      if (!t) return null;
      return { x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy };
    }
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    const p = getCoords(e);
    if (!ctx || !p) return;
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    const p = getCoords(e);
    if (!ctx || !p) return;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasInk(true);
  };

  const endDraw = () => {
    drawingRef.current = false;
  };

  const clearCanvas = () => initCanvas();

  // ─── Saved signature dataURL (captured at sign time) ───────
  const [savedDataUrl, setSavedDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (mode === "saved" && savedSig?.signature_file_url) {
        const d = await fetchSignatureAsDataUrl(savedSig.signature_file_url);
        if (!cancel) setSavedDataUrl(d);
      } else {
        setSavedDataUrl(null);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [mode, savedSig?.signature_file_url]);

  // ─── Selfie / camera ───────────────────────────────────────
  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }

  async function startCamera() {
    setCameraError(null);
    setSelfieDataUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play().catch(() => {});
        setCameraReady(true);
      }
    } catch (err: any) {
      console.warn("[SIGN] camera unavailable:", err);
      setCameraError(
        err?.name === "NotAllowedError"
          ? "Permissão de câmera negada. Habilite o acesso para capturar a selfie de verificação."
          : "Câmera indisponível neste dispositivo."
      );
    }
  }

  // Auto-start camera when entering the selfie step
  useEffect(() => {
    if (open && step === "selfie" && !selfieDataUrl) {
      startCamera();
    }
    if (step !== "selfie") {
      stopCamera();
    }
    return () => {
      // released on unmount/close via outer effects
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, open]);

  function captureSelfie() {
    const v = videoRef.current;
    const c = selfieCanvasRef.current;
    if (!v || !c) return;
    const w = v.videoWidth || 640;
    const h = v.videoHeight || 480;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    // mirror for natural selfie feel
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, w, h);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const url = c.toDataURL("image/png");
    setSelfieDataUrl(url);
    stopCamera();
  }

  function retakeSelfie() {
    setSelfieDataUrl(null);
    startCamera();
  }

  function skipSelfie() {
    setSelfieDataUrl(null);
    stopCamera();
    setStep("confirm");
  }

  // ─── Geolocation ───────────────────────────────────────────
  function captureGeolocation() {
    setGeoLoading(true);
    if (!navigator.geolocation) {
      setGeolocation({
        status: "unavailable",
        captured_at: new Date().toISOString(),
        error: "API de geolocalização indisponível neste dispositivo.",
      });
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeolocation({
          status: "granted",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          captured_at: new Date().toISOString(),
        });
        setGeoLoading(false);
      },
      (err) => {
        setGeolocation({
          status: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
          captured_at: new Date().toISOString(),
          error: err.message,
        });
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  // Auto-request geolocation when entering confirm step
  useEffect(() => {
    if (open && step === "confirm" && !geolocation && !geoLoading) {
      captureGeolocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, open]);

  // ─── Validation ────────────────────────────────────────────
  const canProceedFromReview = confirmAccuracy && confirmIrreversible;
  const canProceedFromSign = useMemo(() => {
    if (mode === "handwritten") return hasInk;
    if (mode === "saved") return !!savedDataUrl;
    return false;
  }, [mode, hasInk, savedDataUrl]);
  const canSubmit = useMemo(() => {
    if (signing) return false;
    if (password.trim().length < 6) return false;
    if (!canProceedFromSign) return false;
    return true;
  }, [signing, password, canProceedFromSign]);

  // ─── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!context || !canSubmit) return;

    let handwrittenDataUrl: string | undefined;
    if (mode === "handwritten") {
      const c = canvasRef.current;
      if (!c) return;
      handwrittenDataUrl = c.toDataURL("image/png");

      if (setAsDefault) {
        const blob = await new Promise<Blob | null>((resolve) =>
          c.toBlob((b) => resolve(b), "image/png")
        );
        if (blob) await saveSignature(blob, { type: "drawn" });
      }
    }

    const result = await signDocument({
      context,
      password,
      method: mode === "saved" ? "saved_signature" : "handwritten",
      handwrittenDataUrl,
      savedSignatureDataUrl: mode === "saved" ? savedDataUrl || undefined : undefined,
      selfieDataUrl,
      geolocation,
    });

    if (result.success) {
      onSigned?.(result);
      onOpenChange(false);
    }
  };

  // ─── Step indicator ────────────────────────────────────────
  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  if (!open) return null;

  // Identify missing required context fields so we can render an in-wizard
  // diagnostic instead of silently failing or only showing a toast.
  const missingFields: string[] = [];
  if (!context?.document_id) missingFields.push("document_id");
  if (!context?.clinic_id) missingFields.push("clinic_id");
  if (!context?.patient_id) missingFields.push("patient_id");
  const hasMissingContext = missingFields.length > 0;

  const fieldLabels: Record<string, string> = {
    document_id: "Documento (document_id)",
    clinic_id: "Clínica (clinic_id)",
    patient_id: "Paciente (patient_id)",
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) stopCamera(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Assinatura Avançada YesClin
          </DialogTitle>
          <DialogDescription>
            Reautenticação, integridade, selfie de verificação, geolocalização e trilha de auditoria.
          </DialogDescription>
        </DialogHeader>

        {hasMissingContext && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Contexto do documento incompleto</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Não é possível iniciar a assinatura porque os seguintes campos
                obrigatórios não foram fornecidos:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                {missingFields.map((f) => (
                  <li key={f} className="font-medium">
                    {fieldLabels[f] ?? f}
                  </li>
                ))}
              </ul>
              <p className="text-xs opacity-90">
                Feche este diálogo, recarregue o documento e tente novamente.
                Se o problema persistir, contate o suporte informando os campos
                acima.
              </p>
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Fechar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Context diagnostics — useful when missing fields, also available
            on demand to inspect what was passed in. */}
        <details
          open={hasMissingContext}
          className="rounded-md border bg-muted/30 text-xs"
        >
          <summary className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer select-none">
            <span className="flex items-center gap-2 font-medium text-foreground">
              <Bug className="h-3.5 w-3.5" />
              Diagnóstico do contexto
              {hasMissingContext && (
                <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                  {missingFields.length} campo{missingFields.length > 1 ? "s" : ""} ausente{missingFields.length > 1 ? "s" : ""}
                </Badge>
              )}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform [details[open]_&]:rotate-180" />
          </summary>
          <div className="px-3 pb-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground">
                JSON do contexto recebido pelo wizard. Inclua isto ao reportar
                problemas para o suporte.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 shrink-0"
                onClick={async () => {
                  const payload = JSON.stringify(context ?? {}, null, 2);
                  try {
                    if (navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(payload);
                    } else {
                      const ta = document.createElement("textarea");
                      ta.value = payload;
                      document.body.appendChild(ta);
                      ta.select();
                      document.execCommand("copy");
                      document.body.removeChild(ta);
                    }
                    toast.success("Contexto copiado para a área de transferência");
                  } catch {
                    toast.error("Não foi possível copiar o contexto");
                  }
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copiar JSON
              </Button>
            </div>
            <pre className="max-h-48 overflow-auto rounded bg-background border p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all">
{JSON.stringify(context ?? {}, null, 2)}
            </pre>
          </div>
        </details>

        {!hasMissingContext && (
        <>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 text-xs">
          {STEPS.map((s, idx) => {
            const active = step === s.key;
            const done = idx < currentStepIdx;
            return (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    "flex items-center gap-1.5 transition-colors",
                    active ? "text-primary font-medium" : done ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-[11px] shrink-0",
                      active
                        ? "bg-primary text-primary-foreground"
                        : done
                        ? "bg-green-600 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                  </div>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
              </div>
            );
          })}
        </div>

        <div className="overflow-y-auto max-h-[65vh] pr-2 space-y-5">
          {/* ─── STEP 1 — Review ─────────────────────────── */}
          {step === "review" && (
            <>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Resumo do Documento
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Paciente:</span>
                    <p className="font-medium">{patientName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Profissional:</span>
                    <p className="font-medium">{context.professional_name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-medium capitalize">
                      {context.document_type === "consolidated_document"
                        ? "Documento Consolidado"
                        : context.document_type === "evolution"
                        ? "Evolução Clínica"
                        : "Anamnese"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gerado em:</span>
                    <p className="font-medium">{fmt(generatedAt)}</p>
                  </div>
                </div>
              </div>

              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Ação Irreversível</AlertTitle>
                <AlertDescription>
                  Após a assinatura, este documento será bloqueado permanentemente.
                  Apenas visualização, exportação e adendos serão permitidos.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="uw-accuracy"
                    checked={confirmAccuracy}
                    onCheckedChange={(c) => setConfirmAccuracy(c === true)}
                  />
                  <label htmlFor="uw-accuracy" className="text-sm leading-relaxed cursor-pointer">
                    Declaro que as informações são verdadeiras e correspondem ao atendimento.
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="uw-irrev"
                    checked={confirmIrreversible}
                    onCheckedChange={(c) => setConfirmIrreversible(c === true)}
                  />
                  <label htmlFor="uw-irrev" className="text-sm leading-relaxed cursor-pointer">
                    Compreendo que esta ação é <strong>irreversível</strong>.
                  </label>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Evidências que serão coletadas
                </p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <KeyRound className="h-4 w-4" />
                  <span>Reautenticação por senha</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileCheck className="h-4 w-4" />
                  <span>Hash SHA-256 do documento</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <PenTool className="h-4 w-4" />
                  <span>Snapshot da assinatura usada</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>IP e dispositivo do signatário</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Geolocalização (com sua autorização)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Camera className="h-4 w-4" />
                  <span>Selfie de verificação</span>
                </div>
              </div>
            </>
          )}

          {/* ─── STEP 2 — Sign ───────────────────────────── */}
          {step === "sign" && (
            <>
              <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="saved" disabled={!hasSavedSignature} className="gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Assinatura salva
                  </TabsTrigger>
                  <TabsTrigger value="handwritten" className="gap-1.5">
                    <PenTool className="h-3.5 w-3.5" />
                    Assinar à mão
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="saved" className="space-y-3 pt-3">
                  {loadingSig ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando assinatura salva...
                    </div>
                  ) : !hasSavedSignature ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Sem assinatura salva</AlertTitle>
                      <AlertDescription>
                        Você ainda não cadastrou uma assinatura padrão. Use a aba “Assinar à mão”
                        e marque a opção para salvar como padrão.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="rounded-lg border bg-white p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Assinatura padrão
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Atualizada em {fmt(savedSig?.updated_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-center min-h-[140px] border rounded">
                        {savedSigUrl ? (
                          <img
                            src={savedSigUrl}
                            alt="Assinatura salva"
                            className="max-h-[140px] object-contain"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Pré-visualização indisponível
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="handwritten" className="space-y-3 pt-3">
                  <div className="rounded-lg border-2 border-dashed bg-white overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      className="w-full touch-none cursor-crosshair"
                      style={{ height: `${CANVAS_HEIGHT}px` }}
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Assine acima usando o mouse ou toque.
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={clearCanvas}>
                      <Eraser className="h-3.5 w-3.5 mr-1.5" />
                      Limpar
                    </Button>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="uw-default"
                      checked={setAsDefault}
                      onCheckedChange={(c) => setSetAsDefault(c === true)}
                      disabled={savingSig}
                    />
                    <label htmlFor="uw-default" className="text-xs leading-relaxed cursor-pointer">
                      Salvar esta assinatura como minha assinatura padrão para os próximos
                      documentos.
                    </label>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}

          {/* ─── STEP 3 — Selfie ─────────────────────────── */}
          {step === "selfie" && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 flex items-start gap-3">
                <Camera className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Selfie de verificação</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Capture uma selfie para vincular a evidência facial à sua assinatura.
                    Esta imagem será armazenada de forma privada como parte da trilha de auditoria.
                  </p>
                </div>
              </div>

              {cameraError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Câmera indisponível</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>{cameraError}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={startCamera}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Tentar novamente
                      </Button>
                      <Button size="sm" variant="ghost" onClick={skipSelfie}>
                        Continuar sem selfie
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : selfieDataUrl ? (
                <div className="space-y-3">
                  <div className="rounded-lg border bg-black flex items-center justify-center overflow-hidden">
                    <img
                      src={selfieDataUrl}
                      alt="Selfie capturada"
                      className="max-h-[320px] object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Selfie capturada
                    </Badge>
                    <Button size="sm" variant="outline" onClick={retakeSelfie}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Refazer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border bg-black flex items-center justify-center overflow-hidden min-h-[280px]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="max-h-[320px] w-full object-contain transform -scale-x-100"
                    />
                  </div>
                  <canvas ref={selfieCanvasRef} className="hidden" />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {cameraReady ? "Posicione seu rosto e clique em capturar." : "Iniciando câmera..."}
                    </p>
                    <Button size="sm" onClick={captureSelfie} disabled={!cameraReady}>
                      <Camera className="h-3.5 w-3.5 mr-1.5" />
                      Capturar selfie
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 4 — Geo + Password ─────────────────── */}
          {step === "confirm" && (
            <>
              {/* Geolocation card */}
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    Geolocalização
                  </h4>
                  <Button size="sm" variant="ghost" onClick={captureGeolocation} disabled={geoLoading}>
                    {geoLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                {geoLoading && (
                  <p className="text-xs text-muted-foreground">Solicitando permissão...</p>
                )}
                {geolocation?.status === "granted" && (
                  <div className="text-xs space-y-1">
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Coordenadas capturadas
                    </Badge>
                    <p className="font-mono text-muted-foreground">
                      {geolocation.latitude?.toFixed(6)}, {geolocation.longitude?.toFixed(6)}
                      {geolocation.accuracy && ` (±${Math.round(geolocation.accuracy)}m)`}
                    </p>
                  </div>
                )}
                {geolocation?.status === "denied" && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Permissão negada. O evento será registrado como “geolocalização negada”
                      na trilha de auditoria.
                    </AlertDescription>
                  </Alert>
                )}
                {geolocation?.status === "unavailable" && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Geolocalização indisponível neste dispositivo.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="uw-password" className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Senha atual
                </Label>
                <div className="relative">
                  <Input
                    id="uw-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha para confirmar a assinatura"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canSubmit) handleSubmit();
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Método: Reautenticação por senha + {mode === "saved" ? "assinatura salva" : "assinatura manuscrita"}
                </p>
              </div>

              <Alert className="border-primary/30 bg-primary/5">
                <Shield className="h-4 w-4" />
                <AlertTitle>O que será registrado</AlertTitle>
                <AlertDescription className="text-xs space-y-1">
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Snapshot imutável do documento e da assinatura usada</li>
                    <li>Hash SHA-256 do documento final</li>
                    <li>IP, navegador, dispositivo e carimbo de tempo</li>
                    <li>Selfie de verificação {selfieDataUrl ? "✓" : "(não capturada)"}</li>
                    <li>Geolocalização: {geolocation?.status === "granted" ? "✓ capturada" : geolocation?.status === "denied" ? "negada" : "indisponível"}</li>
                    <li>Eventos completos da timeline na trilha de auditoria</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          {step === "review" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setStep("sign")} disabled={!canProceedFromReview}>
                <PenTool className="h-4 w-4 mr-2" />
                Continuar
              </Button>
            </>
          )}
          {step === "sign" && (
            <>
              <Button variant="outline" onClick={() => setStep("review")} disabled={signing}>
                Voltar
              </Button>
              <Button onClick={() => setStep("selfie")} disabled={!canProceedFromSign}>
                <Camera className="h-4 w-4 mr-2" />
                Continuar para selfie
              </Button>
            </>
          )}
          {step === "selfie" && (
            <>
              <Button variant="outline" onClick={() => { stopCamera(); setStep("sign"); }} disabled={signing}>
                Voltar
              </Button>
              {selfieDataUrl ? (
                <Button onClick={() => setStep("confirm")}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Continuar
                </Button>
              ) : (
                <Button variant="outline" onClick={skipSelfie}>
                  Pular selfie
                </Button>
              )}
            </>
          )}
          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("selfie")} disabled={signing}>
                Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {signing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assinando...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Assinar Documento
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
