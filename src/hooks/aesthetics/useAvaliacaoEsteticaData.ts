/**
 * ESTÉTICA - Avaliação Estética Facial
 * 
 * Hook para gerenciar avaliação estética facial.
 * Registra: avaliação facial geral, simetria, qualidade da pele,
 * flacidez, volume, linhas/rugas, observações técnicas.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// Escalas de avaliação
export const ESCALA_INTENSIDADE = [
  { value: 'ausente', label: 'Ausente' },
  { value: 'leve', label: 'Leve' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'acentuado', label: 'Acentuado' },
  { value: 'severo', label: 'Severo' },
];

export const ESCALA_QUALIDADE_PELE = [
  { value: 'excelente', label: 'Excelente' },
  { value: 'boa', label: 'Boa' },
  { value: 'regular', label: 'Regular' },
  { value: 'comprometida', label: 'Comprometida' },
  { value: 'muito_comprometida', label: 'Muito Comprometida' },
];

export const TIPOS_PELE = [
  { value: 'normal', label: 'Normal' },
  { value: 'oleosa', label: 'Oleosa' },
  { value: 'seca', label: 'Seca' },
  { value: 'mista', label: 'Mista' },
  { value: 'sensivel', label: 'Sensível' },
];

export const REGIOES_FACIAIS = [
  { id: 'testa', label: 'Testa' },
  { id: 'glabela', label: 'Glabela' },
  { id: 'periorbital', label: 'Periorbital (Olhos)' },
  { id: 'malar', label: 'Malar (Maçãs)' },
  { id: 'nariz', label: 'Nariz' },
  { id: 'sulco_nasogeniano', label: 'Sulco Nasogeniano' },
  { id: 'labios', label: 'Lábios' },
  { id: 'perioral', label: 'Perioral' },
  { id: 'mento', label: 'Mento (Queixo)' },
  { id: 'mandibula', label: 'Mandíbula' },
  { id: 'pescoco', label: 'Pescoço' },
];

// Estrutura do conteúdo da avaliação
export interface AvaliacaoEsteticaContent {
  // Avaliação facial geral
  impressao_geral: string;
  tipo_pele: string;
  qualidade_pele: string;
  
  // Simetria
  simetria_avaliacao: string;
  assimetrias_identificadas: string;
  
  // Flacidez por região
  flacidez_facial: string;
  flacidez_regioes: string[];
  flacidez_observacoes: string;
  
  // Volume
  volume_avaliacao: string;
  volume_deficiente_regioes: string[];
  volume_excessivo_regioes: string[];
  volume_observacoes: string;
  
  // Linhas e rugas
  rugas_estaticas: string;
  rugas_dinamicas: string;
  rugas_regioes_afetadas: string[];
  rugas_observacoes: string;
  
  // Outras características
  manchas_pigmentacao: string;
  manchas_observacoes: string;
  poros_dilatados: string;
  cicatrizes_acne: string;
  vasos_visiveis: string;
  
  // Observações técnicas do profissional
  observacoes_tecnicas: string;
  
  // Plano de tratamento sugerido
  sugestao_tratamento: string;
}

export interface AvaliacaoEsteticaRecord {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string;
  appointment_id: string | null;
  content: AvaliacaoEsteticaContent;
  status: string;
  created_at: string;
  updated_at: string;
}

interface UseAvaliacaoEsteticaDataParams {
  patientId: string | null;
  clinicId: string | null;
  appointmentId?: string | null;
}

export function useAvaliacaoEsteticaData({ 
  patientId, 
  clinicId,
  appointmentId,
}: UseAvaliacaoEsteticaDataParams) {
  const queryClient = useQueryClient();

  // Buscar avaliação atual (mais recente)
  const currentQuery = useQuery({
    queryKey: ['avaliacao-estetica-current', patientId, clinicId],
    queryFn: async () => {
      if (!patientId || !clinicId) return null;

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('evolution_type', 'avaliacao_estetica')
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
        content: data.content as unknown as AvaliacaoEsteticaContent,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as AvaliacaoEsteticaRecord;
    },
    enabled: !!patientId && !!clinicId,
  });

  // Buscar histórico
  const historyQuery = useQuery({
    queryKey: ['avaliacao-estetica-history', patientId, clinicId],
    queryFn: async () => {
      if (!patientId || !clinicId) return [];

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('id, content, created_at, professional_id')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('evolution_type', 'avaliacao_estetica')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data || [];
    },
    enabled: !!patientId && !!clinicId,
  });

  // Criar nova avaliação
  const createMutation = useMutation({
    mutationFn: async (data: AvaliacaoEsteticaContent) => {
      if (!patientId || !clinicId) throw new Error('Dados obrigatórios ausentes');

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { data: professional } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('clinic_id', clinicId)
        .maybeSingle();

      const professionalId = professional?.id || userData.user.id;

      const { data: result, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          appointment_id: appointmentId || null,
          evolution_type: 'avaliacao_estetica',
          specialty: 'estetica',
          content: data as unknown as Json,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avaliacao-estetica-current', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['avaliacao-estetica-history', patientId, clinicId] });
      toast.success('Avaliação estética criada');
    },
    onError: (error) => {
      console.error('Erro ao criar avaliação:', error);
      toast.error('Erro ao criar avaliação estética');
    },
  });

  // Atualizar avaliação existente
  const updateMutation = useMutation({
    mutationFn: async (data: AvaliacaoEsteticaContent) => {
      const currentRecord = currentQuery.data;
      if (!currentRecord) throw new Error('Nenhuma avaliação encontrada');

      const { error } = await supabase
        .from('clinical_evolutions')
        .update({
          content: data as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentRecord.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avaliacao-estetica-current', patientId, clinicId] });
      queryClient.invalidateQueries({ queryKey: ['avaliacao-estetica-history', patientId, clinicId] });
      toast.success('Avaliação estética atualizada');
    },
    onError: (error) => {
      console.error('Erro ao atualizar avaliação:', error);
      toast.error('Erro ao atualizar avaliação estética');
    },
  });

  // Salvar (criar ou atualizar)
  const save = async (data: AvaliacaoEsteticaContent) => {
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
  };
}

// Valores padrão para nova avaliação
export function getEmptyAvaliacaoEstetica(): AvaliacaoEsteticaContent {
  return {
    impressao_geral: '',
    tipo_pele: '',
    qualidade_pele: '',
    simetria_avaliacao: '',
    assimetrias_identificadas: '',
    flacidez_facial: '',
    flacidez_regioes: [],
    flacidez_observacoes: '',
    volume_avaliacao: '',
    volume_deficiente_regioes: [],
    volume_excessivo_regioes: [],
    volume_observacoes: '',
    rugas_estaticas: '',
    rugas_dinamicas: '',
    rugas_regioes_afetadas: [],
    rugas_observacoes: '',
    manchas_pigmentacao: '',
    manchas_observacoes: '',
    poros_dilatados: '',
    cicatrizes_acne: '',
    vasos_visiveis: '',
    observacoes_tecnicas: '',
    sugestao_tratamento: '',
  };
}
