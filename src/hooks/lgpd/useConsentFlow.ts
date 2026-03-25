/**
 * useConsentFlow
 * 
 * LGPD consent management:
 * - Collect patient consent for active term
 * - Check consent status
 * - Revoke consent
 * - List consent history
 * 
 * Works with: consent_terms, patient_consents, system_security_settings
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { toast } from "sonner";
import { logAudit } from "@/utils/auditLog";

export interface ConsentTerm {
  id: string;
  clinic_id: string;
  title: string;
  content: string;
  term_type: string;
  version: number;
  is_active: boolean;
  created_at: string;
}

export interface PatientConsent {
  id: string;
  clinic_id: string;
  patient_id: string;
  term_id: string;
  status: "granted" | "revoked";
  granted_at: string | null;
  revoked_at: string | null;
  granted_by: string | null;
  term_version: number | null;
  ip_address: string | null;
  created_at: string;
  term?: ConsentTerm;
}

export function useConsentFlow(patientId: string | null) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();

  // Fetch active consent term
  const { data: activeTerm } = useQuery({
    queryKey: ["active-consent-term", clinic?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consent_terms")
        .select("*")
        .eq("clinic_id", clinic!.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as ConsentTerm | null;
    },
    enabled: !!clinic?.id,
  });

  // Fetch patient consent history
  const { data: consents = [], isLoading } = useQuery({
    queryKey: ["patient-consents", clinic?.id, patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_consents")
        .select("*")
        .eq("clinic_id", clinic!.id)
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PatientConsent[];
    },
    enabled: !!clinic?.id && !!patientId,
  });

  // Check if patient has valid consent for the active term
  const hasValidConsent = (() => {
    if (!activeTerm) return true; // No active term = no enforcement
    const latest = consents.find(c => c.term_id === activeTerm.id);
    return latest?.status === "granted" && latest?.term_version === activeTerm.version;
  })();

  // Grant consent
  const grantConsent = useMutation({
    mutationFn: async (signatureData?: string) => {
      if (!clinic?.id || !patientId || !activeTerm) {
        throw new Error("Dados incompletos para coleta de consentimento");
      }

      const user = (await supabase.auth.getUser()).data.user;

      const { error } = await supabase.from("patient_consents").insert({
        clinic_id: clinic.id,
        patient_id: patientId,
        term_id: activeTerm.id,
        status: "granted",
        granted_at: new Date().toISOString(),
        granted_by: user?.id || null,
        term_version: activeTerm.version,
        user_agent: navigator.userAgent,
        signature_data: signatureData || null,
      });

      if (error) throw error;

      await logAudit({
        clinicId: clinic.id,
        action: "consent_granted",
        entityType: "patient_consent",
        metadata: {
          patient_id: patientId,
          term_id: activeTerm.id,
          term_version: activeTerm.version,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-consents", clinic?.id, patientId] });
      toast.success("Consentimento LGPD registrado com sucesso");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao registrar consentimento");
    },
  });

  // Revoke consent
  const revokeConsent = useMutation({
    mutationFn: async (consentId: string) => {
      if (!clinic?.id) throw new Error("Clínica não encontrada");

      const { error } = await supabase
        .from("patient_consents")
        .update({
          status: "revoked",
          revoked_at: new Date().toISOString(),
        } as any)
        .eq("id", consentId);

      if (error) throw error;

      await logAudit({
        clinicId: clinic.id,
        action: "consent_revoked",
        entityType: "patient_consent",
        entityId: consentId,
        metadata: { patient_id: patientId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-consents", clinic?.id, patientId] });
      toast.success("Consentimento revogado");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao revogar consentimento");
    },
  });

  return {
    activeTerm,
    consents,
    isLoading,
    hasValidConsent,
    latestConsent: consents[0] || null,
    grantConsent,
    revokeConsent,
  };
}

/**
 * useSecuritySettings
 * 
 * Manage LGPD/security settings for the clinic
 */
export function useSecuritySettings() {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["security-settings", clinic?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_security_settings")
        .select("*")
        .eq("clinic_id", clinic!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!clinic?.id,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!clinic?.id) throw new Error("Clínica não encontrada");

      if (settings) {
        const { error } = await supabase
          .from("system_security_settings")
          .update(updates)
          .eq("clinic_id", clinic.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("system_security_settings")
          .insert({ clinic_id: clinic.id, ...updates });
        if (error) throw error;
      }

      await logAudit({
        clinicId: clinic.id,
        action: "security_settings_updated",
        entityType: "system_security_settings",
        metadata: updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security-settings", clinic?.id] });
      toast.success("Configurações de segurança atualizadas");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar configurações");
    },
  });

  return {
    settings,
    isLoading,
    updateSettings,
    isEnforcementEnabled: settings?.enforce_consent_before_care ?? false,
    isLockEnabled: settings?.lock_record_without_consent ?? false,
    isDigitalSignatureEnabled: settings?.enable_digital_signature ?? true,
    isAuditEnabled: settings?.enable_access_logging ?? true,
  };
}
