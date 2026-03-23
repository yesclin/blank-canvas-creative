/**
 * FISIOTERAPIA - Dados de Alertas Funcionais
 * 
 * Hook para gerenciar alertas de restrições, contraindicações
 * e riscos funcionais do paciente.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Tipos de alerta
export const TIPO_ALERTA_OPTIONS = [
  { value: 'restricao_movimento', label: 'Restrição de Movimento' },
  { value: 'contraindicacao', label: 'Contraindicação' },
  { value: 'risco_funcional', label: 'Risco Funcional' },
  { value: 'precaucao', label: 'Precaução' },
  { value: 'alergia', label: 'Alergia' },
  { value: 'outro', label: 'Outro' },
];

// Severidade
export const SEVERIDADE_ALERTA_OPTIONS = [
  { value: 'critico', label: 'Crítico', color: 'destructive' as const },
  { value: 'alto', label: 'Alto', color: 'destructive' as const },
  { value: 'moderado', label: 'Moderado', color: 'secondary' as const },
  { value: 'baixo', label: 'Baixo', color: 'outline' as const },
];

export interface AlertaFuncional {
  id: string;
  patient_id: string;
  clinic_id: string;
  created_by: string | null;
  created_by_name?: string | null;
  
  tipo: string;
  severidade: string;
  titulo: string;
  descricao: string | null;
  is_ativo: boolean;
  data_inicio: string | null;
  data_fim: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface AlertaFormData {
  tipo: string;
  severidade: string;
  titulo: string;
  descricao: string;
  is_ativo: boolean;
  data_inicio: string;
  data_fim: string;
}

interface UseAlertasFuncionaisDataParams {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}

export function useAlertasFuncionaisData({ 
  patientId, 
  clinicId,
  professionalId
}: UseAlertasFuncionaisDataParams) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlerta, setEditingAlerta] = useState<AlertaFuncional | null>(null);

  // Buscar alertas
  const alertasQuery = useQuery({
    queryKey: ['fisioterapia-alertas', patientId, clinicId],
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
        .eq('evolution_type', 'alerta_funcional_fisio')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((record) => {
        const content = record.content as Record<string, unknown> | null;
        return {
          id: record.id,
          patient_id: patientId,
          clinic_id: clinicId,
          created_by: record.professional_id,
          created_by_name: (record.professionals as { full_name: string } | null)?.full_name || null,
          tipo: (content?.tipo as string) || 'outro',
          severidade: (content?.severidade as string) || 'moderado',
          titulo: (content?.titulo as string) || '',
          descricao: (content?.descricao as string) || null,
          is_ativo: (content?.is_ativo as boolean) ?? true,
          data_inicio: (content?.data_inicio as string) || null,
          data_fim: (content?.data_fim as string) || null,
          created_at: record.created_at,
          updated_at: record.updated_at,
        } as AlertaFuncional;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Alertas ativos
  const alertasAtivos = (alertasQuery.data || []).filter(a => a.is_ativo);
  
  // Alertas críticos
  const alertasCriticos = alertasAtivos.filter(a => 
    a.severidade === 'critico' || a.severidade === 'alto'
  );

  // Salvar alerta
  const saveMutation = useMutation({
    mutationFn: async (formData: AlertaFormData) => {
      if (!patientId || !clinicId || !professionalId) {
        throw new Error('Dados obrigatórios não informados');
      }

      if (!formData.titulo.trim()) {
        throw new Error('Título é obrigatório');
      }

      const content = {
        tipo: formData.tipo,
        severidade: formData.severidade,
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || null,
        is_ativo: formData.is_ativo,
        data_inicio: formData.data_inicio || null,
        data_fim: formData.data_fim || null,
      };

      if (editingAlerta) {
        // Atualizar
        const { data, error } = await supabase
          .from('clinical_evolutions')
          .update({ content })
          .eq('id', editingAlerta.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from('clinical_evolutions')
          .insert({
            patient_id: patientId,
            clinic_id: clinicId,
            professional_id: professionalId,
            evolution_type: 'alerta_funcional_fisio',
            specialty: 'fisioterapia',
            content,
            status: 'signed',
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-alertas', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-summary', patientId, clinicId] });
      toast.success(editingAlerta ? 'Alerta atualizado' : 'Alerta registrado');
      setIsFormOpen(false);
      setEditingAlerta(null);
    },
    onError: (error) => {
      console.error('Erro ao salvar alerta:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar alerta');
    },
  });

  // Alternar status ativo
  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, isAtivo }: { id: string; isAtivo: boolean }) => {
      const alerta = alertasQuery.data?.find(a => a.id === id);
      if (!alerta) throw new Error('Alerta não encontrado');

      const content = {
        tipo: alerta.tipo,
        severidade: alerta.severidade,
        titulo: alerta.titulo,
        descricao: alerta.descricao,
        is_ativo: isAtivo,
        data_inicio: alerta.data_inicio,
        data_fim: alerta.data_fim,
      };

      const { error } = await supabase
        .from('clinical_evolutions')
        .update({ content })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-alertas', patientId, clinicId] });
      toast.success('Status do alerta atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  // Deletar alerta
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clinical_evolutions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-alertas', patientId, clinicId] });
      toast.success('Alerta removido');
    },
    onError: () => {
      toast.error('Erro ao remover alerta');
    },
  });

  return {
    alertas: alertasQuery.data || [],
    alertasAtivos,
    alertasCriticos,
    loading: alertasQuery.isLoading,
    error: alertasQuery.error,
    isFormOpen,
    setIsFormOpen,
    editingAlerta,
    setEditingAlerta,
    saveAlerta: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    toggleAtivo: toggleAtivoMutation.mutate,
    deleteAlerta: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

export function getEmptyAlertaForm(): AlertaFormData {
  return {
    tipo: 'restricao_movimento',
    severidade: 'moderado',
    titulo: '',
    descricao: '',
    is_ativo: true,
    data_inicio: '',
    data_fim: '',
  };
}

export function alertaToFormData(alerta: AlertaFuncional): AlertaFormData {
  return {
    tipo: alerta.tipo,
    severidade: alerta.severidade,
    titulo: alerta.titulo,
    descricao: alerta.descricao || '',
    is_ativo: alerta.is_ativo,
    data_inicio: alerta.data_inicio || '',
    data_fim: alerta.data_fim || '',
  };
}
