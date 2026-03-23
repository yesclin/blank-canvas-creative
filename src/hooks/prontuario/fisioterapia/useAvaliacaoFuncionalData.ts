/**
 * FISIOTERAPIA - Dados da Avaliação Funcional
 * 
 * Hook para gerenciar avaliações funcionais com comparação evolutiva.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Opções para força muscular (Escala de Oxford)
export const FORCA_MUSCULAR_OPTIONS = [
  { value: '0', label: '0 - Nenhuma contração' },
  { value: '1', label: '1 - Contração palpável' },
  { value: '2', label: '2 - Movimento sem gravidade' },
  { value: '3', label: '3 - Movimento contra gravidade' },
  { value: '4', label: '4 - Movimento contra resistência' },
  { value: '5', label: '5 - Força normal' },
];

// Opções para equilíbrio
export const EQUILIBRIO_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'leve', label: 'Déficit Leve' },
  { value: 'moderado', label: 'Déficit Moderado' },
  { value: 'grave', label: 'Déficit Grave' },
];

// Opções para marcha
export const MARCHA_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'antalgica', label: 'Antálgica' },
  { value: 'claudicante', label: 'Claudicante' },
  { value: 'ataxica', label: 'Atáxica' },
  { value: 'espastica', label: 'Espástica' },
  { value: 'outro', label: 'Outro padrão' },
];

export interface AvaliacaoFuncionalData {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  professional_name?: string | null;
  
  // Campos da avaliação
  postura: string | null;
  adm_descricao: string | null;
  adm_medidas: Record<string, { valor: number; unidade: string }> | null;
  forca_muscular: string | null;
  forca_detalhes: Record<string, string> | null;
  testes_funcionais: string | null;
  equilibrio: string | null;
  equilibrio_obs: string | null;
  coordenacao: string | null;
  marcha: string | null;
  marcha_obs: string | null;
  observacoes: string | null;
  
  created_at: string;
}

export interface AvaliacaoFuncionalFormData {
  postura: string;
  adm_descricao: string;
  adm_medidas: Record<string, { valor: number; unidade: string }>;
  forca_muscular: string;
  forca_detalhes: Record<string, string>;
  testes_funcionais: string;
  equilibrio: string;
  equilibrio_obs: string;
  coordenacao: string;
  marcha: string;
  marcha_obs: string;
  observacoes: string;
}

interface UseAvaliacaoFuncionalDataParams {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}

export function useAvaliacaoFuncionalData({ 
  patientId, 
  clinicId, 
  professionalId 
}: UseAvaliacaoFuncionalDataParams) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Buscar todas as avaliações
  const historyQuery = useQuery({
    queryKey: ['fisioterapia-avaliacao-funcional', patientId, clinicId],
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
        .eq('evolution_type', 'avaliacao_funcional_fisio')
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
          postura: (content?.postura as string) || null,
          adm_descricao: (content?.adm_descricao as string) || null,
          adm_medidas: (content?.adm_medidas as Record<string, { valor: number; unidade: string }>) || null,
          forca_muscular: (content?.forca_muscular as string) || null,
          forca_detalhes: (content?.forca_detalhes as Record<string, string>) || null,
          testes_funcionais: (content?.testes_funcionais as string) || null,
          equilibrio: (content?.equilibrio as string) || null,
          equilibrio_obs: (content?.equilibrio_obs as string) || null,
          coordenacao: (content?.coordenacao as string) || null,
          marcha: (content?.marcha as string) || null,
          marcha_obs: (content?.marcha_obs as string) || null,
          observacoes: (content?.observacoes as string) || null,
          created_at: record.created_at,
        } as AvaliacaoFuncionalData;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Avaliação atual e anterior para comparação
  const currentAvaliacao = historyQuery.data?.[0] || null;
  const previousAvaliacao = historyQuery.data?.[1] || null;

  // Salvar nova avaliação
  const saveMutation = useMutation({
    mutationFn: async (formData: AvaliacaoFuncionalFormData) => {
      if (!patientId || !clinicId || !professionalId) {
        throw new Error('Dados obrigatórios não informados');
      }

      const content = {
        postura: formData.postura || null,
        adm_descricao: formData.adm_descricao || null,
        adm_medidas: Object.keys(formData.adm_medidas).length > 0 ? formData.adm_medidas : null,
        forca_muscular: formData.forca_muscular || null,
        forca_detalhes: Object.keys(formData.forca_detalhes).length > 0 ? formData.forca_detalhes : null,
        testes_funcionais: formData.testes_funcionais || null,
        equilibrio: formData.equilibrio || null,
        equilibrio_obs: formData.equilibrio_obs || null,
        coordenacao: formData.coordenacao || null,
        marcha: formData.marcha || null,
        marcha_obs: formData.marcha_obs || null,
        observacoes: formData.observacoes || null,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          evolution_type: 'avaliacao_funcional_fisio',
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
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-avaliacao-funcional', patientId, clinicId] });
      toast.success('Avaliação funcional salva com sucesso');
      setIsFormOpen(false);
    },
    onError: (error) => {
      console.error('Erro ao salvar avaliação:', error);
      toast.error('Erro ao salvar avaliação');
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

export function getEmptyAvaliacaoForm(): AvaliacaoFuncionalFormData {
  return {
    postura: '',
    adm_descricao: '',
    adm_medidas: {},
    forca_muscular: '',
    forca_detalhes: {},
    testes_funcionais: '',
    equilibrio: '',
    equilibrio_obs: '',
    coordenacao: '',
    marcha: '',
    marcha_obs: '',
    observacoes: '',
  };
}
