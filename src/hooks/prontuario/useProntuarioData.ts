import { useState, useEffect, useCallback } from 'react';
import { useMedicalRecordEntries, MedicalRecordEntry } from './useMedicalRecordEntries';
import { useMedicalRecordFiles, MedicalRecordFile } from './useMedicalRecordFiles';
import { useActiveSpecialty } from './useActiveSpecialty';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import type { TabConfig } from './useTabs';
import type { Field } from './useFields';

export interface PatientRecord {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  cpf: string | null;
}

export interface PatientClinicalData {
  id: string;
  patient_id: string;
  clinic_id: string;
  allergies: string[] | null;
  chronic_diseases: string[] | null;
  current_medications: string[] | null;
  family_history: string | null;
  clinical_restrictions: string | null;
  blood_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClinicalAlert {
  id: string;
  patient_id: string;
  alert_type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Combined hook that provides all data for the Prontuario usage module.
 * It connects configuration (from Configurações > Prontuário) with actual patient data.
 */
export function useProntuarioData(patientId: string | null) {
  const { clinic } = useClinicData();
  const { activeSpecialtyId, activeSpecialtyName } = useActiveSpecialty(patientId);
  const entriesHook = useMedicalRecordEntries();
  const filesHook = useMedicalRecordFiles();

  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [clinicalData, setClinicalData] = useState<PatientClinicalData | null>(null);
  // Inicia em `true` quando há patientId — evita falso "Paciente não encontrado"
  // antes da primeira busca (clinic ainda carregando, etc.).
  const [patientLoading, setPatientLoading] = useState<boolean>(!!patientId);
  const [clinicalDataLoading, setClinicalDataLoading] = useState(false);

  // Fetch patient data
  // CRÍTICO: nunca substituir um `patient` válido por `null` em caso de erro
  // temporário (RLS transitório, conexão, etc.). Mantém o último válido.
  const fetchPatient = useCallback(async () => {
    if (!patientId || !clinic?.id) return;
    setPatientLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, birth_date, gender, phone, email, cpf')
        .eq('id', patientId)
        .eq('clinic_id', clinic.id)
        .maybeSingle();

      if (error) {
        console.error('[PRONTUARIO] Error fetching patient (kept last value):', error);
        // Não zera o paciente já carregado — só atualiza se nunca houve patient.
        setPatient((prev) => prev ?? null);
        return;
      }
      if (data) {
        setPatient(data as PatientRecord);
      } else {
        // Confirmadamente vazio: paciente não existe nesta clínica.
        setPatient(null);
      }
    } catch (err) {
      console.error('[PRONTUARIO] fetchPatient threw (kept last value):', err);
      setPatient((prev) => prev ?? null);
    } finally {
      setPatientLoading(false);
    }
  }, [patientId, clinic?.id]);

  // Fetch clinical alerts from clinical_alerts table.
  // Mantemos is_active=true como filtro mínimo para alinhar com
  // usePatientClinicalAlerts (fonte única da verdade). A ordenação
  // por severidade/created_at é feita no consumidor.
  const fetchAlerts = useCallback(async () => {
    if (!patientId || !clinic?.id) return;
    try {
      const { data, error } = await supabase
        .from('clinical_alerts')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .eq('is_active', true);

      if (error) throw error;
      setAlerts((data as ClinicalAlert[]) || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  }, [patientId, clinic?.id]);

  // Fetch patient clinical data (allergies, chronic diseases, medications, etc.)
  const fetchClinicalData = useCallback(async () => {
    if (!patientId || !clinic?.id) return;
    setClinicalDataLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_clinical_data')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .maybeSingle();

      if (error) throw error;
      setClinicalData(data as PatientClinicalData | null);
    } catch (err) {
      console.error('Error fetching clinical data:', err);
    } finally {
      setClinicalDataLoading(false);
    }
  }, [patientId, clinic?.id]);

  // Load only critical data when patient or clinic changes.
  // CRÍTICO: só resetamos quando o `patientId` realmente fica vazio.
  // Se apenas o `clinic.id` ainda não chegou, mantemos o paciente já carregado
  // (evita o flash "Paciente não encontrado" entre re-renders do AuthProvider).
  // Não carregamos entradas, arquivos, templates ou dados clínicos pesados aqui:
  // cada aba deve buscar sob demanda quando for aberta.
  useEffect(() => {
    if (!patientId) {
      setPatient(null);
      setAlerts([]);
      setClinicalData(null);
      setPatientLoading(false);
      return;
    }
    if (!clinic?.id) {
      // Aguarda a clínica carregar — não zera o paciente já visível.
      return;
    }

    fetchPatient();
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, clinic?.id, fetchPatient, fetchAlerts]);

  // Quando o `patientId` da URL muda, descartamos imediatamente o paciente
  // anterior para não exibir dados de outra pessoa enquanto o novo carrega.
  useEffect(() => {
    setPatient((prev) => (prev && prev.id !== patientId ? null : prev));
  }, [patientId]);

  // Get active tabs from configuration
  const getActiveTabs = useCallback((): TabConfig[] => {
    return [];
  }, []);

  // Get template fields for creating new entries
  const getFieldsForTemplate = useCallback(async (templateId: string): Promise<Field[]> => {
    const { data, error } = await supabase
      .from('medical_record_fields')
      .select('*')
      .eq('template_id', templateId)
      .order('field_order', { ascending: true });

    if (error) {
      console.error('Error fetching fields:', error);
      return [];
    }

    return (data || []).map((f) => ({
      ...f,
      options: f.options ? (f.options as unknown as string[]) : null,
    })) as Field[];
  }, []);

  // Create a new entry using a template
  const createEntryFromTemplate = useCallback(async (
    templateId: string,
    professionalId: string,
    content: Record<string, unknown>,
    appointmentId?: string,
    context?: {
      specialty_id?: string | null;
      procedure_id?: string | null;
      template_version_id?: string | null;
      structure_snapshot?: unknown;
    }
  ): Promise<string | null> => {
    if (!patientId) return null;

    const template = config.templates.find((t) => t.id === templateId);

    return entriesHook.createEntry({
      patient_id: patientId,
      professional_id: professionalId,
      template_id: templateId,
      appointment_id: appointmentId || null,
      entry_type: template?.type || 'evolution',
      content,
      specialty_id: context?.specialty_id,
      procedure_id: context?.procedure_id,
      template_version_id: context?.template_version_id,
      structure_snapshot: context?.structure_snapshot,
    });
  }, [patientId, config.templates, entriesHook]);

  // Get entries filtered by type (matching tabs)
  const getEntriesForTab = useCallback((tabKey: string): MedicalRecordEntry[] => {
    const typeMapping: Record<string, string[]> = {
      evolucao: ['evolution'],
      anamnese: ['anamnesis'],
    };

    const types = typeMapping[tabKey] || [];
    if (types.length === 0) return entriesHook.entries;

    return entriesHook.entries.filter((e) => types.includes(e.entry_type));
  }, [entriesHook.entries]);

  // Get files by category for tabs
  const getFilesForTab = useCallback((tabKey: string): MedicalRecordFile[] => {
    const categoryMapping: Record<string, string[]> = {
      exames: ['exam', 'report'],
      documentos: ['document', 'consent', 'prescription'],
      imagens: ['image'],
    };

    const categories = categoryMapping[tabKey];
    if (!categories) return filesHook.files;

    return filesHook.files.filter((f) => categories.includes(f.category));
  }, [filesHook.files]);

  // Active alerts — combine clinical_alerts table + auto-generated from patient_clinical_data
  const allAlerts: ClinicalAlert[] = (() => {
    const combined = [...alerts];
    const now = new Date().toISOString();
    
    // Generate alerts from patient_clinical_data
    if (clinicalData) {
      if (clinicalData.allergies?.length) {
        clinicalData.allergies.forEach((a, i) => {
          combined.push({
            id: `pcd-allergy-${i}`,
            patient_id: clinicalData.patient_id,
            alert_type: 'allergy',
            severity: 'critical',
            title: `⚠ Alergia: ${a.split('\n')[0]}`,
            description: a,
            is_active: true,
            created_at: clinicalData.created_at || now,
          });
        });
      }
      if (clinicalData.chronic_diseases?.length) {
        clinicalData.chronic_diseases.forEach((d, i) => {
          combined.push({
            id: `pcd-disease-${i}`,
            patient_id: clinicalData.patient_id,
            alert_type: 'disease',
            severity: 'warning',
            title: `❤️ ${d.split('\n')[0]}`,
            description: d,
            is_active: true,
            created_at: clinicalData.created_at || now,
          });
        });
      }
      if (clinicalData.current_medications?.length) {
        clinicalData.current_medications.forEach((m, i) => {
          combined.push({
            id: `pcd-med-${i}`,
            patient_id: clinicalData.patient_id,
            alert_type: 'other',
            severity: 'info',
            title: `💊 ${m.split('\n')[0]}`,
            description: m,
            is_active: true,
            created_at: clinicalData.created_at || now,
          });
        });
      }
      if (clinicalData.clinical_restrictions) {
        combined.push({
          id: `pcd-restrictions`,
          patient_id: clinicalData.patient_id,
          alert_type: 'risk',
          severity: 'warning',
          title: `🚫 Restrições Clínicas`,
          description: clinicalData.clinical_restrictions,
          is_active: true,
          created_at: clinicalData.created_at || now,
        });
      }
    }
    return combined;
  })();

  const activeAlerts = allAlerts.filter((a) => a.is_active);
  const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');

  return {
    // Patient data
    patient,
    activeSpecialtyId,
    activeSpecialtyName,
    patientLoading,
    fetchPatient,

    // Clinical data from patient_clinical_data
    clinicalData,
    clinicalDataLoading,
    fetchClinicalData,

    // Configuration
    config,
    getActiveTabs,
    getFieldsForTemplate,

    // Entries
    entries: entriesHook.entries,
    entriesLoading: entriesHook.loading,
    entriesSaving: entriesHook.saving,
    createEntry: entriesHook.createEntry,
    createEntryFromTemplate,
    updateEntry: entriesHook.updateEntry,
    signEntry: entriesHook.signEntry,
    deleteEntry: entriesHook.deleteEntry,
    getEntriesForTab,

    // Files
    files: filesHook.files,
    filesLoading: filesHook.loading,
    filesSaving: filesHook.saving,
    uploadFile: filesHook.uploadFile,
    deleteFile: filesHook.deleteFile,
    getFilesForTab,
    getImages: filesHook.getImages,
    getDocuments: filesHook.getDocuments,

    // Alerts (combined: clinical_alerts + patient_clinical_data)
    alerts: allAlerts,
    activeAlerts,
    criticalAlerts,
    fetchAlerts,

    // Loading state
    loading: patientLoading || config.loading || entriesHook.loading || filesHook.loading,
  };
}
