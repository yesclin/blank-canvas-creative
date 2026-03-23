/**
 * NUTRIÇÃO - Evolução / Retorno
 * 
 * Hook otimizado para uso diário do nutricionista.
 * Permite registrar evoluções recorrentes com comparativo automático.
 * Mantém histórico completo e imutável.
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type NivelAdesao = 'excelente' | 'boa' | 'regular' | 'ruim';

export interface MedidasEvolucao {
  cintura_cm: number | null;
  quadril_cm: number | null;
  braco_cm: number | null;
  coxa_cm: number | null;
  outras_medidas: Record<string, number> | null;
}

export interface EvolucaoRetorno {
  id: string;
  patient_id: string;
  clinic_id: string;
  professional_id: string;
  professional_name?: string;
  appointment_id: string | null;
  
  // Data do atendimento
  data_atendimento: string;
  
  // Peso e medidas
  peso_atual_kg: number;
  medidas: MedidasEvolucao;
  
  // Adesão ao plano
  nivel_adesao: NivelAdesao;
  adesao_detalhes: string | null;
  
  // Dificuldades relatadas
  dificuldades_relatadas: string;
  
  // Ajustes no plano
  ajustes_realizados: string;
  
  // Conduta nutricional
  nova_conduta: string;
  
  // Observações adicionais
  observacoes: string | null;
  
  // Status (sempre signed para manter imutável)
  status: 'signed';
  signed_at: string;
  
  created_at: string;
}

export interface EvolucaoRetornoFormData {
  data_atendimento: string;
  peso_atual_kg: number | null;
  medidas: MedidasEvolucao;
  nivel_adesao: NivelAdesao | null;
  adesao_detalhes: string | null;
  dificuldades_relatadas: string;
  ajustes_realizados: string;
  nova_conduta: string;
  observacoes: string | null;
}

export interface ComparativoEvolucao {
  peso_anterior: number | null;
  peso_variacao: number | null;
  peso_variacao_percent: number | null;
  
  cintura_anterior: number | null;
  cintura_variacao: number | null;
  
  quadril_anterior: number | null;
  quadril_variacao: number | null;
  
  dias_desde_ultima: number | null;
  data_anterior: string | null;
}

// Labels para nível de adesão
export const NIVEL_ADESAO_LABELS: Record<NivelAdesao, string> = {
  excelente: 'Excelente',
  boa: 'Boa',
  regular: 'Regular',
  ruim: 'Ruim',
};

export const NIVEL_ADESAO_COLORS: Record<NivelAdesao, string> = {
  excelente: 'bg-green-100 text-green-800 border-green-300',
  boa: 'bg-blue-100 text-blue-800 border-blue-300',
  regular: 'bg-amber-100 text-amber-800 border-amber-300',
  ruim: 'bg-red-100 text-red-800 border-red-300',
};

/**
 * Hook para gerenciar evoluções/retornos nutricionais
 */
