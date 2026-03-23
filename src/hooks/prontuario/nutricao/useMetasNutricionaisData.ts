/**
 * NUTRIÇÃO - Metas Nutricionais
 * 
 * Hook para gerenciar metas e acompanhamento nutricional do paciente.
 * Inclui metas de peso, composição corporal e hábitos alimentares.
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type StatusMeta = 'em_andamento' | 'alcancada' | 'nao_alcancada' | 'ajustada';
export type TipoMeta = 'peso' | 'gordura_corporal' | 'massa_muscular' | 'circunferencia' | 'habito' | 'outro';
export type PrioridadeMeta = 'alta' | 'media' | 'baixa';

export interface MetaNutricional {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string;
  
  // Identificação
  tipo: TipoMeta;
  titulo: string;
  descricao: string | null;
  prioridade: PrioridadeMeta;
  
  // Valores
  valor_inicial: number | null;
  valor_meta: number | null;
  valor_atual: number | null;
  unidade: string | null;
  
  // Prazo
  data_inicio: string;
  data_prazo: string | null;
  data_alcancada: string | null;
  
  // Status
  status: StatusMeta;
  progresso_percent: number;
  
  // Histórico de acompanhamento
  acompanhamentos: AcompanhamentoMeta[];
  
  created_at: string;
  updated_at: string;
}

export interface AcompanhamentoMeta {
  data: string;
  valor: number;
  observacao?: string;
}

export interface MetaFormData {
  tipo: TipoMeta;
  titulo: string;
  descricao: string | null;
  prioridade: PrioridadeMeta;
  valor_inicial: number | null;
  valor_meta: number | null;
  unidade: string | null;
  data_prazo: string | null;
}

/**
 * Calcula o progresso da meta em porcentagem
 */
function calculateProgress(valorInicial: number | null, valorMeta: number | null, valorAtual: number | null): number {
  if (valorInicial === null || valorMeta === null || valorAtual === null) return 0;
  
  const totalChange = valorMeta - valorInicial;
  if (totalChange === 0) return valorAtual === valorMeta ? 100 : 0;
  
  const currentChange = valorAtual - valorInicial;
  const progress = (currentChange / totalChange) * 100;
  
  return Math.min(100, Math.max(0, Math.round(progress)));
}

/**
 * Hook para gerenciar metas nutricionais do paciente
 */
