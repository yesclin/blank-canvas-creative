import { useEffect, useState } from "react";
import logoFull from "@/assets/logo-full.png";

interface AppLoadingFallbackProps {
  message?: string;
  /** Tempo em ms até exibir o fallback de retry. Default 8s. */
  stuckAfterMs?: number;
  /** Callback do botão "Tentar novamente". Se ausente, faz reload. */
  onRetry?: () => void;
}

export function AppLoadingFallback({
  message = "Carregando sistema...",
  stuckAfterMs = 8_000,
  onRetry,
}: AppLoadingFallbackProps) {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setStuck(true), stuckAfterMs);
    return () => window.clearTimeout(id);
  }, [stuckAfterMs]);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    setStuck(false);
    // Soft retry: tentar de novo antes de reload duro
    window.setTimeout(() => setStuck(true), stuckAfterMs);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <img src={logoFull} alt="Yesclin" className="h-10 w-auto object-contain" />
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{message}</p>

        {stuck && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Não foi possível carregar o preview automaticamente.
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
