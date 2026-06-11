import { useNavigate } from "react-router-dom";
import { Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoFull from "@/assets/logo-full.png";
import Assinatura from "@/pages/app/Assinatura";

type Role = "owner" | "admin" | "profissional" | "recepcionista" | string | null;

interface Props {
  status: "trial" | "active" | "overdue" | "blocked" | "canceled" | string;
  role: Role;
  clinicName?: string | null;
}

/**
 * Tela de bloqueio TOTAL exibida quando o trial expirou ou a assinatura está
 * bloqueada/cancelada. Substitui completamente o AppLayout (sem sidebar, sem
 * header operacional). Mensagem é contextual ao papel do usuário.
 */
export function TrialExpiredBlocker({ status, role, clinicName }: Props) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { markUserLogout } = await import("@/lib/authIntent");
      const { clearAuthenticatedTab, clearSupabaseAuthStorage } = await import("@/lib/authSessionIsolation");
      markUserLogout("trial-expired-logout");
      clearAuthenticatedTab();
      clearSupabaseAuthStorage();
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch {
      toast.error("Erro ao encerrar sessão");
    }
  };


  const isOwner = role === "owner";
  const isAdmin = role === "admin";

  const headline =
    status === "canceled"
      ? "Sua assinatura foi cancelada"
      : status === "blocked"
        ? "Sua clínica está temporariamente bloqueada"
        : "Seu teste grátis terminou";

  const subline = isOwner
    ? "Escolha um plano para continuar utilizando o YesClin."
    : isAdmin
      ? "O período de teste da clínica expirou. Solicite ao proprietário que escolha um plano para continuar."
      : "O período de teste da clínica expirou. Entre em contato com o proprietário da clínica para continuar utilizando o YesClin.";

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0">
        <div className="flex items-center gap-3">
          <img src={logoFull} alt="Yesclin" className="h-7 w-auto object-contain" />
          {clinicName && (
            <>
              <div className="h-5 w-px bg-border" />
              <span className="text-sm font-medium text-foreground">{clinicName}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                Teste expirado
              </span>
            </>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-1.5 h-3.5 w-3.5" />
          Sair
        </Button>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <Lock className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">{headline}</h1>
            <p className="text-base text-muted-foreground">{subline}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Seus dados continuam salvos com segurança. Após escolher um plano, o acesso será liberado automaticamente.
            </p>
          </div>

          <div className="bg-card border rounded-lg shadow-sm">
            <Assinatura />
          </div>
        </div>
      </main>
    </div>
  );
}
