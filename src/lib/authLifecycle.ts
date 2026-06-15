import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { markUserLogout } from "@/lib/authIntent";
import {
  clearAuthenticatedTab,
  clearSupabaseAuthStorage,
  emitIdentityChanged,
  getTabExpectedUserId,
} from "@/lib/authSessionIsolation";
import { hardClearReactQueryCache } from "@/lib/queryClientDiagnostics";

export async function completeLocalLogout(queryClient: QueryClient, reason = "user-logout") {
  const previousUserId = getTabExpectedUserId();
  markUserLogout(reason);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("yc:signout"));
  }

  try {
    await supabase.auth.signOut();
  } finally {
    clearAuthenticatedTab();
    clearSupabaseAuthStorage();
    try { hardClearReactQueryCache(queryClient, reason, { previousUserId }); } catch { /* ignore */ }
    emitIdentityChanged(previousUserId, null, reason);
  }
}