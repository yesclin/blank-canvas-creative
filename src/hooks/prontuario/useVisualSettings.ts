import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type LayoutMode = 'compact' | 'standard' | 'expanded';
export type LogoPosition = 'left' | 'center' | 'right';

export interface VisualSettings {
  id: string;
  clinic_id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
  logo_position: LogoPosition;
  layout: LayoutMode;
  font_size: string;
  created_at: string;
  updated_at: string;
}

export interface VisualSettingsInput {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url?: string | null;
  logo_position: LogoPosition;
  layout: LayoutMode;
}

const DEFAULTS: VisualSettingsInput = {
  primary_color: '#6366f1',
  secondary_color: '#8b5cf6',
  accent_color: '#f59e0b',
  logo_url: null,
  logo_position: 'left',
  layout: 'standard',
};

export function useVisualSettings() {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [settings, setSettings] = useState<VisualSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_record_visual_settings')
        .select('*')
        .eq('clinic_id', clinic.id)
        .maybeSingle();

      if (error) throw error;
      setSettings(data as VisualSettings | null);
    } catch (err) {
      console.error('Error fetching visual settings:', err);
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      fetchSettings();
    }
  }, [clinicLoading, clinic?.id, fetchSettings]);

  const save = async (input: VisualSettingsInput): Promise<boolean> => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      const payload = {
        clinic_id: clinic.id,
        primary_color: input.primary_color,
        secondary_color: input.secondary_color,
        accent_color: input.accent_color,
        logo_url: input.logo_url || null,
        logo_position: input.logo_position,
        layout: input.layout,
        font_size: 'medium',
      };

      if (settings?.id) {
        const { error } = await supabase
          .from('medical_record_visual_settings')
          .update(payload)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('medical_record_visual_settings').insert(payload);
        if (error) throw error;
      }

      await fetchSettings();
      toast.success('Configurações visuais salvas');
      return true;
    } catch (err) {
      console.error('Error saving visual settings:', err);
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
