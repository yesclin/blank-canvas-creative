import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "./useClinicData";
import { toast } from "sonner";
import type { 
  Odontogram, 
  OdontogramTooth, 
  OdontogramRecord, 
  ToothStatus 
} from "@/types/odontogram";

/**
 * Get or create odontogram for a patient
 */
export function usePatientOdontogram(patientId: string | null) {
  const { clinic } = useClinicData();
  
  return useQuery({
    queryKey: ["odontogram", clinic?.id, patientId],
    queryFn: async () => {
      if (!clinic?.id || !patientId) return null;
      
      // Try to get existing odontogram
      const { data: existing, error: fetchError } = await supabase
        .from("odontograms")
        .select("*")
        .eq("clinic_id", clinic.id)
        .eq("patient_id", patientId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (existing) return existing as Odontogram;
      
      // Create new odontogram if none exists
      const { data: newOdontogram, error: createError } = await supabase
        .from("odontograms")
        .insert({
          clinic_id: clinic.id,
          patient_id: patientId,
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      return newOdontogram as Odontogram;
    },
    enabled: !!clinic?.id && !!patientId,
  });
}

/**
 * Get all teeth for an odontogram
 */
export function useOdontogramTeeth(odontogramId: string | null) {
  return useQuery({
    queryKey: ["odontogram-teeth", odontogramId],
    queryFn: async () => {
      if (!odontogramId) return [];
      
      const { data, error } = await supabase
        .from("odontogram_teeth")
        .select("*")
        .eq("odontogram_id", odontogramId);
      
      if (error) throw error;
      
      return (data || []) as OdontogramTooth[];
    },
    enabled: !!odontogramId,
  });
}

/**
 * Get history records for a specific tooth
 */
export function useToothHistory(toothId: string | null) {
  return useQuery({
    queryKey: ["tooth-history", toothId],
    queryFn: async () => {
      if (!toothId) return [];
      
      const { data, error } = await supabase
        .from("odontogram_records")
        .select(`
          *,
          procedure:procedures(name),
          professional:professionals(full_name)
        `)
        .eq("odontogram_tooth_id", toothId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      return (data || []) as OdontogramRecord[];
    },
    enabled: !!toothId,
  });
}

/**
 * Update tooth status and create history record
 */
export function useUpdateToothStatus() {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      odontogramId,
      toothCode,
      status,
      surface,
      notes,
      appointmentId,
      professionalId,
      procedureId,
    }: {
      odontogramId: string;
      toothCode: string;
      status: ToothStatus;
      surface?: string;
      notes?: string;
      appointmentId?: string;
      professionalId: string;
      procedureId?: string;
    }) => {
      if (!clinic?.id) throw new Error("Clínica não encontrada");
      
      // Get or create tooth record
      let toothId: string;
      
      const { data: existingTooth } = await supabase
        .from("odontogram_teeth")
        .select("id")
        .eq("odontogram_id", odontogramId)
        .eq("tooth_code", toothCode)
        .maybeSingle();
      
      if (existingTooth) {
        // Update existing tooth
        const { error: updateError } = await supabase
          .from("odontogram_teeth")
          .update({ 
            status, 
            notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingTooth.id);
        
        if (updateError) throw updateError;
        toothId = existingTooth.id;
      } else {
        // Create new tooth record
        const { data: newTooth, error: insertError } = await supabase
          .from("odontogram_teeth")
          .insert({
            odontogram_id: odontogramId,
            tooth_code: toothCode,
            status,
            notes,
          })
          .select("id")
          .single();
        
        if (insertError) throw insertError;
        toothId = newTooth.id;
      }
      
      // Create history record
      const { error: historyError } = await supabase
        .from("odontogram_records")
        .insert({
          clinic_id: clinic.id,
          odontogram_tooth_id: toothId,
          appointment_id: appointmentId || null,
          professional_id: professionalId,
          procedure_id: procedureId || null,
          status_applied: status,
          surface: surface || null,
          notes,
        });
      
      if (historyError) throw historyError;
      
      return { toothId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["odontogram-teeth", variables.odontogramId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["tooth-history"] 
      });
      toast.success("Dente atualizado");
    },
    onError: (error: Error) => {
      console.error("Error updating tooth:", error);
      toast.error("Erro ao atualizar dente");
    },
  });
}

/**
 * Get tooth by code from teeth array
 */
export function getToothByCode(teeth: OdontogramTooth[], code: string): OdontogramTooth | undefined {
  return teeth.find(t => t.tooth_code === code);
}
