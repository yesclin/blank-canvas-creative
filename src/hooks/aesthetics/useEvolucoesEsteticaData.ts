/**
 * ESTÉTICA - Evoluções Estéticas
 * 
 * Hook para gerenciar evoluções clínicas do módulo de estética.
 * Usa clinical_evolutions com evolution_type = 'evolucao_estetica'.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

const LOG_PREFIX = {
  evolucao: '[ESTETICA_EVOLUCAO]',
  context: '[ESTETICA_CONTEXT]',
  payload: '[ESTETICA_PAYLOAD]',
  dbError: '[ESTETICA_DB_ERROR]',
} as const;

// Níveis de satisfação
export const SATISFACTION_LEVELS = [
  { value: 'muito_satisfeito', label: 'Muito Satisfeito', color: 'text-green-600' },
  { value: 'satisfeito', label: 'Satisfeito', color: 'text-primary' },
  { value: 'neutro', label: 'Neutro', color: 'text-muted-foreground' },
  { value: 'insatisfeito', label: 'Insatisfeito', color: 'text-orange-600' },
  { value: 'muito_insatisfeito', label: 'Muito Insatisfeito', color: 'text-destructive' },
] as const;

export type SatisfactionLevel = typeof SATISFACTION_LEVELS[number]['value'];

// Tipos de resposta ao procedimento
export const RESPONSE_TYPES = [
  { value: 'excelente', label: 'Excelente' },
  { value: 'esperada', label: 'Esperada' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'lenta', label: 'Lenta' },
  { value: 'insuficiente', label: 'Insuficiente' },
] as const;

export type ResponseType = typeof RESPONSE_TYPES[number]['value'];

// Intercorrências comuns
export const COMMON_COMPLICATIONS = [
  'Edema leve',
  'Edema moderado',
  'Equimose leve',
  'Equimose moderada',
  'Eritema localizado',
  'Dor local',
  'Assimetria',
  'Nódulo palpável',
  'Hipersensibilidade',
  'Infecção local',
  'Necrose (alerta)',
  'Reação alérgica',
] as const;

export interface EvolucaoEstetica {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id: string | null;
  professional_id: string;
  professional_name?: string;
  evolution_date: string;
  procedure_performed: string;
  treatment_area: string | null;
  patient_response: ResponseType | null;
  complications: string[];
  complications_notes: string | null;
  satisfaction_level: SatisfactionLevel | null;
  satisfaction_notes: string | null;
  planned_adjustments: string | null;
  post_procedure_guidelines: string[];
  follow_up_date: string | null;
  notes: string | null;
  photos_taken: boolean;
  status: 'draft' | 'signed';
  signed_at: string | null;
  signed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvolucaoEsteticaFormData {
  evolution_date: string;
  procedure_performed: string;
  treatment_area?: string;
  patient_response?: ResponseType;
  complications?: string[];
  complications_notes?: string;
  satisfaction_level?: SatisfactionLevel;
  satisfaction_notes?: string;
  planned_adjustments?: string;
  post_procedure_guidelines?: string[];
  follow_up_date?: string;
  notes?: string;
  photos_taken?: boolean;
}

interface UseEvolucoesEsteticaParams {
  patientId: string | null;
  appointmentId?: string | null;
}

export function useEvolucoesEsteticaData({ patientId, appointmentId }: UseEvolucoesEsteticaParams) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();

  const queryKey = ['evolucoes-estetica', patientId, clinic?.id];

  // Fetch evolutions
  const { data: evolucoes = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select(`
          *,
          professional:professionals(full_name)
        `)
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .eq('evolution_type', 'evolucao_estetica')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`${LOG_PREFIX.dbError} Fetch evolutions failed:`, error);
        throw error;
      }

      return data.map((ev): EvolucaoEstetica => {
        const content = ev.content as Record<string, unknown> || {};
        return {
          id: ev.id,
          clinic_id: ev.clinic_id,
          patient_id: ev.patient_id,
          appointment_id: ev.appointment_id,
          professional_id: ev.professional_id,
          professional_name: (ev.professional as { full_name: string } | null)?.full_name || 'Profissional',
          evolution_date: content.evolution_date as string || ev.created_at.split('T')[0],
          procedure_performed: content.procedure_performed as string || '',
          treatment_area: content.treatment_area as string || null,
          patient_response: content.patient_response as ResponseType || null,
          complications: (content.complications as string[]) || [],
          complications_notes: content.complications_notes as string || null,
          satisfaction_level: content.satisfaction_level as SatisfactionLevel || null,
          satisfaction_notes: content.satisfaction_notes as string || null,
          planned_adjustments: content.planned_adjustments as string || null,
          post_procedure_guidelines: (content.post_procedure_guidelines as string[]) || [],
          follow_up_date: content.follow_up_date as string || null,
          notes: ev.notes,
          photos_taken: content.photos_taken as boolean || false,
          status: ev.status === 'assinado' ? 'signed' : 'draft',
          signed_at: ev.signed_at,
          signed_by: ev.signed_by,
          created_at: ev.created_at,
          updated_at: ev.updated_at,
        };
      });
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Create evolution
  const createMutation = useMutation({
    mutationFn: async (data: EvolucaoEsteticaFormData) => {
      console.log(`${LOG_PREFIX.evolucao} Início do save da evolução estética`);

      // ── Step 1: Validate context ──
      const contextErrors: string[] = [];
      if (!patientId) contextErrors.push('patient_id ausente');
      if (!clinic?.id) contextErrors.push('clinic_id ausente');

      if (contextErrors.length > 0) {
        const msg = `Contexto incompleto: ${contextErrors.join(', ')}`;
        console.error(`${LOG_PREFIX.context} ${msg}`);
        throw new Error(msg);
      }

      console.log(`${LOG_PREFIX.context} clinic_id=${clinic!.id}, patient_id=${patientId}, appointment_id=${appointmentId || 'NENHUM'}`);

      // ── Step 2: Resolve professional ──
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        console.error(`${LOG_PREFIX.context} Usuário não autenticado`);
        throw new Error('Usuário não autenticado');
      }

      console.log(`${LOG_PREFIX.context} Resolving professional for user_id=${userId}`);
      const { data: professional, error: profError } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', userId)
        .eq('clinic_id', clinic!.id)
        .single();

      if (profError || !professional) {
        console.error(`${LOG_PREFIX.dbError} Professional lookup failed:`, profError);
        throw new Error(`Profissional não encontrado para este usuário (user_id=${userId})`);
      }
      console.log(`${LOG_PREFIX.context} professional_id=${professional.id}`);

      // ── Step 3: Build content payload ──
      const content = {
        evolution_date: data.evolution_date,
        procedure_performed: data.procedure_performed,
        treatment_area: data.treatment_area || null,
        patient_response: data.patient_response || null,
        complications: data.complications || [],
        complications_notes: data.complications_notes || null,
        satisfaction_level: data.satisfaction_level || null,
        satisfaction_notes: data.satisfaction_notes || null,
        planned_adjustments: data.planned_adjustments || null,
        post_procedure_guidelines: data.post_procedure_guidelines || [],
        follow_up_date: data.follow_up_date || null,
        photos_taken: data.photos_taken || false,
      };

      const insertPayload = {
        clinic_id: clinic!.id,
        patient_id: patientId,
        appointment_id: appointmentId || null,
        professional_id: professional.id,
        evolution_type: 'evolucao_estetica',
        content,
        notes: data.notes || null,
        status: 'rascunho',
      };

      console.log(`${LOG_PREFIX.payload} Insert payload:`, JSON.stringify(insertPayload, null, 2));

      // ── Step 4: Insert ──
      console.log(`${LOG_PREFIX.evolucao} Inserindo em clinical_evolutions...`);
      const { data: result, error } = await supabase
        .from('clinical_evolutions')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error(`${LOG_PREFIX.dbError} Insert falhou na tabela clinical_evolutions`);
        console.error(`${LOG_PREFIX.dbError} Código: ${error.code}`);
        console.error(`${LOG_PREFIX.dbError} Mensagem: ${error.message}`);
        console.error(`${LOG_PREFIX.dbError} Detalhes: ${error.details}`);
        console.error(`${LOG_PREFIX.dbError} Hint: ${error.hint}`);
        console.error(`${LOG_PREFIX.dbError} Erro completo:`, JSON.stringify(error));

        let userMsg = 'Falha ao salvar evolução';
        if (error.code === '23503') userMsg = `Chave estrangeira inválida: ${error.details}`;
        else if (error.code === '23505') userMsg = 'Registro duplicado';
        else if (error.code === '42703') userMsg = `Coluna inexistente: ${error.message}`;
        else if (error.code === '42501') userMsg = 'Permissão negada (RLS)';
        else if (error.message) userMsg = error.message;

        throw new Error(userMsg);
      }

      console.log(`${LOG_PREFIX.evolucao} Evolução salva com sucesso. id=${result.id}`);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Evolução salva como rascunho');
    },
    onError: (error: Error) => {
      console.error(`${LOG_PREFIX.evolucao} FALHA FINAL:`, error);
      toast.error(`Erro ao salvar evolução: ${error.message}`);
    },
  });

  // Sign evolution
  const signMutation = useMutation({
    mutationFn: async (evolucaoId: string) => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('clinical_evolutions')
        .update({
          status: 'assinado',
          signed_at: new Date().toISOString(),
          signed_by: userData.user?.id,
        })
        .eq('id', evolucaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Evolução assinada com sucesso');
    },
    onError: (error) => {
      console.error('Error signing evolution:', error);
      toast.error('Erro ao assinar evolução');
    },
  });

  // Update evolution (only drafts)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EvolucaoEsteticaFormData> }) => {
      const content = {
        evolution_date: data.evolution_date,
        procedure_performed: data.procedure_performed,
        treatment_area: data.treatment_area || null,
        patient_response: data.patient_response || null,
        complications: data.complications || [],
        complications_notes: data.complications_notes || null,
        satisfaction_level: data.satisfaction_level || null,
        satisfaction_notes: data.satisfaction_notes || null,
        planned_adjustments: data.planned_adjustments || null,
        post_procedure_guidelines: data.post_procedure_guidelines || [],
        follow_up_date: data.follow_up_date || null,
        photos_taken: data.photos_taken || false,
      };

      const { error } = await supabase
        .from('clinical_evolutions')
        .update({
          content,
          notes: data.notes || null,
        })
        .eq('id', id)
        .eq('status', 'rascunho');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Evolução atualizada');
    },
    onError: (error) => {
      console.error('Error updating evolution:', error);
      toast.error('Erro ao atualizar evolução');
    },
  });

  const currentAppointmentEvolucoes = appointmentId
    ? evolucoes.filter(e => e.appointment_id === appointmentId)
    : [];

  return {
    evolucoes,
    currentAppointmentEvolucoes,
    isLoading,
    create: createMutation.mutateAsync,
    sign: signMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isSigning: signMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
