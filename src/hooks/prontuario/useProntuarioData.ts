import { useState, useEffect, useCallback } from 'react';
import { useProntuarioConfig } from './useProntuarioConfig';
import { useMedicalRecordEntries, MedicalRecordEntry } from './useMedicalRecordEntries';
import { useMedicalRecordFiles, MedicalRecordFile } from './useMedicalRecordFiles';
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
  const config = useProntuarioConfig();
  const entriesHook = useMedicalRecordEntries();
  const filesHook = useMedicalRecordFiles();

  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [clinicalData, setClinicalData] = useState<PatientClinicalData | null>(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [clinicalDataLoading, setClinicalDataLoading] = useState(false);

  // Fetch patient data
  const fetchPatient = useCallback(async () => {
    if (!patientId || !clinic?.id) return;
    setPatientLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, birth_date, gender, phone, email, cpf')
        .eq('id', patientId)
        .eq('clinic_id', clinic.id)
        .single();

      if (error) throw error;
      setPatient(data as PatientRecord);
    } catch (err) {
      console.error('Error fetching patient:', err);
      setPatient(null);
    } finally {
      setPatientLoading(false);
    }
  }, [patientId, clinic?.id]);

  // Fetch clinical alerts from clinical_alerts table
  const fetchAlerts = useCallback(async () => {
    if (!patientId || !clinic?.id) return;
    try {
      const { data, error } = await supabase
        .from('clinical_alerts')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('severity', { ascending: true });

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

  // Load all data when patient or clinic changes — reset state when deps are missing
  useEffect(() => {
    if (!patientId || !clinic?.id) {
      // Reset all state to prevent showing stale data
      setPatient(null);
      setAlerts([]);
      setClinicalData(null);
      return;
    }

    fetchPatient();
    fetchAlerts();
    fetchClinicalData();
    entriesHook.fetchEntriesForPatient(patientId);
    filesHook.fetchFilesForPatient(patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, clinic?.id, fetchPatient, fetchAlerts, fetchClinicalData]);

  // Get active tabs from configuration
  const getActiveTabs = useCallback((): TabConfig[] => {
    return config.tabs.filter((t) => t.is_active).sort((a, b) => a.display_order - b.display_order);
  }, [config.tabs]);

  // Get template fields for creating new entries
  const getFieldsForTemplate = useCallback(async (templateId: string): Promise<Field[]> => {
    return config.getTemplateFields(templateId);
  }, [config]);

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
      diagnostico: ['diagnosis'],
      prescricoes: ['prescription'],
      procedimentos: ['procedure'],
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
