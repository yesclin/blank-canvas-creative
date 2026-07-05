import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { useActiveSpecialty } from "./useActiveSpecialty";
import type { ClinicalModuleKey, ModuleWithStatus } from "@/types/clinical-modules";
import {
  doesResourceApplyToSpecialty,
  isProntuarioResourceActive,
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
  const { clinic } = useClinicData();
  const { 
    activeSpecialtyId, 
    activeSpecialty,
    activeSpecialtyKey,
    isFromAppointment,
    loading: specialtyLoading,
    activeAppointment,
    specialties,
  } = useActiveSpecialty(patientId);

  const {
    data: resources = [],
    isLoading: modulesLoading,
  } = useQuery({
    queryKey: ["clinic-prontuario-resources", clinic?.id],
    enabled: !!clinic?.id,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data, error } = await supabase
        .from("clinic_resources")
        .select("id, clinic_id, resource_key, resource_type, specialty_id, specialty_slug, enabled, effective_at, expires_at")
        .eq("clinic_id", clinic.id);

      if (error) {
        console.error("[useActiveMedicalRecordModules] erro ao buscar clinic_resources:", error);
        return [];
      }

      return (data ?? []) as ClinicProntuarioResource[];
    },
  });

  const clinicSpecialtyKeys = useMemo(() => {
    return new Set(
      specialties
        .map((specialty) => specialty.key)
        .filter(Boolean),
    );
  }, [specialties]);

  const applicableResources = useMemo(() => {
    return resources.filter((resource) =>
      doesResourceApplyToSpecialty(resource, activeSpecialtyId, activeSpecialtyKey, clinicSpecialtyKeys),
    );
  }, [resources, activeSpecialtyId, activeSpecialtyKey, clinicSpecialtyKeys]);

  const isResourceKeyEnabled = (resourceKeys: string[]): boolean => {
    const matching = applicableResources.filter((resource) => resourceKeys.includes(resource.resource_key));
    if (matching.length === 0) return false;
    const latest = [...matching].sort((a, b) => {
      const aTime = a.effective_at ? new Date(a.effective_at).getTime() : 0;
      const bTime = b.effective_at ? new Date(b.effective_at).getTime() : 0;
      return bTime - aTime;
    })[0];
    return isProntuarioResourceActive(latest);
  };

  const allModules = useMemo(() => {
    return (Object.keys(MODULE_TO_RESOURCE_KEYS) as ClinicalModuleKey[]).map((moduleKey, index) => ({
      id: moduleKey,
      key: moduleKey,
      name: MODULE_LABELS[moduleKey],
      description: null,
      category: MODULE_CATEGORIES[moduleKey],
      icon: null,
      display_order: index + 1,
      is_system: true,
      is_enabled: isResourceKeyEnabled(MODULE_TO_RESOURCE_KEYS[moduleKey]),
      source: "clinic_override" as const,
    }));
  }, [applicableResources]);
  
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
    clinicResources: resources,
    applicableResources,
    clinicSpecialtyKeys,
    
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
