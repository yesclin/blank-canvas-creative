import { Outlet, useParams } from "react-router-dom";
import { usePublicClinic } from "@/hooks/usePublicClinic";
import { Loader2 } from "lucide-react";

export default function PublicBookingLayout() {
  const { clinicSlug } = useParams();
  const { data: clinic, isLoading, error } = usePublicClinic(clinicSlug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/40 to-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/40 to-background">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-bold text-foreground">Clínica não encontrada</h1>
          <p className="text-muted-foreground">O link de agendamento está inativo ou não existe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/40 via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          {clinic.logo_url && (
            <img src={clinic.logo_url} alt={clinic.name} className="h-10 w-10 rounded-lg object-cover" />
          )}
          <div>
            <h1 className="font-bold text-foreground">{clinic.name}</h1>
            <p className="text-xs text-muted-foreground">Agendamento Online</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Outlet context={{ clinic }} />
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          Powered by YesClin
        </div>
      </footer>
    </div>
  );
}
