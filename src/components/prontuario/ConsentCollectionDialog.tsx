import { useState } from "react";
import { Shield, FileText, Check, Loader2, AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConsentCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  termTitle: string;
  termVersion: string;
  termContent: string;
  onConfirm: () => Promise<boolean>;
  isLoading?: boolean;
}

export function ConsentCollectionDialog({
  open,
  onOpenChange,
  patientName,
  termTitle,
  termVersion,
  termContent,
  onConfirm,
  isLoading = false,
}: ConsentCollectionDialogProps) {
  const [hasReadTerm, setHasReadTerm] = useState(false);
  const [hasPatientConsent, setHasPatientConsent] = useState(false);
  const [showFullTerm, setShowFullTerm] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const canConfirm = hasReadTerm && hasPatientConsent && !isLoading && !confirming;

  const handleConfirm = async () => {
    if (!canConfirm) return;

    setConfirming(true);
    try {
      const success = await onConfirm();
      if (success) {
        toast.success("Consentimento registrado com sucesso", {
          description: `${patientName} aceitou o termo "${termTitle}" v${termVersion}`,
        });
        // Reset state
        setHasReadTerm(false);
        setHasPatientConsent(false);
        setShowFullTerm(false);
        onOpenChange(false);
      } else {
        toast.error("Erro ao registrar consentimento");
      }
    } finally {
      setConfirming(false);
    }
  };

  const handleClose = () => {
    if (!confirming) {
      setHasReadTerm(false);
      setHasPatientConsent(false);
      setShowFullTerm(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Coleta de Consentimento LGPD
          </DialogTitle>
          <DialogDescription>
            Registre o consentimento do paciente para acesso e tratamento de dados
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {/* Patient Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {patientName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium">{patientName}</p>
                <p className="text-sm text-muted-foreground">
                  Termo: {termTitle} (v{termVersion})
                </p>
              </div>
            </div>
          </div>

          {/* Term Preview */}
          <div className="flex-1 overflow-hidden border rounded-lg">
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium text-sm">{termTitle}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullTerm(!showFullTerm)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {showFullTerm ? "Resumir" : "Ver Completo"}
              </Button>
            </div>
            <ScrollArea className={showFullTerm ? "h-64" : "h-32"}>
              <div className="p-4 text-sm whitespace-pre-wrap">
                {termContent}
              </div>
            </ScrollArea>
          </div>

          {/* Confirmation Checkboxes */}
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                É obrigatório que o paciente ou responsável legal consinta de forma livre,
                informada e inequívoca, conforme exigido pela LGPD (Lei nº 13.709/2018).
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="read-term"
                  checked={hasReadTerm}
                  onCheckedChange={(checked) => setHasReadTerm(checked === true)}
                  disabled={isLoading || confirming}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="read-term" className="font-medium cursor-pointer">
                    Li e expliquei o termo ao paciente
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Confirmo que apresentei o conteúdo integral do termo de consentimento
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="patient-consent"
                  checked={hasPatientConsent}
                  onCheckedChange={(checked) => setHasPatientConsent(checked === true)}
                  disabled={isLoading || confirming}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="patient-consent" className="font-medium cursor-pointer">
                    O paciente consentiu expressamente
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    O paciente ou responsável legal manifestou concordância com os termos apresentados
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamp Info */}
          <div className="text-xs text-muted-foreground text-center">
            Registro: {format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={confirming}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {confirming ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Registrar Consentimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
