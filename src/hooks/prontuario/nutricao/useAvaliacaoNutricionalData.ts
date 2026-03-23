/**
 * NUTRIÇÃO - Avaliação Nutricional
 * 
 * Hook para gerenciar dados de avaliação nutricional do paciente.
 * Inclui antropometria, bioimpedância, dobras cutâneas e medidas corporais.
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface AvaliacaoNutricional {
  id: string;
  patient_id: string;
  clinic_id: string;
  measurement_date: string;
  recorded_by: string;
  appointment_id: string | null;
  
  // Dados básicos
  weight_kg: number | null;
  height_cm: number | null;
  bmi: number | null;
  
  // Circunferências
  waist_cm: number | null;
  hip_cm: number | null;
  chest_cm: number | null;
  arm_left_cm: number | null;
  arm_right_cm: number | null;
  thigh_left_cm: number | null;
  thigh_right_cm: number | null;
  calf_left_cm: number | null;
  calf_right_cm: number | null;
  
  // Composição corporal
  body_fat_percent: number | null;
  muscle_mass_kg: number | null;
  
  // Medidas customizadas (dobras cutâneas, bioimpedância, etc.)
  custom_measurements: Record<string, unknown> | null;
  
  // Observações
  notes: string | null;
  
  created_at: string;
}

export interface AvaliacaoNutricionalFormData {
  measurement_date: string;
  weight_kg: number | null;
  height_cm: number | null;
  
  // Circunferências
  waist_cm: number | null;
  hip_cm: number | null;
  abdomen_cm?: number | null; // Circunferência abdominal
  chest_cm: number | null;
  arm_left_cm: number | null;
  arm_right_cm: number | null;
  thigh_left_cm: number | null;
  thigh_right_cm: number | null;
  calf_left_cm: number | null;
  calf_right_cm: number | null;
  
  // Composição corporal
  body_fat_percent: number | null;
  lean_mass_percent?: number | null; // % massa magra
  muscle_mass_kg: number | null;
  
  // Dobras cutâneas principais (em custom_measurements)
  dobra_tricipital_mm?: number | null;
  dobra_subescapular_mm?: number | null;
  dobra_suprailiaca_mm?: number | null;
  dobra_abdominal_mm?: number | null;
  
  // Dobras cutâneas adicionais (em custom_measurements)
  dobra_bicipital_mm?: number | null;
  dobra_coxa_mm?: number | null;
  dobra_peitoral_mm?: number | null;
  
  // Bioimpedância (em custom_measurements)
  agua_corporal_percent?: number | null;
  massa_ossea_kg?: number | null;
  taxa_metabolica_basal?: number | null;
  idade_metabolica?: number | null;
  gordura_visceral?: number | null;
  
  notes: string | null;
}

/**
 * Calcula o IMC a partir do peso e altura
 */
