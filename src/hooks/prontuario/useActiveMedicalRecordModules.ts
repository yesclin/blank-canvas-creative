import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSpecialty } from "./useActiveSpecialty";
import type { ClinicalModuleKey, ModuleWithStatus } from "@/types/clinical-modules";
import type { SpecialtyKey } from "./useActiveSpecialty";
import {
  PRONTUARIO_FEATURE_TAB_ALIASES,
  doesResourceApplyToSpecialty,
  getProntuarioResourceTab,
  isProntuarioResourceActive,
  normalizeProntuarioSpecialtySlug,
  type ClinicProntuarioResource,
} from "./prontuarioFeatureTabs";

const MODULE_TO_RESOURCE_KEYS: Record<ClinicalModuleKey, string[]> = {
  recurring_sessions: ["medical_records.treatment_sessions", "treatment_sessions", "recurring_sessions"],
  clinical_scales: ["psicologia.escalas", "psychological_scales", "clinical_scales"],
  procedures_module: ["procedures", "procedures_module", "procedimentos"],
  advanced_uploads: ["global.anexos", "clinical_attachments", "attachments"],
  interactive_map: ["estetica.facial_map", "facial_map", "interactive_map"],
  odontogram: ["odontologia.odontogram", "odontogram", "odontograma"],
  body_measurements: ["body_measurements", "pediatria.grafico_oms", "growth_charts"],
  before_after: ["estetica.before_after", "before_after", "before_after_photos"],
  consent_terms: ["global.consentimentos", "clinical_consent_terms", "consent_terms"],
  therapeutic_plan: ["psicologia.plano_terapeutico", "therapeutic_plan", "plano_terapeutico"],
};

const MODULE_LABELS: Record<ClinicalModuleKey, string> = {
  recurring_sessions: "Sessões de Tratamento / Pacotes",
  clinical_scales: "Escalas Psicológicas",
  procedures_module: "Procedimentos",
  advanced_uploads: "Anexos / Exames",
  interactive_map: "Mapa Facial",
  odontogram: "Odontograma",
  body_measurements: "Medidas / Gráficos",
  before_after: "Antes e Depois",
  consent_terms: "Consentimentos",
  therapeutic_plan: "Plano Terapêutico",
};

const MODULE_CATEGORIES: Record<ClinicalModuleKey, ModuleWithStatus["category"]> = {
  recurring_sessions: "planning",
  clinical_scales: "assessment",
  procedures_module: "clinical_record",
  advanced_uploads: "documentation",
  interactive_map: "visual",
  odontogram: "assessment",
  body_measurements: "assessment",
  before_after: "visual",
  consent_terms: "documentation",
  therapeutic_plan: "planning",
};

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
    specialties,
  } = useActiveSpecialty(patientId);

  const clinicId = activeSpecialty?.id ? activeSpecialty.id : null;

  const {
    data: resources = [],
    isLoading: modulesLoading,
  } = useQuery({
    queryKey: ["clinic-prontuario-resources", activeSpecialty?.id ? undefined : null],
    enabled: false,
    queryFn: async () => [] as ClinicProntuarioResource[],
  });

  const clinicSpecialtyKeys = useMemo(() => {
    return new Set(
      specialties
        .map((specialty) => specialty.key)
        .filter(Boolean),
    );
  }, [specialties]);

  const activeResourcesQuery = useQuery({
    queryKey: ["clinic-prontuario-resources", activeSpecialty?.id, activeSpecialtyId, activeSpecialtyKey],
    enabled: false,
    queryFn: async () => [] as ClinicProntuarioResource[],
  });
  
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
