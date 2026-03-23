import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from './useClinicData';
import { useQuery } from '@tanstack/react-query';

export interface SpecialtyValidationResult {
  isValid: boolean;
  errorCode: string | null;
  errorMessage: string | null;
}

/**
 * Hook to validate specialty alignment between clinic, professional, and procedure.
 * 
 * Rules:
 * 1. Specialty must be enabled (is_active = true) for the clinic
 * 2. Professional must have the specialty in professional_specialties
 * 3. Both conditions must be met for the alignment to be valid
 */
export function useSpecialtyValidation() {
  const { clinic } = useClinicData();

  /**
   * Validates if a specialty is aligned for a professional in this clinic
   */
  const validateAlignment = useCallback(async (
    professionalId: string,
    specialtyId: string
  ): Promise<SpecialtyValidationResult> => {
    if (!clinic?.id) {
      return {
        isValid: false,
        errorCode: 'NO_CLINIC',
        errorMessage: 'Clínica não encontrada',
      };
    }

    try {
      const { data, error } = await supabase.rpc('validate_specialty_alignment', {
        _professional_id: professionalId,
        _specialty_id: specialtyId,
        _clinic_id: clinic.id,
      });

      if (error) throw error;

      const result = data?.[0];
      return {
        isValid: result?.is_valid ?? false,
        errorCode: result?.error_code ?? null,
        errorMessage: result?.error_message ?? null,
      };
    } catch (err) {
      console.error('Error validating specialty alignment:', err);
      return {
        isValid: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: 'Erro ao validar especialidade',
      };
    }
  }, [clinic?.id]);

  /**
   * Validates if a specialty is enabled for this clinic
   */
  const validateClinicSpecialty = useCallback(async (specialtyId: string): Promise<boolean> => {
    if (!clinic?.id) return false;

    try {
      const { data, error } = await supabase.rpc('validate_clinic_specialty', {
        _specialty_id: specialtyId,
        _clinic_id: clinic.id,
      });

      if (error) throw error;
      return data === true;
    } catch (err) {
      console.error('Error validating clinic specialty:', err);
      return false;
    }
  }, [clinic?.id]);

  /**
   * Validates if a professional has a specific specialty
   */
  const validateProfessionalSpecialty = useCallback(async (
    professionalId: string,
    specialtyId: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('validate_professional_specialty', {
        _professional_id: professionalId,
        _specialty_id: specialtyId,
      });

      if (error) throw error;
      return data === true;
    } catch (err) {
      console.error('Error validating professional specialty:', err);
      return false;
    }
  }, []);

  return {
    validateAlignment,
    validateClinicSpecialty,
    validateProfessionalSpecialty,
  };
}

/**
 * Hook to get a professional's valid specialties (intersection of their specialties and clinic's enabled specialties)
 */
export function useProfessionalValidSpecialties(professionalId: string | null | undefined) {
  const { clinic } = useClinicData();

  return useQuery({
    queryKey: ['professional-valid-specialties', professionalId, clinic?.id],
    queryFn: async () => {
      if (!professionalId || !clinic?.id) return [];

      // Get professional's specialties
      const { data: profSpecialties, error: profError } = await supabase
        .from('professional_specialties')
        .select('specialty_id')
        .eq('professional_id', professionalId);

      if (profError) throw profError;

      const profSpecialtyIds = profSpecialties?.map(ps => ps.specialty_id) || [];
      if (profSpecialtyIds.length === 0) return [];

      // Get clinic's enabled specialties that the professional has
      const { data: validSpecialties, error: specError } = await supabase
        .from('specialties')
        .select('id, name, description, color, area')
        .in('id', profSpecialtyIds)
        .eq('is_active', true)
        .or(`clinic_id.is.null,clinic_id.eq.${clinic.id}`)
        .order('name');

      if (specError) throw specError;

      return validSpecialties || [];
    },
    enabled: !!professionalId && !!clinic?.id,
  });
}

/**
 * Hook to log button actions for audit
 */
export function useButtonActionLogger() {
  const logAction = useCallback(async (
    actionType: string,
    actionTarget: string,
    actionData?: Record<string, unknown>
  ) => {
    try {
      await supabase.rpc('log_button_action', {
        _action_type: actionType,
        _action_target: actionTarget,
        _action_data: actionData ? JSON.stringify(actionData) : null,
      });
    } catch (err) {
      // Logging should not disrupt user experience
      console.error('Error logging button action:', err);
    }
  }, []);

  return { logAction };
}
