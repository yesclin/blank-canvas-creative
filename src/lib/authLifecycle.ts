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
import { clearClinicalDirectoryCache } from "@/lib/clinicalDirectory";
import { invalidateClinicSpecialtyAliases } from "@/lib/specialtyDisplay";

export async function completeLocalLogout(queryClient: QueryClient, reason = "user-logout") {
  const previousUserId = getTabExpectedUserId();
  markUserLogout(reason);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("yc:signout"));
  }

  try {
    await supabase.auth.signOut();
  } catch (error) {
    // Mesmo que o Supabase esteja offline, logout local precisa ser definitivo:
    // nada de token/cache antigo permanecendo no navegador.
    console.warn("[AUTH] signOut remoto falhou; aplicando logout local", error);
  } finally {
    clearAuthenticatedTab();
    clearSupabaseAuthStorage();
    try { hardClearReactQueryCache(queryClient, reason, { previousUserId }); } catch { /* ignore */ }
    try { clearClinicalDirectoryCache(); invalidateClinicSpecialtyAliases(); } catch { /* ignore */ }
    emitIdentityChanged(previousUserId, null, reason);
  }
}