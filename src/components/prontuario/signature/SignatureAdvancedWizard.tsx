import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Shield, AlertTriangle, FileCheck, Lock, Clock, User, FileText,
  CheckCircle2, KeyRound, Eye, EyeOff, Loader2, Camera, PenTool,
  ChevronRight, ChevronLeft, Hash, Upload, Image,
} from 'lucide-react';
import type { MedicalRecordEntry } from '@/hooks/prontuario/useMedicalRecordEntries';
import { SignatureCanvas } from './SignatureCanvas';
import { SelfieCapture } from './SelfieCapture';
import { useClinicSignatureSettings } from '@/hooks/prontuario/useClinicSignatureSettings';
import { useProfessionalSignature } from '@/hooks/useProfessionalSignature';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useClinicData } from '@/hooks/useClinicData';
import { usePermissions } from '@/hooks/usePermissions';

type WizardStep = 'review' | 'authenticate' | 'selfie' | 'sign' | 'finalize';

interface SignatureAdvancedWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: MedicalRecordEntry | null;
  professionalName: string;
  patientName: string;
  patientId: string;
  hasValidConsent: boolean;
  onComplete?: () => void;
}

const STEP_LABELS: Record<WizardStep, string> = {
  review: 'Revisão',
  authenticate: 'Autenticação',
  selfie: 'Selfie',
  sign: 'Assinatura',
  finalize: 'Finalização',
};

