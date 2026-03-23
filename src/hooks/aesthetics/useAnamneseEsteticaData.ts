/**
 * ESTÉTICA - Anamnese Estética
 * 
 * Hook para gerenciar anamnese estética com versionamento.
 * Cada atualização cria uma nova versão, preservando o histórico completo.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// Estrutura do conteúdo da anamnese estética
export interface AnamneseEsteticaContent {
  // Queixa principal
  queixa_principal: string;
  
  // Histórico de procedimentos anteriores
  procedimentos_anteriores: string;
  tem_procedimentos_anteriores: boolean;
  
  // Medicamentos em uso
  medicamentos_em_uso: string;
  usa_medicamentos: boolean;
  
  // Alergias
  alergias: string;
  tem_alergias: boolean;
  
  // Intercorrências prévias
  intercorrencias_previas: string;
  teve_intercorrencias: boolean;
  
  // Expectativas do paciente
  expectativas_paciente: string;
  
  // Observações gerais
  observacoes_gerais?: string;
  
  // Metadata de versionamento
  versao: number;
  versao_anterior_id?: string | null;
}

export interface AnamneseEsteticaRecord {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string;
  appointment_id: string | null;
  content: AnamneseEsteticaContent;
  status: string;
  signed_at: string | null;
  signed_by: string | null;
  created_at: string;
  updated_at: string;
}

interface UseAnamneseEsteticaDataParams {
  patientId: string | null;
  clinicId: string | null;
  appointmentId?: string | null;
}

export function useAnamneseEsteticaData({ 
  patientId, 
  clinicId,
  appointmentId,
}: UseAnamneseEsteticaDataParams) {
  const queryClient = useQueryClient();

  // Buscar anamnese atual (mais recente)
  const currentQuery = useQuery({
    queryKey: ['anamnese-estetica-current', patientId, clinicId],
    queryFn: async () => {
      if (!patientId || !clinicId) return null;

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('evolution_type', 'anamnese_estetica')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;
      
      return {
        id: data.id,
        patient_id: data.patient_id,
        clinic_id: data.clinic_id,
        professional_id: data.professional_id,
        appointment_id: data.appointment_id,
        content: data.content as unknown as AnamneseEsteticaContent,
        status: data.status,
        signed_at: data.signed_at,
        signed_by: data.signed_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as AnamneseEsteticaRecord;
    },
    enabled: !!patientId && !!clinicId,
  });

  // Buscar histórico de versões
  const historyQuery = useQuery({
    queryKey: ['anamnese-estetica-history', patientId, clinicId],
    queryFn: async () => {
      if (!patientId || !clinicId) return [];

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('id, content, created_at, professional_id, signed_at')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('evolution_type', 'anamnese_estetica')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(record => ({
        id: record.id,
        versao: (record.content as Record<string, unknown>)?.versao as number || 1,
        created_at: record.created_at,
        professional_id: record.professional_id,
        signed_at: record.signed_at,
        content: record.content as unknown as AnamneseEsteticaContent,
      }));
    },
    enabled: !!patientId && !!clinicId,
  });

  // Criar nova anamnese (primeira versão)
  const createMutation = useMutation({
    mutationFn: async (data: Omit<AnamneseEsteticaContent, 'versao' | 'versao_anterior_id'>) => {
      if (!patientId || !clinicId) throw new Error('Dados obrigatórios ausentes');

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      // Buscar professional_id do usuário
      const { data: professional } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('clinic_id', clinicId)
        .maybeSingle();

      const professionalId = professional?.id || userData.user.id;

      const content: AnamneseEsteticaContent = {
        ...data,
        versao: 1,
        versao_anterior_id: null,
      };

      const { data: result, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          appointment_id: appointmentId || null,
          evolution_type: 'anamnese_estetica',
          specialty: 'estetica',
          content: content as unknown as Json,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnese-estetica-current', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['anamnese-estetica-history', patientId, clinicId] });
      toast.success('Anamnese estética criada');
    },
    onError: (error) => {
      console.error('Erro ao criar anamnese:', error);
      toast.error('Erro ao criar anamnese estética');
    },
  });

  // Criar nova versão (atualização com versionamento)
  const updateMutation = useMutation({
    mutationFn: async (data: Omit<AnamneseEsteticaContent, 'versao' | 'versao_anterior_id'>) => {
      if (!patientId || !clinicId) throw new Error('Dados obrigatórios ausentes');
      
      const currentRecord = currentQuery.data;
      if (!currentRecord) throw new Error('Nenhuma anamnese encontrada para atualizar');

      // Verificar se a versão atual está assinada (imutável)
      if (currentRecord.signed_at) {
        // Criar nova versão em vez de editar
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Usuário não autenticado');

        const { data: professional } = await supabase
          .from('professionals')
          .select('id')
          .eq('user_id', userData.user.id)
          .eq('clinic_id', clinicId)
          .maybeSingle();

        const professionalId = professional?.id || userData.user.id;

        const newContent: AnamneseEsteticaContent = {
          ...data,
          versao: (currentRecord.content.versao || 1) + 1,
          versao_anterior_id: currentRecord.id,
        };

        const { data: result, error } = await supabase
          .from('clinical_evolutions')
          .insert({
            patient_id: patientId,
            clinic_id: clinicId,
            professional_id: professionalId,
            appointment_id: appointmentId || null,
            evolution_type: 'anamnese_estetica',
            specialty: 'estetica',
            content: newContent as unknown as Json,
            status: 'draft',
          })
          .select()
          .single();

        if (error) throw error;
        return result;
      }

      // Se não estiver assinada, pode atualizar a versão atual
      const updatedContent: AnamneseEsteticaContent = {
        ...data,
        versao: currentRecord.content.versao || 1,
        versao_anterior_id: currentRecord.content.versao_anterior_id || null,
      };

      const { error } = await supabase
        .from('clinical_evolutions')
        .update({
          content: updatedContent as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentRecord.id);

      if (error) throw error;
      return currentRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnese-estetica-current', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['anamnese-estetica-history', patientId, clinicId] });
      toast.success('Anamnese estética atualizada');
    },
    onError: (error) => {
      console.error('Erro ao atualizar anamnese:', error);
      toast.error('Erro ao atualizar anamnese estética');
    },
  });

  // Salvar (criar ou atualizar conforme necessário)
  const save = async (data: Omit<AnamneseEsteticaContent, 'versao' | 'versao_anterior_id'>) => {
    if (currentQuery.data) {
      return updateMutation.mutateAsync(data);
    } else {
      return createMutation.mutateAsync(data);
    }
  };

  return {
    current: currentQuery.data || null,
    history: historyQuery.data || [],
    loading: currentQuery.isLoading || historyQuery.isLoading,
    error: currentQuery.error || historyQuery.error,
    save,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isCurrentSigned: !!currentQuery.data?.signed_at,
    currentVersion: currentQuery.data?.content?.versao || 0,
    totalVersions: historyQuery.data?.length || 0,
  };
}

// Valores padrão para nova anamnese
export function getEmptyAnamneseEstetica(): Omit<AnamneseEsteticaContent, 'versao' | 'versao_anterior_id'> {
  return {
    queixa_principal: '',
    procedimentos_anteriores: '',
    tem_procedimentos_anteriores: false,
    medicamentos_em_uso: '',
    usa_medicamentos: false,
    alergias: '',
    tem_alergias: false,
    intercorrencias_previas: '',
    teve_intercorrencias: false,
    expectativas_paciente: '',
    observacoes_gerais: '',
  };
}
