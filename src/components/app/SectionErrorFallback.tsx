import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SectionErrorFallbackProps {
  /** Título da seção (ex: "Termos", "Anamnese"). */
  title?: string;
  /** Mensagem amigável; default: "Não foi possível carregar esta seção." */
  message?: string;
  /** Handler de retry. Quando ausente, esconde o botão. */
  onRetry?: () => void;
  /** Mensagem técnica do erro (apenas em dev). */
  errorMessage?: string;
}

/**
 * Fallback visual reutilizável para falhas de carregamento em seções/blocos
 * do app. Usar quando uma query/edge function falhar mas a página inteira
 * deve continuar funcional.
 */
export function SectionErrorFallback({
  title,
  message = "Não foi possível carregar esta seção.",
  onRetry,
  errorMessage,
}: SectionErrorFallbackProps) {
  const isDev = import.meta.env.DEV;

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-2">
            {title && (
              <p className="text-sm font-medium text-foreground">{title}</p>
            )}
            <p className="text-sm text-muted-foreground">{message}</p>
            {isDev && errorMessage && (
              <p className="text-xs font-mono bg-muted text-muted-foreground p-2 rounded break-words">
                {errorMessage}
              </p>
            )}
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry} className="mt-2">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Tentar novamente
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
