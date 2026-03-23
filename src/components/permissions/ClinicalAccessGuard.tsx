import { ReactNode } from "react";
import { useProntuarioAccess } from "@/hooks/useRoleBasedData";
import { ShieldX } from "lucide-react";

interface ClinicalAccessGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Guard component that blocks access to clinical content for non-clinical users
 * (e.g., receptionists who shouldn't see medical record details)
 */
export function ClinicalAccessGuard({ children, fallback }: ClinicalAccessGuardProps) {
  const { canAccess, isRestricted } = useProntuarioAccess();

  if (isRestricted || !canAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return <ClinicalAccessDenied />;
  }

  return <>{children}</>;
}

function ClinicalAccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <ShieldX className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Acesso Restrito
      </h1>
      <p className="text-muted-foreground max-w-md mb-6">
        Você não tem permissão para acessar o conteúdo clínico do prontuário.
        Esta área é restrita a profissionais de saúde autorizados.
      </p>
      <p className="text-sm text-muted-foreground">
        Se você precisa visualizar dados do paciente, utilize a área de Cadastro de Pacientes.
      </p>
    </div>
  );
}

/**
 * HOC to wrap clinical content with access guard
 */
export function withClinicalAccessGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithClinicalAccessGuardComponent(props: P) {
    return (
      <ClinicalAccessGuard>
        <WrappedComponent {...props} />
      </ClinicalAccessGuard>
    );
  };
}