function calculateBMI(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

/**
 * Calcula a relação cintura-quadril (RCQ)
 */
export function calculateWaistHipRatio(waistCm: number | null, hipCm: number | null): number | null {
  if (!waistCm || !hipCm || hipCm <= 0) return null;
  return Number((waistCm / hipCm).toFixed(2));
}

/**
 * Hook para gerenciar avaliações nutricionais do paciente
 */
export function useAvaliacaoNutricionalData(patientId: string | null, professionalId?: string) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  
  // Buscar todas as avaliações do paciente
  const {
    data: avaliacoes,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['nutricao-avaliacoes', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];
      
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('measurement_date', { ascending: false });
      
      if (error) throw error;
      return data as AvaliacaoNutricional[];
    },
    enabled: !!patientId && !!clinic?.id,
  });
  
  // Última avaliação
  const currentAvaliacao = avaliacoes?.[0] || null;
  
  // Salvar nova avaliação
  const saveAvaliacao = useCallback(async (formData: AvaliacaoNutricionalFormData) => {
    if (!patientId || !clinic?.id || !professionalId) {
      toast.error('Dados incompletos para salvar avaliação');
      return null;
    }
    
    setSaving(true);
    
    try {
      // Extrair dados de dobras cutâneas e bioimpedância para custom_measurements
      const customMeasurements: Record<string, unknown> = {};
      
      // Circunferência abdominal (custom)
      if (formData.abdomen_cm !== undefined && formData.abdomen_cm !== null) {
        customMeasurements.abdomen_cm = formData.abdomen_cm;
      }
      
      // Massa magra % (custom)
      if (formData.lean_mass_percent !== undefined && formData.lean_mass_percent !== null) {
        customMeasurements.lean_mass_percent = formData.lean_mass_percent;
      }
      
      // Dobras cutâneas principais
      if (formData.dobra_tricipital_mm !== undefined && formData.dobra_tricipital_mm !== null) {
        customMeasurements.dobra_tricipital_mm = formData.dobra_tricipital_mm;
      }
      if (formData.dobra_subescapular_mm !== undefined && formData.dobra_subescapular_mm !== null) {
        customMeasurements.dobra_subescapular_mm = formData.dobra_subescapular_mm;
      }
      if (formData.dobra_suprailiaca_mm !== undefined && formData.dobra_suprailiaca_mm !== null) {
        customMeasurements.dobra_suprailiaca_mm = formData.dobra_suprailiaca_mm;
      }
      if (formData.dobra_abdominal_mm !== undefined && formData.dobra_abdominal_mm !== null) {
        customMeasurements.dobra_abdominal_mm = formData.dobra_abdominal_mm;
      }
      
      // Dobras cutâneas adicionais
      if (formData.dobra_bicipital_mm !== undefined && formData.dobra_bicipital_mm !== null) {
        customMeasurements.dobra_bicipital_mm = formData.dobra_bicipital_mm;
      }
      if (formData.dobra_coxa_mm !== undefined && formData.dobra_coxa_mm !== null) {
        customMeasurements.dobra_coxa_mm = formData.dobra_coxa_mm;
      }
      if (formData.dobra_peitoral_mm !== undefined && formData.dobra_peitoral_mm !== null) {
        customMeasurements.dobra_peitoral_mm = formData.dobra_peitoral_mm;
      }
      
      // Bioimpedância
      if (formData.agua_corporal_percent !== undefined && formData.agua_corporal_percent !== null) {
        customMeasurements.agua_corporal_percent = formData.agua_corporal_percent;
      }
      if (formData.massa_ossea_kg !== undefined && formData.massa_ossea_kg !== null) {
        customMeasurements.massa_ossea_kg = formData.massa_ossea_kg;
      }
      if (formData.taxa_metabolica_basal !== undefined && formData.taxa_metabolica_basal !== null) {
        customMeasurements.taxa_metabolica_basal = formData.taxa_metabolica_basal;
      }
      if (formData.idade_metabolica !== undefined && formData.idade_metabolica !== null) {
        customMeasurements.idade_metabolica = formData.idade_metabolica;
      }
      if (formData.gordura_visceral !== undefined && formData.gordura_visceral !== null) {
        customMeasurements.gordura_visceral = formData.gordura_visceral;
      }
      
      // Calcular IMC
      const bmi = calculateBMI(formData.weight_kg, formData.height_cm);
      
      const insertData = {
        patient_id: patientId,
        clinic_id: clinic.id,
        recorded_by: professionalId,
        measurement_date: formData.measurement_date,
        weight_kg: formData.weight_kg,
        height_cm: formData.height_cm,
        bmi,
        waist_cm: formData.waist_cm,
        hip_cm: formData.hip_cm,
        chest_cm: formData.chest_cm,
        arm_left_cm: formData.arm_left_cm,
        arm_right_cm: formData.arm_right_cm,
        thigh_left_cm: formData.thigh_left_cm,
        thigh_right_cm: formData.thigh_right_cm,
        calf_left_cm: formData.calf_left_cm,
        calf_right_cm: formData.calf_right_cm,
        body_fat_percent: formData.body_fat_percent,
        muscle_mass_kg: formData.muscle_mass_kg,
        custom_measurements: Object.keys(customMeasurements).length > 0 ? customMeasurements : null,
        notes: formData.notes,
      };
      
      const { data, error } = await supabase
        .from('body_measurements')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(insertData as any)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Avaliação nutricional salva com sucesso');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['nutricao-avaliacoes', patientId] });
      queryClient.invalidateQueries({ queryKey: ['nutricao-last-measurement', patientId] });
      queryClient.invalidateQueries({ queryKey: ['nutricao-first-measurement', patientId] });
      
      return data;
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast.error('Erro ao salvar avaliação nutricional');
      return null;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, professionalId, queryClient]);
  
  return {
    avaliacoes: avaliacoes || [],
    currentAvaliacao,
    loading,
    saving,
    saveAvaliacao,
    refetch,
    calculateBMI,
    calculateWaistHipRatio,
  };
}
