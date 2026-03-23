import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from './useClinicData';
import { toast } from 'sonner';

export interface IdleAlertSettings {
  id: string;
  clinic_id: string;
  enabled: boolean;
  min_idle_hours: number;
  min_continuous_minutes: number;
  min_occupancy_percent: number;
  created_at: string;
  updated_at: string;
}

export interface IdleAlertSettingsFormData {
  enabled: boolean;
  min_idle_hours: number;
  min_continuous_minutes: number;
  min_occupancy_percent: number;
}

const DEFAULT_SETTINGS: IdleAlertSettingsFormData = {
  enabled: true,
  min_idle_hours: 2,
  min_continuous_minutes: 60,
  min_occupancy_percent: 60,
};

export function useIdleAlertSettings() {
  const { clinic } = useClinicData();
  const [settings, setSettings] = useState<IdleAlertSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!clinic?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('idle_alert_settings')
        .select('*')
        .eq('clinic_id', clinic.id)
        .maybeSingle();

      if (error) throw error;
      setSettings(data as IdleAlertSettings | null);
    } catch (error) {
      console.error('Error fetching idle alert settings:', error);
      toast.error('Erro ao carregar configurações de alerta');
    } finally {
      setIsLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (data: IdleAlertSettingsFormData) => {
    if (!clinic?.id) return false;

    // Validate data
    const validatedData: IdleAlertSettingsFormData = {
      enabled: Boolean(data.enabled),
      min_idle_hours: Math.max(0, Number(data.min_idle_hours) || 2),
      min_continuous_minutes: Math.max(0, Number(data.min_continuous_minutes) || 60),
      min_occupancy_percent: Math.min(100, Math.max(0, Number(data.min_occupancy_percent) || 60)),
    };

    setIsSaving(true);
    try {
      if (settings?.id) {
        // Update existing settings
        const { error } = await supabase
          .from('idle_alert_settings')
          .update({
            enabled: validatedData.enabled,
            min_idle_hours: validatedData.min_idle_hours,
            min_continuous_minutes: validatedData.min_continuous_minutes,
            min_occupancy_percent: validatedData.min_occupancy_percent,
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { data: newSettings, error } = await supabase
          .from('idle_alert_settings')
          .insert({
            clinic_id: clinic.id,
            enabled: validatedData.enabled,
            min_idle_hours: validatedData.min_idle_hours,
            min_continuous_minutes: validatedData.min_continuous_minutes,
            min_occupancy_percent: validatedData.min_occupancy_percent,
          })
          .select()
          .single();

        if (error) throw error;
        setSettings(newSettings as IdleAlertSettings);
      }
      
      toast.success('Configurações de alerta salvas com sucesso!');
      await fetchSettings();
      return true;
    } catch (error) {
      console.error('Error saving idle alert settings:', error);
      toast.error('Erro ao salvar configurações de alerta');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Memoize current settings to prevent unnecessary re-renders
  const currentSettings: IdleAlertSettingsFormData = useMemo(() => {
    if (settings) {
      return {
        enabled: settings.enabled,
        min_idle_hours: Number(settings.min_idle_hours),
        min_continuous_minutes: settings.min_continuous_minutes,
        min_occupancy_percent: settings.min_occupancy_percent,
      };
    }
    return DEFAULT_SETTINGS;
  }, [settings]);

  return {
    settings,
    currentSettings,
    isLoading,
    isSaving,
    saveSettings,
    refetch: fetchSettings,
  };
}
