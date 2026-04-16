/**
 * UnifiedSignatureWizard
 * 
 * Context-agnostic wizard for signing any document in YesClin.
 * Replaces per-module SignatureAdvancedWizard usage.
 * 
 * Usage:
 *   <UnifiedSignatureWizard
 *     open={open}
 *     onOpenChange={setOpen}
 *     context={{ record_id, document_type, source_module, patient_id, content, ... }}
 *     onComplete={() => refetch()}
 *   />
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Shield, AlertTriangle, FileCheck, Lock, Clock, User, FileText,
  CheckCircle2, KeyRound, Eye, EyeOff, Loader2, Camera, PenTool,
  ChevronRight, ChevronLeft, Hash, Image,
} from 'lucide-react';
import { SignatureCanvas } from '@/components/prontuario/signature/SignatureCanvas';
import { SelfieCapture } from '@/components/prontuario/signature/SelfieCapture';
import { useUnifiedDocumentSigning } from '@/hooks/useUnifiedDocumentSigning';
import type { SignableDocumentContext } from '@/types/documentSigning';

type WizardStep = 'review' | 'authenticate' | 'selfie' | 'sign' | 'finalize';

interface UnifiedSignatureWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: SignableDocumentContext | null;
  onComplete?: () => void;
}

const STEP_LABELS: Record<WizardStep, string> = {
  review: 'Revisão',
  authenticate: 'Autenticação',
  selfie: 'Selfie',
  sign: 'Assinatura',
  finalize: 'Finalização',
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  evolution: 'Evolução Clínica',
  anamnesis: 'Anamnese',
  consolidated_document: 'Documento Consolidado',
  consent_term: 'Termo de Consentimento',
  clinical_document: 'Documento Clínico',
  prescription: 'Receita',
  certificate: 'Atestado',
  report: 'Laudo',
};

export function UnifiedSignatureWizard({
  open, onOpenChange, context, onComplete,
}: UnifiedSignatureWizardProps) {
  const {
    signing: finalizing_signing,
    signDocument,
    reAuthenticate,
    savedSignature,
    getSignedUrl,
    settings,
  } = useUnifiedDocumentSigning();

  // Compute steps
  const steps: WizardStep[] = (() => {
    const s: WizardStep[] = ['review', 'authenticate'];
    if (settings.signature_level === 'advanced' && settings.require_selfie) s.push('selfie');
    if (settings.signature_level !== 'simple') s.push('sign');
    s.push('finalize');
    return s;
  })();

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const currentStep = steps[currentStepIdx];

  // Review state
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [confirmIrreversible, setConfirmIrreversible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  // Auth state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authPassed, setAuthPassed] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Selfie state
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);

  // Sign state
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [useSavedSignature, setUseSavedSignature] = useState(false);
  const [savedSignatureUrl, setSavedSignatureUrl] = useState<string | null>(null);
  const [showManualFallback, setShowManualFallback] = useState(false);

  // Finalize state
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [resultHash, setResultHash] = useState<string | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setCurrentStepIdx(0);
      setConfirmAccuracy(false);
      setConfirmIrreversible(false);
      setScrolledToEnd(false);
      setPassword('');
      setShowPassword(false);
      setAuthPassed(false);
      setSelfieDataUrl(null);
      setCameraUnavailable(false);
      setSignatureDataUrl(null);
      setUseSavedSignature(false);
      setSavedSignatureUrl(null);
      setShowManualFallback(false);
      setFinalizing(false);
      setFinalized(false);
      setResultHash(null);
    }
  }, [open]);

  // Load saved signature URL
  useEffect(() => {
    if (open && savedSignature?.signature_file_url) {
      getSignedUrl(savedSignature.signature_file_url).then(url => {
        if (url) setSavedSignatureUrl(url);
      });
    }
  }, [open, savedSignature, getSignedUrl]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget;
    if (t.scrollHeight - t.scrollTop - t.clientHeight < 20) setScrolledToEnd(true);
  }, []);

  const handleAuth = async () => {
    setAuthLoading(true);
    try {
      const ok = await reAuthenticate(password);
      if (ok) {
        setAuthPassed(true);
        setCurrentStepIdx(prev => prev + 1);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const canAdvance = (): boolean => {
    switch (currentStep) {
      case 'review': return confirmAccuracy && confirmIrreversible && scrolledToEnd;
      case 'authenticate': return authPassed;
      case 'selfie': return !!selfieDataUrl || (cameraUnavailable && settings.allow_camera_fallback);
      case 'sign': return useSavedSignature || !!signatureDataUrl;
      case 'finalize': return finalized;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) setCurrentStepIdx(prev => prev + 1);
  };
  const handleBack = () => {
    if (currentStepIdx > 0) setCurrentStepIdx(prev => prev - 1);
  };

  const handleFinalize = async () => {
    if (!context) return;
    setFinalizing(true);
    try {
      const result = await signDocument(context, {
        useSavedSignature,
        selfieDataUrl,
        handwrittenDataUrl: signatureDataUrl,
      });

      if (result.success) {
        setResultHash(result.document_hash || null);
        setFinalized(true);
        onComplete?.();
      }
    } finally {
      setFinalizing(false);
    }
  };

  if (!context) return null;

  const docLabel = context.document_label || DOCUMENT_TYPE_LABELS[context.document_type] || context.document_type;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!finalizing) onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Assinatura Avançada YesClin
          </DialogTitle>
          <DialogDescription>
            Assinatura eletrônica com múltiplas evidências e trilha de auditoria
          </DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-1 text-xs px-1 overflow-x-auto">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && <div className="h-px w-4 bg-border flex-shrink-0" />}
              <div className={`flex items-center gap-1.5 flex-shrink-0 ${i === currentStepIdx ? 'text-primary font-medium' : i < currentStepIdx ? 'text-green-600' : 'text-muted-foreground'}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  i < currentStepIdx ? 'bg-green-100 text-green-700' : i === currentStepIdx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {i < currentStepIdx ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Step content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* REVIEW */}
          {currentStep === 'review' && (
            <>
              <div ref={scrollRef} onScroll={handleScroll} className="rounded-lg border bg-muted/30 p-4 space-y-3 max-h-40 overflow-y-auto">
                <h4 className="font-medium flex items-center gap-2"><FileText className="h-4 w-4" /> Resumo do Documento</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Paciente:</span><p className="font-medium">{context.patient_name}</p></div>
                  <div><span className="text-muted-foreground">Profissional:</span><p className="font-medium">{context.professional_name}</p></div>
                  <div><span className="text-muted-foreground">Tipo:</span><p className="font-medium">{docLabel}</p></div>
                  <div><span className="text-muted-foreground">Módulo:</span><p className="font-medium capitalize">{context.source_module}</p></div>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground whitespace-pre-wrap max-h-none">
                  {JSON.stringify(context.content, null, 2).slice(0, 1500)}
                  {JSON.stringify(context.content).length > 1500 && '...'}
                </div>
              </div>

              {context.has_valid_consent !== undefined && (
                context.has_valid_consent ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border"><CheckCircle2 className="h-5 w-5 text-green-600" /><p className="text-sm text-green-700 font-medium">Consentimento LGPD Válido</p></div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg border"><AlertTriangle className="h-5 w-5 text-yellow-600" /><p className="text-sm text-yellow-700 font-medium">Consentimento LGPD Pendente</p></div>
                )
              )}

              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Ação Irreversível</AlertTitle>
                <AlertDescription>Após a assinatura, este documento será bloqueado permanentemente.</AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox id="acc" checked={confirmAccuracy} onCheckedChange={c => setConfirmAccuracy(c === true)} />
                  <label htmlFor="acc" className="text-sm leading-relaxed cursor-pointer">
                    Declaro que as informações são verdadeiras e correspondem ao atendimento realizado.
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="irr" checked={confirmIrreversible} onCheckedChange={c => setConfirmIrreversible(c === true)} />
                  <label htmlFor="irr" className="text-sm leading-relaxed cursor-pointer">
                    Compreendo que esta ação é <strong>irreversível</strong> e o documento será bloqueado permanentemente.
                  </label>
                </div>
              </div>

              {!scrolledToEnd && (
                <p className="text-xs text-muted-foreground text-center">Role o resumo do documento até o final para continuar.</p>
              )}
            </>
          )}

          {/* AUTHENTICATE */}
          {currentStep === 'authenticate' && !authPassed && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <h4 className="font-medium flex items-center gap-2"><User className="h-4 w-4" /> Validação de Identidade</h4>
                <p className="text-sm text-muted-foreground">Confirme sua identidade digitando sua senha atual.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signPwd" className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Senha Atual</Label>
                <div className="relative">
                  <Input id="signPwd" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Digite sua senha" autoFocus
                    onKeyDown={e => { if (e.key === 'Enter' && password.length >= 6) handleAuth(); }} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={handleAuth} disabled={password.length < 6 || authLoading} className="w-full">
                {authLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verificando...</> : <><KeyRound className="h-4 w-4 mr-2" /> Confirmar Identidade</>}
              </Button>
            </div>
          )}
          {currentStep === 'authenticate' && authPassed && (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <p className="font-medium text-green-700">Identidade confirmada</p>
            </div>
          )}

          {/* SELFIE */}
          {currentStep === 'selfie' && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <h4 className="font-medium flex items-center gap-2"><Camera className="h-4 w-4" /> Captura de Selfie</h4>
                <p className="text-sm text-muted-foreground">Tire uma selfie ao vivo para comprovar sua identidade no momento da assinatura.</p>
              </div>
              <SelfieCapture onCapture={setSelfieDataUrl} onCameraUnavailable={() => setCameraUnavailable(true)} />
              {cameraUnavailable && settings.allow_camera_fallback && (
                <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>Câmera indisponível. Você pode prosseguir sem selfie (fallback permitido).</AlertDescription></Alert>
              )}
              {cameraUnavailable && !settings.allow_camera_fallback && (
                <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>Câmera obrigatória. Use um dispositivo com câmera para assinar.</AlertDescription></Alert>
              )}
            </div>
          )}

          {/* SIGN */}
          {currentStep === 'sign' && (
            <div className="space-y-4">
              {savedSignature && savedSignatureUrl && !showManualFallback ? (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <h4 className="font-medium flex items-center gap-2"><Image className="h-4 w-4" /> Assinatura Salva</h4>
                    <p className="text-sm text-muted-foreground">Sua assinatura cadastrada será usada neste documento.</p>
                  </div>
                  <div className="rounded-lg border bg-white p-6 flex items-center justify-center min-h-[120px]">
                    <img src={savedSignatureUrl} alt="Assinatura do profissional" className="max-h-[100px] max-w-full object-contain" />
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox id="useSaved" checked={useSavedSignature} onCheckedChange={c => setUseSavedSignature(c === true)} />
                    <label htmlFor="useSaved" className="text-sm leading-relaxed cursor-pointer">
                      Confirmo o uso da minha assinatura salva neste documento
                    </label>
                  </div>
                  {useSavedSignature && (
                    <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle2 className="h-4 w-4" /> Assinatura confirmada</div>
                  )}
                  <Separator />
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setShowManualFallback(true)}>
                    <PenTool className="h-3 w-3 mr-1" /> Prefiro assinar manualmente
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {!savedSignature && (
                    <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>
                      Você não possui assinatura cadastrada. Cadastre em <strong>Configurações → Usuários → Minha Assinatura</strong> para agilizar futuras assinaturas.
                    </AlertDescription></Alert>
                  )}
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <h4 className="font-medium flex items-center gap-2"><PenTool className="h-4 w-4" /> Assinatura Manual</h4>
                    <p className="text-sm text-muted-foreground">Assine no campo abaixo usando mouse ou toque.</p>
                  </div>
                  <SignatureCanvas onSignatureChange={setSignatureDataUrl} />
                  {signatureDataUrl && (
                    <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle2 className="h-4 w-4" /> Assinatura capturada</div>
                  )}
                  {savedSignature && showManualFallback && (
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground"
                      onClick={() => { setShowManualFallback(false); setSignatureDataUrl(null); }}>
                      ← Voltar para assinatura salva
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* FINALIZE */}
          {currentStep === 'finalize' && (
            <div className="space-y-4">
              {!finalized ? (
                <>
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <h4 className="font-medium flex items-center gap-2"><FileCheck className="h-4 w-4" /> Resumo da Assinatura</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Documento revisado e aceito</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Identidade autenticada por senha</div>
                      {steps.includes('selfie') && (
                        <div className="flex items-center gap-2">
                          {selfieDataUrl ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                          Selfie {selfieDataUrl ? 'capturada' : 'não capturada (fallback)'}
                        </div>
                      )}
                      {steps.includes('sign') && (
                        <div className="flex items-center gap-2">
                          {(useSavedSignature || signatureDataUrl) ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                          {useSavedSignature ? 'Assinatura salva utilizada' : signatureDataUrl ? 'Assinatura manual capturada' : 'Assinatura pendente'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground"><Hash className="h-3.5 w-3.5" /> Hash SHA-256 será gerado automaticamente</div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Documento será bloqueado permanentemente</div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Carimbo: {new Date().toLocaleString('pt-BR')}</div>
                  </div>

                  <Badge variant="outline" className="text-xs">Nível: {settings.signature_level.toUpperCase()}</Badge>

                  <Button onClick={handleFinalize} disabled={finalizing} className="w-full" size="lg">
                    {finalizing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Assinando...</> : <><Shield className="h-4 w-4 mr-2" /> Assinar Documento</>}
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Documento Assinado!</h3>
                  <p className="text-sm text-muted-foreground text-center">O documento foi assinado com assinatura avançada e está bloqueado permanentemente.</p>
                  {resultHash && (
                    <div className="rounded bg-muted p-2 text-xs font-mono break-all w-full text-center">{resultHash}</div>
                  )}
                  <Button onClick={() => onOpenChange(false)}>Fechar</Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        {currentStep !== 'finalize' && (
          <>
            <Separator />
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={currentStepIdx === 0 ? () => onOpenChange(false) : handleBack} disabled={finalizing}>
                {currentStepIdx === 0 ? 'Cancelar' : <><ChevronLeft className="h-4 w-4 mr-1" /> Voltar</>}
              </Button>
              {currentStep !== 'authenticate' && (
                <Button onClick={handleNext} disabled={!canAdvance()}>
                  Avançar <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
