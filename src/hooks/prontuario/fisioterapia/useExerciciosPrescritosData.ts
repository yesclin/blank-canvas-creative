/**
 * FISIOTERAPIA - Dados de Exercícios Prescritos
 * 
 * Hook para gerenciar prescrições de exercícios com histórico.
 * Permite atualização conforme evolução do paciente.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Opções de frequência
export const FREQUENCIA_EXERCICIO_OPTIONS = [
  { value: 'diario', label: 'Diário' },
  { value: '2x_dia', label: '2x ao dia' },
  { value: '3x_dia', label: '3x ao dia' },
  { value: '3x_semana', label: '3x por semana' },
  { value: '2x_semana', label: '2x por semana' },
  { value: '1x_semana', label: '1x por semana' },
  { value: 'dias_alternados', label: 'Dias alternados' },
  { value: 'conforme_tolerancia', label: 'Conforme tolerância' },
];

// Status do exercício
export const STATUS_EXERCICIO_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

export interface ExercicioPrescrito {
  id: string;
  nome: string;
  series: number | null;
  repeticoes: string | null;
  carga: string | null;
  frequencia: string;
  orientacoes: string | null;
  observacoes: string | null;
  status: string;
}

export interface PrescricaoExerciciosData {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  professional_name?: string | null;
  
  exercicios: ExercicioPrescrito[];
  orientacoes_gerais: string | null;
  precaucoes: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface ExercicioFormItem {
  id: string;
  nome: string;
  series: string;
  repeticoes: string;
  carga: string;
  frequencia: string;
  orientacoes: string;
  observacoes: string;
  status: string;
}

export interface PrescricaoFormData {
  exercicios: ExercicioFormItem[];
  orientacoes_gerais: string;
  precaucoes: string;
}

interface UseExerciciosPrescritosDataParams {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}

export function useExerciciosPrescritosData({ 
  patientId, 
  clinicId, 
  professionalId 
}: UseExerciciosPrescritosDataParams) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Buscar todas as prescrições
  const prescricoesQuery = useQuery({
    queryKey: ['fisioterapia-exercicios', patientId, clinicId],
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
          professionals:professional_id (
            full_name
          )
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('evolution_type', 'exercicios_prescritos_fisio')
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
          exercicios: (content?.exercicios as ExercicioPrescrito[]) || [],
          orientacoes_gerais: (content?.orientacoes_gerais as string) || null,
          precaucoes: (content?.precaucoes as string) || null,
          created_at: record.created_at,
          updated_at: record.updated_at,
        } as PrescricaoExerciciosData;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Prescrição atual (mais recente)
  const prescricaoAtual = prescricoesQuery.data?.[0] || null;
  
  // Exercícios ativos da prescrição atual
  const exerciciosAtivos = prescricaoAtual?.exercicios.filter(e => e.status === 'ativo') || [];

  // Salvar nova prescrição
  const saveMutation = useMutation({
    mutationFn: async (formData: PrescricaoFormData) => {
      if (!patientId || !clinicId || !professionalId) {
        throw new Error('Dados obrigatórios não informados');
      }

      const exerciciosValidos = formData.exercicios
        .filter(e => e.nome.trim())
        .map(e => ({
          id: e.id,
          nome: e.nome.trim(),
          series: e.series ? parseInt(e.series) : null,
          repeticoes: e.repeticoes.trim() || null,
          carga: e.carga.trim() || null,
          frequencia: e.frequencia,
          orientacoes: e.orientacoes.trim() || null,
          observacoes: e.observacoes.trim() || null,
          status: e.status || 'ativo',
        }));

      if (exerciciosValidos.length === 0) {
        throw new Error('Adicione pelo menos um exercício');
      }

      const content = {
        exercicios: exerciciosValidos,
        orientacoes_gerais: formData.orientacoes_gerais.trim() || null,
        precaucoes: formData.precaucoes.trim() || null,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          evolution_type: 'exercicios_prescritos_fisio',
          specialty: 'fisioterapia',
          content,
          status: 'signed',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-exercicios', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-summary', patientId, clinicId] });
      toast.success('Exercícios prescritos com sucesso');
      setIsFormOpen(false);
      setEditingId(null);
    },
    onError: (error) => {
      console.error('Erro ao salvar exercícios:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar exercícios');
    },
  });

  return {
    prescricoes: prescricoesQuery.data || [],
    prescricaoAtual,
    exerciciosAtivos,
    loading: prescricoesQuery.isLoading,
    error: prescricoesQuery.error,
    isFormOpen,
    setIsFormOpen,
    editingId,
    setEditingId,
    savePrescricao: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}

export function getEmptyExercicio(): ExercicioFormItem {
  return {
    id: crypto.randomUUID(),
    nome: '',
    series: '',
    repeticoes: '',
    carga: '',
    frequencia: 'diario',
    orientacoes: '',
    observacoes: '',
    status: 'ativo',
  };
}

export function getEmptyPrescricaoForm(): PrescricaoFormData {
  return {
    exercicios: [getEmptyExercicio()],
    orientacoes_gerais: '',
    precaucoes: '',
  };
}