export function useEvolucaoRetornoData(patientId: string | null, professionalId?: string) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  // Buscar todas as evoluções do paciente
  const {
    data: evolucoes,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['nutricao-evolucao-retorno', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select(`
          *,
          professional:professionals!clinical_evolutions_professional_id_fkey(
            id,
            profiles:profiles!professionals_user_id_fkey(full_name)
          )
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('specialty', 'nutricao')
        .eq('evolution_type', 'evolucao_retorno')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(item => {
        const content = item.content as Record<string, unknown>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const professionalData = item.professional as any;
        const professionalName = professionalData?.[0]?.profiles?.[0]?.full_name || 'Profissional';

        const medidas: MedidasEvolucao = {
          cintura_cm: (content?.cintura_cm as number) || null,
          quadril_cm: (content?.quadril_cm as number) || null,
          braco_cm: (content?.braco_cm as number) || null,
          coxa_cm: (content?.coxa_cm as number) || null,
          outras_medidas: (content?.outras_medidas as Record<string, number>) || null,
        };

        return {
          id: item.id,
          patient_id: item.patient_id,
          clinic_id: item.clinic_id,
          professional_id: item.professional_id,
          professional_name: professionalName,
          appointment_id: item.appointment_id,
          data_atendimento: (content?.data_atendimento as string) || item.created_at.split('T')[0],
          peso_atual_kg: (content?.peso_atual_kg as number) || 0,
          medidas,
          nivel_adesao: (content?.nivel_adesao as NivelAdesao) || 'regular',
          adesao_detalhes: (content?.adesao_detalhes as string) || null,
          dificuldades_relatadas: (content?.dificuldades_relatadas as string) || '',
          ajustes_realizados: (content?.ajustes_realizados as string) || '',
          nova_conduta: (content?.nova_conduta as string) || '',
          observacoes: item.notes,
          status: 'signed' as const,
          signed_at: item.signed_at || item.created_at,
          created_at: item.created_at,
        };
      }) as EvolucaoRetorno[];
    },
    enabled: !!patientId && !!clinic?.id,
  });

  // Última evolução (para comparativo)
  const lastEvolucao = evolucoes?.[0] || null;

  // Calcular comparativo com a última evolução
  const calcularComparativo = useCallback((pesoAtual: number | null, medidasAtuais: MedidasEvolucao): ComparativoEvolucao => {
    if (!lastEvolucao) {
      return {
        peso_anterior: null,
        peso_variacao: null,
        peso_variacao_percent: null,
        cintura_anterior: null,
        cintura_variacao: null,
        quadril_anterior: null,
        quadril_variacao: null,
        dias_desde_ultima: null,
        data_anterior: null,
      };
    }

    const pesoAnterior = lastEvolucao.peso_atual_kg;
    const pesoVariacao = pesoAtual ? pesoAtual - pesoAnterior : null;
    const pesoVariacaoPercent = pesoAtual && pesoAnterior 
      ? ((pesoAtual - pesoAnterior) / pesoAnterior) * 100 
      : null;

    const cinturaAnterior = lastEvolucao.medidas.cintura_cm;
    const cinturaVariacao = medidasAtuais.cintura_cm && cinturaAnterior 
      ? medidasAtuais.cintura_cm - cinturaAnterior 
      : null;

    const quadrilAnterior = lastEvolucao.medidas.quadril_cm;
    const quadrilVariacao = medidasAtuais.quadril_cm && quadrilAnterior 
      ? medidasAtuais.quadril_cm - quadrilAnterior 
      : null;

    const dataAnterior = new Date(lastEvolucao.data_atendimento);
    const hoje = new Date();
    const diasDesdeUltima = Math.floor((hoje.getTime() - dataAnterior.getTime()) / (1000 * 60 * 60 * 24));

    return {
      peso_anterior: pesoAnterior,
      peso_variacao: pesoVariacao ? Number(pesoVariacao.toFixed(1)) : null,
      peso_variacao_percent: pesoVariacaoPercent ? Number(pesoVariacaoPercent.toFixed(1)) : null,
      cintura_anterior: cinturaAnterior,
      cintura_variacao: cinturaVariacao ? Number(cinturaVariacao.toFixed(1)) : null,
      quadril_anterior: quadrilAnterior,
      quadril_variacao: quadrilVariacao ? Number(quadrilVariacao.toFixed(1)) : null,
      dias_desde_ultima: diasDesdeUltima,
      data_anterior: lastEvolucao.data_atendimento,
    };
  }, [lastEvolucao]);

  // Comparativo atual (memo)
  const comparativoAtual = useMemo(() => {
    return calcularComparativo(null, {
      cintura_cm: null,
      quadril_cm: null,
      braco_cm: null,
      coxa_cm: null,
      outras_medidas: null,
    });
  }, [calcularComparativo]);

  // Salvar evolução (sempre como assinada - imutável)
  const saveEvolucao = useCallback(async (
    formData: EvolucaoRetornoFormData,
    appointmentId?: string
  ) => {
    if (!patientId || !clinic?.id || !professionalId) {
      toast.error('Dados incompletos para salvar evolução');
      return null;
    }

    if (!formData.peso_atual_kg) {
      toast.error('O peso atual é obrigatório');
      return null;
    }

    if (!formData.nivel_adesao) {
      toast.error('O nível de adesão é obrigatório');
      return null;
    }

    setSaving(true);

    try {
      const content = {
        data_atendimento: formData.data_atendimento,
        peso_atual_kg: formData.peso_atual_kg,
        cintura_cm: formData.medidas.cintura_cm,
        quadril_cm: formData.medidas.quadril_cm,
        braco_cm: formData.medidas.braco_cm,
        coxa_cm: formData.medidas.coxa_cm,
        outras_medidas: formData.medidas.outras_medidas,
        nivel_adesao: formData.nivel_adesao,
        adesao_detalhes: formData.adesao_detalhes,
        dificuldades_relatadas: formData.dificuldades_relatadas,
        ajustes_realizados: formData.ajustes_realizados,
        nova_conduta: formData.nova_conduta,
      };

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          professional_id: professionalId,
          appointment_id: appointmentId || null,
          evolution_type: 'evolucao_retorno',
          specialty: 'nutricao',
          content,
          notes: formData.observacoes,
          status: 'signed', // Sempre assinado para garantir imutabilidade
          signed_at: new Date().toISOString(),
          signed_by: professionalId,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Evolução registrada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['nutricao-evolucao-retorno', patientId] });
      queryClient.invalidateQueries({ queryKey: ['nutricao-timeline', patientId] });

      return data;
    } catch (error) {
      console.error('Erro ao salvar evolução:', error);
      toast.error('Erro ao salvar evolução');
      return null;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, professionalId, queryClient]);

  return {
    evolucoes: evolucoes || [],
    lastEvolucao,
    comparativoAtual,
    loading,
    saving,
    saveEvolucao,
    calcularComparativo,
    refetch,
  };
}