export function useMetasNutricionaisData(patientId: string | null, professionalId?: string) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  
  // Buscar todas as metas do paciente (armazenadas em clinical_evolutions)
  const {
    data: metas,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['nutricao-metas', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];
      
      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('evolution_type', 'meta_nutricional')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Mapear para o formato esperado
      return data.map(item => {
        const content = item.content as Record<string, unknown>;
        const valorInicial = content?.valor_inicial as number | null;
        const valorMeta = content?.valor_meta as number | null;
        const valorAtual = content?.valor_atual as number | null;
        
        return {
          id: item.id,
          patient_id: item.patient_id,
          clinic_id: item.clinic_id,
          professional_id: item.professional_id,
          tipo: (content?.tipo as TipoMeta) || 'outro',
          titulo: (content?.titulo as string) || 'Meta',
          descricao: (content?.descricao as string) || null,
          prioridade: (content?.prioridade as PrioridadeMeta) || 'media',
          valor_inicial: valorInicial,
          valor_meta: valorMeta,
          valor_atual: valorAtual,
          unidade: (content?.unidade as string) || null,
          data_inicio: (content?.data_inicio as string) || item.created_at,
          data_prazo: (content?.data_prazo as string) || null,
          data_alcancada: (content?.data_alcancada as string) || null,
          status: (content?.status as StatusMeta) || 'em_andamento',
          progresso_percent: calculateProgress(valorInicial, valorMeta, valorAtual),
          acompanhamentos: (content?.acompanhamentos as AcompanhamentoMeta[]) || [],
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      }) as MetaNutricional[];
    },
    enabled: !!patientId && !!clinic?.id,
  });
  
  // Metas em andamento
  const metasEmAndamento = metas?.filter(m => m.status === 'em_andamento') || [];
  
  // Metas alcançadas
  const metasAlcancadas = metas?.filter(m => m.status === 'alcancada') || [];
  
  // Criar nova meta
  const createMeta = useCallback(async (formData: MetaFormData) => {
    if (!patientId || !clinic?.id || !professionalId) {
      toast.error('Dados incompletos para criar meta');
      return null;
    }
    
    setSaving(true);
    
    try {
      const content = {
        tipo: formData.tipo,
        titulo: formData.titulo,
        descricao: formData.descricao,
        prioridade: formData.prioridade,
        valor_inicial: formData.valor_inicial,
        valor_meta: formData.valor_meta,
        valor_atual: formData.valor_inicial, // Valor atual começa igual ao inicial
        unidade: formData.unidade,
        data_inicio: new Date().toISOString().split('T')[0],
        data_prazo: formData.data_prazo,
        data_alcancada: null,
        status: 'em_andamento',
        acompanhamentos: formData.valor_inicial !== null ? [{
          data: new Date().toISOString().split('T')[0],
          valor: formData.valor_inicial,
          observacao: 'Valor inicial',
        }] : [],
      };
      
      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          professional_id: professionalId,
          evolution_type: 'meta_nutricional',
          specialty: 'nutricao',
          content,
          notes: formData.descricao,
          status: 'signed',
          signed_at: new Date().toISOString(),
          signed_by: professionalId,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Meta nutricional criada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['nutricao-metas', patientId] });
      
      return data;
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      toast.error('Erro ao criar meta nutricional');
      return null;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, professionalId, queryClient]);
  
  // Atualizar progresso da meta
  const updateProgress = useCallback(async (metaId: string, novoValor: number, observacao?: string) => {
    if (!patientId || !clinic?.id) return false;
    
    try {
      // Buscar meta atual
      const { data: currentMeta, error: fetchError } = await supabase
        .from('clinical_evolutions')
        .select('content')
        .eq('id', metaId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const content = currentMeta.content as Record<string, unknown>;
      const acompanhamentos = (content.acompanhamentos as AcompanhamentoMeta[]) || [];
      
      // Adicionar novo acompanhamento
      acompanhamentos.push({
        data: new Date().toISOString().split('T')[0],
        valor: novoValor,
        observacao,
      });
      
      // Verificar se meta foi alcançada
      const valorMeta = content.valor_meta as number | null;
      const valorInicial = content.valor_inicial as number | null;
      let novoStatus = content.status as StatusMeta;
      let dataAlcancada = content.data_alcancada as string | null;
      
      if (valorMeta !== null && valorInicial !== null) {
        // Meta de redução (ex: perda de peso)
        if (valorMeta < valorInicial && novoValor <= valorMeta) {
          novoStatus = 'alcancada';
          dataAlcancada = new Date().toISOString().split('T')[0];
        }
        // Meta de aumento (ex: ganho de massa)
        else if (valorMeta > valorInicial && novoValor >= valorMeta) {
          novoStatus = 'alcancada';
          dataAlcancada = new Date().toISOString().split('T')[0];
        }
      }
      
      const updatedContent = {
        ...content,
        valor_atual: novoValor,
        status: novoStatus,
        data_alcancada: dataAlcancada,
        acompanhamentos,
      };
      
      // Atualizar meta
      const { error } = await supabase
        .from('clinical_evolutions')
        .update({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: updatedContent as any,
        })
        .eq('id', metaId);
      
      if (error) throw error;
      
      toast.success(novoStatus === 'alcancada' ? '🎉 Meta alcançada!' : 'Progresso atualizado');
      queryClient.invalidateQueries({ queryKey: ['nutricao-metas', patientId] });
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      toast.error('Erro ao atualizar progresso');
      return false;
    }
  }, [patientId, clinic?.id, queryClient]);
  
  return {
    metas: metas || [],
    metasEmAndamento,
    metasAlcancadas,
    loading,
    saving,
    createMeta,
    updateProgress,
    refetch,
  };
}

// Labels para tipos de meta
export const TIPO_META_LABELS: Record<TipoMeta, string> = {
  peso: 'Peso Corporal',
  gordura_corporal: 'Gordura Corporal',
  massa_muscular: 'Massa Muscular',
  circunferencia: 'Circunferência',
  habito: 'Hábito Alimentar',
  outro: 'Outro',
};

// Labels para status
export const STATUS_META_LABELS: Record<StatusMeta, string> = {
  em_andamento: 'Em Andamento',
  alcancada: 'Alcançada',
  nao_alcancada: 'Não Alcançada',
  ajustada: 'Ajustada',
};

// Labels para prioridade
export const PRIORIDADE_META_LABELS: Record<PrioridadeMeta, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};
