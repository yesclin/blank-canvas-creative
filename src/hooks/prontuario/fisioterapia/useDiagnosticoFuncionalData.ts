/**
 * FISIOTERAPIA - Dados do Diagnóstico Funcional
 * 
 * Hook para gerenciar diagnósticos funcionais fisioterapêuticos.
 * Não exige diagnóstico médico - foco na funcionalidade.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Status do diagnóstico
export const STATUS_DIAGNOSTICO_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'em_tratamento', label: 'Em Tratamento' },
  { value: 'resolvido', label: 'Resolvido' },
  { value: 'estavel', label: 'Estável' },
];

export interface DiagnosticoFuncionalData {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  professional_name?: string | null;
  
  // Campos do diagnóstico
  diagnostico_principal: string;
  diagnosticos_associados: string[];
  justificativa_clinica: string | null;
  cid_codigo: string | null;
  cid_descricao: string | null;
  status: string;
  observacoes: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface DiagnosticoFuncionalFormData {
  diagnostico_principal: string;
  diagnosticos_associados: string[];
  justificativa_clinica: string;
  cid_codigo: string;
  cid_descricao: string;
  status: string;
  observacoes: string;
}

interface UseDiagnosticoFuncionalDataParams {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}

export function useDiagnosticoFuncionalData({ 
  patientId, 
  clinicId, 
  professionalId 
}: UseDiagnosticoFuncionalDataParams) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDiagnostico, setEditingDiagnostico] = useState<DiagnosticoFuncionalData | null>(null);

  // Buscar todos os diagnósticos
  const diagnosticosQuery = useQuery({
    queryKey: ['fisioterapia-diagnostico-funcional', patientId, clinicId],
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
        .eq('evolution_type', 'diagnostico_funcional_fisio')
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
          diagnostico_principal: (content?.diagnostico_principal as string) || '',
          diagnosticos_associados: (content?.diagnosticos_associados as string[]) || [],
          justificativa_clinica: (content?.justificativa_clinica as string) || null,
          cid_codigo: (content?.cid_codigo as string) || null,
          cid_descricao: (content?.cid_descricao as string) || null,
          status: (content?.status as string) || 'ativo',
          observacoes: (content?.observacoes as string) || null,
          created_at: record.created_at,
          updated_at: record.updated_at,
        } as DiagnosticoFuncionalData;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Diagnósticos ativos
  const diagnosticosAtivos = diagnosticosQuery.data?.filter(d => 
    d.status === 'ativo' || d.status === 'em_tratamento'
  ) || [];

  // Salvar novo diagnóstico
  const saveMutation = useMutation({
    mutationFn: async (formData: DiagnosticoFuncionalFormData) => {
      if (!patientId || !clinicId || !professionalId) {
        throw new Error('Dados obrigatórios não informados');
      }

      // Validação
      if (!formData.diagnostico_principal.trim()) {
        throw new Error('Diagnóstico principal é obrigatório');
      }

      const content = {
        diagnostico_principal: formData.diagnostico_principal.trim(),
        diagnosticos_associados: formData.diagnosticos_associados.filter(d => d.trim()),
        justificativa_clinica: formData.justificativa_clinica.trim() || null,
        cid_codigo: formData.cid_codigo.trim() || null,
        cid_descricao: formData.cid_descricao.trim() || null,
        status: formData.status || 'ativo',
        observacoes: formData.observacoes.trim() || null,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          evolution_type: 'diagnostico_funcional_fisio',
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
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-diagnostico-funcional', patientId, clinicId] });
      toast.success('Diagnóstico funcional salvo com sucesso');
      setIsFormOpen(false);
      setEditingDiagnostico(null);
    },
    onError: (error) => {
      console.error('Erro ao salvar diagnóstico:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar diagnóstico');
    },
  });

  // Atualizar diagnóstico existente
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: DiagnosticoFuncionalFormData }) => {
      if (!formData.diagnostico_principal.trim()) {
        throw new Error('Diagnóstico principal é obrigatório');
      }

      const content = {
        diagnostico_principal: formData.diagnostico_principal.trim(),
        diagnosticos_associados: formData.diagnosticos_associados.filter(d => d.trim()),
        justificativa_clinica: formData.justificativa_clinica.trim() || null,
        cid_codigo: formData.cid_codigo.trim() || null,
        cid_descricao: formData.cid_descricao.trim() || null,
        status: formData.status || 'ativo',
        observacoes: formData.observacoes.trim() || null,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-diagnostico-funcional', patientId, clinicId] });
      toast.success('Diagnóstico atualizado com sucesso');
      setIsFormOpen(false);
      setEditingDiagnostico(null);
    },
    onError: (error) => {
      console.error('Erro ao atualizar diagnóstico:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar diagnóstico');
    },
  });

  return {
    diagnosticos: diagnosticosQuery.data || [],
    diagnosticosAtivos,
    loading: diagnosticosQuery.isLoading,
    error: diagnosticosQuery.error,
    isFormOpen,
    setIsFormOpen,
    editingDiagnostico,
    setEditingDiagnostico,
    saveDiagnostico: saveMutation.mutate,
    updateDiagnostico: updateMutation.mutate,
    isSaving: saveMutation.isPending || updateMutation.isPending,
  };
}

export function getEmptyDiagnosticoForm(): DiagnosticoFuncionalFormData {
  return {
    diagnostico_principal: '',
    diagnosticos_associados: [],
    justificativa_clinica: '',
    cid_codigo: '',
    cid_descricao: '',
    status: 'ativo',
    observacoes: '',
  };
}
