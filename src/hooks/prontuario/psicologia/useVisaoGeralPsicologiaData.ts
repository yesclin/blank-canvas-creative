import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';

/**
 * Status do acompanhamento terapêutico
 */
export type StatusAcompanhamento = 'ativo' | 'em_pausa' | 'encerrado';

/**
 * Dados do paciente para exibição na Visão Geral de Psicologia
 */
export interface PsicologiaPatientData {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * Alerta clínico ativo (medicamentos, condições relevantes)
 */
export interface PsicologiaClinicalAlert {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  alert_type: string;
  description?: string | null;
}

/**
 * Dados resumidos do acompanhamento terapêutico
 */
export interface PsicologiaSummaryData {
  totalSessions: number;
  lastSessionDate: string | null;
  lastSessionProfessional: string | null;
  sessionFrequency: string | null; // ex: "Semanal", "Quinzenal"
  statusAcompanhamento: StatusAcompanhamento;
  alerts: PsicologiaClinicalAlert[];
}

interface UseVisaoGeralPsicologiaDataResult {
  patient: PsicologiaPatientData | null;
  summary: PsicologiaSummaryData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar dados da Visão Geral do prontuário de Psicologia
 * 
 * Retorna:
 * - Dados básicos do paciente (idade, sexo)
 * - Frequência das sessões
 * - Data da última sessão
 * - Alertas ativos (medicamentos em uso, condições relevantes)
 * - Status do acompanhamento (ativo / em pausa / encerrado)
 */
export function useVisaoGeralPsicologiaData(patientId: string | null): UseVisaoGeralPsicologiaDataResult {
  const { clinic } = useClinicData();
  const [patient, setPatient] = useState<PsicologiaPatientData | null>(null);
  const [summary, setSummary] = useState<PsicologiaSummaryData>({
    totalSessions: 0,
    lastSessionDate: null,
    lastSessionProfessional: null,
    sessionFrequency: null,
    statusAcompanhamento: 'ativo',
    alerts: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setPatient(null);
      setSummary({
        totalSessions: 0,
        lastSessionDate: null,
        lastSessionProfessional: null,
        sessionFrequency: null,
        statusAcompanhamento: 'ativo',
        alerts: [],
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch patient basic data
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id, full_name, birth_date, gender, phone, email')
        .eq('id', patientId)
        .eq('clinic_id', clinic.id)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData as PsicologiaPatientData);

      // Fetch clinical alerts (medicamentos, condições)
      const { data: alertsData, error: alertsError } = await supabase
        .from('clinical_alerts')
        .select('id, title, severity, alert_type, description')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('is_active', true)
        .order('severity', { ascending: true });

      if (alertsError) throw alertsError;

      const mappedAlerts: PsicologiaClinicalAlert[] = (alertsData || []).map(alert => ({
        id: alert.id,
        title: alert.title,
        severity: alert.severity as 'critical' | 'warning' | 'info',
        alert_type: alert.alert_type,
        description: alert.description,
      }));

      // Fetch completed appointments (sessions) count and last session
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          scheduled_date,
          status,
          professionals:professional_id (
            id,
            full_name
          )
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .in('status', ['completed', 'finished', 'attended', 'concluido', 'finalizado'])
        .order('scheduled_date', { ascending: false });

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
      }

      const completedSessions = appointmentsData || [];
      const totalSessions = completedSessions.length;
      
      let lastSessionDate: string | null = null;
      let lastSessionProfessional: string | null = null;
      
      if (completedSessions.length > 0) {
        lastSessionDate = completedSessions[0].scheduled_date;
        const professional = completedSessions[0].professionals as { id: string; full_name: string } | null;
        lastSessionProfessional = professional?.full_name || null;
      }

      // Calculate session frequency based on last sessions
      let sessionFrequency: string | null = null;
      if (completedSessions.length >= 2) {
        const dates = completedSessions
          .slice(0, 5)
          .map(s => new Date(s.scheduled_date).getTime());
        
        // Average days between sessions
        let totalDays = 0;
        for (let i = 0; i < dates.length - 1; i++) {
          totalDays += (dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24);
        }
        const avgDays = totalDays / (dates.length - 1);
        
        if (avgDays <= 8) {
          sessionFrequency = 'Semanal';
        } else if (avgDays <= 16) {
          sessionFrequency = 'Quinzenal';
        } else if (avgDays <= 35) {
          sessionFrequency = 'Mensal';
        } else {
          sessionFrequency = 'Esporádico';
        }
      }

      // Determine follow-up status based on last session date
      let statusAcompanhamento: StatusAcompanhamento = 'ativo';
      if (lastSessionDate) {
        const daysSinceLastSession = Math.floor(
          (Date.now() - new Date(lastSessionDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastSession > 90) {
          statusAcompanhamento = 'encerrado';
        } else if (daysSinceLastSession > 45) {
          statusAcompanhamento = 'em_pausa';
        }
      } else if (totalSessions === 0) {
        // No sessions yet - consider as new/active
        statusAcompanhamento = 'ativo';
      }

      setSummary({
        totalSessions,
        lastSessionDate,
        lastSessionProfessional,
        sessionFrequency,
        statusAcompanhamento,
        alerts: mappedAlerts,
      });

    } catch (err) {
      console.error('Error fetching psicologia visao geral data:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    patient,
    summary,
    loading,
    error,
    refetch: fetchData,
  };
}
