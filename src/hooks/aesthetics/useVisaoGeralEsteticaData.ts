/**
 * ESTÉTICA - Dados da Visão Geral
 * 
 * Hook que agrega dados de múltiplas fontes para o painel central do paciente de estética.
 * Exibe: dados básicos, procedimentos realizados, último procedimento, status, alertas.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PROCEDURE_TYPE_LABELS, type ProcedureType } from '@/components/prontuario/aesthetics/types';

// Status do tratamento estético
export const STATUS_TRATAMENTO_ESTETICA: Record<string, string> = {
  ativo: 'Em Tratamento',
  manutencao: 'Manutenção',
  concluido: 'Concluído',
  aguardando: 'Aguardando Início',
};

export interface EsteticaPatientData {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  phone: string | null;
}

export interface EsteticaAlert {
  id: string;
  title: string;
  description: string | null;
  severity: 'critical' | 'warning' | 'info';
  alert_type: string;
  created_at: string;
}

export interface ProcedimentoResumo {
  tipo: ProcedureType;
  label: string;
  quantidade: number;
  ultima_data: string | null;
}

export interface EsteticaSummaryData {
  // Procedimentos
  total_procedimentos: number;
  procedimentos_por_tipo: ProcedimentoResumo[];
  ultimo_procedimento: {
    tipo: string;
    produto: string;
    data: string;
  } | null;
  
  // Sessões / Evoluções
  total_sessoes: number;
  ultima_sessao: string | null;
  dias_desde_ultima_sessao: number | null;
  
  // Fotos
  total_fotos_antes_depois: number;
  
  // Termos
  total_termos_assinados: number;
  
  // Acompanhamento
  status_tratamento: string;
  
  // Estatísticas gerais
  total_alertas: number;
}

interface UseVisaoGeralEsteticaDataParams {
  patientId: string | null;
  clinicId: string | null;
}

export function useVisaoGeralEsteticaData({ patientId, clinicId }: UseVisaoGeralEsteticaDataParams) {
  // Buscar dados do paciente
  const patientQuery = useQuery({
    queryKey: ['estetica-patient', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, birth_date, gender, phone')
        .eq('id', patientId)
        .maybeSingle();
      
      if (error) throw error;
      return data as EsteticaPatientData | null;
    },
    enabled: !!patientId,
  });

  // Buscar resumo consolidado
  const summaryQuery = useQuery({
    queryKey: ['estetica-summary', patientId, clinicId],
    queryFn: async (): Promise<EsteticaSummaryData> => {
      if (!patientId || !clinicId) {
        return getEmptySummary();
      }

      // Buscar pontos de aplicação (procedimentos)
      const { data: aplicacoes } = await supabase
        .from('facial_map_applications')
        .select('id, procedure_type, product_name, created_at')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      // Agrupar por tipo de procedimento
      const procedimentosPorTipo: Record<string, { quantidade: number; ultima_data: string | null }> = {};
      
      (aplicacoes || []).forEach(app => {
        const tipo = app.procedure_type as ProcedureType;
        if (!procedimentosPorTipo[tipo]) {
          procedimentosPorTipo[tipo] = { quantidade: 0, ultima_data: null };
        }
        procedimentosPorTipo[tipo].quantidade++;
        if (!procedimentosPorTipo[tipo].ultima_data) {
          procedimentosPorTipo[tipo].ultima_data = app.created_at;
        }
      });

      const procedimentosResumo: ProcedimentoResumo[] = Object.entries(procedimentosPorTipo).map(([tipo, data]) => ({
        tipo: tipo as ProcedureType,
        label: PROCEDURE_TYPE_LABELS[tipo as ProcedureType] || tipo,
        quantidade: data.quantidade,
        ultima_data: data.ultima_data,
      }));

      // Último procedimento
      const ultimoProc = aplicacoes?.[0] || null;

      // Buscar evoluções/sessões de estética
      const { data: sessoes } = await supabase
        .from('clinical_evolutions')
        .select('id, created_at')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('specialty', 'estetica')
        .order('created_at', { ascending: false })
        .limit(50);

      const totalSessoes = sessoes?.length || 0;
      const ultimaSessao = sessoes?.[0]?.created_at || null;

      // Calcular dias desde última sessão
      let diasDesdeUltimaSessao: number | null = null;
      if (ultimaSessao) {
        const diffTime = Math.abs(new Date().getTime() - new Date(ultimaSessao).getTime());
        diasDesdeUltimaSessao = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Buscar fotos antes/depois
      const { count: totalFotos } = await supabase
        .from('aesthetic_before_after')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId);

      // Buscar termos assinados
      const { count: totalTermos } = await supabase
        .from('aesthetic_consent_records')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId);

      // Buscar alertas clínicos ativos
      const { data: alertas } = await supabase
        .from('clinical_alerts')
        .select('id')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('is_active', true);

      // Determinar status do tratamento
      const totalProcedimentos = aplicacoes?.length || 0;
      let statusTratamento = 'aguardando';
      
      if (totalProcedimentos > 0) {
        const diasDesdeUltimoProc = ultimoProc
          ? Math.ceil(Math.abs(new Date().getTime() - new Date(ultimoProc.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        if (diasDesdeUltimoProc !== null && diasDesdeUltimoProc <= 30) {
          statusTratamento = 'ativo';
        } else if (diasDesdeUltimoProc !== null && diasDesdeUltimoProc <= 90) {
          statusTratamento = 'manutencao';
        } else {
          statusTratamento = 'concluido';
        }
      }

      return {
        total_procedimentos: totalProcedimentos,
        procedimentos_por_tipo: procedimentosResumo,
        ultimo_procedimento: ultimoProc ? {
          tipo: PROCEDURE_TYPE_LABELS[ultimoProc.procedure_type as ProcedureType] || ultimoProc.procedure_type,
          produto: ultimoProc.product_name,
          data: ultimoProc.created_at,
        } : null,
        total_sessoes: totalSessoes,
        ultima_sessao: ultimaSessao,
        dias_desde_ultima_sessao: diasDesdeUltimaSessao,
        total_fotos_antes_depois: totalFotos || 0,
        total_termos_assinados: totalTermos || 0,
        status_tratamento: statusTratamento,
        total_alertas: alertas?.length || 0,
      };
    },
    enabled: !!patientId && !!clinicId,
  });

  // Buscar alertas clínicos ativos
  const alertsQuery = useQuery({
    queryKey: ['estetica-alerts', patientId, clinicId],
    queryFn: async () => {
      if (!patientId || !clinicId) return [];

      const { data, error } = await supabase
        .from('clinical_alerts')
        .select('id, title, description, severity, alert_type, created_at')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(alert => ({
        id: alert.id,
        title: alert.title,
        description: alert.description,
        severity: mapSeverity(alert.severity),
        alert_type: alert.alert_type,
        created_at: alert.created_at,
      })).sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }) as EsteticaAlert[];
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

function mapSeverity(severity: string): 'critical' | 'warning' | 'info' {
  switch (severity?.toLowerCase()) {
    case 'critical':
    case 'error':
    case 'high':
      return 'critical';
    case 'warning':
    case 'medium':
      return 'warning';
    default:
      return 'info';
  }
}

function getEmptySummary(): EsteticaSummaryData {
  return {
    total_procedimentos: 0,
    procedimentos_por_tipo: [],
    ultimo_procedimento: null,
    total_sessoes: 0,
    ultima_sessao: null,
    dias_desde_ultima_sessao: null,
    total_fotos_antes_depois: 0,
    total_termos_assinados: 0,
    status_tratamento: 'aguardando',
    total_alertas: 0,
  };
}
