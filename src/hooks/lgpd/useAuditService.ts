/**
 * useAuditService
 * 
 * Centralized audit logging service for sensitive events.
 * Uses both audit_logs and access_logs tables.
 * 
 * Sensitive events tracked:
 * - Evolution signed/viewed
 * - Document signed/revoked/replaced
 * - Consent granted/revoked
 * - Patient data accessed/exported
 * - Security settings changed
 * - User permissions changed
 * - Login/logout events
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";

export type AuditAction =
  | "evolution_created"
  | "evolution_signed"
  | "evolution_viewed"
  | "document_created"
  | "document_signed"
  | "document_revoked"
  | "document_replaced"
  | "document_exported"
  | "consent_granted"
  | "consent_revoked"
  | "patient_data_accessed"
  | "patient_data_exported"
  | "security_settings_updated"
  | "user_permission_changed"
  | "specialty_activated"
  | "specialty_deactivated"
  | "user_invited"
  | "user_deactivated";

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  evolution_created: "Evolução criada",
  evolution_signed: "Evolução assinada",
  evolution_viewed: "Evolução visualizada",
  document_created: "Documento criado",
  document_signed: "Documento assinado",
  document_revoked: "Documento revogado",
  document_replaced: "Documento substituído",
  document_exported: "Documento exportado",
  consent_granted: "Consentimento concedido",
  consent_revoked: "Consentimento revogado",
  patient_data_accessed: "Dados do paciente acessados",
  patient_data_exported: "Dados do paciente exportados",
  security_settings_updated: "Configurações de segurança alteradas",
  user_permission_changed: "Permissão de usuário alterada",
  specialty_activated: "Especialidade ativada",
  specialty_deactivated: "Especialidade desativada",
  user_invited: "Usuário convidado",
  user_deactivated: "Usuário desativado",
};

export const AUDIT_SEVERITY: Record<string, "info" | "warning" | "critical"> = {
  evolution_created: "info",
  evolution_signed: "warning",
  evolution_viewed: "info",
  document_created: "info",
  document_signed: "warning",
  document_revoked: "critical",
  document_replaced: "warning",
  document_exported: "warning",
  consent_granted: "info",
  consent_revoked: "critical",
  patient_data_accessed: "info",
  patient_data_exported: "warning",
  security_settings_updated: "critical",
  user_permission_changed: "critical",
  specialty_activated: "info",
  specialty_deactivated: "warning",
  user_invited: "info",
  user_deactivated: "warning",
};

export interface AuditEntry {
  id: string;
  clinic_id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

interface UseAuditLogsOptions {
  action?: string;
  entityType?: string;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Hook to fetch audit logs with filtering
 */
export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  const { clinic } = useClinicData();
  const { action, entityType, limit = 50, dateFrom, dateTo } = options;

  return useQuery({
    queryKey: ["audit-logs", clinic?.id, action, entityType, limit, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .eq("clinic_id", clinic!.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (action) query = query.eq("action", action);
      if (entityType) query = query.eq("table_name", entityType);
      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lte("created_at", dateTo);

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditEntry[];
    },
    enabled: !!clinic?.id,
  });
}

/**
 * Hook to fetch access logs (resource access tracking)
 */
export function useAccessLogs(options: { resourceType?: string; limit?: number } = {}) {
  const { clinic } = useClinicData();
  const { resourceType, limit = 50 } = options;

  return useQuery({
    queryKey: ["access-logs", clinic?.id, resourceType, limit],
    queryFn: async () => {
      let query = supabase
        .from("access_logs")
        .select("*")
        .eq("clinic_id", clinic!.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (resourceType) query = query.eq("resource_type", resourceType);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!clinic?.id,
  });
}

/**
 * Log access to a patient resource (for LGPD compliance)
 */
export async function logPatientAccess(
  clinicId: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    await supabase.from("access_logs").insert({
      clinic_id: clinicId,
      user_id: user.id,
      action: "view",
      resource_type: resourceType,
      resource_id: resourceId || null,
      details: details || {},
      user_agent: navigator.userAgent,
    });
  } catch (err) {
    console.error("Access log error (non-blocking):", err);
  }
}
