/**
 * UnifiedSignatureWizard
 *
 * Single signature modal used across Prontuário and Atendimento.
 *
 * Modes:
 *  - Saved signature  → use the professional's stored signature
 *  - Handwritten      → draw on canvas (mouse/touch)
 *
 * Pipeline:
 *  Step 1 — Review (document summary + irreversibility checkboxes)
 *  Step 2 — Sign   (choose mode, preview, optional set-as-default, password)
 *
 * On confirm, calls `useUnifiedDocumentSigning.signDocument()`, which handles
 * hash, snapshot, evidence upload, source-table lock, and event log.
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
  User,
  FileText,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  PenTool,
  Eraser,
  CheckCircle2,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useUnifiedDocumentSigning,
  type SignableDocumentContext,
  type SignDocumentResult,
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

const CANVAS_WIDTH = 520;
const CANVAS_HEIGHT = 180;

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

  const [step, setStep] = useState<"review" | "sign">("review");
  const [mode, setMode] = useState<Mode>("saved");
  const [confirmIrreversible, setConfirmIrreversible] = useState(false);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [hasInk, setHasInk] = useState(false);

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
    } else if (context?.clinic_id) {
      // Audit: opening of the signature flow (pre-signature, no signature_id yet)
      logSignatureEvent(null, context.clinic_id, "signature_started", {
        document_id: context.document_id,
        document_type: context.document_type,
        patient_id: context.patient_id,
      });
    }
  }, [open, context?.clinic_id, context?.document_id, context?.document_type, context?.patient_id]);

  // Default mode = saved if available, else handwritten
  useEffect(() => {
    if (open && !loadingSig) {
      setMode(hasSavedSignature ? "saved" : "handwritten");
    }
  }, [open, loadingSig, hasSavedSignature]);

  // ─── Canvas refs ───────────────────────────────────────────
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

  // (Re)init when entering sign step or switching to handwritten
  useEffect(() => {
    if (step === "sign" && mode === "handwritten") {
      // wait for canvas to mount
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

  // ─── Saved signature dataURL (captured at sign time for immutability) ──
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

  // ─── Validation ────────────────────────────────────────────
  const canProceedFromReview = confirmAccuracy && confirmIrreversible;
  const canSubmit = useMemo(() => {
    if (signing) return false;
    if (password.trim().length < 6) return false;
    if (mode === "handwritten") return hasInk;
    if (mode === "saved") return !!savedDataUrl;
    return false;
  }, [signing, password, mode, hasInk, savedDataUrl]);

  // ─── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!context || !canSubmit) return;

    let handwrittenDataUrl: string | undefined;
    if (mode === "handwritten") {
      const c = canvasRef.current;
      if (!c) return;
      handwrittenDataUrl = c.toDataURL("image/png");

      // Optionally persist as default
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
    });

    if (result.success) {
      onSigned?.(result);
      onOpenChange(false);
    }
  };

  if (!open) return null;
  if (!context) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Assinatura Avançada YesClin
          </DialogTitle>
          <DialogDescription>
            Assinatura eletrônica avançada com reautenticação, integridade e trilha de auditoria.
          </DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-4 text-sm">
          <div
            className={cn(
              "flex items-center gap-2",
              step === "review" ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-xs",
                step === "review"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              1
            </div>
            Revisão
          </div>
          <div className="h-px flex-1 bg-border" />
          <div
            className={cn(
              "flex items-center gap-2",
              step === "sign" ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-xs",
                step === "sign"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              2
            </div>
            Assinatura
          </div>
        </div>

        <div className="overflow-y-auto max-h-[65vh] pr-2 space-y-5">
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
                <div className="flex items-center gap-2 text-muted-foreground">
                  <KeyRound className="h-4 w-4" />
                  <span>Reautenticação por senha obrigatória</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileCheck className="h-4 w-4" />
                  <span>Hash SHA-256 de integridade</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Snapshot imutável da assinatura usada</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Trilha de auditoria com IP e dispositivo</span>
                </div>
              </div>
            </>
          )}

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

              <Separator />

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
                  Método: Reautenticação por senha (password_reauth) +{" "}
                  {mode === "saved" ? "assinatura salva" : "assinatura manuscrita"}
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
                    <li>Modo da assinatura ({mode === "saved" ? "salva" : "manuscrita"})</li>
                    <li>Eventos da timeline na trilha de auditoria</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          {step === "review" ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setStep("sign")} disabled={!canProceedFromReview}>
                <PenTool className="h-4 w-4 mr-2" />
                Continuar para assinatura
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("review")} disabled={signing}>
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
      </DialogContent>
    </Dialog>
  );
}
