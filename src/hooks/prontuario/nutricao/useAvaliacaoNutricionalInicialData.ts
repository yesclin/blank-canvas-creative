/**
 * NUTRIÇÃO - Avaliação Nutricional Inicial
 * 
 * Hook para gerenciar avaliações nutricionais iniciais do paciente.
 * Permite múltiplos registros com histórico cronológico.
 * Difere da anamnese: foco em avaliação pontual, não no histórico de vida.
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface AvaliacaoNutricionalInicial {
  id: string;
  patient_id: string;
  clinic_id: string;
  appointment_id: string | null;
  
  // Data da avaliação
  data_avaliacao: string;
  
  // Queixa principal
  queixa_principal: string;
  
  // Histórico alimentar detalhado
  historico_alimentar: string;
  
  // Rotina diária
  rotina_diaria: string;
  horario_acordar: string | null;
  horario_dormir: string | null;
  horario_trabalho: string | null;
  
  // Consumo hídrico
  consumo_hidrico_litros: number | null;
  tipo_bebida_principal: string | null;
  
  // Suplementos
  usa_suplementos: boolean;
  suplementos_lista: string[];
  suplementos_detalhes: string | null;
  
  // Restrições alimentares
  restricoes_alimentares: string[];
  restricoes_detalhes: string | null;
  
  // Alergias e intolerâncias
  alergias_alimentares: string[];
  intolerancias: string[];
  alergias_intolerancias_detalhes: string | null;
  
  // Objetivos nutricionais
  objetivos_nutricionais: string[];
  objetivo_principal: string;
  peso_desejado_kg: number | null;
  prazo_objetivo: string | null;
  motivacao: string | null;
  
  // Observações
  observacoes: string | null;
  
  // Auditoria
  created_at: string;
  created_by: string;
  created_by_name?: string;
}

export interface AvaliacaoNutricionalInicialFormData {
  data_avaliacao: string;
  queixa_principal: string;
  historico_alimentar: string;
  rotina_diaria: string;
  horario_acordar: string | null;
  horario_dormir: string | null;
  horario_trabalho: string | null;
  consumo_hidrico_litros: number | null;
  tipo_bebida_principal: string | null;
  usa_suplementos: boolean;
  suplementos_lista: string[];
  suplementos_detalhes: string | null;
  restricoes_alimentares: string[];
  restricoes_detalhes: string | null;
  alergias_alimentares: string[];
  intolerancias: string[];
  alergias_intolerancias_detalhes: string | null;
  objetivos_nutricionais: string[];
  objetivo_principal: string;
  peso_desejado_kg: number | null;
  prazo_objetivo: string | null;
  motivacao: string | null;
  observacoes: string | null;
}

// Opções de objetivos nutricionais
export const OBJETIVOS_NUTRICIONAIS_OPTIONS = [
  'Perda de peso',
  'Ganho de massa muscular',
  'Manutenção do peso',
  'Melhora da composição corporal',
  'Controle de doença crônica',
  'Melhora da disposição e energia',
  'Reeducação alimentar',
  'Melhora da qualidade do sono',
  'Melhora da saúde intestinal',
  'Performance esportiva',
  'Gestação saudável',
  'Pós-parto e amamentação',
];

// Opções de restrições alimentares
export const RESTRICOES_OPTIONS = [
  'Vegetariano',
  'Vegano',
  'Sem glúten',
  'Sem lactose',
  'Low carb',
  'Cetogênica',
  'Sem açúcar',
  'Sem carne vermelha',
  'Sem carne de porco',
  'Sem frutos do mar',
  'Kosher',
  'Halal',
];

// Opções de alergias
export const ALERGIAS_OPTIONS = [
  'Amendoim',
  'Nozes e castanhas',
  'Leite de vaca',
  'Ovos',
  'Trigo',
  'Soja',
  'Peixes',
  'Frutos do mar (crustáceos)',
  'Gergelim',
  'Mostarda',
  'Corantes artificiais',
];

// Opções de intolerâncias
export const INTOLERANCIAS_OPTIONS = [
  'Lactose',
  'Glúten',
  'Frutose',
  'Histamina',
  'FODMAPs',
  'Cafeína',
  'Sulfitos',
];

// Opções de suplementos comuns
export const SUPLEMENTOS_OPTIONS = [
  'Whey Protein',
  'Creatina',
  'BCAA',
  'Glutamina',
  'Vitamina D',
  'Vitamina C',
  'Vitamina B12',
  'Ômega 3',
  'Ferro',
  'Zinco',
  'Magnésio',
  'Colágeno',
  'Probióticos',
  'Multivitamínico',
  'Termogênico',
  'Pré-treino',
];

/**
 * Hook para gerenciar avaliações nutricionais iniciais
 */
