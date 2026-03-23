/**
 * NUTRIÇÃO - Anamnese Nutricional
 * 
 * Hook para gerenciar dados de anamnese nutricional do paciente.
 * Segue o padrão de versionamento: não sobrescreve automaticamente,
 * permite atualização manual e mantém histórico completo.
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface AnamneseNutricional {
  id: string;
  patient_id: string;
  clinic_id: string;
  version: number;
  is_current: boolean;

  // BLOCO 1 – Objetivo / Queixa Principal
  queixa_principal: string;

  // BLOCO 2 – História Alimentar
  rotina_alimentar: string;
  refeicoes_por_dia: number | null;
  consumo_agua_litros: number | null;
  consumo_acucar: string;
  consumo_ultraprocessados: string;
  consumo_alcool: string;

  // BLOCO 3 – Histórico Clínico Nutricional
  doencas_associadas: string;
  uso_medicamentos: string;
  suplementacao: string;

  // BLOCO 4 – Avaliação Antropométrica
  peso_kg: number | null;
  altura_cm: number | null;
  imc: number | null;
  circunferencia_abdominal_cm: number | null;
  percentual_gordura: number | null;
  massa_magra_kg: number | null;

  // BLOCO 5 – Comportamento e Estilo de Vida
  qualidade_sono: string;
  nivel_estresse: string;
  atividade_fisica: string;
  compulsao_alimentar: string;
  relacao_emocional_comida: string;

  // BLOCO 6 – Diagnóstico Nutricional
  diagnostico_nutricional: string;

  // BLOCO 7 – Plano Alimentar / Conduta
  estrategia_nutricional: string;
  meta_calorica: string;
  distribuicao_macronutrientes: string;
  orientacoes_gerais: string;
  proxima_reavaliacao: string | null;

  // Observações
  observacoes: string | null;

  // Auditoria
  created_at: string;
  created_by: string;
  created_by_name?: string;
}

export interface AnamneseNutricionalFormData {
  queixa_principal: string;
  rotina_alimentar: string;
  refeicoes_por_dia: number | null;
  consumo_agua_litros: number | null;
  consumo_acucar: string;
  consumo_ultraprocessados: string;
  consumo_alcool: string;
  doencas_associadas: string;
  uso_medicamentos: string;
  suplementacao: string;
  peso_kg: number | null;
  altura_cm: number | null;
  imc: number | null;
  circunferencia_abdominal_cm: number | null;
  percentual_gordura: number | null;
  massa_magra_kg: number | null;
  qualidade_sono: string;
  nivel_estresse: string;
  atividade_fisica: string;
  compulsao_alimentar: string;
  relacao_emocional_comida: string;
  diagnostico_nutricional: string;
  estrategia_nutricional: string;
  meta_calorica: string;
  distribuicao_macronutrientes: string;
  orientacoes_gerais: string;
  proxima_reavaliacao: string | null;
  observacoes: string | null;
}

export const INITIAL_NUTRICAO_FORM: AnamneseNutricionalFormData = {
  queixa_principal: '',
  rotina_alimentar: '',
  refeicoes_por_dia: null,
  consumo_agua_litros: null,
  consumo_acucar: '',
  consumo_ultraprocessados: '',
  consumo_alcool: '',
  doencas_associadas: '',
  uso_medicamentos: '',
  suplementacao: '',
  peso_kg: null,
  altura_cm: null,
  imc: null,
  circunferencia_abdominal_cm: null,
  percentual_gordura: null,
  massa_magra_kg: null,
  qualidade_sono: '',
  nivel_estresse: '',
  atividade_fisica: '',
  compulsao_alimentar: '',
  relacao_emocional_comida: '',
  diagnostico_nutricional: '',
  estrategia_nutricional: '',
  meta_calorica: '',
  distribuicao_macronutrientes: '',
  orientacoes_gerais: '',
  proxima_reavaliacao: null,
  observacoes: null,
};

/** Calcula IMC a partir de peso (kg) e altura (cm) */
export function calcularIMC(pesoKg: number | null, alturaCm: number | null): number | null {
  if (!pesoKg || !alturaCm || alturaCm <= 0) return null;
  const alturaM = alturaCm / 100;
  return Math.round((pesoKg / (alturaM * alturaM)) * 10) / 10;
}

