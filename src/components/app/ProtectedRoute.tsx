import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { usePermissions, AppModule, AppAction } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldX, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
  module: AppModule;
  action?: AppAction;
  redirectTo?: string;
}

/**
 * Route-level permission guard
 * - Checks if user is active (inactive users cannot access)
 * - Shows loading state while permissions are being fetched
 * - Redirects or shows blocked message when access is denied
 * - Renders children when access is granted
 */
export function ProtectedRoute({
  children,
  module,
  action = "view",
  redirectTo,
}: ProtectedRouteProps) {
  const { can, isLoading, isOwner, isAdmin } = usePermissions();
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [checkingActive, setCheckingActive] = useState(true);

  // Check if user is active
  useEffect(() => {
    async function checkUserActive() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsActive(false);
          setCheckingActive(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_active")
          .eq("user_id", user.id)
          .single();

        setIsActive(profile?.is_active ?? false);
      } catch (error) {
        console.error("Error checking user status:", error);
        setIsActive(false);
      } finally {
        setCheckingActive(false);
      }
    }

    checkUserActive();
  }, []);

  // Show skeleton while loading
  if (isLoading || checkingActive) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // If user is inactive, show blocked page
  if (isActive === false) {
    return <InactiveUserPage />;
  }

  // Owner and Admin bypass all permission checks
  if (isOwner || isAdmin) {
    return <>{children}</>;
  }

  // Check permission - CRITICAL: No screen without permission validation
  if (!can(module, action)) {
    // Log denied access attempt for audit
    console.warn(`[SECURITY] Access denied to module: ${module}, action: ${action}`);
    
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    return <AccessDeniedPage module={module} />;
  }

  return <>{children}</>;
}

const moduleLabels: Record<AppModule, string> = {
  dashboard: "Dashboard",
  agenda: "Agenda",
  
  pacientes: "Pacientes",
  prontuario: "Prontuário",
  comunicacao: "Marketing",
  financeiro: "Financeiro",
  meu_financeiro: "Meu Financeiro",
  convenios: "Convênios",
  estoque: "Estoque",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
};

function AccessDeniedPage({ module }: { module: AppModule }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <ShieldX className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Acesso Restrito
      </h1>
      <p className="text-muted-foreground max-w-md mb-6">
        Você não tem permissão para acessar o módulo <strong>{moduleLabels[module]}</strong>.
        Entre em contato com o administrador da clínica para solicitar acesso.
      </p>
    </div>
  );
}

function InactiveUserPage() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mb-6">
        <UserX className="h-10 w-10 text-warning" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Conta Desativada
      </h1>
      <p className="text-muted-foreground max-w-md mb-6">
        Sua conta foi desativada pelo administrador da clínica.
        Entre em contato com o administrador para mais informações.
      </p>
      <Button onClick={handleLogout} variant="outline">
        Sair
      </Button>
    </div>
  );
}
