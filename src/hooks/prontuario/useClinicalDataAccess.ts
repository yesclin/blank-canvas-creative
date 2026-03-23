import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { useQuery } from '@tanstack/react-query';

export type ClinicalAccessAction = 
  | 'VIEW_RECORD'
  | 'EDIT_RECORD'
  | 'VIEW_EVOLUTION'
  | 'CREATE_EVOLUTION'
  | 'EDIT_EVOLUTION'
  | 'VIEW_ALERT'
  | 'CREATE_ALERT'
  | 'VIEW_MEDIA'
  | 'UPLOAD_MEDIA'
  | 'PRINT_RECORD'
  | 'EXPORT_DATA';

interface ClinicalDataAccessResult {
  /** Whether the current user can access this patient's clinical data */
  canAccess: boolean;
  /** Whether the check is still loading */
  isLoading: boolean;
  /** The reason access is denied (if denied) */
  denyReason: string | null;
  /** Log access to this patient's clinical data */
  logAccess: (action: ClinicalAccessAction, resource?: string) => Promise<void>;
}

/**
 * Hook to check if the current user can access a specific patient's clinical data.
 * 
 * Access rules:
 * - Owner/Admin: Full access to all patients
 * - Receptionist: NO access to clinical data
 * - Professional: Access ONLY to patients they have attended
 */
export function useClinicalDataAccess(patientId: string | null | undefined): ClinicalDataAccessResult {
  const { 
    isOwner, 
    isAdmin, 
    isRecepcionista, 
    canAccessClinicalContent,
    professionalId,
    isLoading: permissionsLoading 
  } = usePermissions();

  // Check if professional has attended this patient
  const { data: hasAttended, isLoading: checkingAttendance } = useQuery({
    queryKey: ['has-attended-patient', professionalId, patientId],
    queryFn: async () => {
      if (!professionalId || !patientId) return false;
      
      const { data, error } = await supabase
        .rpc('has_attended_patient', {
          _professional_id: professionalId,
          _patient_id: patientId,
        });
      
      if (error) {
        console.error('Error checking patient attendance:', error);
        return false;
      }
      
      return data === true;
    },
    enabled: !!professionalId && !!patientId && !isOwner && !isAdmin && !isRecepcionista,
  });

  const accessResult = useMemo(() => {
    // Still loading
    if (permissionsLoading || (professionalId && checkingAttendance)) {
      return { canAccess: false, denyReason: null, isLoading: true };
    }

    // No patient selected
    if (!patientId) {
      return { canAccess: false, denyReason: 'Nenhum paciente selecionado', isLoading: false };
    }

    // Receptionists cannot access clinical data
    if (isRecepcionista || !canAccessClinicalContent) {
      return { 
        canAccess: false, 
        denyReason: 'Recepcionistas não têm acesso a dados clínicos', 
        isLoading: false 
      };
    }

    // Owner and Admin have full access
    if (isOwner || isAdmin) {
      return { canAccess: true, denyReason: null, isLoading: false };
    }

    // Professionals can only access patients they have attended
    if (professionalId) {
      if (hasAttended) {
        return { canAccess: true, denyReason: null, isLoading: false };
      } else {
        return { 
          canAccess: false, 
          denyReason: 'Você só pode acessar dados de pacientes que já atendeu', 
          isLoading: false 
        };
      }
    }

    // Default: deny
    return { 
      canAccess: false, 
      denyReason: 'Usuário não autorizado', 
      isLoading: false 
    };
  }, [
    permissionsLoading, 
    checkingAttendance, 
    patientId, 
    isRecepcionista, 
    canAccessClinicalContent, 
    isOwner, 
    isAdmin, 
    professionalId, 
    hasAttended
  ]);

  // Function to log access
  const logAccess = useCallback(async (action: ClinicalAccessAction, resource?: string) => {
    if (!patientId) return;
    
    try {
      await supabase.rpc('log_clinical_access', {
        _patient_id: patientId,
        _action: action,
        _resource: resource || null,
      });
    } catch (err) {
      // Logging should not disrupt user experience
      console.error('Error logging clinical access:', err);
    }
  }, [patientId]);

  return {
    ...accessResult,
    logAccess,
  };
}

/**
 * Hook to log medical record view access when component mounts
 */
export function useLogMedicalRecordView(patientId: string | null | undefined) {
  const { logAccess, canAccess } = useClinicalDataAccess(patientId);

  // Log view when patient changes and access is allowed
  useQuery({
    queryKey: ['log-record-view', patientId],
    queryFn: async () => {
      if (patientId && canAccess) {
        await logAccess('VIEW_RECORD', `patient:${patientId}`);
      }
      return true;
    },
    enabled: !!patientId && canAccess,
    staleTime: 60000, // Only log once per minute per patient
  });
}
