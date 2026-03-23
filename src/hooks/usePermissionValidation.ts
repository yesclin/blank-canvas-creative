import { useCallback, useEffect } from 'react';
import { usePermissions, AppModule, AppAction } from './usePermissions';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Hook to validate screen access permissions.
 * Use this at the top of page components to ensure proper permission validation.
 * 
 * Rule: "No screen without permission validation"
 */
export function useScreenPermissionValidation(module: AppModule, action: AppAction = 'view') {
  const { can, isLoading, isOwner, isAdmin } = usePermissions();
  const navigate = useNavigate();

  const hasAccess = isLoading ? null : (isOwner || isAdmin || can(module, action));

  useEffect(() => {
    // Only redirect after loading completes and access is denied
    if (!isLoading && hasAccess === false) {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/app', { replace: true });
    }
  }, [isLoading, hasAccess, navigate]);

  return {
    hasAccess,
    isLoading,
    isOwner,
    isAdmin,
  };
}

/**
 * Hook to validate action permissions before execution.
 * Returns a wrapper function that only executes if user has permission.
 * 
 * Rule: "No button without functional action" (button only works if allowed)
 */
export function useActionPermissionValidation(module: AppModule) {
  const { can, isOwner, isAdmin } = usePermissions();

  const validateAndExecute = useCallback(<T extends (...args: any[]) => any>(
    action: AppAction,
    fn: T,
    onDenied?: () => void
  ): ((...args: Parameters<T>) => ReturnType<T> | void) => {
    return (...args: Parameters<T>) => {
      // Owner/Admin bypass
      if (isOwner || isAdmin) {
        return fn(...args);
      }

      if (!can(module, action)) {
        toast.error('Você não tem permissão para executar esta ação');
        onDenied?.();
        return;
      }

      return fn(...args);
    };
  }, [can, isOwner, isAdmin, module]);

  const canPerform = useCallback((action: AppAction): boolean => {
    return isOwner || isAdmin || can(module, action);
  }, [can, isOwner, isAdmin, module]);

  return {
    validateAndExecute,
    canPerform,
    canView: canPerform('view'),
    canCreate: canPerform('create'),
    canEdit: canPerform('edit'),
    canDelete: canPerform('delete'),
    canExport: canPerform('export'),
  };
}

/**
 * Hook to validate clinical data scope.
 * Ensures that clinical data access is within permitted scope.
 * 
 * Rule: "No clinical data outside permitted scope"
 */
export function useClinicalDataScopeValidation() {
  const { 
    isOwner, 
    isAdmin, 
    isRecepcionista, 
    canAccessClinicalContent,
    professionalId,
  } = usePermissions();

  /**
   * Validates if user can access clinical data for a specific patient
   */
  const canAccessPatientClinicalData = useCallback((
    patientAttendedByProfessionalId?: string
  ): { allowed: boolean; reason?: string } => {
    // Receptionists cannot access clinical data
    if (isRecepcionista || !canAccessClinicalContent) {
      return { 
        allowed: false, 
        reason: 'Recepcionistas não têm acesso a dados clínicos' 
      };
    }

    // Owner/Admin have full access
    if (isOwner || isAdmin) {
      return { allowed: true };
    }

    // Professionals can only access their own patients
    if (professionalId) {
      if (patientAttendedByProfessionalId === professionalId) {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        reason: 'Você só pode acessar dados de pacientes que atendeu' 
      };
    }

    return { 
      allowed: false, 
      reason: 'Usuário não autorizado' 
    };
  }, [isOwner, isAdmin, isRecepcionista, canAccessClinicalContent, professionalId]);

  /**
   * Validates if user can perform clinical actions
   */
  const canPerformClinicalAction = useCallback((): { allowed: boolean; reason?: string } => {
    if (isRecepcionista) {
      return { 
        allowed: false, 
        reason: 'Recepcionistas não podem realizar ações clínicas' 
      };
    }

    if (!canAccessClinicalContent) {
      return { 
        allowed: false, 
        reason: 'Usuário não tem permissão para ações clínicas' 
      };
    }

    return { allowed: true };
  }, [isRecepcionista, canAccessClinicalContent]);

  return {
    canAccessPatientClinicalData,
    canPerformClinicalAction,
    isReceptionist: isRecepcionista,
    hasClinicalAccess: canAccessClinicalContent,
  };
}
