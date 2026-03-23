/**
 * NUTRIÇÃO - Plano Alimentar
 * 
 * Hook para gerenciar planos alimentares do paciente.
 * Inclui refeições, macros, orientações e prescrição dietética.
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type StatusPlano = 'ativo' | 'inativo' | 'rascunho';

export interface RefeicaoPlano {
  id: string;
  horario: string;
  tipo: 'cafe_manha' | 'lanche_manha' | 'almoco' | 'lanche_tarde' | 'jantar' | 'ceia' | 'outro';
  nome_refeicao?: string;
  opcoes: OpcaoRefeicao[];
}

export interface OpcaoRefeicao {
  descricao: string;
  calorias_kcal?: number;
  proteinas_g?: number;
  carboidratos_g?: number;
  gorduras_g?: number;
  observacoes?: string;
}

export interface MacrosPlano {
  calorias_totais_kcal: number | null;
  proteinas_g: number | null;
  proteinas_percent: number | null;
  carboidratos_g: number | null;
  carboidratos_percent: number | null;
  gorduras_g: number | null;
  gorduras_percent: number | null;
  fibras_g: number | null;
}

export interface PlanoAlimentar {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string;
  appointment_id: string | null;
  
  // Identificação
  titulo: string;
  objetivo: string | null;
  data_inicio: string;
  data_fim: string | null;
  status: StatusPlano;
  
  // Macros calculados
  macros: MacrosPlano;
  
  // Refeições
  refeicoes: RefeicaoPlano[];
  
  // Orientações gerais
  orientacoes: string[];
  alimentos_evitar: string[];
  alimentos_preferir: string[];
  
  // Suplementação (opcional)
  suplementos: string[];
  
  // Observações
  observacoes: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface PlanoAlimentarFormData {
  titulo: string;
  objetivo: string | null;
  data_inicio: string;
  data_fim: string | null;
  macros: MacrosPlano;
  refeicoes: RefeicaoPlano[];
  orientacoes: string[];
  alimentos_evitar: string[];
  alimentos_preferir: string[];
  suplementos: string[];
  observacoes: string | null;
}

/**
 * Hook para gerenciar planos alimentares do paciente
 */
export function usePlanoAlimentarData(patientId: string | null, professionalId?: string) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  
  // Buscar todos os planos do paciente (armazenados em clinical_evolutions com tipo específico)
  const {
    data: planos,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['nutricao-planos', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];
      
      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('evolution_type', 'plano_alimentar')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Mapear para o formato esperado
      return data.map(item => {
        const content = item.content as Record<string, unknown>;
        return {
          id: item.id,
          patient_id: item.patient_id,
          clinic_id: item.clinic_id,
          professional_id: item.professional_id,
          appointment_id: item.appointment_id,
          titulo: (content?.titulo as string) || 'Plano Alimentar',
          objetivo: (content?.objetivo as string) || null,
          data_inicio: (content?.data_inicio as string) || item.created_at,
          data_fim: (content?.data_fim as string) || null,
          status: (content?.status as StatusPlano) || 'ativo',
          macros: (content?.macros as MacrosPlano) || {
            calorias_totais_kcal: null,
            proteinas_g: null,
            proteinas_percent: null,
            carboidratos_g: null,
            carboidratos_percent: null,
            gorduras_g: null,
            gorduras_percent: null,
            fibras_g: null,
          },
          refeicoes: (content?.refeicoes as RefeicaoPlano[]) || [],
          orientacoes: (content?.orientacoes as string[]) || [],
          alimentos_evitar: (content?.alimentos_evitar as string[]) || [],
          alimentos_preferir: (content?.alimentos_preferir as string[]) || [],
          suplementos: (content?.suplementos as string[]) || [],
          observacoes: item.notes,
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      }) as PlanoAlimentar[];
    },
    enabled: !!patientId && !!clinic?.id,
  });
  
  // Plano ativo atual
  const planoAtivo = planos?.find(p => p.status === 'ativo') || null;
  
  // Histórico de planos
  const planosHistorico = planos?.filter(p => p.status !== 'ativo') || [];
  
  // Salvar novo plano
  const savePlano = useCallback(async (formData: PlanoAlimentarFormData, status: StatusPlano = 'ativo') => {
    if (!patientId || !clinic?.id || !professionalId) {
      toast.error('Dados incompletos para salvar plano alimentar');
      return null;
    }
    
    setSaving(true);
    
    try {
      const content = {
        titulo: formData.titulo,
        objetivo: formData.objetivo,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim,
        status,
        macros: formData.macros,
        refeicoes: formData.refeicoes,
        orientacoes: formData.orientacoes,
        alimentos_evitar: formData.alimentos_evitar,
        alimentos_preferir: formData.alimentos_preferir,
        suplementos: formData.suplementos,
      };
      
      const insertData = {
        patient_id: patientId,
        clinic_id: clinic.id,
        professional_id: professionalId,
        evolution_type: 'plano_alimentar',
        specialty: 'nutricao',
        content: content as unknown as Record<string, unknown>,
        notes: formData.observacoes,
        status: status === 'rascunho' ? 'draft' : 'signed',
        signed_at: status !== 'rascunho' ? new Date().toISOString() : null,
        signed_by: status !== 'rascunho' ? professionalId : null,
      };
      
      const { data, error } = await supabase
        .from('clinical_evolutions')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(insertData as any)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success(status === 'rascunho' ? 'Rascunho salvo' : 'Plano alimentar salvo com sucesso');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['nutricao-planos', patientId] });
      
      return data;
    } catch (error) {
      console.error('Erro ao salvar plano alimentar:', error);
      toast.error('Erro ao salvar plano alimentar');
      return null;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, professionalId, queryClient]);
  
  // Desativar plano
  const deactivatePlano = useCallback(async (planoId: string) => {
    if (!patientId || !clinic?.id) return false;
    
    try {
      // Buscar o plano atual
      const { data: currentPlano, error: fetchError } = await supabase
        .from('clinical_evolutions')
        .select('content')
        .eq('id', planoId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const content = currentPlano.content as Record<string, unknown>;
      
      // Atualizar status para inativo
      const { error } = await supabase
        .from('clinical_evolutions')
        .update({
          content: { ...content, status: 'inativo' },
        })
        .eq('id', planoId);
      
      if (error) throw error;
      
      toast.success('Plano alimentar desativado');
      queryClient.invalidateQueries({ queryKey: ['nutricao-planos', patientId] });
      
      return true;
    } catch (error) {
      console.error('Erro ao desativar plano:', error);
      toast.error('Erro ao desativar plano alimentar');
      return false;
    }
  }, [patientId, clinic?.id, queryClient]);
  
  return {
    planos: planos || [],
    planoAtivo,
    planosHistorico,
    loading,
    saving,
    savePlano,
    deactivatePlano,
    refetch,
  };
}

// Refeição padrão para novo plano
export const DEFAULT_REFEICOES: RefeicaoPlano[] = [
  { id: '1', horario: '07:00', tipo: 'cafe_manha', opcoes: [] },
  { id: '2', horario: '10:00', tipo: 'lanche_manha', opcoes: [] },
  { id: '3', horario: '12:30', tipo: 'almoco', opcoes: [] },
  { id: '4', horario: '15:30', tipo: 'lanche_tarde', opcoes: [] },
  { id: '5', horario: '19:30', tipo: 'jantar', opcoes: [] },
  { id: '6', horario: '22:00', tipo: 'ceia', opcoes: [] },
];
