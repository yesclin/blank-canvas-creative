import { ReactNode } from "react";
import { useClinicalDataAccess, useLogMedicalRecordView } from "@/hooks/prontuario/useClinicalDataAccess";
import { ShieldX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ClinicalDataGuardProps {
  patientId: string | null | undefined;
  children: ReactNode;
  fallback?: ReactNode;
  showLoading?: boolean;
  logView?: boolean;
}

/**
 * Guard component that blocks access to a specific patient's clinical data
 * based on the current user's permissions and relationship with the patient.
 * 
 * Rules:
 * - Owner/Admin: Full access
 * - Receptionist: NO access (blocked)
 * - Professional: Access ONLY to patients they have attended
 */
export function ClinicalDataGuard({ 
  patientId, 
  children, 
  fallback, 
  showLoading = true,
  logView = true 
}: ClinicalDataGuardProps) {
  const { canAccess, isLoading, denyReason } = useClinicalDataAccess(patientId);
  
  // Log view when access is granted
  if (logView) {
    useLogMedicalRecordView(patientId);
  }

  if (isLoading && showLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!canAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return <ClinicalDataAccessDenied reason={denyReason} />;
  }

  return <>{children}</>;
}

interface ClinicalDataAccessDeniedProps {
  reason: string | null;
}

function ClinicalDataAccessDenied({ reason }: ClinicalDataAccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <ShieldX className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">
        Acesso Negado
      </h2>
      <p className="text-muted-foreground max-w-md mb-4">
        {reason || "Você não tem permissão para acessar os dados clínicos deste paciente."}
      </p>
      <p className="text-sm text-muted-foreground">
        Profissionais só podem acessar dados de pacientes que já atenderam.
        Administradores têm acesso completo.
      </p>
    </div>
  );
}

/**
 * Inline component to conditionally show/hide clinical content
 * without showing a full blocked message
 */
export function ClinicalDataConditional({ 
  patientId, 
  children 
}: { 
  patientId: string | null | undefined; 
  children: ReactNode;
}) {
  const { canAccess, isLoading } = useClinicalDataAccess(patientId);
  
  if (isLoading || !canAccess) {
    return null;
  }
  
  return <>{children}</>;
}

/**
 * HOC to wrap clinical components with data access guard
 */
export function withClinicalDataGuard<P extends { patientId?: string | null }>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithClinicalDataGuardComponent(props: P) {
    return (
      <ClinicalDataGuard patientId={props.patientId}>
        <WrappedComponent {...props} />
      </ClinicalDataGuard>
    );
  };
}
