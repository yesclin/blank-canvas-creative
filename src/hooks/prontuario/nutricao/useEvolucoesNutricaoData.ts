/**
 * NUTRIÇÃO - Evoluções Clínicas
 * 
 * Hook para gerenciar evoluções clínicas específicas da especialidade Nutrição.
 * Inclui campos específicos para acompanhamento nutricional.
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type StatusEvolucao = 'draft' | 'signed';
export type TipoConsulta = 'primeira_consulta' | 'retorno' | 'acompanhamento' | 'emergencia';

export interface EvolucaoNutricao {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string;
  professional_name?: string;
  appointment_id: string | null;
  
  // Tipo de consulta
  tipo_consulta: TipoConsulta;
  
  // Dados da consulta
  queixa_principal: string | null;
  peso_atual_kg: number | null;
  observacoes_peso: string | null;
  
  // Adesão ao plano
  adesao_plano: 'boa' | 'regular' | 'ruim' | null;
  dificuldades_relatadas: string | null;
  
  // Sintomas gastrointestinais
  sintomas_gi: string[];
  
  // Avaliação geral
  avaliacao: string | null;
  
  // Ajustes realizados no plano
  ajustes_realizados: string | null;
  
  // Orientações e conduta
  orientacoes: string[];
  proximos_passos: string | null;
  
  // Status e assinatura
  status: StatusEvolucao;
  signed_at: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface EvolucaoNutricaoFormData {
  data_atendimento: string; // Data do atendimento (YYYY-MM-DD)
  tipo_consulta: TipoConsulta;
  queixa_principal: string | null;
  peso_atual_kg: number | null;
  observacoes_peso: string | null;
  adesao_plano: 'boa' | 'regular' | 'ruim' | null;
  dificuldades_relatadas: string | null;
  sintomas_gi: string[];
  avaliacao: string | null;
  ajustes_realizados: string | null;
  orientacoes: string[];
  proximos_passos: string | null;
}

/**
 * Hook para gerenciar evoluções nutricionais do paciente
 */
export function useEvolucoesNutricaoData(patientId: string | null, professionalId?: string) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  
  // Buscar todas as evoluções do paciente
  const {
    data: evolucoes,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['nutricao-evolucoes', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];
      
      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select(`
          *,
          professional:professionals!clinical_evolutions_professional_id_fkey(
            id,
            profiles:profiles!professionals_user_id_fkey(full_name)
          )
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('specialty', 'nutricao')
        .in('evolution_type', ['consultation', 'return', 'followup'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Mapear para o formato esperado
      return data.map(item => {
        const content = item.content as Record<string, unknown>;
        // O professional vem como array, pegamos o primeiro elemento
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const professionalData = item.professional as any;
        const professionalName = professionalData?.[0]?.profiles?.[0]?.full_name || 'Profissional';
        
        return {
          id: item.id,
          patient_id: item.patient_id,
          clinic_id: item.clinic_id,
          professional_id: item.professional_id,
          professional_name: professionalName,
          appointment_id: item.appointment_id,
          tipo_consulta: (content?.tipo_consulta as TipoConsulta) || 'acompanhamento',
          queixa_principal: (content?.queixa_principal as string) || null,
          peso_atual_kg: (content?.peso_atual_kg as number) || null,
          observacoes_peso: (content?.observacoes_peso as string) || null,
          adesao_plano: (content?.adesao_plano as 'boa' | 'regular' | 'ruim') || null,
          dificuldades_relatadas: (content?.dificuldades_relatadas as string) || null,
          sintomas_gi: (content?.sintomas_gi as string[]) || [],
          avaliacao: item.notes,
          ajustes_realizados: (content?.ajustes_realizados as string) || null,
          orientacoes: (content?.orientacoes as string[]) || [],
          proximos_passos: item.next_steps,
          status: item.status as StatusEvolucao,
          signed_at: item.signed_at,
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      }) as EvolucaoNutricao[];
    },
    enabled: !!patientId && !!clinic?.id,
  });
  
  // Última evolução
  const lastEvolucao = evolucoes?.[0] || null;
  
  // Salvar evolução
  const saveEvolucao = useCallback(async (formData: EvolucaoNutricaoFormData, appointmentId?: string) => {
    if (!patientId || !clinic?.id || !professionalId) {
      toast.error('Dados incompletos para salvar evolução');
      return null;
    }
    
    setSaving(true);
    
    try {
      const evolutionType = formData.tipo_consulta === 'primeira_consulta' 
        ? 'consultation' 
        : formData.tipo_consulta === 'retorno' 
          ? 'return' 
          : 'followup';
      
      const content = {
        tipo_consulta: formData.tipo_consulta,
        queixa_principal: formData.queixa_principal,
        peso_atual_kg: formData.peso_atual_kg,
        observacoes_peso: formData.observacoes_peso,
        adesao_plano: formData.adesao_plano,
        dificuldades_relatadas: formData.dificuldades_relatadas,
        sintomas_gi: formData.sintomas_gi,
        ajustes_realizados: formData.ajustes_realizados,
        orientacoes: formData.orientacoes,
      };
      
      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          professional_id: professionalId,
          appointment_id: appointmentId || null,
          evolution_type: evolutionType,
          specialty: 'nutricao',
          content,
          notes: formData.avaliacao,
          next_steps: formData.proximos_passos,
          status: 'draft',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Evolução salva como rascunho');
      queryClient.invalidateQueries({ queryKey: ['nutricao-evolucoes', patientId] });
      
      return data;
    } catch (error) {
      console.error('Erro ao salvar evolução:', error);
      toast.error('Erro ao salvar evolução');
      return null;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, professionalId, queryClient]);
  
  // Assinar evolução
  const signEvolucao = useCallback(async (evolucaoId: string) => {
    if (!professionalId) {
      toast.error('Profissional não identificado');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('clinical_evolutions')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          signed_by: professionalId,
        })
        .eq('id', evolucaoId);
      
      if (error) throw error;
      
      toast.success('Evolução assinada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['nutricao-evolucoes', patientId] });
      
      return true;
    } catch (error) {
      console.error('Erro ao assinar evolução:', error);
      toast.error('Erro ao assinar evolução');
      return false;
    }
  }, [patientId, professionalId, queryClient]);
  
  return {
    evolucoes: evolucoes || [],
    lastEvolucao,
    loading,
    saving,
    saveEvolucao,
    signEvolucao,
    refetch,
  };
}

// Labels para tipo de consulta
export const TIPO_CONSULTA_LABELS: Record<TipoConsulta, string> = {
  primeira_consulta: 'Primeira Consulta',
  retorno: 'Retorno',
  acompanhamento: 'Acompanhamento',
  emergencia: 'Emergência',
};

// Sintomas GI comuns
export const SINTOMAS_GI_OPTIONS = [
  'Constipação',
  'Diarreia',
  'Gases/Flatulência',
  'Distensão abdominal',
  'Náusea',
  'Azia/Refluxo',
  'Dor abdominal',
  'Má digestão',
  'Falta de apetite',
  'Compulsão alimentar',
];
