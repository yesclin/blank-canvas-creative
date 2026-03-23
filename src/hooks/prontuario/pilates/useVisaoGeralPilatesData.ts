/**
 * PILATES - Dados da Visão Geral
 * 
 * Hook que agrega dados de múltiplas fontes para o painel central do aluno.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Objetivos comuns de Pilates
export const OBJETIVOS_PILATES = [
  { value: 'postura', label: 'Melhora da Postura' },
  { value: 'dor', label: 'Alívio de Dor' },
  { value: 'fortalecimento', label: 'Fortalecimento Muscular' },
  { value: 'flexibilidade', label: 'Ganho de Flexibilidade' },
  { value: 'reabilitacao', label: 'Reabilitação Leve' },
  { value: 'condicionamento', label: 'Condicionamento Físico' },
  { value: 'gestantes', label: 'Pilates para Gestantes' },
  { value: 'idosos', label: 'Pilates para Idosos' },
  { value: 'estetica', label: 'Estética Corporal' },
];

// Labels para status do acompanhamento
export const STATUS_ACOMPANHAMENTO_PILATES: Record<string, string> = {
  ativo: 'Ativo',
  pausado: 'Pausado',
  finalizado: 'Finalizado',
  aguardando: 'Aguardando Início',
};

export interface PilatesPatientData {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  phone: string | null;
}

export interface PilatesAlert {
  id: string;
  title: string;
  description: string | null;
  severity: 'critical' | 'warning' | 'info';
  alert_type: string;
  created_at: string;
}

export interface PilatesSummaryData {
  // Objetivo do Pilates
  objetivo_pilates: string | null;
  objetivo_label: string | null;
  observacoes_objetivo: string | null;
  
  // Sessões
  total_sessoes: number;
  ultima_sessao: string | null;
  dias_desde_ultima_sessao: number | null;
  
  // Avaliação funcional
  ultima_avaliacao: string | null;
  tem_avaliacao: boolean;
  
  // Acompanhamento
  status_acompanhamento: string;
  
  // Estatísticas
  total_evolucoes: number;
  total_documentos: number;
  total_alertas: number;
}

interface UseVisaoGeralPilatesDataParams {
  patientId: string | null;
  clinicId: string | null;
}

export function useVisaoGeralPilatesData({ patientId, clinicId }: UseVisaoGeralPilatesDataParams) {
  // Buscar dados do paciente
  const patientQuery = useQuery({
    queryKey: ['pilates-patient', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, birth_date, gender, phone')
        .eq('id', patientId)
        .maybeSingle();
      
      if (error) throw error;
      return data as PilatesPatientData | null;
    },
    enabled: !!patientId,
  });

  // Buscar resumo consolidado
  const summaryQuery = useQuery({
    queryKey: ['pilates-summary', patientId, clinicId],
    queryFn: async (): Promise<PilatesSummaryData> => {
      if (!patientId || !clinicId) {
        return getEmptySummary();
      }

      // Buscar sessões de Pilates (evoluções)
      const { data: sessoes } = await supabase
        .from('clinical_evolutions')
        .select('id, content, created_at')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('specialty', 'pilates')
        .in('evolution_type', ['sessao_pilates', 'evolucao'])
        .order('created_at', { ascending: false })
        .limit(50);

      // Buscar última avaliação funcional
      const { data: avaliacoes } = await supabase
        .from('clinical_evolutions')
        .select('id, content, created_at')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('evolution_type', 'avaliacao_funcional_pilates')
        .order('created_at', { ascending: false })
        .limit(1);

      // Extrair objetivo da avaliação mais recente
      let objetivoPilates: string | null = null;
      let observacoesObjetivo: string | null = null;
      
      if (avaliacoes && avaliacoes.length > 0) {
        const content = avaliacoes[0].content as Record<string, unknown> | null;
        if (content) {
          objetivoPilates = (content.objetivos_pilates as string) || null;
          observacoesObjetivo = (content.observacoes_gerais as string) || null;
        }
      }

      // Calcular dias desde última sessão
      const ultimaSessao = sessoes?.[0]?.created_at || null;
      let diasDesdeUltimaSessao: number | null = null;
      if (ultimaSessao) {
        const diffTime = Math.abs(new Date().getTime() - new Date(ultimaSessao).getTime());
        diasDesdeUltimaSessao = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      const totalSessoes = sessoes?.length || 0;

      // Buscar documentos
      const { count: totalDocumentos } = await supabase
        .from('clinical_media')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId);

      // Buscar alertas ativos
      const { data: alertas } = await supabase
        .from('clinical_evolutions')
        .select('id')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .in('evolution_type', ['alerta_funcional_pilates', 'alerta_funcional']);

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

      // Tentar identificar objetivo a partir do texto
      let objetivoLabel: string | null = null;
      if (objetivoPilates) {
        const objetivoLower = objetivoPilates.toLowerCase();
        for (const obj of OBJETIVOS_PILATES) {
          if (objetivoLower.includes(obj.value) || objetivoLower.includes(obj.label.toLowerCase())) {
            objetivoLabel = obj.label;
            break;
          }
        }
      }

      return {
        objetivo_pilates: objetivoPilates,
        objetivo_label: objetivoLabel,
        observacoes_objetivo: observacoesObjetivo,
        total_sessoes: totalSessoes,
        ultima_sessao: ultimaSessao,
        dias_desde_ultima_sessao: diasDesdeUltimaSessao,
        ultima_avaliacao: avaliacoes?.[0]?.created_at || null,
        tem_avaliacao: (avaliacoes?.length || 0) > 0,
        status_acompanhamento: statusAcompanhamento,
        total_evolucoes: totalSessoes,
        total_documentos: totalDocumentos || 0,
        total_alertas: alertas?.length || 0,
      };
    },
    enabled: !!patientId && !!clinicId,
  });

  // Buscar alertas ativos
  const alertsQuery = useQuery({
    queryKey: ['pilates-alerts', patientId, clinicId],
    queryFn: async () => {
      if (!patientId || !clinicId) return [];

      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('id, content, created_at')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .in('evolution_type', ['alerta_funcional_pilates', 'alerta_funcional'])
        .order('created_at', { ascending: false });

      if (error) throw error;

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
          } as PilatesAlert;
        })
        .filter((alert): alert is PilatesAlert => alert !== null)
        .sort((a, b) => {
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

function getEmptySummary(): PilatesSummaryData {
  return {
    objetivo_pilates: null,
    objetivo_label: null,
    observacoes_objetivo: null,
    total_sessoes: 0,
    ultima_sessao: null,
    dias_desde_ultima_sessao: null,
    ultima_avaliacao: null,
    tem_avaliacao: false,
    status_acompanhamento: 'aguardando',
    total_evolucoes: 0,
    total_documentos: 0,
    total_alertas: 0,
  };
}
