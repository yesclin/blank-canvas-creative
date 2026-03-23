/**
 * NUTRIÇÃO - Recordatório Alimentar
 * 
 * Hook para gerenciar dados de recordatório alimentar / inquérito dietético.
 * Inclui recordatório 24h e frequência alimentar habitual.
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type TipoRecordatorio = 'recordatorio_24h' | 'frequencia_habitual' | 'diario_alimentar';

export interface Refeicao {
  horario: string;
  tipo: 'cafe_manha' | 'lanche_manha' | 'almoco' | 'lanche_tarde' | 'jantar' | 'ceia' | 'outro';
  alimentos: string;
  local?: string;
  observacoes?: string;
}

export interface RecordatorioAlimentar {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string;
  appointment_id: string | null;
  
  tipo: TipoRecordatorio;
  data_referencia: string; // Data do consumo alimentar
  
  // Refeições detalhadas
  refeicoes: Refeicao[];
  
  // Análise qualitativa
  agua_copos_dia: number | null;
  frituras_frequencia: 'nunca' | 'raramente' | 'semanal' | 'diario' | null;
  doces_frequencia: 'nunca' | 'raramente' | 'semanal' | 'diario' | null;
  frutas_porcoes_dia: number | null;
  verduras_porcoes_dia: number | null;
  proteinas_adequadas: boolean | null;
  
  // Observações do profissional
  observacoes: string | null;
  pontos_atencao: string[];
  
  created_at: string;
  updated_at: string;
}

export interface RecordatorioFormData {
  tipo: TipoRecordatorio;
  data_referencia: string;
  refeicoes: Refeicao[];
  agua_copos_dia: number | null;
  frituras_frequencia: 'nunca' | 'raramente' | 'semanal' | 'diario' | null;
  doces_frequencia: 'nunca' | 'raramente' | 'semanal' | 'diario' | null;
  frutas_porcoes_dia: number | null;
  verduras_porcoes_dia: number | null;
  proteinas_adequadas: boolean | null;
  observacoes: string | null;
  pontos_atencao: string[];
}

/**
 * Hook para gerenciar recordatórios alimentares do paciente
 */
export function useRecordatorioAlimentarData(patientId: string | null, professionalId?: string) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  
  // Buscar todos os recordatórios do paciente (armazenados em clinical_evolutions com tipo específico)
  const {
    data: recordatorios,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['nutricao-recordatorios', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];
      
      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('evolution_type', 'recordatorio_alimentar')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Mapear para o formato esperado
      return data.map(item => ({
        id: item.id,
        patient_id: item.patient_id,
        clinic_id: item.clinic_id,
        professional_id: item.professional_id,
        appointment_id: item.appointment_id,
        tipo: (item.content as Record<string, unknown>)?.tipo as TipoRecordatorio || 'recordatorio_24h',
        data_referencia: (item.content as Record<string, unknown>)?.data_referencia as string || item.created_at,
        refeicoes: ((item.content as Record<string, unknown>)?.refeicoes as Refeicao[]) || [],
        agua_copos_dia: (item.content as Record<string, unknown>)?.agua_copos_dia as number | null,
        frituras_frequencia: (item.content as Record<string, unknown>)?.frituras_frequencia as string | null,
        doces_frequencia: (item.content as Record<string, unknown>)?.doces_frequencia as string | null,
        frutas_porcoes_dia: (item.content as Record<string, unknown>)?.frutas_porcoes_dia as number | null,
        verduras_porcoes_dia: (item.content as Record<string, unknown>)?.verduras_porcoes_dia as number | null,
        proteinas_adequadas: (item.content as Record<string, unknown>)?.proteinas_adequadas as boolean | null,
        observacoes: item.notes,
        pontos_atencao: ((item.content as Record<string, unknown>)?.pontos_atencao as string[]) || [],
        created_at: item.created_at,
        updated_at: item.updated_at,
      })) as RecordatorioAlimentar[];
    },
    enabled: !!patientId && !!clinic?.id,
  });
  
  // Último recordatório
  const currentRecordatorio = recordatorios?.[0] || null;
  
  // Salvar novo recordatório
  const saveRecordatorio = useCallback(async (formData: RecordatorioFormData) => {
    if (!patientId || !clinic?.id || !professionalId) {
      toast.error('Dados incompletos para salvar recordatório');
      return null;
    }
    
    setSaving(true);
    
    try {
      const content = {
        tipo: formData.tipo,
        data_referencia: formData.data_referencia,
        refeicoes: formData.refeicoes,
        agua_copos_dia: formData.agua_copos_dia,
        frituras_frequencia: formData.frituras_frequencia,
        doces_frequencia: formData.doces_frequencia,
        frutas_porcoes_dia: formData.frutas_porcoes_dia,
        verduras_porcoes_dia: formData.verduras_porcoes_dia,
        proteinas_adequadas: formData.proteinas_adequadas,
        pontos_atencao: formData.pontos_atencao,
      };
      
      const insertData = {
        patient_id: patientId,
        clinic_id: clinic.id,
        professional_id: professionalId,
        evolution_type: 'recordatorio_alimentar',
        specialty: 'nutricao',
        content: content as unknown as Record<string, unknown>,
        notes: formData.observacoes,
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by: professionalId,
      };
      
      const { data, error } = await supabase
        .from('clinical_evolutions')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(insertData as any)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Recordatório alimentar salvo com sucesso');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['nutricao-recordatorios', patientId] });
      
      return data;
    } catch (error) {
      console.error('Erro ao salvar recordatório:', error);
      toast.error('Erro ao salvar recordatório alimentar');
      return null;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, professionalId, queryClient]);
  
  return {
    recordatorios: recordatorios || [],
    currentRecordatorio,
    loading,
    saving,
    saveRecordatorio,
    refetch,
  };
}

// Labels para tipos de refeição
export const TIPO_REFEICAO_LABELS: Record<string, string> = {
  cafe_manha: 'Café da Manhã',
  lanche_manha: 'Lanche da Manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da Tarde',
  jantar: 'Jantar',
  ceia: 'Ceia',
  outro: 'Outro',
};

// Labels para frequência
export const FREQUENCIA_LABELS: Record<string, string> = {
  nunca: 'Nunca',
  raramente: 'Raramente',
  semanal: 'Semanal',
  diario: 'Diário',
};
