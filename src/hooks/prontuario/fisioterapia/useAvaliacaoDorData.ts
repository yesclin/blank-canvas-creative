/**
 * FISIOTERAPIA - Dados da Avaliação de Dor
 * 
 * Hook para gerenciar avaliações de dor com histórico comparativo.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Opções para tipo de dor
export const TIPO_DOR_OPTIONS = [
  { value: 'aguda', label: 'Aguda' },
  { value: 'cronica', label: 'Crônica' },
  { value: 'nociceptiva', label: 'Nociceptiva' },
  { value: 'neuropatica', label: 'Neuropática' },
  { value: 'mista', label: 'Mista' },
  { value: 'referida', label: 'Referida' },
  { value: 'irradiada', label: 'Irradiada' },
];

// Opções para frequência da dor
export const FREQUENCIA_DOR_OPTIONS = [
  { value: 'constante', label: 'Constante' },
  { value: 'intermitente', label: 'Intermitente' },
  { value: 'ocasional', label: 'Ocasional' },
  { value: 'noturna', label: 'Noturna' },
  { value: 'matinal', label: 'Matinal' },
  { value: 'ao_movimento', label: 'Ao movimento' },
  { value: 'em_repouso', label: 'Em repouso' },
];

// Regiões corporais comuns
export const REGIOES_CORPORAIS = [
  'Cervical',
  'Torácica',
  'Lombar',
  'Sacral',
  'Ombro Direito',
  'Ombro Esquerdo',
  'Cotovelo Direito',
  'Cotovelo Esquerdo',
  'Punho/Mão Direita',
  'Punho/Mão Esquerda',
  'Quadril Direito',
  'Quadril Esquerdo',
  'Joelho Direito',
  'Joelho Esquerdo',
  'Tornozelo/Pé Direito',
  'Tornozelo/Pé Esquerdo',
  'Outra região',
];

export interface AvaliacaoDorData {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  professional_name?: string | null;
  
  // Campos da avaliação
  eva_score: number;
  tipo_dor: string | null;
  localizacao: string[];
  localizacao_detalhe: string | null;
  frequencia: string | null;
  fatores_agravantes: string | null;
  fatores_aliviadores: string | null;
  caracteristicas: string | null;
  impacto_funcional: string | null;
  observacoes: string | null;
  
  created_at: string;
}

export interface AvaliacaoDorFormData {
  eva_score: number;
  tipo_dor: string;
  localizacao: string[];
  localizacao_detalhe: string;
  frequencia: string;
  fatores_agravantes: string;
  fatores_aliviadores: string;
  caracteristicas: string;
  impacto_funcional: string;
  observacoes: string;
}

interface UseAvaliacaoDorDataParams {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}

export function useAvaliacaoDorData({ 
  patientId, 
  clinicId, 
  professionalId 
}: UseAvaliacaoDorDataParams) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Buscar todas as avaliações
  const historyQuery = useQuery({
    queryKey: ['fisioterapia-avaliacao-dor', patientId, clinicId],
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
        .eq('evolution_type', 'avaliacao_dor_fisio')
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
          eva_score: (content?.eva_score as number) ?? 0,
          tipo_dor: (content?.tipo_dor as string) || null,
          localizacao: (content?.localizacao as string[]) || [],
          localizacao_detalhe: (content?.localizacao_detalhe as string) || null,
          frequencia: (content?.frequencia as string) || null,
          fatores_agravantes: (content?.fatores_agravantes as string) || null,
          fatores_aliviadores: (content?.fatores_aliviadores as string) || null,
          caracteristicas: (content?.caracteristicas as string) || null,
          impacto_funcional: (content?.impacto_funcional as string) || null,
          observacoes: (content?.observacoes as string) || null,
          created_at: record.created_at,
        } as AvaliacaoDorData;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Avaliação atual e anterior para comparação
  const currentAvaliacao = historyQuery.data?.[0] || null;
  const previousAvaliacao = historyQuery.data?.[1] || null;

  // Calcular variação da EVA
  const evaVariacao = currentAvaliacao && previousAvaliacao
    ? currentAvaliacao.eva_score - previousAvaliacao.eva_score
    : null;

  // Salvar nova avaliação
  const saveMutation = useMutation({
    mutationFn: async (formData: AvaliacaoDorFormData) => {
      if (!patientId || !clinicId || !professionalId) {
        throw new Error('Dados obrigatórios não informados');
      }

      // Validação do score EVA
      const evaScore = Math.max(0, Math.min(10, formData.eva_score));

      const content = {
        eva_score: evaScore,
        tipo_dor: formData.tipo_dor || null,
        localizacao: formData.localizacao.length > 0 ? formData.localizacao : null,
        localizacao_detalhe: formData.localizacao_detalhe.trim() || null,
        frequencia: formData.frequencia || null,
        fatores_agravantes: formData.fatores_agravantes.trim() || null,
        fatores_aliviadores: formData.fatores_aliviadores.trim() || null,
        caracteristicas: formData.caracteristicas.trim() || null,
        impacto_funcional: formData.impacto_funcional.trim() || null,
        observacoes: formData.observacoes.trim() || null,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          evolution_type: 'avaliacao_dor_fisio',
          specialty: 'fisioterapia',
          content,
          status: 'rascunho',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-avaliacao-dor', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-summary', patientId, clinicId] });
      toast.success('Avaliação de dor salva com sucesso');
      setIsFormOpen(false);
    },
    onError: (error) => {
      console.error('Erro ao salvar avaliação de dor:', error);
      toast.error('Erro ao salvar avaliação');
    },
  });

  return {
    currentAvaliacao,
    previousAvaliacao,
    evaVariacao,
    history: historyQuery.data || [],
    loading: historyQuery.isLoading,
    error: historyQuery.error,
    isFormOpen,
    setIsFormOpen,
    saveAvaliacao: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}

export function getEmptyDorForm(): AvaliacaoDorFormData {
  return {
    eva_score: 0,
    tipo_dor: '',
    localizacao: [],
    localizacao_detalhe: '',
    frequencia: '',
    fatores_agravantes: '',
    fatores_aliviadores: '',
    caracteristicas: '',
    impacto_funcional: '',
    observacoes: '',
  };
}
