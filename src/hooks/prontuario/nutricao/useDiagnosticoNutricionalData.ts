/**
 * NUTRIÇÃO - Hook de Diagnóstico Nutricional
 * 
 * Gerencia registros de diagnósticos nutricionais do paciente.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useClinicData } from '@/hooks/useClinicData';

export type StatusDiagnostico = 'ativo' | 'resolvido' | 'em_acompanhamento';

export interface DiagnosticoNutricional {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string;
  
  // Diagnóstico principal
  diagnostico_principal: string;
  cid_principal?: string;
  
  // Diagnósticos associados
  diagnosticos_associados: Array<{
    descricao: string;
    cid?: string;
  }>;
  
  // Justificativa clínica
  justificativa: string;
  
  // Data e status
  data_diagnostico: string;
  status: StatusDiagnostico;
  
  // Auditoria
  created_at: string;
  updated_at: string;
}

export interface DiagnosticoFormData {
  diagnostico_principal: string;
  cid_principal: string;
  diagnosticos_associados: Array<{
    descricao: string;
    cid?: string;
  }>;
  justificativa: string;
  data_diagnostico: string;
  status: StatusDiagnostico;
}

// Diagnósticos nutricionais comuns
export const DIAGNOSTICOS_NUTRICIONAIS_COMUNS = [
  'Sobrepeso',
  'Obesidade grau I',
  'Obesidade grau II',
  'Obesidade grau III',
  'Desnutrição leve',
  'Desnutrição moderada',
  'Desnutrição grave',
  'Baixo peso',
  'Eutrofia',
  'Risco nutricional',
  'Sarcopenia',
  'Caquexia',
  'Deficiência de ferro',
  'Deficiência de vitamina D',
  'Deficiência de vitamina B12',
  'Hipercolesterolemia',
  'Hipertrigliceridemia',
  'Dislipidemia',
  'Resistência insulínica',
  'Pré-diabetes',
  'Diabetes mellitus tipo 2',
  'Síndrome metabólica',
  'Hipertensão arterial',
  'Intolerância à lactose',
  'Doença celíaca',
  'Alergia alimentar',
  'Constipação intestinal crônica',
  'Síndrome do intestino irritável',
  'Esteatose hepática',
  'Compulsão alimentar',
  'Transtorno alimentar restritivo',
];

export const STATUS_DIAGNOSTICO_LABELS: Record<StatusDiagnostico, string> = {
  ativo: 'Ativo',
  resolvido: 'Resolvido',
  em_acompanhamento: 'Em acompanhamento',
};

export function useDiagnosticoNutricionalData(patientId: string | null) {
  const { toast } = useToast();
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();

  // Buscar diagnósticos do paciente
  const {
    data: diagnosticos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['diagnostico-nutricional', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];
      
      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('specialty', 'nutricao')
        .eq('evolution_type', 'followup')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || [])
        .filter(ev => {
          const content = ev.content as Record<string, unknown>;
          return content?.tipo_registro === 'diagnostico_nutricional';
        })
        .map((ev) => {
          const content = ev.content as Record<string, unknown>;
          return {
            id: ev.id,
            patient_id: ev.patient_id,
            clinic_id: ev.clinic_id,
            professional_id: ev.professional_id,
            diagnostico_principal: (content?.diagnostico_principal as string) || '',
            cid_principal: (content?.cid_principal as string) || '',
            diagnosticos_associados: (content?.diagnosticos_associados as Array<{ descricao: string; cid?: string }>) || [],
            justificativa: (content?.justificativa as string) || '',
            data_diagnostico: (content?.data_diagnostico as string) || ev.created_at.split('T')[0],
            status: (content?.status as StatusDiagnostico) || 'ativo',
            created_at: ev.created_at,
            updated_at: ev.updated_at,
          } as DiagnosticoNutricional;
        });
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Salvar novo diagnóstico
  const saveDiagnostico = useMutation({
    mutationFn: async (formData: DiagnosticoFormData) => {
      if (!patientId || !clinic?.id) {
        throw new Error('Dados incompletos para salvar diagnóstico');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: professional } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .eq('clinic_id', clinic.id)
        .single();

      const professionalId = professional?.id || user.id;

      const contentData = {
        tipo_registro: 'diagnostico_nutricional',
        diagnostico_principal: formData.diagnostico_principal,
        cid_principal: formData.cid_principal || null,
        diagnosticos_associados: formData.diagnosticos_associados.map(d => ({
          descricao: d.descricao,
          cid: d.cid || null,
        })),
        justificativa: formData.justificativa,
        data_diagnostico: formData.data_diagnostico,
        status: formData.status,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert([{
          patient_id: patientId,
          clinic_id: clinic.id,
          professional_id: professionalId,
          specialty: 'nutricao',
          evolution_type: 'followup',
          status: 'signed',
          content: JSON.parse(JSON.stringify(contentData)),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostico-nutricional', patientId, clinic?.id] });
      toast({
        title: 'Diagnóstico registrado',
        description: 'O diagnóstico nutricional foi salvo com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao salvar diagnóstico:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível registrar o diagnóstico.',
        variant: 'destructive',
      });
    },
  });

  // Atualizar status de diagnóstico existente
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusDiagnostico }) => {
      const diagnostico = diagnosticos.find(d => d.id === id);
      if (!diagnostico) throw new Error('Diagnóstico não encontrado');

      const contentData = {
        tipo_registro: 'diagnostico_nutricional',
        diagnostico_principal: diagnostico.diagnostico_principal,
        cid_principal: diagnostico.cid_principal || null,
        diagnosticos_associados: diagnostico.diagnosticos_associados,
        justificativa: diagnostico.justificativa,
        data_diagnostico: diagnostico.data_diagnostico,
        status,
      };

      const { error } = await supabase
        .from('clinical_evolutions')
        .update({
          content: JSON.parse(JSON.stringify(contentData)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostico-nutricional', patientId, clinic?.id] });
      toast({
        title: 'Status atualizado',
        description: 'O status do diagnóstico foi alterado.',
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível alterar o status.',
        variant: 'destructive',
      });
    },
  });

  return {
    diagnosticos,
    isLoading,
    error,
    saveDiagnostico: saveDiagnostico.mutateAsync,
    updateStatus: updateStatus.mutateAsync,
    isSaving: saveDiagnostico.isPending,
    isUpdating: updateStatus.isPending,
  };
}
