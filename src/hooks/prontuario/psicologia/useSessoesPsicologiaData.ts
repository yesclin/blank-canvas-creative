import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type StatusSessao = 'rascunho' | 'assinada';

export const statusSessaoConfig: Record<StatusSessao, { label: string; color: string }> = {
  rascunho: { label: 'Rascunho', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  assinada: { label: 'Assinada', color: 'bg-green-100 text-green-700 border-green-300' },
};

/** Intervenções pré-definidas para multi-select */
export const INTERVENCOES_OPTIONS = [
  'Escuta ativa',
  'Reestruturação cognitiva',
  'Técnica de respiração',
  'Psicoeducação',
  'Dessensibilização',
  'Role-playing',
  'Mindfulness',
  'Registro de pensamentos',
  'Exposição gradual',
  'Relaxamento progressivo',
] as const;

/** Encaminhamentos pré-definidos */
export const ENCAMINHAMENTOS_OPTIONS = [
  'Tarefa para casa',
  'Leitura indicada',
  'Encaminhamento psiquiátrico',
  'Encaminhamento médico',
  'Exercício terapêutico',
  'Nenhum',
] as const;

export interface SessaoPsicologia {
  id: string;
  patient_id: string;
  clinic_id: string;
  numero_sessao: number | null;
  data_sessao: string;
  duracao_minutos: number;
  modalidade: string;
  tema_central: string;
  abordagem_terapeutica: string;
  relato_paciente: string;
  intervencoes_realizadas: string;
  intervencoes_tags: string[];
  observacoes_terapeuta: string;
  encaminhamentos_tarefas: string;
  encaminhamentos_tags: string[];
  risco_interno: string;
  risco_atual: string;
  humor_paciente: number | null;
  emocoes_predominantes: string[];
  evolucao_caso: string;
  adesao_terapeutica: string;
  phq9_respostas: number[] | null;
  phq9_total: number | null;
  gad7_respostas: number[] | null;
  gad7_total: number | null;
  tarefa_casa: string;
  proximo_foco: string;
  status: StatusSessao;
  assinada_em: string | null;
  profissional_id: string;
  profissional_nome?: string;
  created_at: string;
}

export interface SessaoFormData {
  data_sessao: string;
  duracao_minutos: number;
  modalidade: string;
  tema_central: string;
  abordagem_terapeutica: string;
  relato_paciente: string;
  intervencoes_realizadas: string;
  intervencoes_tags: string[];
  observacoes_terapeuta: string;
  encaminhamentos_tarefas: string;
  encaminhamentos_tags: string[];
  risco_interno: string;
  risco_atual: string;
  humor_paciente: number | null;
  emocoes_predominantes: string[];
  evolucao_caso: string;
  adesao_terapeutica: string;
  phq9_respostas: number[] | null;
  phq9_total: number | null;
  gad7_respostas: number[] | null;
  gad7_total: number | null;
  tarefa_casa: string;
  proximo_foco: string;
}

interface UseSessoesPsicologiaDataResult {
  sessoes: SessaoPsicologia[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  totalSessoes: number;
  saveSessao: (data: SessaoFormData & { assinar: boolean }) => Promise<string | null>;
  signSessao: (sessaoId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSessoesPsicologiaData(
  patientId: string | null,
  currentProfessionalId?: string
): UseSessoesPsicologiaDataResult {
  const { clinic } = useClinicData();
  const [sessoes, setSessoes] = useState<SessaoPsicologia[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessoes = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setSessoes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('sessoes_psicologia')
        .select(`
          *,
          professionals:profissional_id (
            id,
            profiles:user_id (full_name)
          )
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('data_sessao', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: SessaoPsicologia[] = (data || []).map((item: any) => ({
        id: item.id,
        patient_id: item.patient_id,
        clinic_id: item.clinic_id,
        numero_sessao: item.numero_sessao,
        data_sessao: item.data_sessao,
        duracao_minutos: item.duracao_minutos,
        modalidade: item.modalidade || 'presencial',
        tema_central: item.tema_central || '',
        abordagem_terapeutica: item.abordagem_terapeutica || '',
        relato_paciente: item.relato_paciente || '',
        intervencoes_realizadas: item.intervencoes_realizadas || '',
        intervencoes_tags: item.intervencoes_tags || [],
        observacoes_terapeuta: item.observacoes_terapeuta || '',
        encaminhamentos_tarefas: item.encaminhamentos_tarefas || '',
        encaminhamentos_tags: item.encaminhamentos_tags || [],
        risco_interno: item.risco_interno || '',
        risco_atual: item.risco_atual || 'ausente',
        humor_paciente: item.humor_paciente,
        emocoes_predominantes: item.emocoes_predominantes || [],
        evolucao_caso: item.evolucao_caso || '',
        adesao_terapeutica: item.adesao_terapeutica || '',
        phq9_respostas: item.phq9_respostas || null,
        phq9_total: item.phq9_total ?? null,
        gad7_respostas: item.gad7_respostas || null,
        gad7_total: item.gad7_total ?? null,
        tarefa_casa: item.tarefa_casa || '',
        proximo_foco: item.proximo_foco || '',
        status: item.status as StatusSessao,
        assinada_em: item.assinada_em,
        profissional_id: item.profissional_id,
        profissional_nome: (item.professionals as any)?.profiles?.full_name || 'Profissional',
        created_at: item.created_at,
      }));

      setSessoes(mapped);
    } catch (err) {
      console.error('Error fetching sessoes:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  const saveSessao = useCallback(async (data: SessaoFormData & { assinar: boolean }): Promise<string | null> => {
    if (!patientId || !clinic?.id || !currentProfessionalId) {
      toast.error('Dados insuficientes para salvar a sessão');
      return null;
    }

    setSaving(true);
    setError(null);

    try {
      // Calculate next session number
      const nextNumber = sessoes.length > 0 
        ? Math.max(...sessoes.map(s => s.numero_sessao || 0)) + 1 
        : 1;

      const insertData: any = {
        patient_id: patientId,
        clinic_id: clinic.id,
        profissional_id: currentProfessionalId,
        numero_sessao: nextNumber,
        data_sessao: data.data_sessao,
        duracao_minutos: data.duracao_minutos,
        modalidade: data.modalidade,
        tema_central: data.tema_central,
        abordagem_terapeutica: data.abordagem_terapeutica,
        relato_paciente: data.relato_paciente,
        intervencoes_realizadas: data.intervencoes_realizadas,
        intervencoes_tags: data.intervencoes_tags,
        observacoes_terapeuta: data.observacoes_terapeuta,
        encaminhamentos_tarefas: data.encaminhamentos_tarefas,
        encaminhamentos_tags: data.encaminhamentos_tags,
        risco_interno: data.risco_interno || null,
        risco_atual: data.risco_atual || 'ausente',
        humor_paciente: data.humor_paciente,
        emocoes_predominantes: data.emocoes_predominantes,
        evolucao_caso: data.evolucao_caso || null,
        adesao_terapeutica: data.adesao_terapeutica || null,
        phq9_respostas: data.phq9_respostas,
        phq9_total: data.phq9_total,
        gad7_respostas: data.gad7_respostas,
        gad7_total: data.gad7_total,
        tarefa_casa: data.tarefa_casa || null,
        proximo_foco: data.proximo_foco || null,
        status: data.assinar ? 'assinada' : 'rascunho',
        assinada_em: data.assinar ? new Date().toISOString() : null,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('sessoes_psicologia')
        .insert(insertData)
        .select('id')
        .single();

      if (insertError) throw insertError;

      toast.success(data.assinar 
        ? `Sessão ${nextNumber} registrada e assinada` 
        : `Sessão ${nextNumber} salva como rascunho`
      );
      await fetchSessoes();
      return inserted?.id || null;
    } catch (err) {
      console.error('Error saving sessao:', err);
      const message = err instanceof Error ? err.message : 'Erro ao salvar sessão';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setSaving(false);
    }
  }, [patientId, clinic?.id, currentProfessionalId, sessoes, fetchSessoes]);

  const signSessao = useCallback(async (sessaoId: string) => {
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('sessoes_psicologia')
        .update({
          status: 'assinada',
          assinada_em: new Date().toISOString(),
        } as any)
        .eq('id', sessaoId);

      if (updateError) throw updateError;

      toast.success('Sessão assinada com sucesso');
      await fetchSessoes();
    } catch (err) {
      console.error('Error signing sessao:', err);
      const message = err instanceof Error ? err.message : 'Erro ao assinar sessão';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [fetchSessoes]);

  useEffect(() => {
    fetchSessoes();
  }, [fetchSessoes]);

  return {
    sessoes,
    loading,
    saving,
    error,
    totalSessoes: sessoes.length,
    saveSessao,
    signSessao,
    refetch: fetchSessoes,
  };
}
