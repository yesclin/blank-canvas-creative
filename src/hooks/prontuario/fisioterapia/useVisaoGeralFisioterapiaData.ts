/**
 * FISIOTERAPIA - Dados da Visão Geral
 * 
 * Hook que agrega dados de múltiplas fontes para o painel central do paciente.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Labels para status do plano terapêutico
export const STATUS_PLANO_LABELS: Record<string, string> = {
  ativo: 'Em Tratamento',
  pausado: 'Pausado',
  finalizado: 'Alta',
  aguardando: 'Aguardando Início',
};

// Labels para status do acompanhamento
export const STATUS_ACOMPANHAMENTO_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  pausado: 'Pausado',
  finalizado: 'Finalizado',
  aguardando: 'Aguardando',
};

export interface FisioterapiaPatientData {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  phone: string | null;
}

export interface FisioterapiaAlert {
  id: string;
  title: string;
  description: string | null;
  severity: 'critical' | 'warning' | 'info';
  alert_type: string;
  created_at: string;
}

export interface FisioterapiaSummaryData {
  // Queixa e região
  queixa_principal: string | null;
  regiao_corporal: string | null;
  
  // Dor
  nivel_dor_atual: number | null;
  escala_dor: string; // 'EVA' ou 'Numérica'
  
  // Plano terapêutico
  plano_ativo: {
    id: string;
    titulo: string;
    objetivo: string | null;
    data_inicio: string;
    previsao_alta: string | null;
  } | null;
  status_plano: string;
  
  // Sessões
  total_sessoes: number;
  sessoes_realizadas: number;
  ultima_sessao: string | null;
  dias_desde_ultima_sessao: number | null;
  
  // Acompanhamento
  status_acompanhamento: string;
  ultima_avaliacao: string | null;
  
  // Estatísticas
  total_evolucoes: number;
  total_documentos: number;
}

interface UseVisaoGeralFisioterapiaDataParams {
  patientId: string | null;
  clinicId: string | null;
}

export function useVisaoGeralFisioterapiaData({ patientId, clinicId }: UseVisaoGeralFisioterapiaDataParams) {
  // Buscar dados do paciente
  const patientQuery = useQuery({
    queryKey: ['fisioterapia-patient', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, birth_date, gender, phone')
        .eq('id', patientId)
        .maybeSingle();
      
      if (error) throw error;
      return data as FisioterapiaPatientData | null;
    },
    enabled: !!patientId,
  });

  // Buscar resumo consolidado
  const summaryQuery = useQuery({
    queryKey: ['fisioterapia-summary', patientId, clinicId],
    queryFn: async (): Promise<FisioterapiaSummaryData> => {
      if (!patientId || !clinicId) {
        return getEmptySummary();
      }

      // Buscar última evolução com dados de fisioterapia
      const { data: evolucoes } = await supabase
        .from('clinical_evolutions')
        .select('id, content, created_at, specialty')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('specialty', 'fisioterapia')
        .order('created_at', { ascending: false })
        .limit(10);

      // Extrair dados da última evolução
      let queixaPrincipal: string | null = null;
      let regiaoCorporal: string | null = null;
      let nivelDorAtual: number | null = null;
      let ultimaSessao: string | null = null;

      if (evolucoes && evolucoes.length > 0) {
        const ultimaEvolucao = evolucoes[0];
        const content = ultimaEvolucao.content as Record<string, unknown> | null;
        
        if (content) {
          queixaPrincipal = (content.queixa_principal as string) || null;
          regiaoCorporal = (content.regiao_corporal as string) || null;
          nivelDorAtual = (content.nivel_dor as number) || (content.eva_final as number) || null;
        }
        
        ultimaSessao = ultimaEvolucao.created_at;
      }

      // Calcular dias desde última sessão
      let diasDesdeUltimaSessao: number | null = null;
      if (ultimaSessao) {
        const diffTime = Math.abs(new Date().getTime() - new Date(ultimaSessao).getTime());
        diasDesdeUltimaSessao = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Contar total de evoluções (sessões)
      const totalSessoes = evolucoes?.length || 0;

      // Buscar alertas funcionais ativos para determinar status
      const { data: alertas } = await supabase
        .from('clinical_alerts')
        .select('id')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .eq('alert_type', 'funcional');

      // Buscar documentos anexados
      const { count: totalDocumentos } = await supabase
        .from('clinical_media')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId);

      // Determinar status do acompanhamento
      let statusAcompanhamento = 'aguardando';
      if (totalSessoes > 0) {
        if (diasDesdeUltimaSessao !== null && diasDesdeUltimaSessao <= 14) {
          statusAcompanhamento = 'ativo';
        } else if (diasDesdeUltimaSessao !== null && diasDesdeUltimaSessao <= 30) {
          statusAcompanhamento = 'pausado';
        } else {
          statusAcompanhamento = 'finalizado';
        }
      }

      return {
        queixa_principal: queixaPrincipal,
        regiao_corporal: regiaoCorporal,
        nivel_dor_atual: nivelDorAtual,
        escala_dor: 'EVA',
        plano_ativo: null, // TODO: Implementar quando tabela de planos existir
        status_plano: totalSessoes > 0 ? 'ativo' : 'aguardando',
        total_sessoes: totalSessoes,
        sessoes_realizadas: totalSessoes,
        ultima_sessao: ultimaSessao,
        dias_desde_ultima_sessao: diasDesdeUltimaSessao,
        status_acompanhamento: statusAcompanhamento,
        ultima_avaliacao: evolucoes?.[0]?.created_at || null,
        total_evolucoes: totalSessoes,
        total_documentos: totalDocumentos || 0,
      };
    },
    enabled: !!patientId && !!clinicId,
  });

  // Buscar alertas funcionais ativos (da tabela clinical_evolutions)
  const alertsQuery = useQuery({
    queryKey: ['fisioterapia-alerts', patientId, clinicId],
    queryFn: async () => {
      if (!patientId || !clinicId) return [];

      // Buscar alertas funcionais salvos como evoluções
      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('id, content, created_at')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('evolution_type', 'alerta_funcional_fisio')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtrar apenas alertas ativos e mapear para o formato esperado
      return (data || [])
        .map(record => {
          const content = record.content as Record<string, unknown> | null;
          if (!content) return null;
          
          const isAtivo = content.is_ativo as boolean ?? true;
          if (!isAtivo) return null;

          const severidade = content.severidade as string || 'moderado';
          let mappedSeverity: 'critical' | 'warning' | 'info' = 'info';
          if (severidade === 'critico' || severidade === 'alto') {
            mappedSeverity = 'critical';
          } else if (severidade === 'moderado') {
            mappedSeverity = 'warning';
          }

          return {
            id: record.id,
            title: (content.titulo as string) || 'Alerta',
            description: (content.descricao as string) || null,
            severity: mappedSeverity,
            alert_type: (content.tipo as string) || 'funcional',
            created_at: record.created_at,
          } as FisioterapiaAlert;
        })
        .filter((alert): alert is FisioterapiaAlert => alert !== null)
        .sort((a, b) => {
          // Ordenar por severidade (crítico primeiro)
          const severityOrder = { critical: 0, warning: 1, info: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        });
    },
    enabled: !!patientId && !!clinicId,
  });

  return {
    patient: patientQuery.data || null,
    summary: summaryQuery.data || getEmptySummary(),
    alerts: alertsQuery.data || [],
    loading: patientQuery.isLoading || summaryQuery.isLoading || alertsQuery.isLoading,
    error: patientQuery.error || summaryQuery.error || alertsQuery.error,
  };
}

function getEmptySummary(): FisioterapiaSummaryData {
  return {
    queixa_principal: null,
    regiao_corporal: null,
    nivel_dor_atual: null,
    escala_dor: 'EVA',
    plano_ativo: null,
    status_plano: 'aguardando',
    total_sessoes: 0,
    sessoes_realizadas: 0,
    ultima_sessao: null,
    dias_desde_ultima_sessao: null,
    status_acompanhamento: 'aguardando',
    ultima_avaliacao: null,
    total_evolucoes: 0,
    total_documentos: 0,
  };
}
