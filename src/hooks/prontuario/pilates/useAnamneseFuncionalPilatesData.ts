/**
 * PILATES - Dados da Anamnese Funcional
 * 
 * Hook para gerenciar anamnese funcional de Pilates com versionamento.
 * Cada atualização cria uma nova versão sem sobrescrever registros anteriores.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Opções para nível de atividade física
export const NIVEL_ATIVIDADE_OPTIONS = [
  { value: 'sedentario', label: 'Sedentário' },
  { value: 'leve', label: 'Levemente ativo (1-2x/semana)' },
  { value: 'moderado', label: 'Moderadamente ativo (3-4x/semana)' },
  { value: 'ativo', label: 'Ativo (5+ x/semana)' },
  { value: 'atleta', label: 'Atleta / Alto rendimento' },
];

// Objetivos comuns de Pilates
export const OBJETIVOS_PILATES_OPTIONS = [
  { value: 'postura', label: 'Melhora da Postura' },
  { value: 'dor', label: 'Alívio de Dor' },
  { value: 'fortalecimento', label: 'Fortalecimento Muscular' },
  { value: 'flexibilidade', label: 'Ganho de Flexibilidade' },
  { value: 'reabilitacao', label: 'Reabilitação Leve' },
  { value: 'condicionamento', label: 'Condicionamento Físico' },
  { value: 'gestantes', label: 'Pilates para Gestantes' },
  { value: 'idosos', label: 'Pilates para Idosos' },
  { value: 'estetica', label: 'Estética Corporal' },
  { value: 'relaxamento', label: 'Relaxamento / Bem-estar' },
];

export interface AnamneseFuncionalPilatesData {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  professional_name?: string | null;
  version: number;
  
  // Campos da anamnese
  queixa_principal: string;
  historico_dores: string | null;
  limitacoes_movimento: string | null;
  nivel_atividade_fisica: string | null;
  cirurgias_previas: string | null;
  habitos_posturais: string | null;
  objetivos_pilates: string[] | null;
  objetivos_outros: string | null;
  observacoes: string | null;
  
  created_at: string;
}

export interface AnamneseFuncionalPilatesFormData {
  queixa_principal: string;
  historico_dores: string;
  limitacoes_movimento: string;
  nivel_atividade_fisica: string;
  cirurgias_previas: string;
  habitos_posturais: string;
  objetivos_pilates: string[];
  objetivos_outros: string;
  observacoes: string;
}

interface UseAnamneseFuncionalPilatesDataParams {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}

export function useAnamneseFuncionalPilatesData({ 
  patientId, 
  clinicId, 
  professionalId 
}: UseAnamneseFuncionalPilatesDataParams) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Buscar todas as versões da anamnese (histórico)
  const historyQuery = useQuery({
    queryKey: ['pilates-anamnese-funcional-history', patientId, clinicId],
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
        .eq('evolution_type', 'anamnese_funcional_pilates')
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
          queixa_principal: (content?.queixa_principal as string) || '',
          historico_dores: (content?.historico_dores as string) || null,
          limitacoes_movimento: (content?.limitacoes_movimento as string) || null,
          nivel_atividade_fisica: (content?.nivel_atividade_fisica as string) || null,
          cirurgias_previas: (content?.cirurgias_previas as string) || null,
          habitos_posturais: (content?.habitos_posturais as string) || null,
          objetivos_pilates: (content?.objetivos_pilates as string[]) || null,
          objetivos_outros: (content?.objetivos_outros as string) || null,
          observacoes: (content?.observacoes as string) || null,
          created_at: record.created_at,
        } as AnamneseFuncionalPilatesData;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Última versão (mais recente)
  const currentAnamnese = historyQuery.data?.[0] || null;

  // Salvar nova versão da anamnese
  const saveMutation = useMutation({
    mutationFn: async (formData: AnamneseFuncionalPilatesFormData) => {
      if (!patientId || !clinicId || !professionalId) {
        throw new Error('Dados obrigatórios não informados');
      }

      const content = {
        queixa_principal: formData.queixa_principal,
        historico_dores: formData.historico_dores || null,
        limitacoes_movimento: formData.limitacoes_movimento || null,
        nivel_atividade_fisica: formData.nivel_atividade_fisica || null,
        cirurgias_previas: formData.cirurgias_previas || null,
        habitos_posturais: formData.habitos_posturais || null,
        objetivos_pilates: formData.objetivos_pilates.length > 0 ? formData.objetivos_pilates : null,
        objetivos_outros: formData.objetivos_outros || null,
        observacoes: formData.observacoes || null,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          evolution_type: 'anamnese_funcional_pilates',
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
      queryClient.invalidateQueries({ queryKey: ['pilates-anamnese-funcional-history', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['pilates-summary', patientId, clinicId] });
      toast.success('Anamnese salva com sucesso');
      setIsFormOpen(false);
    },
    onError: (error) => {
      console.error('Erro ao salvar anamnese:', error);
      toast.error('Erro ao salvar anamnese');
    },
  });

  return {
    currentAnamnese,
    history: historyQuery.data || [],
    loading: historyQuery.isLoading,
    error: historyQuery.error,
    isFormOpen,
    setIsFormOpen,
    saveAnamnese: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}

export function getEmptyAnamneseFuncionalPilatesForm(): AnamneseFuncionalPilatesFormData {
  return {
    queixa_principal: '',
    historico_dores: '',
    limitacoes_movimento: '',
    nivel_atividade_fisica: '',
    cirurgias_previas: '',
    habitos_posturais: '',
    objetivos_pilates: [],
    objetivos_outros: '',
    observacoes: '',
  };
}
