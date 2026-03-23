import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "./useClinicData";
import type { 
  ClinicalModule, 
  ModuleWithStatus, 
  ClinicalModuleKey,
  ClinicalModuleCategory 
} from "@/types/clinical-modules";
import { DEFAULT_SPECIALTY_MODULES, CORE_MODULES } from "@/types/clinical-modules";
import { toast } from "sonner";

/**
 * Normalize specialty name to match DEFAULT_SPECIALTY_MODULES keys
 */
function normalizeSpecialtyKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .trim();
}

/**
 * Fetch all available clinical modules
 */
export function useClinicalModules() {
  return useQuery({
    queryKey: ["clinical-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_modules")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      
      return (data || []).map(m => ({
        ...m,
        key: m.key as ClinicalModuleKey,
        category: m.category as ClinicalModuleCategory,
      })) as ClinicalModule[];
    },
  });
}

/**
 * Fetch modules for a specific specialty with clinic overrides applied
 */
export function useSpecialtyModules(specialtyId: string | null) {
  const { clinic } = useClinicData();
  
  return useQuery({
    queryKey: ["specialty-modules", clinic?.id, specialtyId],
    queryFn: async () => {
      if (!clinic?.id || !specialtyId) return [];
      
      // Get all modules
      const { data: modules, error: modulesError } = await supabase
        .from("clinical_modules")
        .select("*")
        .order("display_order");
      
      if (modulesError) throw modulesError;
      
      // Get clinic-level overrides for this specialty
      const { data: overrides, error: overridesError } = await supabase
        .from("clinic_specialty_modules")
        .select("*")
        .eq("clinic_id", clinic.id)
        .eq("specialty_id", specialtyId);
      
      if (overridesError) throw overridesError;
      
      // Get specialty name to check defaults
      const { data: specialty } = await supabase
        .from("specialties")
        .select("name")
        .eq("id", specialtyId)
        .single();
      
      const specialtyKey = normalizeSpecialtyKey(specialty?.name || "");
      
      // Try exact match first, then normalized with underscores
      const defaultModuleKeys = 
        DEFAULT_SPECIALTY_MODULES[specialtyKey] || 
        DEFAULT_SPECIALTY_MODULES[specialtyKey.replace(/\s+/g, "_")] || 
        CORE_MODULES; // Fallback to core modules
      
      // Build override map
      const overrideMap = new Map(
        overrides?.map(o => [o.module_id, o.is_enabled]) || []
      );
      
      // Apply logic: clinic override > default mapping
      const result: ModuleWithStatus[] = (modules || []).map(module => {
        const hasOverride = overrideMap.has(module.id);
        const moduleKey = module.key as ClinicalModuleKey;
        const isEnabledByDefault = defaultModuleKeys.includes(moduleKey);
        
        return {
          id: module.id,
          key: moduleKey,
          name: module.name,
          description: module.description,
          category: module.category as ClinicalModuleCategory,
          icon: module.icon,
          display_order: module.display_order,
          is_system: module.is_system,
          is_enabled: hasOverride 
            ? overrideMap.get(module.id)! 
            : isEnabledByDefault,
          source: hasOverride ? 'clinic_override' : 'default',
        };
      });
      
      return result;
    },
    enabled: !!clinic?.id && !!specialtyId,
  });
}

/**
 * Get enabled modules for a specialty (convenience hook)
 */
export function useEnabledModulesForSpecialty(specialtyId: string | null) {
  const { data: modules = [] } = useSpecialtyModules(specialtyId);
  return modules.filter(m => m.is_enabled);
}

/**
 * Check if a specific module is enabled for a specialty
 */
export function useIsModuleEnabled(specialtyId: string | null, moduleKey: ClinicalModuleKey) {
  const { data: modules = [] } = useSpecialtyModules(specialtyId);
  const module = modules.find(m => m.key === moduleKey);
  return module?.is_enabled ?? false;
}

/**
 * Toggle module for a specialty at clinic level
 */
export function useToggleSpecialtyModule() {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      specialtyId, 
      moduleId, 
      isEnabled 
    }: { 
      specialtyId: string; 
      moduleId: string; 
      isEnabled: boolean;
    }) => {
      if (!clinic?.id) throw new Error("Clínica não encontrada");
      
      // Upsert the override
      const { error } = await supabase
        .from("clinic_specialty_modules")
        .upsert({
          clinic_id: clinic.id,
          specialty_id: specialtyId,
          module_id: moduleId,
          is_enabled: isEnabled,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'clinic_id,specialty_id,module_id',
        });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["specialty-modules", clinic?.id, variables.specialtyId] 
      });
      toast.success("Módulo atualizado com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error toggling module:", error);
      toast.error("Erro ao atualizar módulo");
    },
  });
}

/**
 * Reset specialty modules to defaults (remove all clinic overrides)
 */
export function useResetSpecialtyModules() {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (specialtyId: string) => {
      if (!clinic?.id) throw new Error("Clínica não encontrada");
      
      const { error } = await supabase
        .from("clinic_specialty_modules")
        .delete()
        .eq("clinic_id", clinic.id)
        .eq("specialty_id", specialtyId);
      
      if (error) throw error;
    },
    onSuccess: (_, specialtyId) => {
      queryClient.invalidateQueries({ 
        queryKey: ["specialty-modules", clinic?.id, specialtyId] 
      });
      toast.success("Módulos restaurados para os padrões");
    },
    onError: (error: Error) => {
      console.error("Error resetting modules:", error);
      toast.error("Erro ao restaurar módulos");
    },
  });
}

/**
 * Fetch modules grouped by category
 */
export function useModulesByCategory() {
  const { data: modules = [] } = useClinicalModules();
  
  const grouped = modules.reduce((acc, module) => {
    const category = module.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(module);
    return acc;
  }, {} as Record<ClinicalModuleCategory, ClinicalModule[]>);
  
  return grouped;
}
