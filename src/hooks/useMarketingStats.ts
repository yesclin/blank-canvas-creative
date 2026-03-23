import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";

export interface MessageStats {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryRate: number;
  readRate: number;
}

export function useMarketingStats() {
  const { clinic } = useClinicData();
  const [logs, setLogs] = useState<Array<{ status: string }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!clinic?.id) return;
    try {
      const { data, error } = await supabase
        .from("message_logs")
        .select("status")
        .eq("clinic_id", clinic.id)
        .is("deleted_at", null);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Error fetching message stats:", err);
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Realtime subscription
  useEffect(() => {
    if (!clinic?.id) return;

    const channel = supabase
      .channel("marketing-stats")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_logs",
          filter: `clinic_id=eq.${clinic.id}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinic?.id, fetchStats]);

  const messageStats: MessageStats = useMemo(() => {
    const total = logs.length;
    const sent = logs.filter(
      (m) => m.status === "sent" || m.status === "delivered" || m.status === "read"
    ).length;
    const delivered = logs.filter(
      (m) => m.status === "delivered" || m.status === "read"
    ).length;
    const read = logs.filter((m) => m.status === "read").length;
    const failed = logs.filter((m) => m.status === "failed").length;

    return {
      total,
      sent,
      delivered,
      read,
      failed,
      deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
      readRate: delivered > 0 ? Math.round((read / delivered) * 100) : 0,
    };
  }, [logs]);

  return { messageStats, loading, refetch: fetchStats };
}
