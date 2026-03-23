import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface SecuritySettings {
  id: string;
  clinic_id: string;
  lock_after_signature: boolean;
  signature_lock_hours: number;
  require_consent_before_access: boolean;
  audit_enabled: boolean;
  audit_retention_days: number;
  allow_evolution_edit_minutes: number;
  require_justification_for_edit: boolean;
  created_at: string;
  updated_at: string;
}

export interface SecurityInput {
  lock_after_signature: boolean;
  signature_lock_hours: number;
  require_consent_before_access: boolean;
  audit_enabled: boolean;
  audit_retention_days: number;
  allow_evolution_edit_minutes: number;
  require_justification_for_edit: boolean;
}

const DEFAULTS: SecurityInput = {
  lock_after_signature: true,
  signature_lock_hours: 24,
  require_consent_before_access: true,
  audit_enabled: true,
  audit_retention_days: 365,
  allow_evolution_edit_minutes: 60,
  require_justification_for_edit: true,
};

export function useSecurity() {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_record_security_config')
        .select('*')
        .eq('clinic_id', clinic.id)
        .maybeSingle();

      if (error) throw error;
      setSettings(data as SecuritySettings | null);
    } catch (err) {
      console.error('Error fetching security settings:', err);
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      fetchSettings();
    }
  }, [clinicLoading, clinic?.id, fetchSettings]);

  const save = async (input: SecurityInput): Promise<boolean> => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      const payload = {
        clinic_id: clinic.id,
        ...input,
      };

      if (settings?.id) {
        const { error } = await supabase
          .from('medical_record_security_config')
          .update(payload)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('medical_record_security_config').insert(payload);
        if (error) throw error;
      }

      await fetchSettings();
      toast.success('Configurações de segurança salvas');
      return true;
    } catch (err) {
      console.error('Error saving security settings:', err);
      toast.error('Erro ao salvar');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    defaults: DEFAULTS,
    loading: loading || clinicLoading,
    saving,
    fetchSettings,
    save,
  };
}
