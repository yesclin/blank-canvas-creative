import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';

export interface ConsentValidationResult {
  hasValidConsent: boolean;
  isEnforcementEnabled: boolean;
  isLockEnabled: boolean;
  isDigitalSignatureEnabled: boolean;
  isAuditLogsEnabled: boolean;
  isTabPermissionsEnabled: boolean;
  activeTermId: string | null;
  activeTermVersion: string | null;
  activeTermTitle: string | null;
  activeTermContent: string | null;
  patientConsentStatus: 'granted' | 'revoked' | 'none';
  consentDate: string | null;
}

const DEFAULT_RESULT: ConsentValidationResult = {
  hasValidConsent: true, // Default to true (no blocking) if no settings
  isEnforcementEnabled: false,
  isLockEnabled: false,
  isDigitalSignatureEnabled: true,
  isAuditLogsEnabled: true,
  isTabPermissionsEnabled: false,
  activeTermId: null,
  activeTermVersion: null,
  activeTermTitle: null,
  activeTermContent: null,
  patientConsentStatus: 'none',
  consentDate: null,
};

export function useLgpdEnforcement(patientId: string | null) {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [result, setResult] = useState<ConsentValidationResult>(DEFAULT_RESULT);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);

  const validateConsent = useCallback(async () => {
    if (!clinic?.id || !patientId) {
      setResult(DEFAULT_RESULT);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Step 1: Get security settings
      const { data: settings, error: settingsError } = await supabase
        .from('system_security_settings')
        .select('*')
        .eq('clinic_id', clinic.id)
        .maybeSingle();

      if (settingsError) throw settingsError;

      // Extract feature flags from settings
      const isDigitalSignatureEnabled = settings?.enable_digital_signature ?? true;
      const isAuditLogsEnabled = settings?.enable_access_logging ?? true;
      const isTabPermissionsEnabled = settings?.enable_tab_permissions ?? false;

      // If no settings or enforcement is disabled, allow access
      if (!settings || !settings.enforce_consent_before_care) {
        setResult({
          ...DEFAULT_RESULT,
          hasValidConsent: true,
          isEnforcementEnabled: false,
          isLockEnabled: false,
          isDigitalSignatureEnabled,
          isAuditLogsEnabled,
          isTabPermissionsEnabled,
        });
        setLoading(false);
        return;
      }

      const isEnforcementEnabled = settings.enforce_consent_before_care;
      const isLockEnabled = settings.lock_record_without_consent;

      // Step 2: Get active consent term
      const { data: activeTerm, error: termError } = await supabase
        .from('consent_terms')
        .select('id, title, content, version')
        .eq('clinic_id', clinic.id)
        .eq('is_active', true)
        .maybeSingle();

      if (termError) throw termError;

      // If no active term, can't enforce - allow access
      if (!activeTerm) {
        setResult({
          hasValidConsent: true,
          isEnforcementEnabled,
          isLockEnabled,
          isDigitalSignatureEnabled,
          isAuditLogsEnabled,
          isTabPermissionsEnabled,
          activeTermId: null,
          activeTermVersion: null,
          activeTermTitle: null,
          activeTermContent: null,
          patientConsentStatus: 'none',
          consentDate: null,
        });
        setLoading(false);
        return;
      }

      // Step 3: Check if patient has granted consent for this term
      const { data: patientConsent, error: consentError } = await supabase
        .from('patient_consents')
        .select('id, status, granted_at, term_version')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .eq('term_id', activeTerm.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (consentError) throw consentError;

      // Determine consent status
      let patientConsentStatus: 'granted' | 'revoked' | 'none' = 'none';
      let consentDate: string | null = null;
      let hasValidConsent = false;

      if (patientConsent) {
        patientConsentStatus = patientConsent.status as 'granted' | 'revoked';
        consentDate = patientConsent.granted_at;
        
        // Valid consent = status is 'granted' and version matches active term
        hasValidConsent = 
          patientConsent.status === 'granted' && 
          patientConsent.term_version === activeTerm.version;
      }

      setResult({
        hasValidConsent,
        isEnforcementEnabled,
        isLockEnabled,
        isDigitalSignatureEnabled,
        isAuditLogsEnabled,
        isTabPermissionsEnabled,
        activeTermId: activeTerm.id,
        activeTermVersion: activeTerm.version,
        activeTermTitle: activeTerm.title,
        activeTermContent: activeTerm.content,
        patientConsentStatus,
        consentDate,
      });
    } catch (err) {
      console.error('Error validating LGPD consent:', err);
      // On error, default to allowing access to prevent blocking legitimate use
      setResult({
        ...DEFAULT_RESULT,
        hasValidConsent: true,
      });
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, patientId]);

  useEffect(() => {
    if (!clinicLoading) {
      validateConsent();
    }
  }, [clinicLoading, validateConsent]);

  const grantConsent = useCallback(async (): Promise<boolean> => {
    if (!clinic?.id || !patientId || !result.activeTermId || !result.activeTermVersion) {
      return false;
    }

    setGranting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('patient_consents').insert({
        clinic_id: clinic.id,
        patient_id: patientId,
        term_id: result.activeTermId,
        term_version: result.activeTermVersion,
        status: 'granted',
        granted_by: user?.id,
        user_agent: navigator.userAgent,
      });

      if (error) throw error;

      // Re-validate to update state
      await validateConsent();
      return true;
    } catch (err) {
      console.error('Error granting consent:', err);
      return false;
    } finally {
      setGranting(false);
    }
  }, [clinic?.id, patientId, result.activeTermId, result.activeTermVersion, validateConsent]);

  // Computed properties
  const shouldBlockEditing = result.isEnforcementEnabled && !result.hasValidConsent;
  const shouldHideContent = result.isLockEnabled && !result.hasValidConsent;

  return {
    ...result,
    loading: loading || clinicLoading,
    granting,
    shouldBlockEditing,
    shouldHideContent,
    validateConsent,
    grantConsent,
  };
}
