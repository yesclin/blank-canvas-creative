import { useMemo } from "react";
import { useActiveSpecialty } from "./useActiveSpecialty";
import { useSpecialtyModules } from "@/hooks/useClinicalModules";
import type { ClinicalModuleKey, ModuleWithStatus } from "@/types/clinical-modules";

/**
 * Hook that provides the enabled clinical modules for the currently active specialty
 * in the medical record context.
 * 
 * This is the main integration point between:
 * - Active specialty (from appointment or manual selection)
 * - Clinical modules configuration
 */
export function useActiveMedicalRecordModules(patientId: string | null | undefined) {
  const { 
    activeSpecialtyId, 
    activeSpecialty,
    activeSpecialtyKey,
    isFromAppointment,
    loading: specialtyLoading,
    activeAppointment,
  } = useActiveSpecialty(patientId);
  
  const { 
    data: allModules = [], 
    isLoading: modulesLoading 
  } = useSpecialtyModules(activeSpecialtyId);
  
  // Get only enabled modules
  const enabledModules = useMemo(() => {
    return allModules.filter(m => m.is_enabled);
  }, [allModules]);
  
  // Create a quick lookup for module status
  const moduleStatus = useMemo(() => {
    const map = new Map<ClinicalModuleKey, boolean>();
    allModules.forEach(m => {
      map.set(m.key, m.is_enabled);
    });
    return map;
  }, [allModules]);
  
  // Helper to check if a specific module is enabled
  const isModuleEnabled = (moduleKey: ClinicalModuleKey): boolean => {
    return moduleStatus.get(moduleKey) ?? false;
  };
  
  // Get modules by category
  const modulesByCategory = useMemo(() => {
    return enabledModules.reduce((acc, module) => {
      if (!acc[module.category]) {
        acc[module.category] = [];
      }
      acc[module.category].push(module);
      return acc;
    }, {} as Record<string, ModuleWithStatus[]>);
  }, [enabledModules]);

  return {
    // Specialty info
    activeSpecialtyId,
    activeSpecialty,
    activeSpecialtyKey,
    isFromAppointment,
    activeAppointment,
    
    // Module info
    allModules,
    enabledModules,
    modulesByCategory,
    isModuleEnabled,
    
    // Loading state
    loading: specialtyLoading || modulesLoading,
    
    // Quick checks for common modules
    hasOdontogram: isModuleEnabled('odontogram'),
    hasScales: isModuleEnabled('clinical_scales'),
    hasBeforeAfter: isModuleEnabled('before_after'),
    hasBodyMeasurements: isModuleEnabled('body_measurements'),
    hasRecurringSessions: isModuleEnabled('recurring_sessions'),
    hasTherapeuticPlan: isModuleEnabled('therapeutic_plan'),
    hasAdvancedUploads: isModuleEnabled('advanced_uploads'),
    hasInteractiveMap: isModuleEnabled('interactive_map'),
    hasConsentTerms: isModuleEnabled('consent_terms'),
    hasProcedures: isModuleEnabled('procedures_module'),
  };
}

/**
 * Simplified hook that just checks if a module is available for a patient's current context
 */
export function useIsModuleAvailable(
  patientId: string | null | undefined, 
  moduleKey: ClinicalModuleKey
): boolean {
  const { isModuleEnabled, loading } = useActiveMedicalRecordModules(patientId);
  
  if (loading) return false;
  return isModuleEnabled(moduleKey);
}
