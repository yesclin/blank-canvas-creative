/**
 * PILATES - Dados da Avaliação Funcional
 * 
 * Hook para gerenciar avaliações funcionais específicas de Pilates
 * com campos: mobilidade, força funcional, equilíbrio, core, respiração, testes.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Opções para nível de mobilidade articular
export const MOBILIDADE_OPTIONS = [
  { value: 'normal', label: 'Normal', description: 'Amplitude completa sem restrições' },
  { value: 'leve_restricao', label: 'Leve Restrição', description: 'Pequena limitação, funcional' },
  { value: 'moderada_restricao', label: 'Moderada Restrição', description: 'Limitação que afeta movimentos' },
  { value: 'grave_restricao', label: 'Grave Restrição', description: 'Limitação significativa' },
];

// Opções para força funcional
export const FORCA_FUNCIONAL_OPTIONS = [
  { value: 'excelente', label: 'Excelente', description: 'Executa todos os movimentos com controle' },
  { value: 'bom', label: 'Bom', description: 'Executa a maioria dos movimentos' },
  { value: 'regular', label: 'Regular', description: 'Dificuldade em alguns movimentos' },
  { value: 'insuficiente', label: 'Insuficiente', description: 'Dificuldade significativa' },
];

// Opções para equilíbrio
export const EQUILIBRIO_PILATES_OPTIONS = [
  { value: 'excelente', label: 'Excelente', description: 'Controle postural pleno' },
  { value: 'bom', label: 'Bom', description: 'Pequenas compensações' },
  { value: 'regular', label: 'Regular', description: 'Compensações frequentes' },
  { value: 'deficiente', label: 'Deficiente', description: 'Instabilidade significativa' },
];

// Opções para controle do core
export const CORE_CONTROL_OPTIONS = [
  { value: 'excelente', label: 'Excelente', description: 'Ativação correta e sustentada' },
  { value: 'bom', label: 'Bom', description: 'Ativação com pequenas falhas' },
  { value: 'regular', label: 'Regular', description: 'Dificuldade em manter ativação' },
  { value: 'insuficiente', label: 'Insuficiente', description: 'Não consegue ativar corretamente' },
];

// Opções para padrão respiratório
export const RESPIRACAO_OPTIONS = [
  { value: 'diafragmatico', label: 'Diafragmático', description: 'Padrão adequado para Pilates' },
  { value: 'toracico_alto', label: 'Torácico Alto', description: 'Respiração superficial' },
  { value: 'paradoxal', label: 'Paradoxal', description: 'Inversão do padrão normal' },
  { value: 'misto', label: 'Misto', description: 'Combinação de padrões' },
];

export interface AvaliacaoFuncionalPilatesData {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  professional_name?: string | null;
  
  // Campos específicos Pilates
  mobilidade_articular: string | null;
  mobilidade_obs: string | null;
  mobilidade_regioes: Record<string, string> | null; // ex: { coluna: 'leve_restricao', quadril: 'normal' }
  
  forca_funcional: string | null;
  forca_obs: string | null;
  
  equilibrio: string | null;
  equilibrio_obs: string | null;
  
  core_control: string | null;
  core_obs: string | null;
  
  padrao_respiratorio: string | null;
  respiracao_obs: string | null;
  
  testes_funcionais: string | null;
  testes_resultados: Record<string, { resultado: string; observacao?: string }> | null;
  
  postura_observacoes: string | null;
  objetivos_pilates: string | null;
  observacoes_gerais: string | null;
  
  created_at: string;
}

export interface AvaliacaoFuncionalPilatesFormData {
  mobilidade_articular: string;
  mobilidade_obs: string;
  mobilidade_regioes: Record<string, string>;
  
  forca_funcional: string;
  forca_obs: string;
  
  equilibrio: string;
  equilibrio_obs: string;
  
  core_control: string;
  core_obs: string;
  
  padrao_respiratorio: string;
  respiracao_obs: string;
  
  testes_funcionais: string;
  testes_resultados: Record<string, { resultado: string; observacao?: string }>;
  
  postura_observacoes: string;
  objetivos_pilates: string;
  observacoes_gerais: string;
}

interface UseAvaliacaoFuncionalPilatesDataParams {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}

export function useAvaliacaoFuncionalPilatesData({ 
  patientId, 
  clinicId, 
  professionalId 
}: UseAvaliacaoFuncionalPilatesDataParams) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Buscar todas as avaliações
  const historyQuery = useQuery({
    queryKey: ['pilates-avaliacao-funcional', patientId, clinicId],
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
        .eq('evolution_type', 'avaliacao_funcional_pilates')
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
          
          mobilidade_articular: (content?.mobilidade_articular as string) || null,
          mobilidade_obs: (content?.mobilidade_obs as string) || null,
          mobilidade_regioes: (content?.mobilidade_regioes as Record<string, string>) || null,
          
          forca_funcional: (content?.forca_funcional as string) || null,
          forca_obs: (content?.forca_obs as string) || null,
          
          equilibrio: (content?.equilibrio as string) || null,
          equilibrio_obs: (content?.equilibrio_obs as string) || null,
          
          core_control: (content?.core_control as string) || null,
          core_obs: (content?.core_obs as string) || null,
          
          padrao_respiratorio: (content?.padrao_respiratorio as string) || null,
          respiracao_obs: (content?.respiracao_obs as string) || null,
          
          testes_funcionais: (content?.testes_funcionais as string) || null,
          testes_resultados: (content?.testes_resultados as Record<string, { resultado: string; observacao?: string }>) || null,
          
          postura_observacoes: (content?.postura_observacoes as string) || null,
          objetivos_pilates: (content?.objetivos_pilates as string) || null,
          observacoes_gerais: (content?.observacoes_gerais as string) || null,
          
          created_at: record.created_at,
        } as AvaliacaoFuncionalPilatesData;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Avaliação atual e anterior para comparação
  const currentAvaliacao = historyQuery.data?.[0] || null;
  const previousAvaliacao = historyQuery.data?.[1] || null;

  // Salvar nova avaliação
  const saveMutation = useMutation({
    mutationFn: async (formData: AvaliacaoFuncionalPilatesFormData) => {
      if (!patientId || !clinicId || !professionalId) {
        throw new Error('Dados obrigatórios não informados');
      }

      const content = {
        mobilidade_articular: formData.mobilidade_articular || null,
        mobilidade_obs: formData.mobilidade_obs || null,
        mobilidade_regioes: Object.keys(formData.mobilidade_regioes).length > 0 ? formData.mobilidade_regioes : null,
        
        forca_funcional: formData.forca_funcional || null,
        forca_obs: formData.forca_obs || null,
        
        equilibrio: formData.equilibrio || null,
        equilibrio_obs: formData.equilibrio_obs || null,
        
        core_control: formData.core_control || null,
        core_obs: formData.core_obs || null,
        
        padrao_respiratorio: formData.padrao_respiratorio || null,
        respiracao_obs: formData.respiracao_obs || null,
        
        testes_funcionais: formData.testes_funcionais || null,
        testes_resultados: Object.keys(formData.testes_resultados).length > 0 ? formData.testes_resultados : null,
        
        postura_observacoes: formData.postura_observacoes || null,
        objetivos_pilates: formData.objetivos_pilates || null,
        observacoes_gerais: formData.observacoes_gerais || null,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          evolution_type: 'avaliacao_funcional_pilates',
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
      queryClient.invalidateQueries({ queryKey: ['pilates-avaliacao-funcional', patientId, clinicId] });
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

export function getEmptyAvaliacaoFormPilates(): AvaliacaoFuncionalPilatesFormData {
  return {
    mobilidade_articular: '',
    mobilidade_obs: '',
    mobilidade_regioes: {},
    forca_funcional: '',
    forca_obs: '',
    equilibrio: '',
    equilibrio_obs: '',
    core_control: '',
    core_obs: '',
    padrao_respiratorio: '',
    respiracao_obs: '',
    testes_funcionais: '',
    testes_resultados: {},
    postura_observacoes: '',
    objetivos_pilates: '',
    observacoes_gerais: '',
  };
}

// Regiões corporais para avaliação de mobilidade
export const REGIOES_MOBILIDADE = [
  { key: 'coluna_cervical', label: 'Coluna Cervical' },
  { key: 'coluna_toracica', label: 'Coluna Torácica' },
  { key: 'coluna_lombar', label: 'Coluna Lombar' },
  { key: 'ombros', label: 'Ombros' },
  { key: 'quadril', label: 'Quadril' },
  { key: 'joelhos', label: 'Joelhos' },
  { key: 'tornozelos', label: 'Tornozelos' },
];

// Testes funcionais comuns em Pilates
export const TESTES_FUNCIONAIS_PILATES = [
  { key: 'roll_up', label: 'Roll Up', description: 'Avalia força e flexibilidade da cadeia posterior' },
  { key: 'roll_down', label: 'Roll Down', description: 'Controle segmentar da coluna' },
  { key: 'single_leg_circle', label: 'Single Leg Circle', description: 'Estabilidade pélvica' },
  { key: 'teaser', label: 'Teaser', description: 'Força de core e controle' },
  { key: 'swan', label: 'Swan', description: 'Extensão de coluna' },
  { key: 'side_plank', label: 'Side Plank', description: 'Estabilidade lateral' },
  { key: 'hundred', label: 'Hundred', description: 'Resistência abdominal e respiração' },
];