export function useAvaliacaoNutricionalInicialData(patientId: string | null) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  // Buscar todas as avaliações do paciente
  const {
    data: avaliacoes,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['nutricao-avaliacao-inicial', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('evolution_type', 'avaliacao_nutricional_inicial')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar nomes dos criadores
      const creatorIds = [...new Set((data || []).map(a => a.professional_id).filter(Boolean))];
      let creatorsMap: Record<string, string> = {};

      if (creatorIds.length > 0) {
        const { data: professionals } = await supabase
          .from('professionals')
          .select('id, profiles:profiles!professionals_user_id_fkey(full_name)')
          .in('id', creatorIds);

        if (professionals) {
          creatorsMap = professionals.reduce((acc, p) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const prof = p as any;
            if (prof.id && prof.profiles?.[0]?.full_name) {
              acc[prof.id] = prof.profiles[0].full_name;
            }
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Mapear para o formato esperado
      return data.map((item) => {
        const content = item.content as Record<string, unknown>;
        return {
          id: item.id,
          patient_id: item.patient_id,
          clinic_id: item.clinic_id,
          appointment_id: item.appointment_id,
          data_avaliacao: (content?.data_avaliacao as string) || item.created_at.split('T')[0],
          queixa_principal: (content?.queixa_principal as string) || '',
          historico_alimentar: (content?.historico_alimentar as string) || '',
          rotina_diaria: (content?.rotina_diaria as string) || '',
          horario_acordar: (content?.horario_acordar as string) || null,
          horario_dormir: (content?.horario_dormir as string) || null,
          horario_trabalho: (content?.horario_trabalho as string) || null,
          consumo_hidrico_litros: (content?.consumo_hidrico_litros as number) || null,
          tipo_bebida_principal: (content?.tipo_bebida_principal as string) || null,
          usa_suplementos: (content?.usa_suplementos as boolean) || false,
          suplementos_lista: (content?.suplementos_lista as string[]) || [],
          suplementos_detalhes: (content?.suplementos_detalhes as string) || null,
          restricoes_alimentares: (content?.restricoes_alimentares as string[]) || [],
          restricoes_detalhes: (content?.restricoes_detalhes as string) || null,
          alergias_alimentares: (content?.alergias_alimentares as string[]) || [],
          intolerancias: (content?.intolerancias as string[]) || [],
          alergias_intolerancias_detalhes: (content?.alergias_intolerancias_detalhes as string) || null,
          objetivos_nutricionais: (content?.objetivos_nutricionais as string[]) || [],
          objetivo_principal: (content?.objetivo_principal as string) || '',
          peso_desejado_kg: (content?.peso_desejado_kg as number) || null,
          prazo_objetivo: (content?.prazo_objetivo as string) || null,
          motivacao: (content?.motivacao as string) || null,
          observacoes: item.notes,
          created_at: item.created_at,
          created_by: item.professional_id,
          created_by_name: item.professional_id ? creatorsMap[item.professional_id] : undefined,
        };
      }) as AvaliacaoNutricionalInicial[];
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Avaliação mais recente
  const currentAvaliacao = avaliacoes?.[0] || null;

  // Histórico completo
  const avaliacaoHistory = avaliacoes || [];

  // Salvar nova avaliação
  const saveAvaliacao = useCallback(async (
    formData: AvaliacaoNutricionalInicialFormData,
    professionalId: string,
    appointmentId?: string
  ) => {
    if (!patientId || !clinic?.id) {
      toast.error('Paciente ou clínica não identificados');
      return null;
    }

    setSaving(true);

    try {
      const content = {
        data_avaliacao: formData.data_avaliacao,
        queixa_principal: formData.queixa_principal,
        historico_alimentar: formData.historico_alimentar,
        rotina_diaria: formData.rotina_diaria,
        horario_acordar: formData.horario_acordar,
        horario_dormir: formData.horario_dormir,
        horario_trabalho: formData.horario_trabalho,
        consumo_hidrico_litros: formData.consumo_hidrico_litros,
        tipo_bebida_principal: formData.tipo_bebida_principal,
        usa_suplementos: formData.usa_suplementos,
        suplementos_lista: formData.suplementos_lista,
        suplementos_detalhes: formData.suplementos_detalhes,
        restricoes_alimentares: formData.restricoes_alimentares,
        restricoes_detalhes: formData.restricoes_detalhes,
        alergias_alimentares: formData.alergias_alimentares,
        intolerancias: formData.intolerancias,
        alergias_intolerancias_detalhes: formData.alergias_intolerancias_detalhes,
        objetivos_nutricionais: formData.objetivos_nutricionais,
        objetivo_principal: formData.objetivo_principal,
        peso_desejado_kg: formData.peso_desejado_kg,
        prazo_objetivo: formData.prazo_objetivo,
        motivacao: formData.motivacao,
      };

      const insertData = {
        patient_id: patientId,
        clinic_id: clinic.id,
        professional_id: professionalId,
        appointment_id: appointmentId || null,
        evolution_type: 'avaliacao_nutricional_inicial',
        specialty: 'nutricao',
        content,
        notes: formData.observacoes,
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by: professionalId,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;

      toast.success('Avaliação nutricional inicial salva com sucesso');

      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['nutricao-avaliacao-inicial', patientId] });

      return data;
    } catch (error) {
      console.error('Erro ao salvar avaliação nutricional inicial:', error);
      toast.error('Erro ao salvar avaliação nutricional inicial');
      return null;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, queryClient]);

  return {
    avaliacoes: avaliacaoHistory,
    currentAvaliacao,
    loading,
    saving,
    saveAvaliacao,
    refetch,
  };
}
