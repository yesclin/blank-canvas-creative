import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChannelIntegrationCredentials {
  id: string;
  clinic_id: string;
  channel: string;
  provider: string;
  access_token: string | null;
  instance_token: string | null;
  api_url: string | null;
  base_url: string | null;
  webhook_url: string | null;
  phone_number_id: string | null;
  business_account_id: string | null;
  instance_external_id: string | null;
  instance_id: string | null;
  config: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  settings_json: Record<string, unknown> | null;
  last_error: string | null;
}

/**
 * Admin-only hook: fetches credential/sensitive columns for a channel integration
 * via the `get_channel_integration_credentials` RPC, which validates that the
 * caller is an admin/owner of the integration's clinic.
 *
 * Non-admins will receive an error from the RPC and the query will be in error state.
 */
export function useChannelIntegrationCredentials(integrationId: string | null | undefined) {
  return useQuery({
    queryKey: ["channel-integration-credentials", integrationId],
    queryFn: async () => {
      if (!integrationId) return null;
      const { data, error } = await supabase.rpc("get_channel_integration_credentials", {
        _integration_id: integrationId,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? null) as ChannelIntegrationCredentials | null;
    },
    enabled: !!integrationId,
    staleTime: 30_000,
    retry: false,
  });
}
