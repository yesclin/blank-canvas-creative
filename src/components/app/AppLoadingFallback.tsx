import logoFull from "@/assets/logo-full.png";

interface AppLoadingFallbackProps {
  message?: string;
}

export function AppLoadingFallback({ message = "Carregando sistema..." }: AppLoadingFallbackProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <img src={logoFull} alt="Yesclin" className="h-10 w-auto object-contain" />
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}