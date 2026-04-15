import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';

export interface ClinicSignatureSettings {
  signature_level: 'simple' | 'reinforced' | 'advanced';
  require_selfie: boolean;
  require_otp: boolean;
  allow_camera_fallback: boolean;
  allow_geolocation: boolean;
  allow_typed_name: boolean;
}

const DEFAULTS: ClinicSignatureSettings = {
  signature_level: 'advanced',
  require_selfie: true,
  require_otp: false,
  allow_camera_fallback: true,
  allow_geolocation: false,
  allow_typed_name: false,
};

export function useClinicSignatureSettings(documentType = 'evolution') {
  const { clinic } = useClinicData();

  const { data, isLoading } = useQuery({
    queryKey: ['clinic-signature-settings', clinic?.id, documentType],
    queryFn: async () => {
      if (!clinic?.id) return DEFAULTS;
      const { data, error } = await supabase
        .from('clinic_signature_settings')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('document_type', documentType)
        .maybeSingle();
      if (error || !data) return DEFAULTS;
      return {
        signature_level: data.signature_level as ClinicSignatureSettings['signature_level'],
        require_selfie: data.require_selfie,
        require_otp: data.require_otp,
        allow_camera_fallback: data.allow_camera_fallback,
        allow_geolocation: data.allow_geolocation,
        allow_typed_name: data.allow_typed_name,
      };
    },
    enabled: !!clinic?.id,
  });

  return { settings: data || DEFAULTS, loading: isLoading };
}
