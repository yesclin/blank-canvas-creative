import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface TherapeuticGoal {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string;
  title: string;
  description: string | null;
  priority: 'baixa' | 'media' | 'alta';
  status: 'ativa' | 'concluida' | 'pausada' | 'arquivada';
  progress: number;
  is_measurable: boolean;
  success_indicator: string | null;
  review_date: string | null;
  completed_at: string | null;
  goal_type: 'livre' | 'escala';
  scale_name: string | null;
  initial_score: number | null;
  target_score: number | null;
  current_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface GoalUpdate {
  id: string;
  goal_id: string;
  sessao_id: string | null;
  previous_progress: number;
  new_progress: number;
  observation: string | null;
  score_value: number | null;
  updated_by: string;
  created_at: string;
}

export interface GoalFormData {
  title: string;
  description: string;
  priority: 'baixa' | 'media' | 'alta';
  is_measurable: boolean;
  success_indicator: string;
  review_date: string;
  goal_type: 'livre' | 'escala';
  scale_name: string;
  initial_score: number | null;
  target_score: number | null;
}

export function useMetasTerapeuticasData(patientId: string | null) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  const queryKey = ['therapeutic-goals', patientId, clinic?.id];

  const goalsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];
      const { data, error } = await supabase
        .from('therapeutic_goals' as any)
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .neq('status', 'arquivada')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TherapeuticGoal[];
    },
    enabled: !!patientId && !!clinic?.id,
  });

  const goalUpdatesQuery = async (goalId: string): Promise<GoalUpdate[]> => {
    const { data, error } = await supabase
      .from('therapeutic_goal_updates' as any)
      .select('*')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as GoalUpdate[];
  };

  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      if (!patientId || !clinic?.id) throw new Error('Dados faltando');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const insertData: any = {
        patient_id: patientId,
        clinic_id: clinic.id,
        professional_id: user.id,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        is_measurable: data.is_measurable,
        success_indicator: data.success_indicator || null,
        review_date: data.review_date || null,
        goal_type: data.goal_type || 'livre',
        scale_name: data.goal_type === 'escala' ? data.scale_name : null,
        initial_score: data.goal_type === 'escala' ? data.initial_score : null,
        target_score: data.goal_type === 'escala' ? data.target_score : null,
        current_score: data.goal_type === 'escala' ? data.initial_score : null,
      };
      // Calculate initial progress for scale goals
      if (data.goal_type === 'escala' && data.initial_score != null && data.target_score != null) {
        insertData.progress = 0; // starts at 0%
      }
      const { error } = await supabase.from('therapeutic_goals' as any).insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Meta terapêutica criada');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ goalId, newProgress, observation, sessaoId }: {
      goalId: string; newProgress: number; observation: string; sessaoId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Get current progress
      const { data: goal } = await supabase
        .from('therapeutic_goals' as any)
        .select('progress')
        .eq('id', goalId)
        .single();
      
      const previousProgress = (goal as any)?.progress ?? 0;

      // Insert history
      const { error: histErr } = await supabase.from('therapeutic_goal_updates' as any).insert({
        goal_id: goalId,
        sessao_id: sessaoId || null,
        previous_progress: previousProgress,
        new_progress: newProgress,
        observation: observation || null,
        updated_by: user.id,
      } as any);
      if (histErr) throw histErr;

      // Update goal
      const updateData: any = { progress: newProgress };
      if (newProgress >= 100) {
        updateData.status = 'concluida';
        updateData.completed_at = new Date().toISOString();
      }
      const { error } = await supabase.from('therapeutic_goals' as any)
        .update(updateData).eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Progresso atualizado');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ goalId, status }: { goalId: string; status: string }) => {
      const updateData: any = { status };
      if (status === 'concluida') updateData.completed_at = new Date().toISOString();
      if (status === 'ativa') updateData.completed_at = null;
      
      const { error } = await supabase.from('therapeutic_goals' as any)
        .update(updateData).eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Status atualizado');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateScaleScoreMutation = useMutation({
    mutationFn: async ({ goalId, newScore, sessaoId }: {
      goalId: string; newScore: number; sessaoId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: goal } = await supabase
        .from('therapeutic_goals' as any)
        .select('progress, current_score, initial_score, target_score')
        .eq('id', goalId)
        .single();
      
      const g = goal as any;
      const previousProgress = g?.progress ?? 0;
      const initialScore = g?.initial_score ?? 0;
      const targetScore = g?.target_score ?? 0;
      const previousScore = g?.current_score ?? initialScore;

      // Calculate progress: ((initial - current) / (initial - target)) * 100
      let newProgress = 0;
      if (initialScore !== targetScore) {
        newProgress = Math.round(((initialScore - newScore) / (initialScore - targetScore)) * 100);
        newProgress = Math.max(0, Math.min(100, newProgress));
      }

      // Insert history
      const { error: histErr } = await supabase.from('therapeutic_goal_updates' as any).insert({
        goal_id: goalId,
        sessao_id: sessaoId || null,
        previous_progress: previousProgress,
        new_progress: newProgress,
        score_value: newScore,
        observation: `Pontuação: ${previousScore} → ${newScore}`,
        updated_by: user.id,
      } as any);
      if (histErr) throw histErr;

      const updateData: any = { progress: newProgress, current_score: newScore };
      if (newProgress >= 100) {
        updateData.status = 'concluida';
        updateData.completed_at = new Date().toISOString();
      }
      const { error } = await supabase.from('therapeutic_goals' as any)
        .update(updateData).eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Pontuação da escala atualizada');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    goals: goalsQuery.data || [],
    loading: goalsQuery.isLoading,
    createGoal: createGoalMutation.mutateAsync,
    updateProgress: updateProgressMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    updateScaleScore: updateScaleScoreMutation.mutateAsync,
    fetchGoalUpdates: goalUpdatesQuery,
    saving: createGoalMutation.isPending || updateProgressMutation.isPending || updateStatusMutation.isPending || updateScaleScoreMutation.isPending,
  };
}
