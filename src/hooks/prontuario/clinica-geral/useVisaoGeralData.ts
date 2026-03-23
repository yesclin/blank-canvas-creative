import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import type { 
  PatientBasicData, 
  ClinicalSummaryData, 
  ClinicalAlertItem,
  LastAppointmentData 
} from '@/components/prontuario/clinica-geral/VisaoGeralBlock';

interface UseVisaoGeralDataResult {
  patient: PatientBasicData | null;
  clinicalData: ClinicalSummaryData;
  alerts: ClinicalAlertItem[];
  lastAppointment: LastAppointmentData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar dados da Visão Geral do prontuário de Clínica Geral
 * 
 * Retorna:
 * - Dados básicos do paciente (idade, sexo)
 * - Alergias registradas
 * - Doenças crônicas
 * - Medicamentos de uso contínuo
 * - Última consulta
 * - Alertas clínicos ativos
 */
export function useVisaoGeralData(patientId: string | null): UseVisaoGeralDataResult {
  const { clinic } = useClinicData();
  const [patient, setPatient] = useState<PatientBasicData | null>(null);
  const [clinicalData, setClinicalData] = useState<ClinicalSummaryData>({
    allergies: [],
    chronic_diseases: [],
    current_medications: [],
    blood_type: null,
    total_evolutions: 0,
    last_evolution_date: null,
    pending_prescriptions: 0,
    total_exams: 0,
  });
  const [alerts, setAlerts] = useState<ClinicalAlertItem[]>([]);
  const [lastAppointment, setLastAppointment] = useState<LastAppointmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!patientId || !clinic?.id) {
      setPatient(null);
      setClinicalData({
        allergies: [],
        chronic_diseases: [],
        current_medications: [],
        blood_type: null,
        total_evolutions: 0,
        last_evolution_date: null,
        pending_prescriptions: 0,
        total_exams: 0,
      });
      setAlerts([]);
      setLastAppointment(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch patient basic data
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id, full_name, birth_date, gender, phone, email, cpf')
        .eq('id', patientId)
        .eq('clinic_id', clinic.id)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData as PatientBasicData);

      // Fetch clinical alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('clinical_alerts')
        .select('id, title, severity, alert_type, description, is_active')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('is_active', true)
        .order('severity', { ascending: true });

      if (alertsError) throw alertsError;
      
      // Map alerts and extract clinical data from alert types
      const mappedAlerts: ClinicalAlertItem[] = (alertsData || []).map(alert => ({
        id: alert.id,
        title: alert.title,
        severity: alert.severity as 'critical' | 'warning' | 'info',
        alert_type: alert.alert_type,
        description: alert.description,
        is_active: alert.is_active ?? true,
      }));
      setAlerts(mappedAlerts);

      // Extract allergies, chronic diseases, medications from alerts
      let allergies = mappedAlerts
        .filter(a => a.alert_type === 'allergy')
        .map(a => a.title);
      let chronicDiseases = mappedAlerts
        .filter(a => a.alert_type === 'chronic_disease' || a.alert_type === 'condition')
        .map(a => a.title);
      let medications = mappedAlerts
        .filter(a => a.alert_type === 'medication' || a.alert_type === 'continuous_medication')
        .map(a => a.title);

      // Also fetch from patient_clinical_data table
      let bloodType: string | null = null;
      const { data: pcdData, error: pcdError } = await supabase
        .from('patient_clinical_data')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .maybeSingle();

      if (!pcdError && pcdData) {
        if (pcdData.allergies?.length) {
          allergies = [...allergies, ...(pcdData.allergies as string[])];
        }
        if (pcdData.chronic_diseases?.length) {
          chronicDiseases = [...chronicDiseases, ...(pcdData.chronic_diseases as string[])];
        }
        if (pcdData.current_medications?.length) {
          medications = [...medications, ...(pcdData.current_medications as string[])];
        }
        bloodType = pcdData.blood_type as string | null;
      }

      // Fetch evolutions count and last date
      const { data: evolutionsData, error: evolutionsError } = await supabase
        .from('clinical_evolutions')
        .select('id, created_at')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false });

      const totalEvolutions = evolutionsData?.length ?? 0;
      const lastEvolutionDate = evolutionsData?.[0]?.created_at ?? null;

      // Fetch medical record files count (exams/documents)
      const { count: examsCount, error: examsError } = await supabase
        .from('medical_record_files')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id);

      setClinicalData({
        allergies,
        chronic_diseases: chronicDiseases,
        current_medications: medications,
        blood_type: bloodType,
        total_evolutions: totalEvolutions,
        last_evolution_date: lastEvolutionDate,
        pending_prescriptions: 0,
        total_exams: examsCount ?? 0,
      });

      // Fetch last appointment
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          id,
          scheduled_date,
          status,
          professionals:professional_id (
            id,
            full_name
          ),
          specialties:specialty_id (
            id,
            name
          ),
          procedures:procedure_id (
            id,
            name
          )
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .in('status', ['completed', 'finished', 'attended', 'concluido', 'finalizado'])
        .order('scheduled_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (appointmentError) {
        console.error('Error fetching last appointment:', appointmentError);
      } else if (appointmentData) {
        const professional = appointmentData.professionals as { id: string; full_name: string } | null;
        const specialty = appointmentData.specialties as { id: string; name: string } | null;
        const procedure = appointmentData.procedures as { id: string; name: string } | null;
        
        setLastAppointment({
          id: appointmentData.id,
          scheduled_date: appointmentData.scheduled_date,
          professional_name: professional?.full_name || undefined,
          specialty_name: specialty?.name || undefined,
          procedure_name: procedure?.name || undefined,
          status: appointmentData.status,
        });
      } else {
        setLastAppointment(null);
      }

    } catch (err) {
      console.error('Error fetching visao geral data:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinic?.id]);

  useEffect(() => {
    let cancelled = false;
    fetchData().then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [fetchData]);

  return {
    patient,
    clinicalData,
    alerts,
    lastAppointment,
    loading,
    error,
    refetch: fetchData,
  };
}
