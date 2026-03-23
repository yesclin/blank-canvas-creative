/**
 * PILATES - Dados das Sessões
 * 
 * Hook para gerenciar sessões de Pilates.
 * Cada sessão é um registro independente com data e evolução do aluno.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Níveis de resposta do aluno
export const RESPOSTA_ALUNO_OPTIONS = [
  { value: 'excelente', label: 'Excelente', color: 'bg-green-500' },
  { value: 'boa', label: 'Boa', color: 'bg-blue-500' },
  { value: 'regular', label: 'Regular', color: 'bg-yellow-500' },
  { value: 'dificuldade', label: 'Com Dificuldade', color: 'bg-orange-500' },
  { value: 'impossibilitado', label: 'Impossibilitado', color: 'bg-red-500' },
];

// Tipos de ajustes comuns
export const AJUSTES_COMUNS = [
  { value: 'reducao_carga', label: 'Redução de carga' },
  { value: 'aumento_carga', label: 'Aumento de carga' },
  { value: 'reducao_repeticoes', label: 'Redução de repetições' },
  { value: 'aumento_repeticoes', label: 'Aumento de repetições' },
  { value: 'troca_exercicio', label: 'Troca de exercício' },
  { value: 'adaptacao_amplitude', label: 'Adaptação de amplitude' },
  { value: 'foco_respiracao', label: 'Foco na respiração' },
  { value: 'foco_alinhamento', label: 'Foco no alinhamento' },
  { value: 'uso_acessorio', label: 'Uso de acessório auxiliar' },
  { value: 'pausas_extras', label: 'Pausas extras' },
];

export interface ExercicioRealizado {
  id: string;
  exercicio: string;
  exercicio_custom?: string;
  aparelho: string;
  series_realizadas: number;
  repeticoes_realizadas: string;
  resposta: string;
  ajustes?: string;
  observacao?: string;
}

export interface SessaoPilatesData {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  professional_name?: string | null;
  
  // Campos da sessão
  data_sessao: string;
  exercicios_realizados: ExercicioRealizado[];
  resposta_geral: string | null;
  ajustes_sessao: string[] | null;
  observacoes: string | null;
  proxima_sessao_foco: string | null;
  
  created_at: string;
}

export interface SessaoPilatesFormData {
  data_sessao: string;
  exercicios_realizados: ExercicioRealizado[];
  resposta_geral: string;
  ajustes_sessao: string[];
  observacoes: string;
  proxima_sessao_foco: string;
}

interface UseSessoesPilatesDataParams {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}

export function useSessoesPilatesData({ 
  patientId, 
  clinicId, 
  professionalId 
}: UseSessoesPilatesDataParams) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Buscar todas as sessões (ordem cronológica decrescente)
  const sessoesQuery = useQuery({
    queryKey: ['pilates-sessoes', patientId, clinicId],
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
        .eq('evolution_type', 'sessao_pilates')
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
          data_sessao: (content?.data_sessao as string) || record.created_at,
          exercicios_realizados: (content?.exercicios_realizados as ExercicioRealizado[]) || [],
          resposta_geral: (content?.resposta_geral as string) || null,
          ajustes_sessao: (content?.ajustes_sessao as string[]) || null,
          observacoes: (content?.observacoes as string) || null,
          proxima_sessao_foco: (content?.proxima_sessao_foco as string) || null,
          created_at: record.created_at,
        } as SessaoPilatesData;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Salvar nova sessão
  const saveMutation = useMutation({
    mutationFn: async (formData: SessaoPilatesFormData) => {
      if (!patientId || !clinicId || !professionalId) {
        throw new Error('Dados obrigatórios não informados');
      }

      const content = {
        data_sessao: formData.data_sessao,
        exercicios_realizados: formData.exercicios_realizados.map(ex => ({
          id: ex.id,
          exercicio: ex.exercicio,
          exercicio_custom: ex.exercicio_custom || null,
          aparelho: ex.aparelho,
          series_realizadas: ex.series_realizadas,
          repeticoes_realizadas: ex.repeticoes_realizadas,
          resposta: ex.resposta,
          ajustes: ex.ajustes || null,
          observacao: ex.observacao || null,
        })),
        resposta_geral: formData.resposta_geral || null,
        ajustes_sessao: formData.ajustes_sessao.length > 0 ? formData.ajustes_sessao : null,
        observacoes: formData.observacoes || null,
        proxima_sessao_foco: formData.proxima_sessao_foco || null,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          evolution_type: 'sessao_pilates',
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
      queryClient.invalidateQueries({ queryKey: ['pilates-sessoes', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['pilates-summary', patientId, clinicId] });
      toast.success('Sessão registrada com sucesso');
      setIsFormOpen(false);
    },
    onError: (error) => {
      console.error('Erro ao salvar sessão:', error);
      toast.error('Erro ao registrar sessão');
    },
  });

  return {
    sessoes: sessoesQuery.data || [],
    loading: sessoesQuery.isLoading,
    error: sessoesQuery.error,
    isFormOpen,
    setIsFormOpen,
    saveSessao: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}

export function getEmptySessaoForm(): SessaoPilatesFormData {
  return {
    data_sessao: new Date().toISOString().split('T')[0],
    exercicios_realizados: [],
    resposta_geral: '',
    ajustes_sessao: [],
    observacoes: '',
    proxima_sessao_foco: '',
  };
}

export function createEmptyExercicioRealizado(): ExercicioRealizado {
  return {
    id: crypto.randomUUID(),
    exercicio: '',
    aparelho: 'solo',
    series_realizadas: 1,
    repeticoes_realizadas: '10',
    resposta: 'boa',
  };
}
