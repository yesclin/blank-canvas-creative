import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

/**
 * Estrutura de dados da Avaliação Inicial Psicológica — V2 Completa
 */
export interface AnamnesePsicologiaData {
  id: string;
  patient_id: string;
  version: number;
  // 1. Demanda Inicial
  queixa_principal: string;
  expectativas_terapia: string;
  quem_sugeriu_terapia: string;
  // 2. História do Problema Atual
  historico_emocional_comportamental: string;
  quando_comecou: string;
  situacoes_associadas: string;
  frequencia_sintomas: string;
  intensidade_subjetiva: string;
  impacto_vida: string;
  estrategias_tentadas: string;
  // 3. Histórico Psicológico/Psiquiátrico
  ja_fez_terapia: boolean;
  ja_fez_terapia_obs: string;
  uso_medicacao: boolean;
  uso_medicacao_qual: string;
  diagnostico_previo: string;
  internacoes: boolean;
  internacoes_obs: string;
  // 4. Histórico de Vida
  infancia: string;
  adolescencia: string;
  eventos_marcantes: string;
  experiencias_traumaticas: string;
  relacionamento_pais_cuidadores: string;
  contexto_familiar: string;
  // 5. Contexto Atual
  contexto_trabalho: string;
  contexto_relacionamentos: string;
  contexto_vida_social: string;
  contexto_rede_apoio: string;
  contexto_rotina: string;
  contexto_sono: string;
  contexto_alimentacao: string;
  contexto_atividade_fisica: string;
  // 6. Funcionamento Psíquico Atual
  humor_predominante: string;
  ansiedade: string;
  irritabilidade: string;
  concentracao: string;
  autoestima: string;
  pensamentos_recorrentes: string;
  ideacao_suicida: boolean;
  ideacao_suicida_obs: string;
  comportamentos_risco: string;
  // Legacy
  fatores_risco: string;
  fatores_protecao: string;
  // 7. Observação Clínica do Psicólogo
  observacao_postura: string;
  observacao_afeto: string;
  observacao_linguagem: string;
  observacao_insight: string;
  observacao_coerencia_discurso: string;
  impressoes_clinicas: string;
  formulacao_inicial: string;
  hipoteses: string;
  ocultar_avaliacao_relatorio: boolean;
  // 8. Objetivos Terapêuticos
  objetivo_1: string;
  objetivo_2: string;
  objetivo_3: string;
  observacoes_objetivos: string;
  // 9. Plano Terapêutico Inicial
  abordagem_terapeutica: string;
  frequencia_sessoes: string;
  encaminhamentos: string;
  intervencoes_previstas: string;
  // Modalidade
  modalidade: string;
  // Observações
  observacoes: string;
  // Legacy mapped
  contexto_social: string;
  historico_tratamentos: string;
  // Meta
  created_at: string;
  created_by: string;
  created_by_name?: string;
  is_current: boolean;
}

export type AnamnesePsicologiaFormData = Omit<
  AnamnesePsicologiaData, 
  'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'
>;

