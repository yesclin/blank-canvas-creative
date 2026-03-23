/**
 * NUTRIÇÃO - Hook de Avaliação Clínica / Bioquímica
 * 
 * Gerencia registros de sinais, sintomas e exames laboratoriais.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useClinicData } from '@/hooks/useClinicData';

export interface ExameLaboratorial {
  nome: string;
  valor: string;
  unidade: string;
  referencia?: string;
  status?: 'normal' | 'baixo' | 'alto';
  data?: string;
}

export interface AvaliacaoClinica {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string;
  appointment_id?: string;
  
  // Sinais e sintomas
  sinais_sintomas: string[];
  sinais_sintomas_obs?: string;
  
  // Exames laboratoriais
  exames: ExameLaboratorial[];
  
  // Observações clínicas
  observacoes_clinicas?: string;
  
  // Auditoria
  created_at: string;
  updated_at: string;
}

export interface AvaliacaoClinicaFormData {
  sinais_sintomas: string[];
  sinais_sintomas_obs: string;
  exames: ExameLaboratorial[];
  observacoes_clinicas: string;
}

// Lista de sinais/sintomas comuns em nutrição
export const SINAIS_SINTOMAS_NUTRICAO = [
  'Fadiga / Cansaço',
  'Fraqueza muscular',
  'Queda de cabelo',
  'Unhas frágeis',
  'Pele seca',
  'Constipação intestinal',
  'Diarreia',
  'Distensão abdominal',
  'Náuseas',
  'Refluxo / Azia',
  'Apetite reduzido',
  'Compulsão alimentar',
  'Ansiedade',
  'Insônia',
  'Irritabilidade',
  'Dificuldade de concentração',
  'Edema (inchaço)',
  'Câimbras',
  'Formigamento',
  'Cicatrização lenta',
];

// Exames laboratoriais comuns em nutrição
export const EXAMES_COMUNS_NUTRICAO = [
  { nome: 'Glicemia de jejum', unidade: 'mg/dL', referencia: '70-99' },
  { nome: 'Hemoglobina glicada (HbA1c)', unidade: '%', referencia: '< 5.7' },
  { nome: 'Colesterol total', unidade: 'mg/dL', referencia: '< 200' },
  { nome: 'HDL', unidade: 'mg/dL', referencia: '> 40 (H) / > 50 (M)' },
  { nome: 'LDL', unidade: 'mg/dL', referencia: '< 100' },
  { nome: 'Triglicerídeos', unidade: 'mg/dL', referencia: '< 150' },
  { nome: 'Hemoglobina', unidade: 'g/dL', referencia: '12-16 (M) / 14-18 (H)' },
  { nome: 'Ferritina', unidade: 'ng/mL', referencia: '20-200 (M) / 20-500 (H)' },
  { nome: 'Ferro sérico', unidade: 'µg/dL', referencia: '60-170' },
  { nome: 'Vitamina D (25-OH)', unidade: 'ng/mL', referencia: '30-100' },
  { nome: 'Vitamina B12', unidade: 'pg/mL', referencia: '200-900' },
  { nome: 'Ácido fólico', unidade: 'ng/mL', referencia: '3-17' },
  { nome: 'TSH', unidade: 'mUI/L', referencia: '0.4-4.0' },
  { nome: 'T4 livre', unidade: 'ng/dL', referencia: '0.8-1.8' },
  { nome: 'Creatinina', unidade: 'mg/dL', referencia: '0.6-1.2' },
  { nome: 'Ureia', unidade: 'mg/dL', referencia: '15-40' },
  { nome: 'TGO (AST)', unidade: 'U/L', referencia: '< 40' },
  { nome: 'TGP (ALT)', unidade: 'U/L', referencia: '< 41' },
  { nome: 'Ácido úrico', unidade: 'mg/dL', referencia: '2.5-7.0' },
  { nome: 'Albumina', unidade: 'g/dL', referencia: '3.5-5.0' },
  { nome: 'Proteínas totais', unidade: 'g/dL', referencia: '6.0-8.0' },
  { nome: 'Zinco', unidade: 'µg/dL', referencia: '70-120' },
  { nome: 'Magnésio', unidade: 'mg/dL', referencia: '1.7-2.5' },
  { nome: 'Cálcio', unidade: 'mg/dL', referencia: '8.5-10.5' },
  { nome: 'Potássio', unidade: 'mEq/L', referencia: '3.5-5.0' },
  { nome: 'Sódio', unidade: 'mEq/L', referencia: '136-145' },
];

export function useAvaliacaoClinicaData(patientId: string | null) {
  const { toast } = useToast();
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();

  // Buscar avaliações clínicas do paciente
  const {
    data: avaliacoes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['avaliacao-clinica-nutricao', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];
      
      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('specialty', 'nutricao')
        .eq('evolution_type', 'exam')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((ev) => {
        const content = ev.content as Record<string, unknown>;
        return {
          id: ev.id,
          patient_id: ev.patient_id,
          clinic_id: ev.clinic_id,
          professional_id: ev.professional_id,
          appointment_id: ev.appointment_id,
          sinais_sintomas: (content?.sinais_sintomas as string[]) || [],
          sinais_sintomas_obs: (content?.sinais_sintomas_obs as string) || '',
          exames: (content?.exames as ExameLaboratorial[]) || [],
          observacoes_clinicas: (content?.observacoes_clinicas as string) || '',
          created_at: ev.created_at,
          updated_at: ev.updated_at,
        } as AvaliacaoClinica;
      });
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Salvar nova avaliação
  const saveAvaliacao = useMutation({
    mutationFn: async (formData: AvaliacaoClinicaFormData) => {
      if (!patientId || !clinic?.id) {
        throw new Error('Dados incompletos para salvar avaliação');
      }
      
      // Buscar professional_id do usuário logado
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
        sinais_sintomas: formData.sinais_sintomas,
        sinais_sintomas_obs: formData.sinais_sintomas_obs,
        exames: formData.exames.map(e => ({
          nome: e.nome,
          valor: e.valor,
          unidade: e.unidade,
          referencia: e.referencia || null,
          status: e.status || null,
          data: e.data || null,
        })),
        observacoes_clinicas: formData.observacoes_clinicas,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert([{
          patient_id: patientId,
          clinic_id: clinic.id,
          professional_id: professionalId,
          specialty: 'nutricao',
          evolution_type: 'exam',
          status: 'signed',
          content: JSON.parse(JSON.stringify(contentData)),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avaliacao-clinica-nutricao', patientId, clinic?.id] });
      toast({
        title: 'Avaliação registrada',
        description: 'Os dados clínicos foram salvos com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao salvar avaliação clínica:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível registrar a avaliação clínica.',
        variant: 'destructive',
      });
    },
  });

  return {
    avaliacoes,
    isLoading,
    error,
    saveAvaliacao: saveAvaliacao.mutateAsync,
    isSaving: saveAvaliacao.isPending,
  };
}
