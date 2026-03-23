import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface SystemSecuritySettings {
  id: string;
  clinic_id: string;
  // LGPD Consent
  require_consent_on_registration: boolean;
  allow_patient_data_deletion: boolean;
  anonymize_reports: boolean;
  // Prontuário blocking
  enforce_consent_before_care: boolean;
  lock_record_without_consent: boolean;
  // Features toggles
  enable_digital_signature: boolean;
  enable_access_logging: boolean;
  enable_tab_permissions: boolean;
  log_retention_days: number;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface SystemSecuritySettingsInput {
  require_consent_on_registration: boolean;
  allow_patient_data_deletion: boolean;
  anonymize_reports: boolean;
  enforce_consent_before_care: boolean;
  lock_record_without_consent: boolean;
  enable_digital_signature: boolean;
  enable_access_logging: boolean;
  enable_tab_permissions: boolean;
  log_retention_days: number;
}

const DEFAULTS: SystemSecuritySettingsInput = {
  require_consent_on_registration: true,
  allow_patient_data_deletion: true,
  anonymize_reports: false,
  enforce_consent_before_care: false,
  lock_record_without_consent: false,
  enable_digital_signature: true,
  enable_access_logging: true,
  enable_tab_permissions: false,
  log_retention_days: 365,
};

/**
 * Hook to manage system-wide security settings (singleton per clinic).
 * These settings control LGPD compliance and feature enforcement across the system.
 */
export function useSecuritySettings() {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [settings, setSettings] = useState<SystemSecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_security_settings')
        .select('*')
        .eq('clinic_id', clinic.id)
        .maybeSingle();

      if (error) throw error;
      setSettings(data as SystemSecuritySettings | null);
      setInitialized(true);
    } catch (err) {
      console.error('Error fetching security settings:', err);
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      fetchSettings();
    }
  }, [clinicLoading, clinic?.id, fetchSettings]);

  const save = useCallback(async (input: SystemSecuritySettingsInput): Promise<boolean> => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      const payload = {
        clinic_id: clinic.id,
        ...input,
        updated_at: new Date().toISOString(),
      };

      if (settings?.id) {
        // Update existing record
        const { error } = await supabase
          .from('system_security_settings')
          .update(payload)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        // Insert new record (upsert with unique constraint)
        const { error } = await supabase
          .from('system_security_settings')
          .upsert(payload, { onConflict: 'clinic_id' });
        if (error) throw error;
      }

      await fetchSettings();
      toast.success('Configurações de segurança salvas com sucesso');
      return true;
    } catch (err) {
      console.error('Error saving security settings:', err);
      toast.error('Erro ao salvar configurações de segurança');
      return false;
    } finally {
      setSaving(false);
    }
  }, [clinic?.id, settings?.id, fetchSettings]);

  // Initialize with defaults if no settings exist
  const initializeDefaults = useCallback(async (): Promise<boolean> => {
    if (!clinic?.id || settings) return false;
    return save(DEFAULTS);
  }, [clinic?.id, settings, save]);

  // Get current value or default
  const getValue = useCallback(<K extends keyof SystemSecuritySettingsInput>(
    key: K
  ): SystemSecuritySettingsInput[K] => {
    if (settings && key in settings) {
      return settings[key as keyof SystemSecuritySettings] as SystemSecuritySettingsInput[K];
    }
    return DEFAULTS[key];
  }, [settings]);

  return {
    settings,
    defaults: DEFAULTS,
    loading: loading || clinicLoading,
    saving,
    initialized,
    fetchSettings,
    save,
    initializeDefaults,
    getValue,
  };
}

// Re-export types for backward compatibility
export type SecuritySettings = SystemSecuritySettings;
export type SecuritySettingsInput = SystemSecuritySettingsInput;
