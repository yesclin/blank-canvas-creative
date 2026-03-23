import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserAuditLog {
  id: string;
  clinic_id: string;
  action: string;
  target_user_id: string | null;
  target_email: string | null;
  performed_by: string;
  performer_name?: string;
  details: Record<string, any>;
  created_at: string;
}

const actionLabels: Record<string, string> = {
  user_invited: "Convite enviado",
  user_joined: "Usuário entrou",
  user_activated: "Usuário ativado",
  user_deactivated: "Usuário desativado",
  user_role_changed: "Perfil alterado",
  user_permissions_changed: "Permissões alteradas",
  invitation_cancelled: "Convite cancelado",
  invitation_resent: "Convite reenviado",
};

export function useUserAuditLogs(clinicId: string | null) {
  const [logs, setLogs] = useState<UserAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!clinicId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch audit logs
      const { data: logsData, error: logsError } = await supabase
        .from("user_audit_logs")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Get unique performer IDs to fetch their names
      const performerIds = [...new Set((logsData || []).map(log => log.performed_by))];
      
      // Fetch performer names
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", performerIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p.full_name])
      );

      // Enrich logs with performer names
      const enrichedLogs: UserAuditLog[] = (logsData || []).map(log => ({
        ...log,
        performer_name: profileMap.get(log.performed_by) || "Sistema",
        details: (typeof log.details === 'object' && log.details !== null && !Array.isArray(log.details)) 
          ? log.details as Record<string, any>
          : {},
      }));

      setLogs(enrichedLogs);
    } catch (err: any) {
      console.error("Error fetching audit logs:", err);
      setError("Erro ao carregar histórico de auditoria");
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId) {
      fetchLogs();
    }
  }, [clinicId, fetchLogs]);

  const logAction = useCallback(async (
    action: string,
    targetUserId: string | null,
    targetEmail: string | null,
    details: Record<string, any> = {}
  ) => {
    if (!clinicId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("user_audit_logs").insert({
        clinic_id: clinicId,
        action,
        target_user_id: targetUserId,
        target_email: targetEmail,
        performed_by: user.id,
        details,
      });

      // Refresh logs after inserting
      await fetchLogs();
    } catch (err) {
      console.error("Error logging action:", err);
    }
  }, [clinicId, fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    fetchLogs,
    logAction,
    actionLabels,
  };
}
