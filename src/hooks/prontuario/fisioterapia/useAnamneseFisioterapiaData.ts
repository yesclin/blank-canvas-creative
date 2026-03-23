/**
 * FISIOTERAPIA - Dados da Anamnese
 * 
 * Hook para gerenciar anamnese fisioterapêutica com versionamento.
 * Cada atualização cria uma nova versão sem sobrescrever registros anteriores.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AnamneseFisioterapiaData {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  version: number;
  
  // Campos da anamnese
  queixa_principal: string;
  historico_dor: string | null;
  mecanismo_lesao: string | null;
  limitacoes_funcionais: string | null;
  atividades_agravantes: string | null;
  atividades_aliviadoras: string | null;
  tratamentos_anteriores: string | null;
  objetivos_paciente: string | null;
  observacoes: string | null;
  
  created_at: string;
  created_by: string | null;
}

export interface AnamneseFisioterapiaFormData {
  queixa_principal: string;
  historico_dor: string;
  mecanismo_lesao: string;
  limitacoes_funcionais: string;
  atividades_agravantes: string;
  atividades_aliviadoras: string;
  tratamentos_anteriores: string;
  objetivos_paciente: string;
  observacoes: string;
}

interface UseAnamneseFisioterapiaDataParams {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}

export function useAnamneseFisioterapiaData({ 
  patientId, 
  clinicId, 
  professionalId 
}: UseAnamneseFisioterapiaDataParams) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Buscar todas as versões da anamnese (histórico)
  const historyQuery = useQuery({
    queryKey: ['fisioterapia-anamnese-history', patientId, clinicId],
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
        .eq('evolution_type', 'anamnese_fisioterapia')
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
          historico_dor: (content?.historico_dor as string) || null,
          mecanismo_lesao: (content?.mecanismo_lesao as string) || null,
          limitacoes_funcionais: (content?.limitacoes_funcionais as string) || null,
          atividades_agravantes: (content?.atividades_agravantes as string) || null,
          atividades_aliviadoras: (content?.atividades_aliviadoras as string) || null,
          tratamentos_anteriores: (content?.tratamentos_anteriores as string) || null,
          objetivos_paciente: (content?.objetivos_paciente as string) || null,
          observacoes: (content?.observacoes as string) || null,
          created_at: record.created_at,
          created_by: record.professional_id,
        } as AnamneseFisioterapiaData & { professional_name: string | null };
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Última versão (mais recente)
  const currentAnamnese = historyQuery.data?.[0] || null;

  // Salvar nova versão da anamnese
  const saveMutation = useMutation({
    mutationFn: async (formData: AnamneseFisioterapiaFormData) => {
      if (!patientId || !clinicId || !professionalId) {
        throw new Error('Dados obrigatórios não informados');
      }

      const content = {
        queixa_principal: formData.queixa_principal,
        historico_dor: formData.historico_dor || null,
        mecanismo_lesao: formData.mecanismo_lesao || null,
        limitacoes_funcionais: formData.limitacoes_funcionais || null,
        atividades_agravantes: formData.atividades_agravantes || null,
        atividades_aliviadoras: formData.atividades_aliviadoras || null,
        tratamentos_anteriores: formData.tratamentos_anteriores || null,
        objetivos_paciente: formData.objetivos_paciente || null,
        observacoes: formData.observacoes || null,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          evolution_type: 'anamnese_fisioterapia',
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
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-anamnese-history', patientId, clinicId] });
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

export function getEmptyAnamneseForm(): AnamneseFisioterapiaFormData {
  return {
    queixa_principal: '',
    historico_dor: '',
    mecanismo_lesao: '',
    limitacoes_funcionais: '',
    atividades_agravantes: '',
    atividades_aliviadoras: '',
    tratamentos_anteriores: '',
    objetivos_paciente: '',
    observacoes: '',
  };
}
