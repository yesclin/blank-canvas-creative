/**
 * PILATES - Dados da Avaliação Postural
 * 
 * Hook para gerenciar avaliações posturais com versionamento.
 * Suporta upload de imagens posturais (armazenadas em storage).
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Opções de alinhamento por região
export const ALINHAMENTO_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'leve', label: 'Desvio Leve' },
  { value: 'moderado', label: 'Desvio Moderado' },
  { value: 'acentuado', label: 'Desvio Acentuado' },
];

// Regiões para avaliação postural
export const REGIOES_POSTURAIS = [
  { key: 'cabeca', label: 'Cabeça / Cervical' },
  { key: 'ombros', label: 'Ombros' },
  { key: 'escapulas', label: 'Escápulas' },
  { key: 'coluna_toracica', label: 'Coluna Torácica' },
  { key: 'coluna_lombar', label: 'Coluna Lombar' },
  { key: 'pelve', label: 'Pelve / Quadril' },
  { key: 'joelhos', label: 'Joelhos' },
  { key: 'pes', label: 'Pés / Tornozelos' },
];

// Desvios posturais comuns
export const DESVIOS_POSTURAIS_OPTIONS = [
  { value: 'hiperlordose_cervical', label: 'Hiperlordose Cervical' },
  { value: 'retificacao_cervical', label: 'Retificação Cervical' },
  { value: 'hipercifose_toracica', label: 'Hipercifose Torácica' },
  { value: 'hiperlordose_lombar', label: 'Hiperlordose Lombar' },
  { value: 'retificacao_lombar', label: 'Retificação Lombar' },
  { value: 'escoliose', label: 'Escoliose' },
  { value: 'ombros_protusos', label: 'Ombros Protusos' },
  { value: 'escapulas_aladas', label: 'Escápulas Aladas' },
  { value: 'pelve_anteversao', label: 'Anteversão Pélvica' },
  { value: 'pelve_retroversao', label: 'Retroversão Pélvica' },
  { value: 'joelho_valgo', label: 'Joelho Valgo' },
  { value: 'joelho_varo', label: 'Joelho Varo' },
  { value: 'joelho_hiperextensao', label: 'Hiperextensão de Joelhos' },
  { value: 'pe_plano', label: 'Pé Plano' },
  { value: 'pe_cavo', label: 'Pé Cavo' },
];

// Encurtamentos musculares comuns
export const ENCURTAMENTOS_OPTIONS = [
  { value: 'isquiotibiais', label: 'Isquiotibiais' },
  { value: 'iliopsoas', label: 'Iliopsoas' },
  { value: 'reto_femoral', label: 'Reto Femoral' },
  { value: 'piriforme', label: 'Piriforme' },
  { value: 'peitoral_maior', label: 'Peitoral Maior' },
  { value: 'peitoral_menor', label: 'Peitoral Menor' },
  { value: 'trapezio_superior', label: 'Trapézio Superior' },
  { value: 'esternocleidomastoideo', label: 'Esternocleidomastóideo' },
  { value: 'quadrado_lombar', label: 'Quadrado Lombar' },
  { value: 'tensor_fascia_lata', label: 'Tensor da Fáscia Lata' },
  { value: 'gastrocnemio', label: 'Gastrocnêmio' },
  { value: 'soleo', label: 'Sóleo' },
];

export interface ImagemPostural {
  id: string;
  url: string;
  vista: 'anterior' | 'posterior' | 'lateral_direita' | 'lateral_esquerda';
  descricao?: string;
  created_at: string;
}

export interface AvaliacaoPosturalPilatesData {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  professional_name?: string | null;
  version: number;
  
  // Campos da avaliação
  alinhamento_geral: string | null;
  alinhamento_regioes: Record<string, { status: string; observacao?: string }> | null;
  desvios_posturais: string[] | null;
  desvios_observacoes: string | null;
  encurtamentos: string[] | null;
  encurtamentos_observacoes: string | null;
  assimetrias: string | null;
  observacoes_gerais: string | null;
  imagens_ids: string[] | null;
  
  created_at: string;
}

export interface AvaliacaoPosturalPilatesFormData {
  alinhamento_geral: string;
  alinhamento_regioes: Record<string, { status: string; observacao?: string }>;
  desvios_posturais: string[];
  desvios_observacoes: string;
  encurtamentos: string[];
  encurtamentos_observacoes: string;
  assimetrias: string;
  observacoes_gerais: string;
}

interface UseAvaliacaoPosturalPilatesDataParams {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}

export function useAvaliacaoPosturalPilatesData({ 
  patientId, 
  clinicId, 
  professionalId 
}: UseAvaliacaoPosturalPilatesDataParams) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Buscar todas as versões da avaliação (histórico)
  const historyQuery = useQuery({
    queryKey: ['pilates-avaliacao-postural-history', patientId, clinicId],
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
        .eq('evolution_type', 'avaliacao_postural_pilates')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((record, index, arr) => {
        const content = record.content as Record<string, unknown> | null;
        return {
          id: record.id,
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: record.professional_id,
          professional_name: (record.professionals as { full_name: string } | null)?.full_name || null,
          version: arr.length - index,
          alinhamento_geral: (content?.alinhamento_geral as string) || null,
          alinhamento_regioes: (content?.alinhamento_regioes as Record<string, { status: string; observacao?: string }>) || null,
          desvios_posturais: (content?.desvios_posturais as string[]) || null,
          desvios_observacoes: (content?.desvios_observacoes as string) || null,
          encurtamentos: (content?.encurtamentos as string[]) || null,
          encurtamentos_observacoes: (content?.encurtamentos_observacoes as string) || null,
          assimetrias: (content?.assimetrias as string) || null,
          observacoes_gerais: (content?.observacoes_gerais as string) || null,
          imagens_ids: (content?.imagens_ids as string[]) || null,
          created_at: record.created_at,
        } as AvaliacaoPosturalPilatesData;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Buscar imagens posturais do paciente
  const imagensQuery = useQuery({
    queryKey: ['pilates-imagens-posturais', patientId, clinicId],
    queryFn: async () => {
      if (!patientId || !clinicId) return [];

      const { data, error } = await supabase
        .from('clinical_media')
        .select('id, file_url, description, metadata, created_at')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('media_type', 'image')
        .contains('tags', ['avaliacao_postural'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(img => {
        const meta = img.metadata as Record<string, unknown> | null;
        return {
          id: img.id,
          url: img.file_url,
          vista: (meta?.vista as ImagemPostural['vista']) || 'anterior',
          descricao: img.description || undefined,
          created_at: img.created_at,
        } as ImagemPostural;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Última versão (mais recente)
  const currentAvaliacao = historyQuery.data?.[0] || null;
  const previousAvaliacao = historyQuery.data?.[1] || null;

  // Salvar nova versão da avaliação
  const saveMutation = useMutation({
    mutationFn: async (formData: AvaliacaoPosturalPilatesFormData & { imagens_ids?: string[] }) => {
      if (!patientId || !clinicId || !professionalId) {
        throw new Error('Dados obrigatórios não informados');
      }

      const content = {
        alinhamento_geral: formData.alinhamento_geral || null,
        alinhamento_regioes: Object.keys(formData.alinhamento_regioes).length > 0 ? formData.alinhamento_regioes : null,
        desvios_posturais: formData.desvios_posturais.length > 0 ? formData.desvios_posturais : null,
        desvios_observacoes: formData.desvios_observacoes || null,
        encurtamentos: formData.encurtamentos.length > 0 ? formData.encurtamentos : null,
        encurtamentos_observacoes: formData.encurtamentos_observacoes || null,
        assimetrias: formData.assimetrias || null,
        observacoes_gerais: formData.observacoes_gerais || null,
        imagens_ids: formData.imagens_ids?.length ? formData.imagens_ids : null,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          evolution_type: 'avaliacao_postural_pilates',
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
      queryClient.invalidateQueries({ queryKey: ['pilates-avaliacao-postural-history', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['pilates-summary', patientId, clinicId] });
      toast.success('Avaliação postural salva com sucesso');
      setIsFormOpen(false);
    },
    onError: (error) => {
      console.error('Erro ao salvar avaliação postural:', error);
      toast.error('Erro ao salvar avaliação postural');
    },
  });

  return {
    currentAvaliacao,
    previousAvaliacao,
    history: historyQuery.data || [],
    imagens: imagensQuery.data || [],
    loading: historyQuery.isLoading,
    loadingImagens: imagensQuery.isLoading,
    error: historyQuery.error,
    isFormOpen,
    setIsFormOpen,
    saveAvaliacao: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}

export function getEmptyAvaliacaoPosturalForm(): AvaliacaoPosturalPilatesFormData {
  return {
    alinhamento_geral: '',
    alinhamento_regioes: {},
    desvios_posturais: [],
    desvios_observacoes: '',
    encurtamentos: [],
    encurtamentos_observacoes: '',
    assimetrias: '',
    observacoes_gerais: '',
  };
}
