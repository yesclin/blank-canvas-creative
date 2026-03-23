/**
 * FISIOTERAPIA - Dados das Sessões / Evoluções
 * 
 * Hook para gerenciar registros de sessões de fisioterapia.
 * Mantém histórico cronológico completo de todos os atendimentos.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Opções para resposta do paciente
export const RESPOSTA_PACIENTE_OPTIONS = [
  { value: 'excelente', label: 'Excelente' },
  { value: 'boa', label: 'Boa' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'limitada', label: 'Limitada' },
  { value: 'sem_resposta', label: 'Sem resposta' },
];

// Opções para evolução funcional
export const EVOLUCAO_FUNCIONAL_OPTIONS = [
  { value: 'melhora_significativa', label: 'Melhora significativa' },
  { value: 'melhora_leve', label: 'Melhora leve' },
  { value: 'estavel', label: 'Estável' },
  { value: 'piora_leve', label: 'Piora leve' },
  { value: 'piora_significativa', label: 'Piora significativa' },
];

export interface SessaoFisioterapiaData {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string | null;
  professional_name?: string | null;
  appointment_id?: string | null;
  
  // Campos da sessão
  data_atendimento: string;
  tecnicas_aplicadas: string[];
  exercicios_realizados: string[];
  resposta_paciente: string;
  resposta_paciente_obs: string | null;
  dor_pos_sessao: number | null;
  evolucao_funcional: string;
  evolucao_funcional_obs: string | null;
  ajustes_plano: string | null;
  nova_conduta: string | null;
  observacoes: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface SessaoFormData {
  data_atendimento: string;
  tecnicas_aplicadas: string[];
  exercicios_realizados: string[];
  resposta_paciente: string;
  resposta_paciente_obs: string;
  dor_pos_sessao: number | null;
  evolucao_funcional: string;
  evolucao_funcional_obs: string;
  ajustes_plano: string;
  nova_conduta: string;
  observacoes: string;
}

interface UseSessoesFisioterapiaDataParams {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
}

export function useSessoesFisioterapiaData({ 
  patientId, 
  clinicId, 
  professionalId 
}: UseSessoesFisioterapiaDataParams) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Buscar todas as sessões
  const sessionsQuery = useQuery({
    queryKey: ['fisioterapia-sessoes', patientId, clinicId],
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
          appointment_id,
          professionals:professional_id (
            full_name
          )
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('evolution_type', 'sessao_fisioterapia')
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
          appointment_id: record.appointment_id,
          data_atendimento: (content?.data_atendimento as string) || record.created_at,
          tecnicas_aplicadas: (content?.tecnicas_aplicadas as string[]) || [],
          exercicios_realizados: (content?.exercicios_realizados as string[]) || [],
          resposta_paciente: (content?.resposta_paciente as string) || '',
          resposta_paciente_obs: (content?.resposta_paciente_obs as string) || null,
          dor_pos_sessao: (content?.dor_pos_sessao as number) ?? null,
          evolucao_funcional: (content?.evolucao_funcional as string) || '',
          evolucao_funcional_obs: (content?.evolucao_funcional_obs as string) || null,
          ajustes_plano: (content?.ajustes_plano as string) || null,
          nova_conduta: (content?.nova_conduta as string) || null,
          observacoes: (content?.observacoes as string) || null,
          created_at: record.created_at,
          updated_at: record.updated_at,
        } as SessaoFisioterapiaData;
      });
    },
    enabled: !!patientId && !!clinicId,
  });

  // Salvar nova sessão
  const saveMutation = useMutation({
    mutationFn: async (formData: SessaoFormData) => {
      if (!patientId || !clinicId || !professionalId) {
        throw new Error('Dados obrigatórios não informados');
      }

      // Validação
      if (!formData.data_atendimento) {
        throw new Error('Data do atendimento é obrigatória');
      }

      const content = {
        data_atendimento: formData.data_atendimento,
        tecnicas_aplicadas: formData.tecnicas_aplicadas.filter(t => t.trim()),
        exercicios_realizados: formData.exercicios_realizados.filter(e => e.trim()),
        resposta_paciente: formData.resposta_paciente || null,
        resposta_paciente_obs: formData.resposta_paciente_obs.trim() || null,
        dor_pos_sessao: formData.dor_pos_sessao,
        evolucao_funcional: formData.evolucao_funcional || null,
        evolucao_funcional_obs: formData.evolucao_funcional_obs.trim() || null,
        ajustes_plano: formData.ajustes_plano.trim() || null,
        nova_conduta: formData.nova_conduta.trim() || null,
        observacoes: formData.observacoes.trim() || null,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          evolution_type: 'sessao_fisioterapia',
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
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-sessoes', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['fisioterapia-summary', patientId, clinicId] });
      toast.success('Sessão registrada com sucesso');
      setIsFormOpen(false);
    },
    onError: (error) => {
      console.error('Erro ao salvar sessão:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar sessão');
    },
  });

  // Estatísticas
  const sessions = sessionsQuery.data || [];
  const totalSessoes = sessions.length;
  const ultimaSessao = sessions[0] || null;
  
  // Média de dor pós-sessão (últimas 5)
  const ultimasSessoes = sessions.slice(0, 5);
  const sessoesComDor = ultimasSessoes.filter(s => s.dor_pos_sessao !== null);
  const mediaDor = sessoesComDor.length > 0 
    ? sessoesComDor.reduce((acc, s) => acc + (s.dor_pos_sessao || 0), 0) / sessoesComDor.length 
    : null;

  return {
    sessions,
    totalSessoes,
    ultimaSessao,
    mediaDor,
    loading: sessionsQuery.isLoading,
    error: sessionsQuery.error,
    isFormOpen,
    setIsFormOpen,
    saveSessao: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}

export function getEmptySessaoForm(): SessaoFormData {
  return {
    data_atendimento: new Date().toISOString().split('T')[0],
    tecnicas_aplicadas: [''],
    exercicios_realizados: [''],
    resposta_paciente: '',
    resposta_paciente_obs: '',
    dor_pos_sessao: null,
    evolucao_funcional: '',
    evolucao_funcional_obs: '',
    ajustes_plano: '',
    nova_conduta: '',
    observacoes: '',
  };
}
