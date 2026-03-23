/**
 * PILATES - Dados do Plano de Exercícios
 * 
 * Hook para gerenciar planos de exercícios com versionamento.
 * Cada atualização cria uma nova versão sem sobrescrever registros anteriores.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Aparelhos de Pilates
export const APARELHOS_PILATES = [
  { value: 'solo', label: 'Solo (Mat)' },
  { value: 'reformer', label: 'Reformer' },
  { value: 'cadillac', label: 'Cadillac / Trapézio' },
  { value: 'chair', label: 'Chair (Cadeira)' },
  { value: 'barrel', label: 'Barrel (Barril)' },
  { value: 'ladder_barrel', label: 'Ladder Barrel' },
  { value: 'spine_corrector', label: 'Spine Corrector' },
  { value: 'wall_unit', label: 'Wall Unit' },
  { value: 'acessorios', label: 'Acessórios (bola, faixa, etc.)' },
];

// Focos de treino
export const FOCOS_TREINO = [
  { value: 'fortalecimento_core', label: 'Fortalecimento de Core' },
  { value: 'flexibilidade', label: 'Flexibilidade' },
  { value: 'mobilidade', label: 'Mobilidade Articular' },
  { value: 'postura', label: 'Correção Postural' },
  { value: 'equilibrio', label: 'Equilíbrio' },
  { value: 'coordenacao', label: 'Coordenação Motora' },
  { value: 'fortalecimento_mmii', label: 'Fortalecimento MMII' },
  { value: 'fortalecimento_mmss', label: 'Fortalecimento MMSS' },
  { value: 'alongamento', label: 'Alongamento' },
  { value: 'respiracao', label: 'Trabalho Respiratório' },
  { value: 'relaxamento', label: 'Relaxamento' },
  { value: 'reabilitacao', label: 'Reabilitação' },
];

// Exercícios comuns de Pilates
export const EXERCICIOS_PILATES = [
  // Solo / Mat
  { value: 'hundred', label: 'The Hundred', aparelho: 'solo' },
  { value: 'roll_up', label: 'Roll Up', aparelho: 'solo' },
  { value: 'roll_over', label: 'Roll Over', aparelho: 'solo' },
  { value: 'single_leg_circle', label: 'Single Leg Circle', aparelho: 'solo' },
  { value: 'rolling_like_ball', label: 'Rolling Like a Ball', aparelho: 'solo' },
  { value: 'single_leg_stretch', label: 'Single Leg Stretch', aparelho: 'solo' },
  { value: 'double_leg_stretch', label: 'Double Leg Stretch', aparelho: 'solo' },
  { value: 'spine_stretch', label: 'Spine Stretch Forward', aparelho: 'solo' },
  { value: 'saw', label: 'Saw', aparelho: 'solo' },
  { value: 'swan', label: 'Swan / Swan Dive', aparelho: 'solo' },
  { value: 'swimming', label: 'Swimming', aparelho: 'solo' },
  { value: 'teaser', label: 'Teaser', aparelho: 'solo' },
  { value: 'side_kick', label: 'Side Kick Series', aparelho: 'solo' },
  { value: 'plank', label: 'Plank / Front Support', aparelho: 'solo' },
  { value: 'side_plank', label: 'Side Plank', aparelho: 'solo' },
  { value: 'leg_pull_front', label: 'Leg Pull Front', aparelho: 'solo' },
  { value: 'leg_pull_back', label: 'Leg Pull Back', aparelho: 'solo' },
  { value: 'mermaid', label: 'Mermaid', aparelho: 'solo' },
  { value: 'seal', label: 'Seal', aparelho: 'solo' },
  
  // Reformer
  { value: 'footwork', label: 'Footwork', aparelho: 'reformer' },
  { value: 'leg_circles_reformer', label: 'Leg Circles', aparelho: 'reformer' },
  { value: 'frog', label: 'Frog', aparelho: 'reformer' },
  { value: 'stomach_massage', label: 'Stomach Massage', aparelho: 'reformer' },
  { value: 'short_spine', label: 'Short Spine', aparelho: 'reformer' },
  { value: 'long_spine', label: 'Long Spine', aparelho: 'reformer' },
  { value: 'knee_stretch', label: 'Knee Stretch Series', aparelho: 'reformer' },
  { value: 'running', label: 'Running', aparelho: 'reformer' },
  { value: 'elephant', label: 'Elephant', aparelho: 'reformer' },
  { value: 'long_stretch', label: 'Long Stretch', aparelho: 'reformer' },
  { value: 'down_stretch', label: 'Down Stretch', aparelho: 'reformer' },
  { value: 'up_stretch', label: 'Up Stretch', aparelho: 'reformer' },
  { value: 'arabesque', label: 'Arabesque', aparelho: 'reformer' },
  { value: 'side_splits', label: 'Side Splits', aparelho: 'reformer' },
  { value: 'front_splits', label: 'Front Splits', aparelho: 'reformer' },
  
  // Cadillac
  { value: 'roll_down_bar', label: 'Roll Down Bar', aparelho: 'cadillac' },
  { value: 'push_through', label: 'Push Through', aparelho: 'cadillac' },
  { value: 'tower', label: 'Tower', aparelho: 'cadillac' },
  { value: 'leg_springs', label: 'Leg Springs', aparelho: 'cadillac' },
  { value: 'arm_springs', label: 'Arm Springs', aparelho: 'cadillac' },
  { value: 'breathing', label: 'Breathing', aparelho: 'cadillac' },
  { value: 'monkey', label: 'Monkey', aparelho: 'cadillac' },
  { value: 'cat_stretch', label: 'Cat Stretch', aparelho: 'cadillac' },
  
  // Chair
  { value: 'pumping', label: 'Pumping', aparelho: 'chair' },
  { value: 'going_up_front', label: 'Going Up Front', aparelho: 'chair' },
  { value: 'going_up_side', label: 'Going Up Side', aparelho: 'chair' },
  { value: 'swan_chair', label: 'Swan', aparelho: 'chair' },
  { value: 'tendon_stretch', label: 'Tendon Stretch', aparelho: 'chair' },
  { value: 'mountain_climber', label: 'Mountain Climber', aparelho: 'chair' },
  
  // Barrel
  { value: 'swan_barrel', label: 'Swan', aparelho: 'barrel' },
  { value: 'horseback', label: 'Horseback', aparelho: 'barrel' },
  { value: 'side_sit_ups', label: 'Side Sit Ups', aparelho: 'barrel' },
];

export interface ExercicioPrescrito {
  id: string;
  exercicio: string;
  exercicio_custom?: string;
  aparelho: string;
  series: number;
  repeticoes: string;
  carga?: string;
  mola?: string;
  observacoes?: string;
}

export interface PlanoExerciciosPilatesData {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  professional_name?: string | null;
  version: number;
  
  // Campos do plano
  titulo: string;
  focos_treino: string[] | null;
  exercicios: ExercicioPrescrito[];
  duracao_estimada: string | null;
  frequencia_semanal: string | null;
  observacoes_gerais: string | null;
  
  created_at: string;
}

export interface PlanoExerciciosPilatesFormData {
  titulo: string;
  focos_treino: string[];
  exercicios: ExercicioPrescrito[];
  duracao_estimada: string;
  frequencia_semanal: string;
  observacoes_gerais: string;
}

interface UsePlanoExerciciosPilatesDataParams {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}

export function usePlanoExerciciosPilatesData({ 
  patientId, 
  clinicId, 
  professionalId 
}: UsePlanoExerciciosPilatesDataParams) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Buscar todas as versões do plano (histórico)
  const historyQuery = useQuery({
    queryKey: ['pilates-plano-exercicios-history', patientId, clinicId],
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
        .eq('evolution_type', 'plano_exercicios_pilates')
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
          titulo: (content?.titulo as string) || 'Plano de Exercícios',
          focos_treino: (content?.focos_treino as string[]) || null,
          exercicios: (content?.exercicios as ExercicioPrescrito[]) || [],
          duracao_estimada: (content?.duracao_estimada as string) || null,
          frequencia_semanal: (content?.frequencia_semanal as string) || null,
          observacoes_gerais: (content?.observacoes_gerais as string) || null,
          created_at: record.created_at,
        } as PlanoExerciciosPilatesData;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Última versão (mais recente)
  const currentPlano = historyQuery.data?.[0] || null;

  // Salvar nova versão do plano
  const saveMutation = useMutation({
    mutationFn: async (formData: PlanoExerciciosPilatesFormData) => {
      if (!patientId || !clinicId || !professionalId) {
        throw new Error('Dados obrigatórios não informados');
      }

      const content = {
        titulo: formData.titulo || 'Plano de Exercícios',
        focos_treino: formData.focos_treino.length > 0 ? formData.focos_treino : null,
        exercicios: formData.exercicios.map(ex => ({
          id: ex.id,
          exercicio: ex.exercicio,
          exercicio_custom: ex.exercicio_custom || null,
          aparelho: ex.aparelho,
          series: ex.series,
          repeticoes: ex.repeticoes,
          carga: ex.carga || null,
          mola: ex.mola || null,
          observacoes: ex.observacoes || null,
        })),
        duracao_estimada: formData.duracao_estimada || null,
        frequencia_semanal: formData.frequencia_semanal || null,
        observacoes_gerais: formData.observacoes_gerais || null,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          evolution_type: 'plano_exercicios_pilates',
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
      queryClient.invalidateQueries({ queryKey: ['pilates-plano-exercicios-history', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['pilates-summary', patientId, clinicId] });
      toast.success('Plano de exercícios salvo com sucesso');
      setIsFormOpen(false);
    },
    onError: (error) => {
      console.error('Erro ao salvar plano:', error);
      toast.error('Erro ao salvar plano de exercícios');
    },
  });

  return {
    currentPlano,
    history: historyQuery.data || [],
    loading: historyQuery.isLoading,
    error: historyQuery.error,
    isFormOpen,
    setIsFormOpen,
    savePlano: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}

export function getEmptyPlanoExerciciosForm(): PlanoExerciciosPilatesFormData {
  return {
    titulo: '',
    focos_treino: [],
    exercicios: [],
    duracao_estimada: '',
    frequencia_semanal: '',
    observacoes_gerais: '',
  };
}

export function createEmptyExercicio(): ExercicioPrescrito {
  return {
    id: crypto.randomUUID(),
    exercicio: '',
    aparelho: 'solo',
    series: 1,
    repeticoes: '10',
  };
}
