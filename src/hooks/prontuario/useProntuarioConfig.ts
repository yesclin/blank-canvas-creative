import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import type { TabConfig } from './useTabs';
import type { Template } from './useTemplates';
import type { Field } from './useFields';

export interface VisualConfig {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  layout: string;
  logo_url: string | null;
}

export interface SecurityConfig {
  lock_after_signature: boolean;
  signature_lock_hours: number;
  require_consent: boolean;
  audit_enabled: boolean;
  audit_retention_days: number;
}

const DEFAULT_VISUAL: VisualConfig = {
  primary_color: '#6366f1',
  secondary_color: '#8b5cf6',
  accent_color: '#f59e0b',
  layout: 'standard',
  logo_url: null,
};

const DEFAULT_SECURITY: SecurityConfig = {
  lock_after_signature: true,
  signature_lock_hours: 24,
  require_consent: true,
  audit_enabled: true,
  audit_retention_days: 365,
};

/**
 * Hook that CONSUMES the prontuario configuration for the usage module.
 * This reads from the config tables and provides the structure to the Prontuario page.
 */
export function useProntuarioConfig() {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [tabs, setTabs] = useState<TabConfig[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [visual, setVisual] = useState<VisualConfig>(DEFAULT_VISUAL);
  const [security, setSecurity] = useState<SecurityConfig>(DEFAULT_SECURITY);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);

    try {
      // Fetch active tabs
      const { data: tabsData } = await supabase
        .from('medical_record_tabs')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      setTabs((tabsData as TabConfig[]) || []);

      // Fetch active templates with their fields
      const { data: templatesData } = await supabase
        .from('medical_record_templates')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('is_active', true)
        .order('type', { ascending: true });

      setTemplates((templatesData as Template[]) || []);

      // Fetch visual settings
      const { data: visualData } = await supabase
        .from('medical_record_visual_settings')
        .select('*')
        .eq('clinic_id', clinic.id)
        .maybeSingle();

      if (visualData) {
        setVisual({
          primary_color: visualData.primary_color || DEFAULT_VISUAL.primary_color,
          secondary_color: visualData.secondary_color || DEFAULT_VISUAL.secondary_color,
          accent_color: visualData.accent_color || DEFAULT_VISUAL.accent_color,
          layout: visualData.layout || DEFAULT_VISUAL.layout,
          logo_url: visualData.logo_url,
        });
      }

      // Fetch security settings
      const { data: securityData } = await supabase
        .from('medical_record_security_config')
        .select('*')
        .eq('clinic_id', clinic.id)
        .maybeSingle();

      if (securityData) {
        setSecurity({
          lock_after_signature: securityData.lock_after_signature ?? DEFAULT_SECURITY.lock_after_signature,
          signature_lock_hours: securityData.signature_lock_hours ?? DEFAULT_SECURITY.signature_lock_hours,
          require_consent: securityData.require_consent_before_access ?? DEFAULT_SECURITY.require_consent,
          audit_enabled: securityData.audit_enabled ?? DEFAULT_SECURITY.audit_enabled,
          audit_retention_days: securityData.audit_retention_days ?? DEFAULT_SECURITY.audit_retention_days,
        });
      }
    } catch (err) {
      console.error('Error fetching prontuario config:', err);
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      fetchConfig();
    }
  }, [clinicLoading, clinic?.id, fetchConfig]);

  // Get fields for a specific template
  const getTemplateFields = useCallback(async (templateId: string): Promise<Field[]> => {
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

  // Get templates by type
  const getTemplatesByType = useCallback(
    (type: string) => templates.filter((t) => t.type === type),
    [templates]
  );

  // Get default template for a type
  const getDefaultTemplate = useCallback(
    (type: string) => templates.find((t) => t.type === type && t.is_default) || templates.find((t) => t.type === type),
    [templates]
  );

  return {
    tabs,
    templates,
    visual,
    security,
    loading: loading || clinicLoading,
    fetchConfig,
    getTemplateFields,
    getTemplatesByType,
    getDefaultTemplate,
  };
}
