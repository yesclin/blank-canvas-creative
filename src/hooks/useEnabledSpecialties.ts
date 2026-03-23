import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "./useClinicData";
import { toast } from "sonner";
import { OFFICIAL_SPECIALTY_NAMES, getSpecialtySlug } from "@/constants/officialSpecialties";

export type SpecialtyType = 'padrao' | 'personalizada';

export interface EnabledSpecialty {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  area: string | null;
  is_active: boolean;
  specialty_type: SpecialtyType;
  clinic_id: string | null;
}

/**
 * Hook to fetch ONLY enabled (active) specialties available to the current clinic.
 * This includes:
 * - Global standard specialties (specialty_type = 'padrao', clinic_id = null)
 * - Custom specialties created by this clinic (specialty_type = 'personalizada')
 * 
 * Rules enforced:
 * - Only specialties with is_active = true are returned
 * - Standard specialties are globally available
 * - Custom specialties only exist within their clinic
 */
export function useEnabledSpecialties() {
  const { clinic } = useClinicData();
  
  return useQuery({
    queryKey: ["enabled-specialties", clinic?.id],
    queryFn: async () => {
      // Fetch both global and clinic-specific specialties
      // ONLY fetch clinic-specific specialties — matches what Config > Clínica manages.
      // Global specialties (clinic_id IS NULL) are NOT included because
      // Config creates clinic-specific records when toggling a specialty on.
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name, description, color, area, is_active, specialty_type, clinic_id")
        .eq("is_active", true)
        .eq("clinic_id", clinic!.id)
        .order("area")
        .order("name");
      
      if (error) {
        console.error("Error fetching enabled specialties:", error);
        throw error;
      }
      
      // WHITELIST FILTER: Only return officially supported specialties, enrich with slug
      const filtered = (data as Array<Omit<EnabledSpecialty, 'slug'> & { name: string }>)
        .filter(s => OFFICIAL_SPECIALTY_NAMES.some(name => name.toLowerCase() === s.name.trim().toLowerCase()))
        .map(s => ({ ...s, slug: getSpecialtySlug(s.name) || s.name.toLowerCase().replace(/\s+/g, '-') }));
      return filtered as EnabledSpecialty[];
    },
    enabled: !!clinic?.id,
  });
}

/**
 * Hook to fetch standard (global) specialties only.
 * Used for the specialty catalog.
 */
export function useStandardSpecialties() {
  return useQuery({
    queryKey: ["standard-specialties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name, description, color, area, is_active, specialty_type, clinic_id")
        .is("clinic_id", null)
        .eq("specialty_type", "padrao")
        .eq("is_active", true)
        .order("area")
        .order("name");
      
      if (error) {
        console.error("Error fetching standard specialties:", error);
        throw error;
      }
      
      const filtered = (data as Array<Omit<EnabledSpecialty, 'slug'> & { name: string }>)
        .filter(s => OFFICIAL_SPECIALTY_NAMES.some(name => name.toLowerCase() === s.name.trim().toLowerCase()))
        .map(s => ({ ...s, slug: getSpecialtySlug(s.name) || s.name.toLowerCase().replace(/\s+/g, '-') }));
      return filtered as EnabledSpecialty[];
    },
  });
}

/**
 * Hook to fetch ALL specialties (including inactive) for management purposes.
 * Only admins/owners should use this for configuration screens.
 * Returns both standard and custom specialties.
 */
export function useAllSpecialties() {
  const { clinic } = useClinicData();
  
  return useQuery({
    queryKey: ["all-specialties", clinic?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name, description, color, area, is_active, specialty_type, clinic_id, created_at")
        .or(`clinic_id.is.null,clinic_id.eq.${clinic?.id}`)
        .order("specialty_type", { ascending: true }) // padrao first
        .order("area")
        .order("name");
      
      if (error) {
        console.error("Error fetching all specialties:", error);
        throw error;
      }
      
      return data;
    },
    enabled: !!clinic?.id,
  });
}

/**
 * Hook to fetch only custom (personalized) specialties for a clinic.
 */
export function useCustomSpecialties() {
  const { clinic } = useClinicData();
  
  return useQuery({
    queryKey: ["custom-specialties", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name, description, color, area, is_active, specialty_type, clinic_id, created_at")
        .eq("clinic_id", clinic.id)
        .eq("specialty_type", "personalizada")
        .order("name");
      
      if (error) {
        console.error("Error fetching custom specialties:", error);
        throw error;
      }
      
      return data;
    },
    enabled: !!clinic?.id,
  });
}

/**
 * Hook to enable/disable a specialty.
 * Only works for custom specialties (personalizadas).
 * Standard specialties cannot be modified.
 */
