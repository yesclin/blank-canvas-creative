/**
 * NUTRIÇÃO - Visão Geral Consolidada
 * 
 * Hook para dados da visão geral do paciente na especialidade Nutrição.
 * Conecta todos os módulos clínicos: Avaliação Inicial, Antropometria,
 * Diagnóstico, Plano Alimentar, Evoluções, Documentos e Alertas.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';

export type ObjetivoNutricional = 'perda_peso' | 'ganho_massa' | 'manutencao' | 'reeducacao' | 'outro';
export type StatusAcompanhamento = 'ativo' | 'pausado' | 'finalizado' | 'aguardando';

export interface NutricaoPatientData {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
}

export interface NutricaoAlert {
  id: string;
  title: string;
  description: string | null;
  severity: 'critical' | 'warning' | 'info';
  alert_type: string;
  is_active: boolean;
  created_at: string;
}

export interface LastMeasurement {
  id: string;
  measurement_date: string;
  weight_kg: number | null;
  height_cm: number | null;
  bmi: number | null;
  body_fat_percent: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
}

export interface DiagnosticoResumo {
  id: string;
  diagnostico_principal: string;
  status: 'ativo' | 'resolvido' | 'em_acompanhamento';
  data_diagnostico: string;
  created_at: string;
}

export interface PlanoAlimentarResumo {
  id: string;
  titulo: string;
  objetivo: string | null;
  status: 'ativo' | 'inativo' | 'rascunho';
  data_inicio: string;
  calorias_totais: number | null;
  created_at: string;
}

export interface EvolucaoResumo {
  id: string;
  data_atendimento: string;
  peso_atual_kg: number | null;
  adesao_plano: string | null;
  created_at: string;
}

export interface AvaliacaoInicialResumo {
  id: string;
  data_avaliacao: string;
  objetivo_principal: string | null;
  historico_alimentar: string | null;
  created_at: string;
}

export interface NutricaoSummaryData {
  // Dados atuais (da Avaliação Antropométrica)
  peso_atual_kg: number | null;
  altura_cm: number | null;
  imc: number | null;
  classificacao_imc: string | null;
  data_ultima_medicao: string | null;
  
  // Objetivo (da Avaliação Inicial)
  objetivo: ObjetivoNutricional | null;
  objetivo_descricao: string | null;
  peso_meta_kg: number | null;
  
  // Variação de peso
  variacao_peso_kg: number | null;
  peso_consulta_anterior: number | null;
  
  // Status do acompanhamento
  status_acompanhamento: StatusAcompanhamento;
  
  // Estatísticas de consultas
  total_consultas: number;
  ultima_consulta: string | null;
  
  // Diagnóstico nutricional
  ultimo_diagnostico: DiagnosticoResumo | null;
  total_diagnosticos: number;
  
  // Plano alimentar
  plano_ativo: PlanoAlimentarResumo | null;
  total_planos: number;
  
  // Evoluções nutricionais
  ultima_evolucao: EvolucaoResumo | null;
  total_evolucoes: number;
  
  // Avaliação inicial
  avaliacao_inicial: AvaliacaoInicialResumo | null;
  
  // Documentos
  total_documentos: number;
}

// Labels para objetivo nutricional
export const OBJETIVO_NUTRICIONAL_LABELS: Record<ObjetivoNutricional, string> = {
  perda_peso: 'Perda de Peso',
  ganho_massa: 'Ganho de Massa',
  manutencao: 'Manutenção',
  reeducacao: 'Reeducação Alimentar',
  outro: 'Outro',
};

// Labels para status do acompanhamento
export const STATUS_ACOMPANHAMENTO_LABELS: Record<StatusAcompanhamento, string> = {
  ativo: 'Em Acompanhamento',
  pausado: 'Pausado',
  finalizado: 'Finalizado',
  aguardando: 'Aguardando Início',
};

/**
 * Calcula a classificação do IMC segundo a OMS
 */
