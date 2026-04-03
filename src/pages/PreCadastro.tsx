import { useParams } from "react-router-dom";
import { usePublicPreRegistration } from "@/hooks/usePreRegistration";
import { Loader2, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { PreRegistrationForm } from "@/components/pre-cadastro/PreRegistrationForm";

export default function PreCadastro() {
  const { token } = useParams<{ token: string }>();
  const { data: link, isLoading, error } = usePublicPreRegistration(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/40 to-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/40 to-background">
        <div className="text-center space-y-4 p-8 max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Link inválido</h1>
          <p className="text-muted-foreground">
            Este link de pré-cadastro não existe ou foi removido.
          </p>
        </div>
      </div>
    );
  }

  const isExpired = new Date(link.expires_at) < new Date();
  const isCanceled = link.status === "canceled";
  const isSubmitted = link.status === "submitted";

  if (isExpired || isCanceled) {
    return (
      <PublicLayout clinicName={link.clinic_name} clinicLogo={link.clinic_logo}>
        <div className="text-center space-y-4 p-8 max-w-md mx-auto">
          <Clock className="h-12 w-12 text-amber-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">
            {isExpired ? "Link expirado" : "Link cancelado"}
          </h1>
          <p className="text-muted-foreground">
            {isExpired
              ? "Este link de pré-cadastro expirou. Solicite um novo link à clínica."
              : "Este link foi cancelado. Entre em contato com a clínica."}
          </p>
        </div>
      </PublicLayout>
    );
  }

  if (isSubmitted) {
    return (
      <PublicLayout clinicName={link.clinic_name} clinicLogo={link.clinic_logo}>
        <div className="text-center space-y-4 p-8 max-w-md mx-auto">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Pré-cadastro já enviado</h1>
          <p className="text-muted-foreground">
            Seus dados já foram enviados com sucesso. A clínica já possui suas informações.
          </p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout clinicName={link.clinic_name} clinicLogo={link.clinic_logo}>
      <PreRegistrationForm link={link} />
    </PublicLayout>
  );
}

function PublicLayout({
  clinicName,
  clinicLogo,
  children,
}: {
  clinicName: string;
  clinicLogo: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/40 via-background to-muted/20">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          {clinicLogo && (
            <img src={clinicLogo} alt={clinicName} className="h-10 w-10 rounded-lg object-cover" />
          )}
          <div>
            <h1 className="font-bold text-foreground">{clinicName}</h1>
            <p className="text-xs text-muted-foreground">Pré-cadastro do Paciente</p>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      <footer className="border-t bg-card/50 mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          Powered by YesClin
        </div>
      </footer>
    </div>
  );
}
