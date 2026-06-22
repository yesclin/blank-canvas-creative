/**
 * ESTÉTICA - Dados da Visão Geral
 * 
 * Hook que agrega dados de múltiplas fontes para o painel central do paciente de estética.
 * Exibe: dados básicos, procedimentos realizados, último procedimento, status, alertas.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  tipo: string;
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
  
  // Mapa facial
  total_mapas_faciais: number;
  total_marcacoes_faciais: number;

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

async function safeOverviewQuery<T>(label: string, query: PromiseLike<{ data: T | null; error: any; count?: number | null }>) {
  const { data, error, count } = await query;
  if (error) {
    console.error(`[VisaoGeralEstetica] ${label} query failed`, error);
    return { data: null as T | null, count: 0 };
  }
  return { data, count: count ?? (Array.isArray(data) ? data.length : 0) };
}

function getRowDate(row: any, fallback?: string | null) {
  return row?.performed_at || row?.created_at || row?.updated_at || fallback || null;
}

function countAnnotationMarks(annotations: unknown): number {
  if (!annotations) return 0;
  if (Array.isArray(annotations)) return annotations.length;
  if (typeof annotations !== 'object') return 0;

  const data = annotations as Record<string, any>;
  const candidates = [data.points, data.applications, data.annotations, data.markers, data.items];
  const arrayCandidate = candidates.find(Array.isArray);
  if (arrayCandidate) return arrayCandidate.length;
  return Object.keys(data).length > 0 ? 1 : 0;
}

function extractEvolutionProcedures(evolutions: any[] = []): any[] {
  return evolutions.flatMap((evolution) => {
    const content = (evolution?.content || {}) as Record<string, any>;
    const candidates = [
      content.procedures,
      content.procedimentos,
      content.procedimentos_realizados,
      content.performed_procedures,
      content.procedures_performed,
    ].filter(Array.isArray) as any[][];

    if (content.procedure_name || content.procedimento_nome) {
      candidates.push([{ procedure_name: content.procedure_name || content.procedimento_nome }]);
    }

    return candidates.flat().map((item) => {
      const name = typeof item === 'string'
        ? item
        : item?.procedure_name || item?.name || item?.nome || item?.procedimento || item?.title;

      if (!name) return null;

      return {
        id: `${evolution.id}-${name}`,
        procedure_name: String(name),
        region: typeof item === 'object' ? (item.region || item.regiao || null) : null,
        performed_at: getRowDate(item, evolution.created_at),
        created_at: evolution.created_at,
        source: 'clinical_evolutions',
      };
    }).filter(Boolean);
  });
}

function getAppointmentDate(row: any) {
  if (!row) return null;
  if (row.started_at || row.finished_at || row.created_at) return row.started_at || row.finished_at || row.created_at;
  if (row.scheduled_date && row.start_time) return `${row.scheduled_date}T${row.start_time}`;
  return row.scheduled_date || null;
}

function getProcedureName(row: any) {
  return row?.procedure_name || row?.procedures?.name || row?.name || row?.title || row?.appointment_type || 'Procedimento';
}

function isClinicalImageMedia(row: any) {
  const category = String(row?.category || '').toLowerCase();
  const fileType = String(row?.file_type || '').toLowerCase();
  return ['image', 'photo', 'foto', 'before_after', 'antes_depois', 'before', 'after'].includes(category) || fileType.startsWith('image/');
}

function uniqueById<T extends Record<string, any>>(rows: T[]) {
  const map = new Map<string, T>();
  rows.forEach((row, index) => map.set(String(row.id || `${row.source || 'row'}-${index}`), row));
  return Array.from(map.values());
}

export function useVisaoGeralEsteticaData({ patientId, clinicId }: UseVisaoGeralEsteticaDataParams) {
  // Buscar dados do paciente
  const patientQuery = useQuery({
    queryKey: ['estetica-patient', patientId, clinicId],
    queryFn: async () => {
      if (!patientId || !clinicId) return null;
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, birth_date, gender, phone')
        .eq('id', patientId)
        .eq('clinic_id', clinicId)
        .maybeSingle();
      
      if (error) throw error;
      return data as EsteticaPatientData | null;
    },
    enabled: !!patientId && !!clinicId,
  });

  // Buscar resumo consolidado
  const summaryQuery = useQuery({
    queryKey: ['prontuario-overview', patientId, clinicId],
    queryFn: async (): Promise<EsteticaSummaryData> => {
      if (!patientId || !clinicId) {
        return getEmptySummary();
      }

      console.log('overview patient', patientId);
      console.log('overview clinic', clinicId);

      const [proceduresResult, legacyProceduresResult, appointmentProceduresResult, evolutionsResult] = await Promise.all([
        safeOverviewQuery('clinical_performed_procedures', supabase
          .from('clinical_performed_procedures')
          .select('id, procedure_id, procedure_name, region, status, performed_at, created_at, procedures(name)')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinicId)
          .order('performed_at', { ascending: false })),
        safeOverviewQuery('patient_procedures', (supabase as any)
          .from('patient_procedures')
          .select('id, procedure_id, procedure_name, name, title, status, performed_at, procedure_date, created_at, procedures(name)')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinicId)),
        safeOverviewQuery('appointments_with_procedure', supabase
          .from('appointments')
          .select('id, procedure_id, appointment_type, scheduled_date, start_time, started_at, finished_at, created_at, status, procedures(name)')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinicId)
          .not('procedure_id', 'is', null)),
        safeOverviewQuery('clinical_evolutions', supabase
          .from('clinical_evolutions')
          .select('id, content, created_at, updated_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinicId)
          .order('created_at', { ascending: false })
          .limit(50)),
      ]);

      const procedimentos = uniqueById([
        ...((proceduresResult.data as any[]) || []).map((p) => ({ ...p, source: 'clinical_performed_procedures' })),
        ...((legacyProceduresResult.data as any[]) || []).map((p) => ({
          ...p,
          procedure_name: getProcedureName(p),
          performed_at: p.performed_at || p.procedure_date || p.created_at,
          source: 'patient_procedures',
        })),
        ...((appointmentProceduresResult.data as any[]) || []).map((appointment) => ({
          ...appointment,
          id: `appointment-${appointment.id}`,
          procedure_name: appointment.procedures?.name || appointment.appointment_type || 'Procedimento agendado',
          performed_at: getAppointmentDate(appointment),
          source: 'appointments',
        })),
        ...extractEvolutionProcedures((evolutionsResult.data as any[]) || []),
      ]).sort((a, b) => new Date(getRowDate(b) || 0).getTime() - new Date(getRowDate(a) || 0).getTime());

      // Agrupar por nome de procedimento
      const procedimentosPorTipo: Record<string, { quantidade: number; ultima_data: string | null }> = {};
      
      (procedimentos || []).forEach(p => {
        const nome = p.procedure_name || p.procedures?.name || 'Outros';
        if (!procedimentosPorTipo[nome]) {
          procedimentosPorTipo[nome] = { quantidade: 0, ultima_data: null };
        }
        procedimentosPorTipo[nome].quantidade++;
        if (!procedimentosPorTipo[nome].ultima_data) {
          procedimentosPorTipo[nome].ultima_data = getRowDate(p);
        }
      });

      const procedimentosResumo: ProcedimentoResumo[] = Object.entries(procedimentosPorTipo).map(([nome, data]) => ({
        tipo: nome,
        label: nome,
        quantidade: data.quantidade,
        ultima_data: data.ultima_data,
      }));

      // Último procedimento
      const ultimoProc = procedimentos?.[0] || null;

      const sessoes = (evolutionsResult.data as any[]) || [];

      const totalSessoes = sessoes?.length || 0;
      const ultimaSessao = sessoes?.[0]?.created_at || null;

      // Calcular dias desde última sessão
      let diasDesdeUltimaSessao: number | null = null;
      if (ultimaSessao) {
        const diffTime = Math.abs(new Date().getTime() - new Date(ultimaSessao).getTime());
        diasDesdeUltimaSessao = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Buscar fotos antes/depois (tabela nova + legacy)
      const [fotosNew, fotosLegacy] = await Promise.all([
        safeOverviewQuery('aesthetic_before_after', supabase.from('aesthetic_before_after').select('id', { count: 'exact', head: true })
          .eq('patient_id', patientId).eq('clinic_id', clinicId)),
        safeOverviewQuery('before_after_records', supabase.from('before_after_records').select('id', { count: 'exact', head: true })
          .eq('patient_id', patientId).eq('clinic_id', clinicId)),
      ]);
      const totalFotos = (fotosNew.count || 0) + (fotosLegacy.count || 0);

      // Buscar mapas faciais e marcações (tabela canônica + aplicações + anotações interativas)
      const [facialMapsResult, interactiveMapsResult] = await Promise.all([
        safeOverviewQuery('facial_maps', supabase
          .from('facial_maps')
          .select('id, data, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinicId)),
        safeOverviewQuery('interactive_map_annotations', supabase
          .from('interactive_map_annotations')
          .select('id, annotations, created_at')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinicId)),
      ]);

      const facialMaps = (facialMapsResult.data as any[]) || [];
      const interactiveMaps = (interactiveMapsResult.data as any[]) || [];
      const mapIds = facialMaps.map((map) => map.id).filter(Boolean);
      const applicationsResult = mapIds.length > 0
        ? await safeOverviewQuery('facial_map_applications', supabase
          .from('facial_map_applications')
          .select('id, facial_map_id, data, created_at')
          .in('facial_map_id', mapIds))
        : { data: [] as any[], count: 0 };

      const totalMapasFaciais = facialMaps.length + interactiveMaps.length;
      const totalMarcacoesFaciais =
        (((applicationsResult.data as any[]) || []).length) +
        interactiveMaps.reduce((total, map) => total + countAnnotationMarks(map.annotations), 0);

      // Buscar termos assinados
      // - clinical_consent_acceptances: filtrar não revogados via revoked_at
      // - patient_consents: tabela não possui revoked_at; filtrar por status
      const [termosNew, termosLegacy] = await Promise.all([
        safeOverviewQuery('clinical_consent_acceptances', supabase.from('clinical_consent_acceptances').select('id', { count: 'exact', head: true })
          .eq('patient_id', patientId).eq('clinic_id', clinicId).is('revoked_at', null)),
        safeOverviewQuery('patient_consents', supabase.from('patient_consents').select('id', { count: 'exact', head: true })
          .eq('patient_id', patientId).eq('clinic_id', clinicId).neq('status', 'revoked')),
      ]);
      const totalTermos = (termosNew.count || 0) + (termosLegacy.count || 0);

      // Buscar alertas clínicos ativos
      const alertasResult = await safeOverviewQuery('clinical_alerts', supabase
        .from('clinical_alerts')
        .select('id')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('is_active', true));
      const alertas = (alertasResult.data as any[]) || [];

      // Determinar status do tratamento
      const totalProcedimentos = procedimentos?.length || 0;
      let statusTratamento = 'aguardando';
      
      if (totalProcedimentos > 0) {
        const diasDesdeUltimoProc = ultimoProc
          ? Math.ceil(Math.abs(new Date().getTime() - new Date(getRowDate(ultimoProc) || '').getTime()) / (1000 * 60 * 60 * 24))
          : null;

        if (diasDesdeUltimoProc !== null && diasDesdeUltimoProc <= 30) {
          statusTratamento = 'ativo';
        } else if (diasDesdeUltimoProc !== null && diasDesdeUltimoProc <= 90) {
          statusTratamento = 'manutencao';
        } else {
          statusTratamento = 'concluido';
        }
      }

      const result: EsteticaSummaryData = {
        total_procedimentos: totalProcedimentos,
        procedimentos_por_tipo: procedimentosResumo,
        ultimo_procedimento: ultimoProc ? {
          tipo: ultimoProc.procedure_name || ultimoProc.procedures?.name || 'Procedimento',
          produto: ultimoProc.region || '',
          data: getRowDate(ultimoProc) || new Date().toISOString(),
        } : null,
        total_sessoes: totalSessoes,
        ultima_sessao: ultimaSessao,
        dias_desde_ultima_sessao: diasDesdeUltimaSessao,
        total_mapas_faciais: totalMapasFaciais,
        total_marcacoes_faciais: totalMarcacoesFaciais,
        total_fotos_antes_depois: totalFotos,
        total_termos_assinados: totalTermos,
        status_tratamento: statusTratamento,
        total_alertas: alertas.length || 0,
      };

      console.log('overview data', {
        procedures: procedimentos.length,
        lastProcedure: ultimoProc,
        facialMap: { maps: totalMapasFaciais, applications: totalMarcacoesFaciais },
        beforeAfter: { new: fotosNew.count, legacy: fotosLegacy.count, total: totalFotos },
        terms: { new: termosNew.count, legacy: termosLegacy.count, total: totalTermos },
        alerts: alertas.length || 0,
      });

      return result;
    },
    enabled: !!patientId && !!clinicId,
  });


  // Buscar alertas clínicos ativos
  // IMPORTANTE: queryKey compartilha o prefixo ['aesthetic-alerts', patientId]
  // com useAestheticAlerts. As mutations do hook invalidam por prefixo, garantindo
  // sincronização entre o card de Visão Geral, a aba Alertas Clínicos e os cards
  // superiores em tempo real após criar/editar/desativar/reativar alertas.
  const alertsQuery = useQuery({
    queryKey: ['aesthetic-alerts', patientId, 'active-only'],
    queryFn: async () => {
      if (!patientId || !clinicId) return [];

      const { data, error } = await supabase
        .from('clinical_alerts')
        .select('id, title, description, severity, alert_type, created_at, is_active')
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

  // Override total_alertas with the actual alerts list length so the
  // "Alertas Clínicos" summary card always matches the rendered list.
  const summaryData = summaryQuery.data || getEmptySummary();
  const alertsData = alertsQuery.data || [];
  const summaryWithLiveAlerts: EsteticaSummaryData = {
    ...summaryData,
    total_alertas: alertsData.length,
  };

  return {
    patient: patientQuery.data || null,
    summary: summaryWithLiveAlerts,
    alerts: alertsData,
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
    total_mapas_faciais: 0,
    total_marcacoes_faciais: 0,
    total_termos_assinados: 0,
    status_tratamento: 'aguardando',
    total_alertas: 0,
  };
}