function classifyBMI(bmi: number | null): string | null {
  if (bmi === null) return null;
  
  if (bmi < 18.5) return 'Abaixo do peso';
  if (bmi < 25) return 'Peso normal';
  if (bmi < 30) return 'Sobrepeso';
  if (bmi < 35) return 'Obesidade grau I';
  if (bmi < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

/**
 * Determina o status do acompanhamento baseado nos dados disponíveis
 */
function determineStatus(
  totalConsultas: number,
  ultimaConsulta: string | null,
  planoAtivo: boolean
): StatusAcompanhamento {
  if (totalConsultas === 0) return 'aguardando';
  if (!planoAtivo && totalConsultas > 0) return 'pausado';
  
  // Se última consulta foi há mais de 60 dias, considerar pausado
  if (ultimaConsulta) {
    const daysSinceLastVisit = Math.floor(
      (new Date().getTime() - new Date(ultimaConsulta).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastVisit > 60) return 'pausado';
  }
  
  return 'ativo';
}

/**
 * Hook para buscar dados consolidados da visão geral nutricional do paciente
 */
export function useVisaoGeralNutricaoData(patientId: string | null) {
  const { clinic } = useClinicData();
  
  // Buscar dados do paciente
  const {
    data: patient,
    isLoading: patientLoading,
  } = useQuery({
    queryKey: ['nutricao-patient', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, birth_date, gender, phone, email')
        .eq('id', patientId)
        .single();
      
      if (error) throw error;
      return data as NutricaoPatientData;
    },
    enabled: !!patientId,
  });
  
  // Buscar última e penúltima medição corporal (para variação)
  const {
    data: measurements,
    isLoading: measurementLoading,
  } = useQuery({
    queryKey: ['nutricao-measurements', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return { last: null, previous: null };
      
      const { data, error } = await supabase
        .from('body_measurements')
        .select('id, measurement_date, weight_kg, height_cm, bmi, body_fat_percent, waist_cm, hip_cm')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('measurement_date', { ascending: false })
        .limit(2);
      
      if (error) throw error;
      
      return {
        last: (data?.[0] as LastMeasurement) || null,
        previous: (data?.[1] as LastMeasurement) || null,
      };
    },
    enabled: !!patientId && !!clinic?.id,
  });
  
  // Buscar estatísticas de consultas
  const {
    data: appointmentStats,
    isLoading: appointmentStatsLoading,
  } = useQuery({
    queryKey: ['nutricao-appointment-stats', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return { total: 0, ultima: null };
      
      const { count, error: countError } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('status', 'finalizado');
      
      if (countError) throw countError;
      
      const { data: lastAppt, error: lastError } = await supabase
        .from('appointments')
        .select('scheduled_date')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('status', 'finalizado')
        .order('scheduled_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (lastError) throw lastError;
      
      return {
        total: count || 0,
        ultima: lastAppt?.scheduled_date || null,
      };
    },
    enabled: !!patientId && !!clinic?.id,
  });
  
  // Buscar alertas nutricionais ativos
  const {
    data: alerts,
    isLoading: alertsLoading,
  } = useQuery({
    queryKey: ['nutricao-alerts', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];
      
      const { data, error } = await supabase
        .from('clinical_alerts')
        .select('id, title, description, severity, alert_type, is_active, created_at')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('is_active', true)
        .order('severity', { ascending: true });
      
      if (error) throw error;
      return (data || []) as NutricaoAlert[];
    },
    enabled: !!patientId && !!clinic?.id,
  });
  
  // Buscar diagnósticos nutricionais
  const {
    data: diagnosticos,
    isLoading: diagnosticosLoading,
  } = useQuery({
    queryKey: ['nutricao-visao-diagnosticos', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];
      
      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('id, content, created_at')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('specialty', 'nutricao')
        .eq('evolution_type', 'followup')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || [])
        .filter(ev => {
          const content = ev.content as Record<string, unknown>;
          return content?.tipo_registro === 'diagnostico_nutricional';
        })
        .map(ev => {
          const content = ev.content as Record<string, unknown>;
          return {
            id: ev.id,
            diagnostico_principal: (content?.diagnostico_principal as string) || '',
            status: (content?.status as 'ativo' | 'resolvido' | 'em_acompanhamento') || 'ativo',
            data_diagnostico: (content?.data_diagnostico as string) || ev.created_at.split('T')[0],
            created_at: ev.created_at,
          };
        }) as DiagnosticoResumo[];
    },
    enabled: !!patientId && !!clinic?.id,
  });
  
  // Buscar planos alimentares
  const {
    data: planos,
    isLoading: planosLoading,
  } = useQuery({
    queryKey: ['nutricao-visao-planos', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];
      
      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('id, content, created_at')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('evolution_type', 'plano_alimentar')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(ev => {
        const content = ev.content as Record<string, unknown>;
        const macros = content?.macros as Record<string, unknown>;
        return {
          id: ev.id,
          titulo: (content?.titulo as string) || 'Plano Alimentar',
          objetivo: (content?.objetivo as string) || null,
          status: (content?.status as 'ativo' | 'inativo' | 'rascunho') || 'ativo',
          data_inicio: (content?.data_inicio as string) || ev.created_at.split('T')[0],
          calorias_totais: (macros?.calorias_totais_kcal as number) || null,
          created_at: ev.created_at,
        };
      }) as PlanoAlimentarResumo[];
    },
    enabled: !!patientId && !!clinic?.id,
  });
  
  // Buscar evoluções nutricionais (evolucao_retorno)
  const {
    data: evolucoes,
    isLoading: evolucoesLoading,
  } = useQuery({
    queryKey: ['nutricao-visao-evolucoes', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];
      
      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('id, content, created_at')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('specialty', 'nutricao')
        .eq('evolution_type', 'evolucao_retorno')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(ev => {
        const content = ev.content as Record<string, unknown>;
        return {
          id: ev.id,
          data_atendimento: (content?.data_atendimento as string) || ev.created_at.split('T')[0],
          peso_atual_kg: (content?.peso_atual_kg as number) || null,
          adesao_plano: (content?.adesao_plano as string) || null,
          created_at: ev.created_at,
        };
      }) as EvolucaoResumo[];
    },
    enabled: !!patientId && !!clinic?.id,
  });
  
  // Buscar avaliação inicial
  const {
    data: avaliacaoInicial,
    isLoading: avaliacaoInicialLoading,
  } = useQuery({
    queryKey: ['nutricao-visao-avaliacao-inicial', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return null;
      
      const { data, error } = await supabase
        .from('clinical_evolutions')
        .select('id, content, created_at')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('specialty', 'nutricao')
        .eq('evolution_type', 'avaliacao_inicial')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      const content = data.content as Record<string, unknown>;
      return {
        id: data.id,
        data_avaliacao: (content?.data_avaliacao as string) || data.created_at.split('T')[0],
        objetivo_principal: (content?.objetivo_principal as string) || null,
        historico_alimentar: (content?.historico_alimentar as string) || null,
        created_at: data.created_at,
      } as AvaliacaoInicialResumo;
    },
    enabled: !!patientId && !!clinic?.id,
  });
  
  // Buscar contagem de documentos
  const {
    data: documentCount,
    isLoading: documentCountLoading,
  } = useQuery({
    queryKey: ['nutricao-visao-documentos', patientId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return 0;
      
      const { count, error } = await supabase
        .from('clinical_media')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!patientId && !!clinic?.id,
  });
  
  // Processar dados
  const lastMeasurement = measurements?.last || null;
  const previousMeasurement = measurements?.previous || null;
  
  const planoAtivo = planos?.find(p => p.status === 'ativo') || null;
  const ultimoDiagnostico = diagnosticos?.find(d => d.status === 'ativo') || diagnosticos?.[0] || null;
  const ultimaEvolucao = evolucoes?.[0] || null;
  
  // Calcular variação de peso
  const variacaoPeso = lastMeasurement?.weight_kg && previousMeasurement?.weight_kg
    ? Number((lastMeasurement.weight_kg - previousMeasurement.weight_kg).toFixed(1))
    : null;
  
  // Determinar status do acompanhamento
  const statusAcompanhamento = determineStatus(
    appointmentStats?.total || 0,
    appointmentStats?.ultima || null,
    !!planoAtivo
  );
  
  // Mapear objetivo da avaliação inicial
  const objetivoMap: Record<string, ObjetivoNutricional> = {
    'emagrecimento': 'perda_peso',
    'perda_peso': 'perda_peso',
    'ganho_massa': 'ganho_massa',
    'hipertrofia': 'ganho_massa',
    'manutencao': 'manutencao',
    'reeducacao': 'reeducacao',
    'reeducacao_alimentar': 'reeducacao',
  };
  
  const objetivoRaw = avaliacaoInicial?.objetivo_principal?.toLowerCase() || '';
  const objetivo = objetivoMap[objetivoRaw] || (objetivoRaw ? 'outro' : null);
  
  // Calcular resumo consolidado
  const summary: NutricaoSummaryData = {
    peso_atual_kg: lastMeasurement?.weight_kg || null,
    altura_cm: lastMeasurement?.height_cm || null,
    imc: lastMeasurement?.bmi || null,
    classificacao_imc: classifyBMI(lastMeasurement?.bmi || null),
    data_ultima_medicao: lastMeasurement?.measurement_date || null,
    
    objetivo,
    objetivo_descricao: avaliacaoInicial?.objetivo_principal || null,
    peso_meta_kg: null,
    
    variacao_peso_kg: variacaoPeso,
    peso_consulta_anterior: previousMeasurement?.weight_kg || null,
    
    status_acompanhamento: statusAcompanhamento,
    
    total_consultas: appointmentStats?.total || 0,
    ultima_consulta: appointmentStats?.ultima || null,
    
    ultimo_diagnostico: ultimoDiagnostico,
    total_diagnosticos: diagnosticos?.length || 0,
    
    plano_ativo: planoAtivo,
    total_planos: planos?.length || 0,
    
    ultima_evolucao: ultimaEvolucao,
    total_evolucoes: evolucoes?.length || 0,
    
    avaliacao_inicial: avaliacaoInicial || null,
    
    total_documentos: documentCount || 0,
  };
  
  const loading = 
    patientLoading || 
    measurementLoading || 
    appointmentStatsLoading || 
    alertsLoading ||
    diagnosticosLoading ||
    planosLoading ||
    evolucoesLoading ||
    avaliacaoInicialLoading ||
    documentCountLoading;
  
  return {
    patient,
    summary,
    lastMeasurement,
    alerts: alerts || [],
    loading,
  };
}
