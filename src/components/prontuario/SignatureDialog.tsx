import { useState } from 'react';
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
} from 'lucide-react';
import type { MedicalRecordEntry } from '@/hooks/prontuario/useMedicalRecordEntries';

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: MedicalRecordEntry | null;
  professionalName: string;
  patientName: string;
  hasValidConsent: boolean;
  onSign: (signedName: string, signedDocument?: string) => Promise<boolean>;
  signing?: boolean;
}

export function SignatureDialog({
  open,
  onOpenChange,
  entry,
  professionalName,
  patientName,
  hasValidConsent,
  onSign,
  signing = false,
}: SignatureDialogProps) {
  const [signedName, setSignedName] = useState(professionalName);
  const [signedDocument, setSignedDocument] = useState('');
  const [confirmIrreversible, setConfirmIrreversible] = useState(false);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);

  const canSign = signedName.trim() && confirmIrreversible && confirmAccuracy;

  const handleSign = async () => {
    if (!canSign) return;
    const success = await onSign(signedName.trim(), signedDocument.trim() || undefined);
    if (success) {
      onOpenChange(false);
      // Reset form
      setConfirmIrreversible(false);
      setConfirmAccuracy(false);
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
            Assinatura Digital do Prontuário
          </DialogTitle>
          <DialogDescription>
            Assinatura eletrônica avançada com validade jurídica
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Record Summary */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resumo do Registro
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
                  <p className="font-medium capitalize">{entry.entry_type}</p>
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
                    <p className="text-sm text-muted-foreground">
                      O paciente aceitou o termo de consentimento
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-700">Consentimento LGPD Pendente</p>
                    <p className="text-sm text-muted-foreground">
                      O paciente ainda não aceitou o termo
                    </p>
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Signature Form */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados do Signatário
              </h4>

              <div className="space-y-2">
                <Label htmlFor="signedName">Nome Completo *</Label>
                <Input
                  id="signedName"
                  value={signedName}
                  onChange={(e) => setSignedName(e.target.value)}
                  placeholder="Digite seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signedDocument">CPF ou Registro Profissional (opcional)</Label>
                <Input
                  id="signedDocument"
                  value={signedDocument}
                  onChange={(e) => setSignedDocument(e.target.value)}
                  placeholder="Ex: 123.456.789-00 ou CRM 12345"
                />
              </div>
            </div>

            <Separator />

            {/* Warning */}
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Ação Irreversível</AlertTitle>
              <AlertDescription>
                Após a assinatura, este registro será bloqueado permanentemente.
                Não será possível editar, excluir ou modificar o conteúdo.
                Apenas visualização e exportação serão permitidas.
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
                  Declaro que as informações contidas neste registro são verdadeiras e 
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
                  Compreendo que esta ação é <strong>irreversível</strong> e que o registro 
                  será bloqueado permanentemente após a assinatura.
                </label>
              </div>
            </div>

            {/* Signature Info */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>Assinatura eletrônica avançada</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Carimbo de tempo: {new Date().toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileCheck className="h-4 w-4" />
                <span>Hash SHA-256 será gerado automaticamente</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={signing}>
            Cancelar
          </Button>
          <Button onClick={handleSign} disabled={!canSign || signing}>
            {signing ? (
              <>Assinando...</>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Assinar Digitalmente
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