interface UseAnamnesePsicologiaDataResult {
  currentAnamnese: AnamnesePsicologiaData | null;
  anamneseHistory: AnamnesePsicologiaData[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveAnamnese: (data: AnamnesePsicologiaFormData) => Promise<void>;
  updateAnamnese: (id: string, data: AnamnesePsicologiaFormData) => Promise<void>;
  refetch: () => Promise<void>;
}

const mapRow = (item: any, creatorsMap: Record<string, string>): AnamnesePsicologiaData => ({
  id: item.id,
  patient_id: item.patient_id,
  version: item.version,
  queixa_principal: item.queixa_principal || '',
  expectativas_terapia: item.expectativas_terapia || '',
  quem_sugeriu_terapia: item.quem_sugeriu_terapia || '',
  historico_emocional_comportamental: item.historico_emocional_comportamental || '',
  quando_comecou: item.quando_comecou || '',
  situacoes_associadas: item.situacoes_associadas || '',
  frequencia_sintomas: item.frequencia_sintomas || '',
  intensidade_subjetiva: item.intensidade_subjetiva || '',
  impacto_vida: item.impacto_vida || '',
  estrategias_tentadas: item.estrategias_tentadas || '',
  ja_fez_terapia: item.ja_fez_terapia ?? false,
  ja_fez_terapia_obs: item.ja_fez_terapia_obs || '',
  uso_medicacao: item.uso_medicacao ?? false,
  uso_medicacao_qual: item.uso_medicacao_qual || '',
  diagnostico_previo: item.diagnostico_previo || '',
  internacoes: item.internacoes ?? false,
  internacoes_obs: item.internacoes_obs || '',
  infancia: item.infancia || '',
  adolescencia: item.adolescencia || '',
  eventos_marcantes: item.eventos_marcantes || '',
  experiencias_traumaticas: item.experiencias_traumaticas || '',
  relacionamento_pais_cuidadores: item.relacionamento_pais_cuidadores || '',
  contexto_familiar: item.contexto_familiar || '',
  contexto_trabalho: item.contexto_trabalho || '',
  contexto_relacionamentos: item.contexto_relacionamentos || '',
  contexto_vida_social: item.contexto_vida_social || '',
  contexto_rede_apoio: item.contexto_rede_apoio || '',
  contexto_rotina: item.contexto_rotina || '',
  contexto_sono: item.contexto_sono || '',
  contexto_alimentacao: item.contexto_alimentacao || '',
  contexto_atividade_fisica: item.contexto_atividade_fisica || '',
  humor_predominante: item.humor_predominante || '',
  ansiedade: item.ansiedade || '',
  irritabilidade: item.irritabilidade || '',
  concentracao: item.concentracao || '',
  autoestima: item.autoestima || '',
  pensamentos_recorrentes: item.pensamentos_recorrentes || '',
  ideacao_suicida: item.ideacao_suicida ?? false,
  ideacao_suicida_obs: item.ideacao_suicida_obs || '',
  comportamentos_risco: item.comportamentos_risco || '',
  fatores_risco: item.fatores_risco || '',
  fatores_protecao: item.fatores_protecao || '',
  observacao_postura: item.observacao_postura || '',
  observacao_afeto: item.observacao_afeto || '',
  observacao_linguagem: item.observacao_linguagem || '',
  observacao_insight: item.observacao_insight || '',
  observacao_coerencia_discurso: item.observacao_coerencia_discurso || '',
  impressoes_clinicas: item.impressoes_clinicas || '',
  formulacao_inicial: item.formulacao_inicial || '',
  hipoteses: item.hipoteses || '',
  ocultar_avaliacao_relatorio: item.ocultar_avaliacao_relatorio ?? false,
  objetivo_1: item.objetivo_1 || '',
  objetivo_2: item.objetivo_2 || '',
  objetivo_3: item.objetivo_3 || '',
  observacoes_objetivos: item.observacoes_objetivos || '',
  abordagem_terapeutica: item.abordagem_terapeutica || '',
  frequencia_sessoes: item.frequencia_sessoes || '',
  encaminhamentos: item.encaminhamentos || '',
  intervencoes_previstas: item.intervencoes_previstas || '',
  modalidade: item.modalidade || 'presencial',
  observacoes: item.observacoes || '',
  contexto_social: item.contexto_social || '',
  historico_tratamentos: item.historico_tratamentos || '',
  created_at: item.created_at,
  created_by: item.created_by || '',
  created_by_name: item.created_by ? creatorsMap[item.created_by] : undefined,
  is_current: item.is_current ?? false,
});

const buildPayload = (data: AnamnesePsicologiaFormData) => ({
  queixa_principal: data.queixa_principal,
  expectativas_terapia: data.expectativas_terapia,
  quem_sugeriu_terapia: data.quem_sugeriu_terapia,
  historico_emocional_comportamental: data.historico_emocional_comportamental,
  quando_comecou: data.quando_comecou,
  situacoes_associadas: data.situacoes_associadas,
  frequencia_sintomas: data.frequencia_sintomas,
  intensidade_subjetiva: data.intensidade_subjetiva,
  impacto_vida: data.impacto_vida,
  estrategias_tentadas: data.estrategias_tentadas,
  ja_fez_terapia: data.ja_fez_terapia,
  ja_fez_terapia_obs: data.ja_fez_terapia_obs,
  uso_medicacao: data.uso_medicacao,
  uso_medicacao_qual: data.uso_medicacao_qual,
  diagnostico_previo: data.diagnostico_previo,
  internacoes: data.internacoes,
  internacoes_obs: data.internacoes_obs,
  infancia: data.infancia,
  adolescencia: data.adolescencia,
  eventos_marcantes: data.eventos_marcantes,
  experiencias_traumaticas: data.experiencias_traumaticas,
  relacionamento_pais_cuidadores: data.relacionamento_pais_cuidadores,
  contexto_familiar: data.contexto_familiar,
  contexto_trabalho: data.contexto_trabalho,
  contexto_relacionamentos: data.contexto_relacionamentos,
  contexto_vida_social: data.contexto_vida_social,
  contexto_rede_apoio: data.contexto_rede_apoio,
  contexto_rotina: data.contexto_rotina,
  contexto_sono: data.contexto_sono,
  contexto_alimentacao: data.contexto_alimentacao,
  contexto_atividade_fisica: data.contexto_atividade_fisica,
  humor_predominante: data.humor_predominante,
  ansiedade: data.ansiedade,
  irritabilidade: data.irritabilidade,
  concentracao: data.concentracao,
  autoestima: data.autoestima,
  pensamentos_recorrentes: data.pensamentos_recorrentes,
  ideacao_suicida: data.ideacao_suicida,
  ideacao_suicida_obs: data.ideacao_suicida_obs,
  comportamentos_risco: data.comportamentos_risco,
  fatores_risco: data.fatores_risco,
  fatores_protecao: data.fatores_protecao,
  observacao_postura: data.observacao_postura,
  observacao_afeto: data.observacao_afeto,
  observacao_linguagem: data.observacao_linguagem,
  observacao_insight: data.observacao_insight,
  observacao_coerencia_discurso: data.observacao_coerencia_discurso,
  impressoes_clinicas: data.impressoes_clinicas,
  formulacao_inicial: data.formulacao_inicial,
  hipoteses: data.hipoteses,
  ocultar_avaliacao_relatorio: data.ocultar_avaliacao_relatorio,
  objetivo_1: data.objetivo_1,
  objetivo_2: data.objetivo_2,
  objetivo_3: data.objetivo_3,
  observacoes_objetivos: data.observacoes_objetivos,
  abordagem_terapeutica: data.abordagem_terapeutica,
  frequencia_sessoes: data.frequencia_sessoes,
  encaminhamentos: data.encaminhamentos,
  intervencoes_previstas: data.intervencoes_previstas,
  modalidade: data.modalidade,
  observacoes: data.observacoes,
  contexto_social: data.contexto_social,
  historico_tratamentos: data.historico_tratamentos,
});

/**
 * Hook para gerenciar Avaliação Inicial Psicológica com versionamento
 */
export function useAnamnesePsicologiaData(patientId: string | null): UseAnamnesePsicologiaDataResult {
  const { clinic } = useClinicData();
  const [currentAnamnese, setCurrentAnamnese] = useState<AnamnesePsicologiaData | null>(null);
  const [anamneseHistory, setAnamneseHistory] = useState<AnamnesePsicologiaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnamneses = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setCurrentAnamnese(null);
      setAnamneseHistory([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('patient_anamnese_psicologia')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('version', { ascending: false });

      if (fetchError) throw fetchError;

      const creatorIds = [...new Set((data || []).map(a => a.created_by).filter(Boolean))];
      let creatorsMap: Record<string, string> = {};
      
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', creatorIds);
        if (profiles) {
          creatorsMap = profiles.reduce((acc, p) => {
            if (p.user_id && p.full_name) acc[p.user_id] = p.full_name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const mapped = (data || []).map((item: any) => mapRow(item, creatorsMap));
      setAnamneseHistory(mapped);
      setCurrentAnamnese(mapped.find(a => a.is_current) || mapped[0] || null);
    } catch (err) {
      console.error('Error fetching anamnese psicologia:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar avaliação');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const saveAnamnese = useCallback(async (data: AnamnesePsicologiaFormData) => {
    if (!patientId || !clinic?.id) {
      toast.error('Paciente ou clínica não identificados');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const nextVersion = (currentAnamnese?.version || 0) + 1;

      if (anamneseHistory.length > 0) {
        const { error: updateError } = await supabase
          .from('patient_anamnese_psicologia')
          .update({ is_current: false } as any)
          .eq('patient_id', patientId)
          .eq('clinic_id', clinic.id);
        if (updateError) throw updateError;
      }

      const { error: insertError } = await supabase
        .from('patient_anamnese_psicologia')
        .insert({
          patient_id: patientId,
          clinic_id: clinic.id,
          version: nextVersion,
          created_by: user.id,
          is_current: true,
          ...buildPayload(data),
        } as any);

      if (insertError) throw insertError;

      toast.success(`Avaliação inicial salva (versão ${nextVersion})`);
      await fetchAnamneses();
    } catch (err) {
      console.error('Error saving anamnese psicologia:', err);
      const message = err instanceof Error ? err.message : 'Erro ao salvar avaliação';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentAnamnese, anamneseHistory, fetchAnamneses]);

  const updateAnamnese = useCallback(async (id: string, data: AnamnesePsicologiaFormData) => {
    if (!patientId || !clinic?.id) {
      toast.error('Paciente ou clínica não identificados');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('patient_anamnese_psicologia')
        .update(buildPayload(data) as any)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Avaliação inicial atualizada');
      await fetchAnamneses();
    } catch (err) {
      console.error('Error updating anamnese psicologia:', err);
      const message = err instanceof Error ? err.message : 'Erro ao atualizar avaliação';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, fetchAnamneses]);

  useEffect(() => {
    fetchAnamneses();
  }, [fetchAnamneses]);

  return {
    currentAnamnese,
    anamneseHistory,
    loading,
    saving,
    error,
    saveAnamnese,
    updateAnamnese,
    refetch: fetchAnamneses,
  };
}
