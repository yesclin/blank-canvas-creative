/**
 * PILATES - Dados da Avaliação de Dor
 * 
 * Hook para gerenciar avaliações de dor específicas de Pilates.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const INTENSIDADE_DOR_OPTIONS = [
  { value: '0', label: '0 - Sem dor' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3 - Leve' },
  { value: '4', label: '4' },
  { value: '5', label: '5 - Moderada' },
  { value: '6', label: '6' },
  { value: '7', label: '7 - Intensa' },
  { value: '8', label: '8' },
  { value: '9', label: '9' },
  { value: '10', label: '10 - Insuportável' },
];

export const FREQUENCIA_DOR_OPTIONS = [
  { value: 'constante', label: 'Constante' },
  { value: 'frequente', label: 'Frequente' },
  { value: 'intermitente', label: 'Intermitente' },
  { value: 'ocasional', label: 'Ocasional' },
  { value: 'rara', label: 'Rara' },
];

export const LOCAIS_DOR_PILATES = [
  { value: 'cervical', label: 'Cervical' },
  { value: 'toracica', label: 'Torácica' },
  { value: 'lombar', label: 'Lombar' },
  { value: 'sacral', label: 'Sacral' },
  { value: 'ombro_direito', label: 'Ombro Direito' },
  { value: 'ombro_esquerdo', label: 'Ombro Esquerdo' },
  { value: 'quadril_direito', label: 'Quadril Direito' },
  { value: 'quadril_esquerdo', label: 'Quadril Esquerdo' },
  { value: 'joelho_direito', label: 'Joelho Direito' },
  { value: 'joelho_esquerdo', label: 'Joelho Esquerdo' },
  { value: 'tornozelo_direito', label: 'Tornozelo Direito' },
  { value: 'tornozelo_esquerdo', label: 'Tornozelo Esquerdo' },
  { value: 'punho_mao', label: 'Punho / Mão' },
  { value: 'outro', label: 'Outro' },
];

export interface AvaliacaoDorPilatesData {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  professional_name?: string | null;

  local_da_dor: string[];
  local_da_dor_outro: string | null;
  intensidade_dor: string | null;
  frequencia_dor: string | null;
  inicio_da_dor: string | null;
  fatores_de_piora: string | null;
  fatores_de_melhora: string | null;
  impacto_funcional_da_dor: string | null;
  observacoes_clinicas_dor: string | null;

  created_at: string;
}

export interface AvaliacaoDorPilatesFormData {
  local_da_dor: string[];
  local_da_dor_outro: string;
  intensidade_dor: string;
  frequencia_dor: string;
  inicio_da_dor: string;
  fatores_de_piora: string;
  fatores_de_melhora: string;
  impacto_funcional_da_dor: string;
  observacoes_clinicas_dor: string;
}

interface UseAvaliacaoDorPilatesDataParams {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}

export function useAvaliacaoDorPilatesData({
  patientId,
  clinicId,
  professionalId,
}: UseAvaliacaoDorPilatesDataParams) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const historyQuery = useQuery({
    queryKey: ['pilates-avaliacao-dor', patientId, clinicId],
    queryFn: async () => {
      if (!patientId || !clinicId) return [];

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select(`
          id,
          content,
          created_at,
          professional_id,
          professionals:professional_id (
            full_name
          )
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('evolution_type', 'avaliacao_dor_pilates')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((record) => {
        const content = record.content as Record<string, unknown> | null;
        return {
          id: record.id,
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: record.professional_id,
          professional_name: (record.professionals as { full_name: string } | null)?.full_name || null,
          local_da_dor: (content?.local_da_dor as string[]) || [],
          local_da_dor_outro: (content?.local_da_dor_outro as string) || null,
          intensidade_dor: (content?.intensidade_dor as string) || null,
          frequencia_dor: (content?.frequencia_dor as string) || null,
          inicio_da_dor: (content?.inicio_da_dor as string) || null,
          fatores_de_piora: (content?.fatores_de_piora as string) || null,
          fatores_de_melhora: (content?.fatores_de_melhora as string) || null,
          impacto_funcional_da_dor: (content?.impacto_funcional_da_dor as string) || null,
          observacoes_clinicas_dor: (content?.observacoes_clinicas_dor as string) || null,
          created_at: record.created_at,
        } as AvaliacaoDorPilatesData;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  const currentAvaliacao = historyQuery.data?.[0] || null;
  const previousAvaliacao = historyQuery.data?.[1] || null;

  const saveMutation = useMutation({
    mutationFn: async (formData: AvaliacaoDorPilatesFormData) => {
      if (!patientId || !clinicId || !professionalId) {
        throw new Error('Dados obrigatórios não informados');
      }

      const content = {
        local_da_dor: formData.local_da_dor.length > 0 ? formData.local_da_dor : null,
        local_da_dor_outro: formData.local_da_dor_outro || null,
        intensidade_dor: formData.intensidade_dor || null,
        frequencia_dor: formData.frequencia_dor || null,
        inicio_da_dor: formData.inicio_da_dor || null,
        fatores_de_piora: formData.fatores_de_piora || null,
        fatores_de_melhora: formData.fatores_de_melhora || null,
        impacto_funcional_da_dor: formData.impacto_funcional_da_dor || null,
        observacoes_clinicas_dor: formData.observacoes_clinicas_dor || null,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          evolution_type: 'avaliacao_dor_pilates',
          specialty: 'pilates',
          content,
          status: 'rascunho',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilates-avaliacao-dor', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['pilates-summary', patientId, clinicId] });
      toast.success('Avaliação de dor salva com sucesso');
      setIsFormOpen(false);
    },
    onError: (error) => {
      console.error('Erro ao salvar avaliação de dor:', error);
      toast.error('Erro ao salvar avaliação de dor');
    },
  });

  return {
    currentAvaliacao,
    previousAvaliacao,
    history: historyQuery.data || [],
    loading: historyQuery.isLoading,
    error: historyQuery.error,
    isFormOpen,
    setIsFormOpen,
    saveAvaliacao: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}

export function getEmptyAvaliacaoDorPilatesForm(): AvaliacaoDorPilatesFormData {
  return {
    local_da_dor: [],
    local_da_dor_outro: '',
    intensidade_dor: '',
    frequencia_dor: '',
    inicio_da_dor: '',
    fatores_de_piora: '',
    fatores_de_melhora: '',
    impacto_funcional_da_dor: '',
    observacoes_clinicas_dor: '',
  };
}
