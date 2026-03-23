import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "./useClinicData";
import { toast } from "sonner";

export interface ProfessionalSpecialty {
  id: string;
  professional_id: string;
  specialty_id: string;
  is_primary: boolean;
  created_at: string;
  specialty?: {
    id: string;
    name: string;
    area: string | null;
    is_active: boolean;
  };
}

/**
 * Fetch specialties for a specific professional.
 * Only returns specialties that are still ENABLED in the clinic.
 * This ensures professionals cannot use disabled specialties.
 */
export function useProfessionalSpecialties(professionalId: string | null) {
  return useQuery({
    queryKey: ["professional-specialties", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      
      const { data, error } = await supabase
        .from("professional_specialties")
        .select(`
          id,
          professional_id,
          specialty_id,
          is_primary,
          created_at,
          specialty:specialties(id, name, area, is_active)
        `)
        .eq("professional_id", professionalId)
        .order("is_primary", { ascending: false });
      
      if (error) throw error;
      
      // Filter to only include ENABLED specialties
      // This ensures that if a specialty is disabled, it won't be available
      return (data || [])
        .map(item => ({
          ...item,
          specialty: item.specialty as ProfessionalSpecialty['specialty'],
        }))
        .filter(item => item.specialty?.is_active !== false) as ProfessionalSpecialty[];
    },
    enabled: !!professionalId,
  });
}

/**
 * Fetch professionals by specialty
 */
export function useProfessionalsBySpecialty(specialtyId: string | null) {
  const { clinic } = useClinicData();
  
  return useQuery({
    queryKey: ["professionals-by-specialty", clinic?.id, specialtyId],
    queryFn: async () => {
      if (!clinic?.id || !specialtyId) return [];
      
      const { data, error } = await supabase
        .from("professional_specialties")
        .select(`
          professional:professionals(
            id,
            full_name,
            email,
            avatar_url,
            color,
            is_active
          )
        `)
        .eq("specialty_id", specialtyId);
      
      if (error) throw error;
      
      // Filter to active professionals from current clinic
      return (data || [])
        .map(item => item.professional)
        .filter(p => p && p.is_active);
    },
    enabled: !!clinic?.id && !!specialtyId,
  });
}

/**
 * Add specialty to professional.
 * Only allows adding ENABLED specialties.
 */
export function useAddProfessionalSpecialty() {
  const queryClient = useQueryClient();
  const { clinic } = useClinicData();
  
  return useMutation({
    mutationFn: async ({ 
      professionalId, 
      specialtyId, 
      isPrimary = false 
    }: { 
      professionalId: string; 
      specialtyId: string; 
      isPrimary?: boolean;
    }) => {
      // First verify the specialty is enabled
      const { data: specialty, error: checkError } = await supabase
        .from("specialties")
        .select("id, is_active")
        .eq("id", specialtyId)
        .eq("clinic_id", clinic?.id)
        .single();
      
      if (checkError || !specialty) {
        throw new Error("Especialidade não encontrada");
      }
      
      if (!specialty.is_active) {
        throw new Error("Esta especialidade não está habilitada na clínica");
      }
      
      const { data, error } = await supabase
        .from("professional_specialties")
        .insert({
          professional_id: professionalId,
          specialty_id: specialtyId,
          is_primary: isPrimary,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["professional-specialties", variables.professionalId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["professionals-by-specialty"] 
      });
      toast.success("Especialidade adicionada");
    },
    onError: (error: Error) => {
      console.error("Error adding specialty:", error);
      if (error.message.includes("duplicate")) {
        toast.error("Profissional já possui esta especialidade");
      } else if (error.message.includes("habilitada")) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao adicionar especialidade");
      }
    },
  });
}

/**
 * Remove specialty from professional
 */
export function useRemoveProfessionalSpecialty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      professionalId, 
      specialtyId 
    }: { 
      professionalId: string; 
      specialtyId: string;
    }) => {
      const { error } = await supabase
        .from("professional_specialties")
        .delete()
        .eq("professional_id", professionalId)
        .eq("specialty_id", specialtyId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["professional-specialties", variables.professionalId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["professionals-by-specialty"] 
      });
      toast.success("Especialidade removida");
    },
    onError: (error: Error) => {
      console.error("Error removing specialty:", error);
      toast.error("Erro ao remover especialidade");
    },
  });
}

/**
 * Set primary specialty for professional
 */
export function useSetPrimarySpecialty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      professionalId, 
      specialtyId 
    }: { 
      professionalId: string; 
      specialtyId: string;
    }) => {
      const { error } = await supabase
        .from("professional_specialties")
        .update({ is_primary: true })
        .eq("professional_id", professionalId)
        .eq("specialty_id", specialtyId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["professional-specialties", variables.professionalId] 
      });
      toast.success("Especialidade principal definida");
    },
    onError: (error: Error) => {
      console.error("Error setting primary specialty:", error);
      toast.error("Erro ao definir especialidade principal");
    },
  });
}

/**
 * Bulk update professional specialties
 */
export function useUpdateProfessionalSpecialties() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      professionalId, 
      specialtyIds,
      primarySpecialtyId,
    }: { 
      professionalId: string; 
      specialtyIds: string[];
      primarySpecialtyId?: string;
    }) => {
      // Delete existing
      const { error: deleteError } = await supabase
        .from("professional_specialties")
        .delete()
        .eq("professional_id", professionalId);
      
      if (deleteError) throw deleteError;
      
      // Insert new
      if (specialtyIds.length > 0) {
        const { error: insertError } = await supabase
          .from("professional_specialties")
          .insert(
            specialtyIds.map(specialtyId => ({
              professional_id: professionalId,
              specialty_id: specialtyId,
              is_primary: specialtyId === primarySpecialtyId,
            }))
          );
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["professional-specialties", variables.professionalId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["professionals-by-specialty"] 
      });
      toast.success("Especialidades atualizadas");
    },
    onError: (error: Error) => {
      console.error("Error updating specialties:", error);
      toast.error("Erro ao atualizar especialidades");
    },
  });
}

/**
 * Get primary specialty for a professional
 */
export function usePrimarySpecialty(professionalId: string | null) {
  const { data: specialties = [] } = useProfessionalSpecialties(professionalId);
  
  const primary = specialties.find(s => s.is_primary);
  return primary?.specialty || specialties[0]?.specialty || null;
}