export function useToggleSpecialty() {
  const queryClient = useQueryClient();
  const { clinic } = useClinicData();
  
  return useMutation({
    mutationFn: async ({ specialtyId, isActive }: { specialtyId: string; isActive: boolean }) => {
      // First check if it's a custom specialty
      const { data: specialty, error: checkError } = await supabase
        .from("specialties")
        .select("specialty_type, clinic_id")
        .eq("id", specialtyId)
        .single();
      
      if (checkError || !specialty) {
        throw new Error("Especialidade não encontrada");
      }
      
      if (specialty.specialty_type === 'padrao') {
        throw new Error("Especialidades padrão não podem ser modificadas");
      }
      
      if (specialty.clinic_id !== clinic?.id) {
        throw new Error("Você não tem permissão para modificar esta especialidade");
      }
      
      const { error } = await supabase
        .from("specialties")
        .update({ is_active: isActive })
        .eq("id", specialtyId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["enabled-specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["all-specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties-management", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["custom-specialties", clinic?.id] });
      
      toast.success(
        variables.isActive 
          ? "Especialidade habilitada com sucesso" 
          : "Especialidade desabilitada com sucesso"
      );
    },
    onError: (error: Error) => {
      console.error("Error toggling specialty:", error);
      toast.error(error.message || "Erro ao alterar status da especialidade");
    },
  });
}

/**
 * Hook to create a new CUSTOM specialty.
 * Only owner/admin should have access to this.
 * Standard specialties are seeded at the database level.
 */
export function useCreateSpecialty() {
  const queryClient = useQueryClient();
  const { clinic } = useClinicData();
  
  return useMutation({
    mutationFn: async (data: {
      name: string;
      area?: string;
      description?: string;
      color?: string;
      is_active?: boolean;
    }) => {
      if (!clinic?.id) throw new Error("Clínica não encontrada");
      
      const { data: specialty, error } = await supabase
        .from("specialties")
        .insert({
          clinic_id: clinic.id,
          name: data.name.trim(),
          area: data.area?.trim() || null,
          description: data.description?.trim() || null,
          color: data.color || null,
          is_active: data.is_active ?? true,
          specialty_type: 'personalizada', // Always custom when created by user
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error("Já existe uma especialidade com este nome");
        }
        throw error;
      }
      return specialty;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enabled-specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["all-specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties-management", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["custom-specialties", clinic?.id] });
      
      toast.success("Especialidade personalizada criada com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error creating specialty:", error);
      toast.error(error.message || "Erro ao criar especialidade");
    },
  });
}

/**
 * Hook to update a CUSTOM specialty.
 * Standard specialties cannot be modified.
 */
export function useUpdateSpecialty() {
  const queryClient = useQueryClient();
  const { clinic } = useClinicData();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: {
        name?: string;
        area?: string;
        description?: string;
        color?: string;
        is_active?: boolean;
      };
    }) => {
      // First check if it's a custom specialty
      const { data: specialty, error: checkError } = await supabase
        .from("specialties")
        .select("specialty_type, clinic_id")
        .eq("id", id)
        .single();
      
      if (checkError || !specialty) {
        throw new Error("Especialidade não encontrada");
      }
      
      if (specialty.specialty_type === 'padrao') {
        throw new Error("Especialidades padrão não podem ser editadas");
      }
      
      if (specialty.clinic_id !== clinic?.id) {
        throw new Error("Você não tem permissão para modificar esta especialidade");
      }
      
      const updateData: Record<string, unknown> = {};
      
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.area !== undefined) updateData.area = data.area.trim() || null;
      if (data.description !== undefined) updateData.description = data.description.trim() || null;
      if (data.color !== undefined) updateData.color = data.color || null;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      
      const { error } = await supabase
        .from("specialties")
        .update(updateData)
        .eq("id", id);
      
      if (error) {
        if (error.code === '23505') {
          throw new Error("Já existe uma especialidade com este nome");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enabled-specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["all-specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties-management", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["custom-specialties", clinic?.id] });
      
      toast.success("Especialidade atualizada com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error updating specialty:", error);
      toast.error(error.message || "Erro ao atualizar especialidade");
    },
  });
}

/**
 * Hook to validate if a specialty is enabled for use.
 * Returns false if specialty is not found or inactive.
 */
export function useValidateSpecialty() {
  const { data: enabledSpecialties = [] } = useEnabledSpecialties();
  
  return (specialtyId: string | null | undefined): boolean => {
    if (!specialtyId) return false;
    return enabledSpecialties.some(s => s.id === specialtyId);
  };
}

/**
 * Hook to get the list of enabled specialty IDs for validation.
 */
export function useEnabledSpecialtyIds() {
  const { data: enabledSpecialties = [] } = useEnabledSpecialties();
  return enabledSpecialties.map(s => s.id);
}

/**
 * Hook to validate specialty alignment for appointments.
 * Ensures that when creating an appointment:
 * 1. The specialty is enabled in the clinic
 * 2. The professional has the specialty
 * 
 * CRITICAL RULE: "Clinic specialty always validates professional specialty"
 */
export function useSpecialtyAlignmentValidation() {
  const { clinic } = useClinicData();
  
  const validateAlignment = async (
    professionalId: string,
    specialtyId: string
  ): Promise<{ isValid: boolean; error?: string }> => {
    if (!clinic?.id) {
      return { isValid: false, error: 'Clínica não encontrada' };
    }
    
    try {
      const { data, error } = await supabase.rpc('validate_specialty_alignment', {
        _professional_id: professionalId,
        _specialty_id: specialtyId,
        _clinic_id: clinic.id,
      });
      
      if (error) throw error;
      
      const result = data?.[0];
      if (!result?.is_valid) {
        return { 
          isValid: false, 
          error: result?.error_message || 'Especialidade não autorizada' 
        };
      }
      
      return { isValid: true };
    } catch (err) {
      console.error('Error validating specialty alignment:', err);
      return { isValid: false, error: 'Erro ao validar especialidade' };
    }
  };
  
  return { validateAlignment };
}
