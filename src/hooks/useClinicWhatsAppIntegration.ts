import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { toast } from "sonner";

export interface ClinicWhatsAppIntegration {
  id: string;
  clinic_id: string;
  channel: string;
  provider: string;
  is_active: boolean;
  is_default: boolean;
  status: string | null;
  instance_name: string | null;
  instance_external_id: string | null;
  instance_status: string | null;
  instance_phone: string | null;
  instance_profile_name: string | null;
  instance_profile_pic_url: string | null;
  is_business: boolean;
  webhook_url: string | null;
  webhook_enabled: boolean;
  last_connection_check_at: string | null;
  last_connection_status: string | null;
  last_error: string | null;
  settings_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

type Action = "create" | "connect" | "status" | "disconnect" | "reset" | "send_test";

export function useClinicWhatsAppIntegration() {
  const { clinic } = useClinicData();
  const [integration, setIntegration] = useState<ClinicWhatsAppIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Action | null>(null);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [paircode, setPaircode] = useState<string | null>(null);

  const fetchIntegration = useCallback(async () => {
    if (!clinic?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clinic_channel_integrations")
        .select("*")
        .eq("clinic_id", clinic.id)
        .eq("channel", "whatsapp")
        .eq("provider", "uazapi")
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      setIntegration(data as ClinicWhatsAppIntegration | null);
    } catch (err) {
      console.error("Error fetching UAZAPI integration:", err);
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    fetchIntegration();
  }, [fetchIntegration]);

  // Realtime
  useEffect(() => {
    if (!clinic?.id) return;
    const channel = supabase
      .channel(`uazapi-integration-${clinic.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clinic_channel_integrations",
          filter: `clinic_id=eq.${clinic.id}`,
        },
        () => fetchIntegration()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinic?.id, fetchIntegration]);

  const invokeAction = useCallback(
    async (action: Action, payload: Record<string, unknown> = {}) => {
      if (!clinic?.id) {
        toast.error("Clínica não identificada");
        return null;
      }
      setActionLoading(action);
      try {
        const { data, error } = await supabase.functions.invoke("uazapi-instance", {
          body: { action, clinic_id: clinic.id, payload },
        });
        if (error) throw error;
        if (data?.qrcode !== undefined) setQrcode(data.qrcode);
        if (data?.paircode !== undefined) setPaircode(data.paircode);
        if (data?.error) {
          toast.error(data.error);
          return null;
        }
        await fetchIntegration();
        return data;
      } catch (err: any) {
        const msg = err?.message || "Erro na operação";
        console.error(`UAZAPI ${action} error:`, err);
        toast.error(msg);
        return null;
      } finally {
        setActionLoading(null);
      }
    },
    [clinic?.id, fetchIntegration]
  );

  const createInstance = (instance_name?: string) => invokeAction("create", instance_name ? { instance_name } : {});
  const connectInstance = (phone?: string) => invokeAction("connect", phone ? { phone } : {});
  const refreshStatus = () => invokeAction("status");
  const disconnectInstance = () => invokeAction("disconnect");
  const resetInstance = () => invokeAction("reset");
  const sendTestMessage = (phone: string, message: string) =>
    invokeAction("send_test", { phone, message });

  const isConnected = integration?.instance_status === "connected" || integration?.status === "active";
  const hasInstance = !!integration?.instance_external_id || !!integration?.instance_name;

  return {
    integration,
    loading,
    actionLoading,
    qrcode,
    paircode,
    isConnected,
    hasInstance,
    createInstance,
    connectInstance,
    refreshStatus,
    disconnectInstance,
    resetInstance,
    sendTestMessage,
    refetch: fetchIntegration,
  };
}
