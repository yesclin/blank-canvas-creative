import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';

export interface WhatsAppIntegration {
  id: string;
  clinic_id: string;
  channel: string;
  provider: string;
  status: string;
  instance_name: string | null;
  instance_phone: string | null;
  instance_status: string | null;
  display_phone_number: string | null;
}

/**
 * Compatibility hook: reads the active UAZAPI integration for the current clinic.
 * For management actions, use `useClinicWhatsAppIntegration`.
 */
export function useWhatsAppIntegration() {
  const { clinic } = useClinicData();
  const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchIntegration = useCallback(async () => {
    if (!clinic?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinic_channel_integrations')
        .select('id, clinic_id, channel, provider, status, instance_name, instance_phone, instance_status, display_phone_number')
        .eq('clinic_id', clinic.id)
        .eq('channel', 'whatsapp')
        .eq('provider', 'uazapi')
        .eq('is_active', true)
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

  useEffect(() => {
    if (!clinic?.id) return;
    const channel = supabase
      .channel('whatsapp-integration-status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clinic_channel_integrations', filter: `clinic_id=eq.${clinic.id}` },
        () => fetchIntegration()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clinic?.id, fetchIntegration]);

  const isConfigured =
    integration?.instance_status === 'connected' || integration?.status === 'active';

  return {
    integration,
    loading,
    isConfigured,
    refetch: fetchIntegration,
  };
}