async function generateDocumentHash(content: Record<string, unknown>): Promise<string> {
  const jsonString = JSON.stringify(content, Object.keys(content).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateVerificationToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function SignatureAdvancedWizard({
  open, onOpenChange, entry, professionalName, patientName, patientId, hasValidConsent, onComplete,
}: SignatureAdvancedWizardProps) {
  const { clinic } = useClinicData();
  const { professionalId } = usePermissions();
  const docType = entry?.entry_type === 'anamnesis' ? 'anamnesis' : 'evolution';
  const { settings } = useClinicSignatureSettings(docType);

  // Compute steps based on settings
  const steps: WizardStep[] = (() => {
    const s: WizardStep[] = ['review', 'authenticate'];
    if (settings.signature_level === 'advanced' && settings.require_selfie) s.push('selfie');
    if (settings.signature_level !== 'simple') s.push('sign');
    s.push('finalize');
    return s;
  })();

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const currentStep = steps[currentStepIdx];

  // Step 1 state
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [confirmIrreversible, setConfirmIrreversible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  // Step 2 state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authPassed, setAuthPassed] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Step 3 state
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);

  // Step 4 state
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Step 5 state
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [resultHash, setResultHash] = useState<string | null>(null);

  // Reset on open/close
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
      setFinalizing(false);
      setFinalized(false);
      setResultHash(null);
    }
  }, [open]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget;
    if (t.scrollHeight - t.scrollTop - t.clientHeight < 20) setScrolledToEnd(true);
  }, []);

  const handleAuth = async () => {
    setAuthLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;
      if (!email) { toast.error('E-mail não encontrado'); return; }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error('Senha incorreta. Tente novamente.'); return; }
      setAuthPassed(true);
      // Auto-advance
      setCurrentStepIdx(prev => prev + 1);
    } catch { toast.error('Erro na autenticação'); } finally { setAuthLoading(false); }
  };

  const canAdvance = (): boolean => {
    switch (currentStep) {
      case 'review': return confirmAccuracy && confirmIrreversible && scrolledToEnd;
      case 'authenticate': return authPassed;
      case 'selfie': return !!selfieDataUrl || (cameraUnavailable && settings.allow_camera_fallback);
      case 'sign': return !!signatureDataUrl;
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
    if (!entry || !clinic?.id || !professionalId) return;
    setFinalizing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error('Não autenticado');

      const documentHash = await generateDocumentHash(entry.content);
      const verificationToken = generateVerificationToken();
      const userAgent = navigator.userAgent;
      setResultHash(documentHash);

      let ipAddress = 'unknown';
      try {
        const r = await fetch('https://api.ipify.org?format=json');
        ipAddress = (await r.json()).ip;
      } catch {}

      // Insert signature
      const { data: sigData, error: sigError } = await supabase
        .from('medical_record_signatures')
        .insert({
          clinic_id: clinic.id,
          patient_id: patientId,
          record_id: entry.id,
          record_type: entry.entry_type,
          signature_hash: documentHash,
          document_snapshot_json: entry.content as any,
          signed_by: userId,
          signed_by_professional_id: professionalId,
          signed_by_name: professionalName,
          sign_method: 'password_reauth',
          signature_level: settings.signature_level,
          ip_address: ipAddress,
          user_agent: userAgent,
          verification_token: verificationToken,
          auth_method: 'password',
          evidence_snapshot: {
            has_selfie: !!selfieDataUrl,
            has_handwritten: !!signatureDataUrl,
            signature_level: settings.signature_level,
          } as any,
        })
        .select('id')
        .single();

      if (sigError) throw sigError;

      // Upload evidence files
      const sigId = sigData.id;

      // Upload evidence files — storage RLS requires auth.uid() as first folder
      if (selfieDataUrl) {
        const blob = await (await fetch(selfieDataUrl)).blob();
        const path = `${userId}/${sigId}/selfie.jpg`;
        const { error: uploadErr } = await supabase.storage.from('signature-evidence').upload(path, blob, { contentType: 'image/jpeg' });
        if (uploadErr) console.error('[WIZARD] Selfie upload error:', uploadErr);
        await supabase.from('signature_evidence').insert({
          signature_id: sigId, clinic_id: clinic.id, evidence_type: 'selfie', file_path: path,
        });
        await supabase.from('medical_record_signatures').update({ selfie_path: path }).eq('id', sigId);
      }

      if (signatureDataUrl) {
        const blob = await (await fetch(signatureDataUrl)).blob();
        const path = `${userId}/${sigId}/handwritten.png`;
        const { error: uploadErr } = await supabase.storage.from('signature-evidence').upload(path, blob, { contentType: 'image/png' });
        if (uploadErr) console.error('[WIZARD] Handwritten upload error:', uploadErr);
        await supabase.from('signature_evidence').insert({
          signature_id: sigId, clinic_id: clinic.id, evidence_type: 'handwritten_signature', file_path: path,
        });
        await supabase.from('medical_record_signatures').update({ handwritten_path: path }).eq('id', sigId);
      }

      // Update source record
      const table = entry.entry_type === 'anamnesis' ? 'anamnesis_records' : 'clinical_evolutions';
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from(table)
        .update({ status: 'assinado', signed_at: now, signed_by: userId })
        .eq('id', entry.id);
      if (updateError) {
        if (updateError.code === '42501') throw new Error('Permissão negada.');
        throw updateError;
      }

      // Log events
      await supabase.from('medical_signature_events').insert({
        signature_id: sigId, clinic_id: clinic.id, event_type: 'document_signed',
        metadata: { hash: documentHash, sign_method: 'password_reauth', level: settings.signature_level } as any,
        created_by: userId,
      });

      await supabase.from('access_logs').insert({
        clinic_id: clinic.id, user_id: userId, action: 'advanced_sign_medical_record',
        resource_type: 'medical_record', resource_id: entry.id, ip_address: ipAddress, user_agent: userAgent,
      });

      toast.success('Documento assinado com assinatura avançada YesClin');
      setFinalized(true);
      onComplete?.();
    } catch (err: any) {
      console.error('[WIZARD] Finalize error:', err);
      toast.error(err?.message || 'Erro ao assinar documento');
    } finally {
      setFinalizing(false);
    }
  };

  if (!entry) return null;

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
          {/* STEP: REVIEW */}
          {currentStep === 'review' && (
            <>
              <div ref={scrollRef} onScroll={handleScroll} className="rounded-lg border bg-muted/30 p-4 space-y-3 max-h-40 overflow-y-auto">
                <h4 className="font-medium flex items-center gap-2"><FileText className="h-4 w-4" /> Resumo do Documento</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Paciente:</span><p className="font-medium">{patientName}</p></div>
                  <div><span className="text-muted-foreground">Profissional:</span><p className="font-medium">{professionalName}</p></div>
                  <div><span className="text-muted-foreground">Tipo:</span><p className="font-medium capitalize">{entry.entry_type === 'anamnesis' ? 'Anamnese' : 'Evolução Clínica'}</p></div>
                  <div><span className="text-muted-foreground">Data:</span><p className="font-medium">{formatDate(entry.created_at)}</p></div>
                </div>
                {/* Content preview to force scrolling */}
                <Separator />
                <div className="text-xs text-muted-foreground whitespace-pre-wrap max-h-none">
                  {JSON.stringify(entry.content, null, 2).slice(0, 1500)}
                  {JSON.stringify(entry.content).length > 1500 && '...'}
                </div>
              </div>

              {hasValidConsent ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border"><CheckCircle2 className="h-5 w-5 text-green-600" /><p className="text-sm text-green-700 font-medium">Consentimento LGPD Válido</p></div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg border"><AlertTriangle className="h-5 w-5 text-yellow-600" /><p className="text-sm text-yellow-700 font-medium">Consentimento LGPD Pendente</p></div>
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

          {/* STEP: AUTHENTICATE */}
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

          {/* STEP: SELFIE */}
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

          {/* STEP: SIGN */}
          {currentStep === 'sign' && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <h4 className="font-medium flex items-center gap-2"><PenTool className="h-4 w-4" /> Assinatura Manual</h4>
                <p className="text-sm text-muted-foreground">Assine no campo abaixo usando mouse ou toque.</p>
              </div>
              <SignatureCanvas onSignatureChange={setSignatureDataUrl} />
              {signatureDataUrl && (
                <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle2 className="h-4 w-4" /> Assinatura capturada</div>
              )}
            </div>
          )}

          {/* STEP: FINALIZE */}
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
                          {signatureDataUrl ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                          Assinatura manual {signatureDataUrl ? 'capturada' : 'pendente'}
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