/** Classificação do IMC */
export function classificarIMC(imc: number | null): string {
  if (imc === null) return '';
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso normal';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade grau I';
  if (imc < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

function mapContentToAnamnese(
  content: Record<string, unknown>,
  item: { id: string; patient_id: string; clinic_id: string; created_at: string; professional_id: string; notes: string | null },
  version: number,
  isCurrent: boolean,
  creatorName?: string,
): AnamneseNutricional {
  return {
    id: item.id,
    patient_id: item.patient_id,
    clinic_id: item.clinic_id,
    version,
    is_current: isCurrent,
    queixa_principal: (content?.queixa_principal as string) || '',
    rotina_alimentar: (content?.rotina_alimentar as string) || (content?.historico_alimentar as string) || '',
    refeicoes_por_dia: (content?.refeicoes_por_dia as number) || null,
    consumo_agua_litros: (content?.consumo_agua_litros as number) || null,
    consumo_acucar: (content?.consumo_acucar as string) || '',
    consumo_ultraprocessados: (content?.consumo_ultraprocessados as string) || '',
    consumo_alcool: (content?.consumo_alcool as string) || '',
    doencas_associadas: (content?.doencas_associadas as string) || '',
    uso_medicamentos: (content?.uso_medicamentos as string) || '',
    suplementacao: (content?.suplementacao as string) || (content?.suplementos_detalhes as string) || '',
    peso_kg: (content?.peso_kg as number) || null,
    altura_cm: (content?.altura_cm as number) || null,
    imc: (content?.imc as number) || null,
    circunferencia_abdominal_cm: (content?.circunferencia_abdominal_cm as number) || null,
    percentual_gordura: (content?.percentual_gordura as number) || null,
    massa_magra_kg: (content?.massa_magra_kg as number) || null,
    qualidade_sono: (content?.qualidade_sono as string) || '',
    nivel_estresse: (content?.nivel_estresse as string) || '',
    atividade_fisica: (content?.atividade_fisica as string) || (content?.atividade_fisica_detalhes as string) || '',
    compulsao_alimentar: (content?.compulsao_alimentar as string) || '',
    relacao_emocional_comida: (content?.relacao_emocional_comida as string) || '',
    diagnostico_nutricional: (content?.diagnostico_nutricional as string) || '',
    estrategia_nutricional: (content?.estrategia_nutricional as string) || '',
    meta_calorica: (content?.meta_calorica as string) || '',
    distribuicao_macronutrientes: (content?.distribuicao_macronutrientes as string) || '',
    orientacoes_gerais: (content?.orientacoes_gerais as string) || '',
    proxima_reavaliacao: (content?.proxima_reavaliacao as string) || null,
    observacoes: item.notes,
    created_at: item.created_at,
    created_by: item.professional_id,
    created_by_name: creatorName,
  };
}

/**
 * Hook para gerenciar anamnese nutricional com versionamento
 */
export function useAnamneseNutricionalData(patientId: string | null) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const {
    data: anamneses,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['nutricao-anamnese', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('evolution_type', 'anamnese_nutricional')
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

      return data.map((item, index) => {
        const content = item.content as Record<string, unknown>;
        return mapContentToAnamnese(
          content,
          item,
          data.length - index,
          index === 0,
          item.professional_id ? creatorsMap[item.professional_id] : undefined,
        );
      });
    },
    enabled: !!patientId && !!clinic?.id,
  });

  const currentAnamnese = anamneses?.[0] || null;
  const anamneseHistory = anamneses || [];

  const saveAnamnese = useCallback(async (
    formData: AnamneseNutricionalFormData,
    professionalId: string
  ) => {
    if (!patientId || !clinic?.id) {
      toast.error('Paciente ou clínica não identificados');
      return null;
    }

    setSaving(true);

    try {
      const content = { ...formData };
      // Remove observacoes from content (goes to notes column)
      const { observacoes, ...contentWithoutObs } = content;

      const insertData = {
        patient_id: patientId,
        clinic_id: clinic.id,
        professional_id: professionalId,
        evolution_type: 'anamnese_nutricional',
        specialty: 'nutricao',
        content: contentWithoutObs,
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

      const newVersion = (currentAnamnese?.version || 0) + 1;
      toast.success(`Anamnese nutricional salva (versão ${newVersion})`);

      queryClient.invalidateQueries({ queryKey: ['nutricao-anamnese', patientId] });

      return data;
    } catch (error) {
      console.error('Erro ao salvar anamnese nutricional:', error);
      toast.error('Erro ao salvar anamnese nutricional');
      return null;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentAnamnese, queryClient]);

  return {
    currentAnamnese,
    anamneseHistory,
    loading,
    saving,
    saveAnamnese,
    refetch,
  };
}
