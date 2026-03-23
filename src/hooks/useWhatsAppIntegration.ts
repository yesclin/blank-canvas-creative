import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface WhatsAppIntegration {
  id: string;
  clinic_id: string;
  channel: string;
  provider: string;
  phone_number_id: string | null;
  business_account_id: string | null;
  access_token: string | null;
  status: string;
  display_phone_number: string | null;
  metadata: Record<string, unknown> | null;
  base_url: string | null;
  instance_id: string | null;
  api_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvolutionApiFormData {
  api_url: string;
  instance_id: string;
  access_token: string;
  display_phone_number?: string;
}

export function useWhatsAppIntegration() {
  const { clinic } = useClinicData();
  const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchIntegration = useCallback(async () => {
    if (!clinic?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinic_channel_integrations')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('channel', 'whatsapp')
        .maybeSingle();

      if (error) throw error;
      setIntegration(data as WhatsAppIntegration | null);
    } catch (err) {
      console.error('Error fetching WhatsApp integration:', err);
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    fetchIntegration();
  }, [fetchIntegration]);

  // Realtime subscription for integration status changes
  useEffect(() => {
    if (!clinic?.id) return;

    const channel = supabase
      .channel('whatsapp-integration-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clinic_channel_integrations',
          filter: `clinic_id=eq.${clinic.id}`,
        },
        () => {
          fetchIntegration();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinic?.id, fetchIntegration]);

  const saveIntegration = async (formData: EvolutionApiFormData) => {
    if (!clinic?.id) return;
    setSaving(true);
    try {
      const payload = {
        clinic_id: clinic.id,
        channel: 'whatsapp',
        provider: 'evolution-api',
        base_url: formData.api_url || null,
        api_url: formData.api_url || null,
        instance_id: formData.instance_id || null,
        access_token: formData.access_token || null,
        display_phone_number: formData.display_phone_number || null,
        status: formData.instance_id && formData.access_token && formData.api_url ? 'active' : 'not_configured',
      };

      if (integration?.id) {
        const { error } = await supabase
          .from('clinic_channel_integrations')
          .update(payload)
          .eq('id', integration.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clinic_channel_integrations')
          .insert(payload);
        if (error) throw error;
      }

      toast.success('Integração Evolution API salva com sucesso');
      await fetchIntegration();
    } catch (err: any) {
      console.error('Error saving WhatsApp integration:', err);
      toast.error('Erro ao salvar integração: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const disconnectIntegration = async () => {
    if (!integration?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('clinic_channel_integrations')
        .update({
          status: 'not_configured',
          base_url: null,
          api_url: null,
          instance_id: null,
          access_token: null,
          display_phone_number: null,
        })
        .eq('id', integration.id);
      if (error) throw error;
      toast.success('Evolution API desconectado');
      await fetchIntegration();
    } catch (err: any) {
      toast.error('Erro ao desconectar: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return {
    integration,
    loading,
    saving,
    saveIntegration,
    disconnectIntegration,
    refetch: fetchIntegration,
    isConfigured: integration?.status === 'active',
  };
}
