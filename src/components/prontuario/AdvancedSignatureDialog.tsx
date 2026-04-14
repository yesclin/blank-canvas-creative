import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Shield,
  AlertTriangle,
  FileCheck,
  Lock,
  Clock,
  User,
  FileText,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import type { MedicalRecordEntry } from '@/hooks/prontuario/useMedicalRecordEntries';

interface AdvancedSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: MedicalRecordEntry | null;
  professionalName: string;
  patientName: string;
  hasValidConsent: boolean;
  onSign: (password: string) => Promise<boolean>;
  signing?: boolean;
}

export function AdvancedSignatureDialog({
  open,
  onOpenChange,
  entry,
  professionalName,
  patientName,
  hasValidConsent,
  onSign,
  signing = false,
}: AdvancedSignatureDialogProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmIrreversible, setConfirmIrreversible] = useState(false);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [step, setStep] = useState<'review' | 'authenticate'>('review');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setPassword('');
      setShowPassword(false);
      setConfirmIrreversible(false);
      setConfirmAccuracy(false);
      setStep('review');
    }
  }, [open]);

  const canProceedToAuth = confirmIrreversible && confirmAccuracy;
  const canSign = password.trim().length >= 6;

  const handleSign = async () => {
    if (!canSign) return;
    const success = await onSign(password);
    if (success) {
      onOpenChange(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Assinatura Avançada YesClin
          </DialogTitle>
          <DialogDescription>
            Assinatura eletrônica avançada com reautenticação e integridade documental
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Steps indicator */}
            <div className="flex items-center gap-4 text-sm">
              <div className={`flex items-center gap-2 ${step === 'review' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</div>
                Revisão
              </div>
              <div className="h-px flex-1 bg-border" />
              <div className={`flex items-center gap-2 ${step === 'authenticate' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step === 'authenticate' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
                Autenticação
              </div>
            </div>

            {step === 'review' && (
              <>
                {/* Record Summary */}
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Resumo do Documento
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Paciente:</span>
                      <p className="font-medium">{patientName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Profissional:</span>
                      <p className="font-medium">{professionalName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tipo:</span>
                      <p className="font-medium capitalize">{entry.entry_type === 'anamnesis' ? 'Anamnese' : 'Evolução Clínica'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Data:</span>
                      <p className="font-medium">{formatDate(entry.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Consent Status */}
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                  {hasValidConsent ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-700">Consentimento LGPD Válido</p>
                        <p className="text-sm text-muted-foreground">Paciente aceitou o termo</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-700">Consentimento LGPD Pendente</p>
                        <p className="text-sm text-muted-foreground">Paciente ainda não aceitou</p>
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                {/* Warning */}
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Ação Irreversível</AlertTitle>
                  <AlertDescription>
                    Após a assinatura, este documento será bloqueado permanentemente.
                    Não será possível editar, excluir ou modificar o conteúdo.
                    Apenas visualização, exportação e adendos serão permitidos.
                  </AlertDescription>
                </Alert>

                {/* Confirmations */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="confirmAccuracy"
                      checked={confirmAccuracy}
                      onCheckedChange={(checked) => setConfirmAccuracy(checked === true)}
                    />
                    <label htmlFor="confirmAccuracy" className="text-sm leading-relaxed cursor-pointer">
                      Declaro que as informações contidas neste documento são verdadeiras e
                      correspondem fielmente ao atendimento realizado.
                    </label>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="confirmIrreversible"
                      checked={confirmIrreversible}
                      onCheckedChange={(checked) => setConfirmIrreversible(checked === true)}
                    />
                    <label htmlFor="confirmIrreversible" className="text-sm leading-relaxed cursor-pointer">
                      Compreendo que esta ação é <strong>irreversível</strong> e que o documento
                      será bloqueado permanentemente após a assinatura.
                    </label>
                  </div>
                </div>

                {/* Signature technical info */}
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
                    <span>Snapshot imutável do conteúdo</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Carimbo de tempo: {new Date().toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </>
            )}

            {step === 'authenticate' && (
              <>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Validação de Identidade
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Para garantir a autenticidade da assinatura, confirme sua identidade digitando sua senha atual.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signPassword" className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Senha Atual
                  </Label>
                  <div className="relative">
                    <Input
                      id="signPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha para confirmar"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && canSign && !signing) {
                          handleSign();
                        }
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
                    Método: Reautenticação por senha (password_reauth)
                  </p>
                </div>

                <Alert className="border-primary/30 bg-primary/5">
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Assinatura Avançada YesClin</AlertTitle>
                  <AlertDescription className="text-xs space-y-1">
                    <p>Ao confirmar, o sistema irá:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Validar sua identidade pela senha</li>
                      <li>Gerar hash SHA-256 do conteúdo final</li>
                      <li>Criar snapshot imutável do documento</li>
                      <li>Registrar IP, navegador e carimbo de tempo</li>
                      <li>Bloquear permanentemente o documento</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          {step === 'review' ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setStep('authenticate')} disabled={!canProceedToAuth}>
                <KeyRound className="h-4 w-4 mr-2" />
                Validar Identidade
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('review')} disabled={signing}>
                Voltar
              </Button>
              <Button onClick={handleSign} disabled={!canSign || signing}>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
