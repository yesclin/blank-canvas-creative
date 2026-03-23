import { ReactNode } from "react";
import { usePermissions, AppModule, AppAction } from "@/hooks/usePermissions";
import { ShieldX } from "lucide-react";

interface PermissionGateProps {
  module: AppModule;
  action?: AppAction;
  children: ReactNode;
  fallback?: ReactNode;
  showBlocked?: boolean;
}

/**
 * Component that conditionally renders children based on user permissions
 * 
 * @param module - The module to check permission for
 * @param action - The action to check (default: "view")
 * @param children - Content to render if user has permission
 * @param fallback - Optional custom fallback when permission denied
 * @param showBlocked - Whether to show a "blocked" message (default: false)
 */
export function PermissionGate({
  module,
  action = "view",
  children,
  fallback,
  showBlocked = false,
}: PermissionGateProps) {
  const { can, isLoading, isOwner } = usePermissions();

  if (isLoading) {
    return null;
  }

  // Owner bypasses all gates
  if (isOwner) {
    return <>{children}</>;
  }

  // CRITICAL: Log and block unauthorized access attempts
  if (!can(module, action)) {
    // Log denied access for security audit
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[PERMISSION_GATE] Access denied - Module: ${module}, Action: ${action}`);
    }
    
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showBlocked) {
      return <AccessDeniedMessage module={module} />;
    }

    // RULE: No element rendered without proper permission
    return null;
  }

  return <>{children}</>;
}

/**
 * Component shown when access is denied
 */
function AccessDeniedMessage({ module }: { module: AppModule }) {
  const moduleLabels: Record<AppModule, string> = {
    dashboard: "Dashboard",
    agenda: "Agenda",
    
    pacientes: "Pacientes",
    prontuario: "Prontuário",
    comunicacao: "Comunicação",
    financeiro: "Financeiro",
    meu_financeiro: "Meu Financeiro",
    convenios: "Convênios",
    estoque: "Estoque",
    relatorios: "Relatórios",
    configuracoes: "Configurações",
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <ShieldX className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Acesso Restrito
      </h2>
      <p className="text-muted-foreground max-w-md">
        Você não tem permissão para acessar o módulo <strong>{moduleLabels[module]}</strong>.
        Entre em contato com o administrador da clínica.
      </p>
    </div>
  );
}

/**
 * Higher-order component version for wrapping entire pages
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  module: AppModule,
  action: AppAction = "view"
) {
  return function WithPermissionComponent(props: P) {
    return (
      <PermissionGate module={module} action={action} showBlocked>
        <WrappedComponent {...props} />
      </PermissionGate>
    );
  };
}
