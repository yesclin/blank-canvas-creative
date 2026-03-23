import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface PatientConsent {
  id: string;
  clinic_id: string;
  patient_id: string;
  term_id: string;
  term_version: string;
  status: 'granted' | 'revoked';
  granted_at: string;
  revoked_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  granted_by: string | null;
  created_at: string;
  updated_at: string;
  term_title?: string;
  patient_name?: string;
}

export function usePatientConsents(patientId?: string) {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [consents, setConsents] = useState<PatientConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConsents = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('patient_consents')
        .select('*')
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get term titles
      const termIds = [...new Set((data || []).map(c => c.term_id))];
      let termMap = new Map<string, string>();
      if (termIds.length > 0) {
        const { data: terms } = await supabase
          .from('consent_terms')
          .select('id, title')
          .in('id', termIds);
        termMap = new Map((terms || []).map(t => [t.id, t.title]));
      }

      // Get patient names if no specific patient
      let patientMap = new Map<string, string>();
      if (!patientId) {
        const patientIds = [...new Set((data || []).map(c => c.patient_id))];
        if (patientIds.length > 0) {
          const { data: patients } = await supabase
            .from('patients')
            .select('id, full_name')
            .in('id', patientIds);
          patientMap = new Map((patients || []).map(p => [p.id, p.full_name]));
        }
      }

      const enrichedConsents: PatientConsent[] = (data || []).map(consent => ({
        ...consent,
        status: consent.status as 'granted' | 'revoked',
        term_title: termMap.get(consent.term_id) || 'Termo desconhecido',
        patient_name: patientMap.get(consent.patient_id),
      }));

      setConsents(enrichedConsents);
    } catch (err) {
      console.error('Error fetching patient consents:', err);
      toast.error('Erro ao carregar consentimentos');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, patientId]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      fetchConsents();
    }
  }, [clinicLoading, clinic?.id, fetchConsents]);

  const grantConsent = async (
    patientId: string, 
    termId: string, 
    termVersion: string
  ): Promise<boolean> => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('patient_consents').insert({
        clinic_id: clinic.id,
        patient_id: patientId,
        term_id: termId,
        term_version: termVersion,
        status: 'granted',
        granted_by: user?.id,
        ip_address: null, // Would need server-side
        user_agent: navigator.userAgent,
      });

      if (error) throw error;
      await fetchConsents();
      toast.success('Consentimento registrado');
      return true;
    } catch (err) {
      console.error('Error granting consent:', err);
      toast.error('Erro ao registrar consentimento');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const revokeConsent = async (consentId: string): Promise<boolean> => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('patient_consents')
        .update({ 
          status: 'revoked',
          revoked_at: new Date().toISOString(),
        })
        .eq('id', consentId);

      if (error) throw error;
      await fetchConsents();
      toast.success('Consentimento revogado');
      return true;
    } catch (err) {
      console.error('Error revoking consent:', err);
      toast.error('Erro ao revogar consentimento');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const checkPatientConsent = async (patientId: string, termId: string): Promise<boolean> => {
    if (!clinic?.id) return false;
    
    const { data, error } = await supabase
      .from('patient_consents')
      .select('id')
      .eq('clinic_id', clinic.id)
      .eq('patient_id', patientId)
      .eq('term_id', termId)
      .eq('status', 'granted')
      .maybeSingle();

    if (error) {
      console.error('Error checking consent:', error);
      return false;
    }

    return !!data;
  };

  return {
    consents,
    loading: loading || clinicLoading,
    saving,
    fetchConsents,
    grantConsent,
    revokeConsent,
    checkPatientConsent,
  };
}
