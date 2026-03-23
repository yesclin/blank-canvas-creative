import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "./useClinicData";
import type { ClinicalScale, PatientScaleReading, ScaleOption, ScaleType } from "@/types/clinical-modules";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

// Helper to parse scale from DB
function parseScale(data: {
  id: string;
  clinic_id: string | null;
  name: string;
  description: string | null;
  scale_type: string;
  min_value: number | null;
  max_value: number | null;
  unit: string | null;
  options: Json | null;
  interpretation_guide: Json | null;
  is_system: boolean;
  is_active: boolean;
}): ClinicalScale {
  return {
    id: data.id,
    clinic_id: data.clinic_id,
    name: data.name,
    description: data.description,
    scale_type: data.scale_type as ScaleType,
    min_value: data.min_value,
    max_value: data.max_value,
    unit: data.unit,
    options: data.options as unknown as ScaleOption[] | null,
    interpretation_guide: data.interpretation_guide as ClinicalScale['interpretation_guide'],
    is_system: data.is_system,
    is_active: data.is_active,
  };
}

/**
 * Fetch all available clinical scales (system + clinic-specific)
 */
export function useClinicalScales() {
  const { clinic } = useClinicData();
  
  return useQuery({
    queryKey: ["clinical-scales", clinic?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_scales")
        .select("*")
        .or(`is_system.eq.true,clinic_id.eq.${clinic?.id}`)
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      
      return (data || []).map(parseScale);
    },
    enabled: !!clinic?.id,
  });
}

/**
 * Fetch scales for a specific specialty
 */
export function useScalesForSpecialty(specialtyId: string | null) {
  const { clinic } = useClinicData();
  
  return useQuery({
    queryKey: ["specialty-scales", clinic?.id, specialtyId],
    queryFn: async () => {
      if (!specialtyId) return [];
      
      // Get scale IDs associated with this specialty
      const { data: associations, error: assocError } = await supabase
        .from("scale_specialties")
        .select("scale_id")
        .eq("specialty_id", specialtyId);
      
      if (assocError) throw assocError;
      
      const scaleIds = associations?.map(a => a.scale_id) || [];
      
      if (scaleIds.length === 0) {
        // Return system scales as fallback
        const { data, error } = await supabase
          .from("clinical_scales")
          .select("*")
          .eq("is_system", true)
          .eq("is_active", true)
          .order("name");
        
        if (error) throw error;
        return (data || []).map(parseScale);
      }
      
      const { data, error } = await supabase
        .from("clinical_scales")
        .select("*")
        .in("id", scaleIds)
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return (data || []).map(parseScale);
    },
    enabled: !!clinic?.id && !!specialtyId,
  });
}

/**
 * Fetch scale readings for a patient
 */
export function usePatientScaleReadings(patientId: string | null, scaleId?: string) {
  const { clinic } = useClinicData();
  
  return useQuery({
    queryKey: ["patient-scale-readings", clinic?.id, patientId, scaleId],
    queryFn: async () => {
      if (!patientId) return [];
      
      let query = supabase
        .from("patient_scale_readings")
        .select(`
          *,
          scale:clinical_scales(*)
        `)
        .eq("patient_id", patientId)
        .order("recorded_at", { ascending: false });
      
      if (scaleId) {
        query = query.eq("scale_id", scaleId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(reading => ({
        id: reading.id,
        clinic_id: reading.clinic_id,
        patient_id: reading.patient_id,
        scale_id: reading.scale_id,
        appointment_id: reading.appointment_id,
        evolution_id: reading.evolution_id,
        value: reading.value,
        notes: reading.notes,
        recorded_by: reading.recorded_by,
        recorded_at: reading.recorded_at,
        scale: reading.scale ? parseScale(reading.scale) : undefined,
      })) as PatientScaleReading[];
    },
    enabled: !!clinic?.id && !!patientId,
  });
}

/**
 * Create a new scale reading
 */
export function useCreateScaleReading() {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: {
      patient_id: string;
      scale_id: string;
      value: number;
      appointment_id?: string;
      evolution_id?: string;
      notes?: string;
    }) => {
      if (!clinic?.id) throw new Error("Clínica não encontrada");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from("patient_scale_readings")
        .insert({
          clinic_id: clinic.id,
          patient_id: input.patient_id,
          scale_id: input.scale_id,
          value: input.value,
          appointment_id: input.appointment_id,
          evolution_id: input.evolution_id,
          notes: input.notes,
          recorded_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["patient-scale-readings", clinic?.id, variables.patient_id] 
      });
      toast.success("Leitura registrada com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error creating scale reading:", error);
      toast.error("Erro ao registrar leitura");
    },
  });
}

/**
 * Create a custom clinical scale
 */
export function useCreateClinicalScale() {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string | null;
      scale_type?: ScaleType;
      min_value?: number | null;
      max_value?: number | null;
      unit?: string | null;
      options?: ScaleOption[] | null;
      interpretation_guide?: ClinicalScale['interpretation_guide'];
    }) => {
      if (!clinic?.id) throw new Error("Clínica não encontrada");
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("clinical_scales")
        .insert({
          clinic_id: clinic.id,
          name: input.name,
          description: input.description ?? null,
          scale_type: input.scale_type ?? 'numeric',
          min_value: input.min_value ?? null,
          max_value: input.max_value ?? null,
          unit: input.unit ?? null,
          options: (input.options ?? null) as unknown as Json,
          interpretation_guide: input.interpretation_guide as Json ?? null,
          is_system: false,
          is_active: true,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return parseScale(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-scales", clinic?.id] });
      toast.success("Escala criada com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error creating scale:", error);
      toast.error("Erro ao criar escala");
    },
  });
}

/**
 * Get interpretation for a scale value
 */
export function getScaleInterpretation(scale: ClinicalScale, value: number): string | null {
  if (!scale.interpretation_guide?.ranges) return null;
  
  const range = scale.interpretation_guide.ranges.find(
    r => value >= r.min && value <= r.max
  );
  
  return range?.label || null;
}
