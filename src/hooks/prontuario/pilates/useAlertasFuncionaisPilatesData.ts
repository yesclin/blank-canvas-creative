/**
 * PILATES - Dados de Alertas Funcionais
 * 
 * Hook para gerenciar alertas funcionais do aluno:
 * restrições de movimento, cuidados especiais e limitações.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// Tipos de alerta
export const TIPO_ALERTA_OPTIONS = [
  { value: 'restricao_movimento', label: 'Restrição de Movimento', severity: 'critical' },
  { value: 'cuidado_especial', label: 'Cuidado Especial', severity: 'warning' },
  { value: 'limitacao', label: 'Limitação Importante', severity: 'warning' },
  { value: 'contraindicacao', label: 'Contraindicação', severity: 'critical' },
  { value: 'patologia', label: 'Patologia de Base', severity: 'info' },
  { value: 'observacao', label: 'Observação Geral', severity: 'info' },
];

// Severidades
export const SEVERIDADE_OPTIONS = [
  { value: 'critical', label: 'Crítico', className: 'bg-destructive/10 border-destructive/30 text-destructive' },
  { value: 'warning', label: 'Atenção', className: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400' },
  { value: 'info', label: 'Informativo', className: 'bg-primary/10 border-primary/30 text-primary' },
];

export interface AlertaFuncionalPilates {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  professional_name?: string | null;
  
  // Campos do alerta
  tipo: string;
  severidade: string;
  titulo: string;
  descricao: string | null;
  regiao_afetada: string | null;
  exercicios_evitar: string[] | null;
  recomendacoes: string | null;
  is_active: boolean;
  
  created_at: string;
  updated_at?: string;
}

export interface AlertaFuncionalFormData {
  tipo: string;
  severidade: string;
  titulo: string;
  descricao: string;
  regiao_afetada: string;
  exercicios_evitar: string[];
  recomendacoes: string;
}

interface UseAlertasFuncionaisPilatesDataParams {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}

export function useAlertasFuncionaisPilatesData({ 
  patientId, 
  clinicId, 
  professionalId 
}: UseAlertasFuncionaisPilatesDataParams) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlerta, setEditingAlerta] = useState<AlertaFuncionalPilates | null>(null);

  // Buscar todos os alertas ativos
  const alertasQuery = useQuery({
    queryKey: ['pilates-alertas-funcionais', patientId, clinicId],
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
        .eq('evolution_type', 'alerta_funcional_pilates')
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
          tipo: (content?.tipo as string) || 'observacao',
          severidade: (content?.severidade as string) || 'info',
          titulo: (content?.titulo as string) || '',
          descricao: (content?.descricao as string) || null,
          regiao_afetada: (content?.regiao_afetada as string) || null,
          exercicios_evitar: (content?.exercicios_evitar as string[]) || null,
          recomendacoes: (content?.recomendacoes as string) || null,
          is_active: (content?.is_active as boolean) ?? true,
          created_at: record.created_at,
          updated_at: record.updated_at,
        } as AlertaFuncionalPilates;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Apenas alertas ativos
  const alertasAtivos = (alertasQuery.data || []).filter(a => a.is_active);

  // Criar novo alerta
  const createMutation = useMutation({
    mutationFn: async (formData: AlertaFuncionalFormData) => {
      if (!patientId || !clinicId || !professionalId) {
        throw new Error('Dados obrigatórios não informados');
      }

      const content = {
        tipo: formData.tipo,
        severidade: formData.severidade,
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        regiao_afetada: formData.regiao_afetada || null,
        exercicios_evitar: formData.exercicios_evitar.length > 0 ? formData.exercicios_evitar : null,
        recomendacoes: formData.recomendacoes || null,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          evolution_type: 'alerta_funcional_pilates',
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
      queryClient.invalidateQueries({ queryKey: ['pilates-alertas-funcionais', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['pilates-summary', patientId, clinicId] });
      toast.success('Alerta criado com sucesso');
      setIsFormOpen(false);
    },
    onError: (error) => {
      console.error('Erro ao criar alerta:', error);
      toast.error('Erro ao criar alerta');
    },
  });

  // Atualizar alerta (toggle ativo/inativo ou edição)
  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from('clinical_evolutions')
        .update({ content: content as Json, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilates-alertas-funcionais', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['pilates-summary', patientId, clinicId] });
      toast.success('Alerta atualizado');
      setEditingAlerta(null);
      setIsFormOpen(false);
    },
    onError: (error) => {
      console.error('Erro ao atualizar alerta:', error);
      toast.error('Erro ao atualizar alerta');
    },
  });

  // Toggle ativo/inativo
  const toggleAlerta = (alerta: AlertaFuncionalPilates) => {
    const newContent: Record<string, unknown> = {
      tipo: alerta.tipo,
      severidade: alerta.severidade,
      titulo: alerta.titulo,
      descricao: alerta.descricao,
      regiao_afetada: alerta.regiao_afetada,
      exercicios_evitar: alerta.exercicios_evitar,
      recomendacoes: alerta.recomendacoes,
      is_active: !alerta.is_active,
    };
    updateMutation.mutate({ id: alerta.id, content: newContent });
  };

  // Salvar (criar ou atualizar)
  const saveAlerta = (formData: AlertaFuncionalFormData) => {
    if (editingAlerta) {
      const newContent = {
        ...formData,
        exercicios_evitar: formData.exercicios_evitar.length > 0 ? formData.exercicios_evitar : null,
        is_active: editingAlerta.is_active,
      };
      updateMutation.mutate({ id: editingAlerta.id, content: newContent });
    } else {
      createMutation.mutate(formData);
    }
  };

  return {
    alertas: alertasQuery.data || [],
    alertasAtivos,
    loading: alertasQuery.isLoading,
    error: alertasQuery.error,
    isFormOpen,
    setIsFormOpen,
    editingAlerta,
    setEditingAlerta,
    saveAlerta,
    isSaving: createMutation.isPending || updateMutation.isPending,
    toggleAlerta,
  };
}

export function getEmptyAlertaForm(): AlertaFuncionalFormData {
  return {
    tipo: 'restricao_movimento',
    severidade: 'warning',
    titulo: '',
    descricao: '',
    regiao_afetada: '',
    exercicios_evitar: [],
    recomendacoes: '',
  };
}

export function alertaToFormData(alerta: AlertaFuncionalPilates): AlertaFuncionalFormData {
  return {
    tipo: alerta.tipo,
    severidade: alerta.severidade,
    titulo: alerta.titulo,
    descricao: alerta.descricao || '',
    regiao_afetada: alerta.regiao_afetada || '',
    exercicios_evitar: alerta.exercicios_evitar || [],
    recomendacoes: alerta.recomendacoes || '',
  };
}
