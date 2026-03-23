/**
 * FISIOTERAPIA - Dados do Plano Terapêutico
 * 
 * Hook para gerenciar planos terapêuticos com versionamento.
 * Cada atualização cria uma nova versão, mantendo histórico completo.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Opções para frequência das sessões
export const FREQUENCIA_SESSAO_OPTIONS = [
  { value: 'diaria', label: 'Diária' },
  { value: '3x_semana', label: '3x por semana' },
  { value: '2x_semana', label: '2x por semana' },
  { value: '1x_semana', label: '1x por semana' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'sob_demanda', label: 'Sob demanda' },
];

// Status do plano
export const STATUS_PLANO_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'rascunho', label: 'Rascunho' },
];

export interface PlanoTerapeuticoData {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  professional_name?: string | null;
  version: number;
  
  // Campos do plano
  titulo: string;
  objetivos: string[];
  tecnicas: string[];
  frequencia_sessoes: string;
  duracao_prevista: string | null;
  duracao_semanas: number | null;
  criterios_reavaliacao: string | null;
  recursos_equipamentos: string | null;
  orientacoes_domiciliares: string | null;
  observacoes: string | null;
  status: string;
  
  created_at: string;
  updated_at: string;
}

export interface PlanoTerapeuticoFormData {
  titulo: string;
  objetivos: string[];
  tecnicas: string[];
  frequencia_sessoes: string;
  duracao_prevista: string;
  duracao_semanas: number | null;
  criterios_reavaliacao: string;
  recursos_equipamentos: string;
  orientacoes_domiciliares: string;
  observacoes: string;
  status: string;
}

interface UsePlanoTerapeuticoDataParams {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}

export function usePlanoTerapeuticoData({ 
  patientId, 
  clinicId, 
  professionalId 
}: UsePlanoTerapeuticoDataParams) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Buscar todos os planos (histórico)
  const historyQuery = useQuery({
    queryKey: ['fisioterapia-plano-terapeutico', patientId, clinicId],
    queryFn: async () => {
      if (!patientId || !clinicId) return [];

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select(`
          id,
          content,
          created_at,
          updated_at,
          professional_id,
          status,
          professionals:professional_id (
            full_name
          )
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('evolution_type', 'plano_terapeutico_fisio')
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
          titulo: (content?.titulo as string) || 'Plano Terapêutico',
          objetivos: (content?.objetivos as string[]) || [],
          tecnicas: (content?.tecnicas as string[]) || [],
          frequencia_sessoes: (content?.frequencia_sessoes as string) || '',
          duracao_prevista: (content?.duracao_prevista as string) || null,
          duracao_semanas: (content?.duracao_semanas as number) || null,
          criterios_reavaliacao: (content?.criterios_reavaliacao as string) || null,
          recursos_equipamentos: (content?.recursos_equipamentos as string) || null,
          orientacoes_domiciliares: (content?.orientacoes_domiciliares as string) || null,
          observacoes: (content?.observacoes as string) || null,
          status: (content?.status as string) || record.status || 'ativo',
          created_at: record.created_at,
          updated_at: record.updated_at,
        } as PlanoTerapeuticoData;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Plano atual (mais recente e ativo)
  const planoAtivo = historyQuery.data?.find(p => p.status === 'ativo') || null;
  const planoAtual = historyQuery.data?.[0] || null;

  // Salvar novo plano (nova versão)
  const saveMutation = useMutation({
    mutationFn: async (formData: PlanoTerapeuticoFormData) => {
      if (!patientId || !clinicId || !professionalId) {
        throw new Error('Dados obrigatórios não informados');
      }

      // Validação
      if (!formData.titulo.trim()) {
        throw new Error('Título do plano é obrigatório');
      }
      if (formData.objetivos.filter(o => o.trim()).length === 0) {
        throw new Error('Pelo menos um objetivo é obrigatório');
      }

      const content = {
        titulo: formData.titulo.trim(),
        objetivos: formData.objetivos.filter(o => o.trim()),
        tecnicas: formData.tecnicas.filter(t => t.trim()),
        frequencia_sessoes: formData.frequencia_sessoes || null,
        duracao_prevista: formData.duracao_prevista.trim() || null,
        duracao_semanas: formData.duracao_semanas,
        criterios_reavaliacao: formData.criterios_reavaliacao.trim() || null,
        recursos_equipamentos: formData.recursos_equipamentos.trim() || null,
        orientacoes_domiciliares: formData.orientacoes_domiciliares.trim() || null,
        observacoes: formData.observacoes.trim() || null,
        status: formData.status || 'ativo',
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          evolution_type: 'plano_terapeutico_fisio',
          specialty: 'fisioterapia',
          content,
          status: formData.status === 'rascunho' ? 'rascunho' : 'assinado',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-plano-terapeutico', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-summary', patientId, clinicId] });
      toast.success('Plano terapêutico salvo com sucesso');
      setIsFormOpen(false);
    },
    onError: (error) => {
      console.error('Erro ao salvar plano:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar plano');
    },
  });

  return {
    planoAtivo,
    planoAtual,
    history: historyQuery.data || [],
    loading: historyQuery.isLoading,
    error: historyQuery.error,
    isFormOpen,
    setIsFormOpen,
    savePlano: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}

export function getEmptyPlanoForm(): PlanoTerapeuticoFormData {
  return {
    titulo: '',
    objetivos: [''],
    tecnicas: [''],
    frequencia_sessoes: '',
    duracao_prevista: '',
    duracao_semanas: null,
    criterios_reavaliacao: '',
    recursos_equipamentos: '',
    orientacoes_domiciliares: '',
    observacoes: '',
    status: 'ativo',
  };
}
