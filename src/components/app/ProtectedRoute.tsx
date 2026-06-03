import { ReactNode, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usePermissions, AppModule, AppAction } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldX, UserX, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { withTimeout } from "@/lib/asyncTimeout";

interface ProtectedRouteProps {
  children: ReactNode;
  module: AppModule;
  action?: AppAction;
  redirectTo?: string;
}

/**
 * Route-level permission guard.
 *
 * REGRAS INVIOLÁVEIS:
 *  1. NUNCA chamar signOut() aqui. Falha de profile/clinic/role NÃO é
 *     falha de autenticação — só o RequireAuth decide quem vai para /login.
 *  2. Enquanto isLoading (auth/permissions) for true, mostrar skeleton.
 *     Nunca decidir bloqueio antes de loading=false.
 *  3. Se as permissões falharem temporariamente (role=null após carregar),
 *     mostrar tela de erro recuperável com botão "Tentar novamente" —
 *     NÃO redirecionar para /login e NÃO deslogar.
 *  4. Apenas exibir AccessDeniedPage quando o role EXISTE e realmente
 *     não tem permissão para o módulo solicitado.
 *
 * O check de `is_active` é cacheado via React Query por user.id, de modo
 * que navegar entre rotas /app/* NÃO refaz o fetch nem mostra skeleton
 * a cada clique — o sidebar/header ficam fixos e só o conteúdo troca.
 */
export function ProtectedRoute({
  children,
  module,
  action = "view",
  redirectTo,
}: ProtectedRouteProps) {
  const { can, isLoading, isOwner, isAdmin, role, refetch } = usePermissions();

  const activeQuery = useQuery({
    queryKey: ["protected-route", "is-active"],
    queryFn: async (): Promise<boolean> => {
      const { data: { user } } = await withTimeout<any>(supabase.auth.getUser());
      if (!user) return false;
      const { data: profile } = await withTimeout<any>(
        supabase.from("profiles").select("is_active").eq("user_id", user.id).maybeSingle()
      );
      // Profile ainda não criado (race no signup) → trata como ativo.
      if (!profile) return true;
      return profile.is_active ?? true;
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    // Em erro, não bloqueamos — default ativo. Tratado abaixo.
  });

  const isActive: boolean | null =
    activeQuery.isError ? true : activeQuery.data ?? null;

  // Só mostra skeleton no primeiro carregamento. Em navegações
  // subsequentes (cache quente) cai direto no conteúdo.
  if (isLoading || (activeQuery.isLoading && activeQuery.data === undefined)) {
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

  // CRÍTICO: se as permissões já terminaram de carregar mas o role veio
  // null/undefined, foi falha temporária de dados — NÃO é falha de auth.
  // Mostrar erro recuperável com "Tentar novamente". NUNCA deslogar aqui.
  if (!isLoading && !role) {
    return <PermissionsLoadFailedPage onRetry={() => refetch()} />;
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
  comercial: "Comercial",
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

function PermissionsLoadFailedPage({ onRetry }: { onRetry: () => void | Promise<void> }) {
  const [retrying, setRetrying] = useState(false);
  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mb-6">
        <AlertTriangle className="h-10 w-10 text-warning" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Não foi possível carregar suas permissões
      </h1>
      <p className="text-muted-foreground max-w-md mb-6">
        Sua sessão continua ativa, mas tivemos um problema temporário ao buscar
        os dados da sua clínica. Tente novamente em instantes.
      </p>
      <div className="flex gap-2">
        <Button onClick={handleRetry} disabled={retrying}>
          {retrying ? "Tentando..." : "Tentar novamente"}
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Recarregar página
        </Button>
      </div>
    </div>
  );
}

function InactiveUserPage() {
  const handleLogout = async () => {
    const { markUserLogout } = await import("@/lib/authIntent");
    markUserLogout("inactive-account");
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
