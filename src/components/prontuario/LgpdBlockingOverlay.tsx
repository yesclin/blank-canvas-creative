import { Shield, Lock, FileWarning, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LgpdBlockingOverlayProps {
  patientName: string;
  isFullyLocked: boolean; // lock_record_without_consent = true
  onCollectConsent: () => void;
}

export function LgpdBlockingOverlay({
  patientName,
  isFullyLocked,
  onCollectConsent,
}: LgpdBlockingOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-2xl border-2 border-destructive/20">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                {isFullyLocked ? (
                  <Lock className="h-10 w-10 text-destructive" />
                ) : (
                  <Shield className="h-10 w-10 text-destructive" />
                )}
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                {isFullyLocked ? "Prontuário Bloqueado" : "Edição Bloqueada"}
              </h2>
              <p className="text-muted-foreground">
                {isFullyLocked 
                  ? "Este prontuário está completamente bloqueado até que o paciente aceite o Termo de Consentimento LGPD."
                  : "A edição deste prontuário está bloqueada até que o paciente aceite o Termo de Consentimento LGPD."
                }
              </p>
            </div>

            {/* Patient info */}
            <div className="bg-muted rounded-lg p-4 w-full">
              <p className="text-sm text-muted-foreground">Paciente</p>
              <p className="font-semibold text-lg">{patientName}</p>
            </div>

            {/* Alert */}
            <Alert variant="destructive" className="text-left">
              <FileWarning className="h-4 w-4" />
              <AlertTitle>Conformidade LGPD Exigida</AlertTitle>
              <AlertDescription>
                De acordo com a Lei nº 13.709/2018 (LGPD), é necessário obter o consentimento 
                expresso do paciente antes de acessar ou tratar seus dados pessoais e de saúde.
              </AlertDescription>
            </Alert>

            {/* CTA */}
            <Button 
              size="lg" 
              onClick={onCollectConsent}
              className="w-full sm:w-auto"
            >
              <Shield className="h-4 w-4 mr-2" />
              Coletar Consentimento
            </Button>

            {/* Info text */}
            <p className="text-xs text-muted-foreground max-w-sm">
              Após o registro do consentimento, o prontuário será desbloqueado automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
