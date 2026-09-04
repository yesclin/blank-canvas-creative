/**
 * checkPlatformAdmin
 * --------------------------------------------------
 * Fonte ÚNICA da checagem `is_platform_admin`.
 *
 * Antes, 6 pontos diferentes (useActiveClinicScope, useClinicData,
 * useConveniosData, usePlatformAdmin, Login, Index) chamavam a RPC por conta
 * própria — em cada boot/navegação isso somava várias requisições idênticas,
 * ocupando a fila de conexões do navegador (Stalled alto).
 *
 * Aqui a chamada é deduplicada e memorizada por `userId` com TTL curto.
 * A validação continua sendo feita NO BANCO (RPC SECURITY DEFINER); nada é
 * inferido do navegador. O cache é descartado em troca de identidade/logout.
 */
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/asyncTimeout";

const TTL_MS = 5 * 60_000;

let cache: { userId: string; value: boolean; at: number } | null = null;
let inFlight: { userId: string; promise: Promise<boolean> } | null = null;

export function invalidatePlatformAdminCache() {
  cache = null;
  inFlight = null;
}

export async function checkPlatformAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;

  if (cache && cache.userId === userId && Date.now() - cache.at < TTL_MS) {
    return cache.value;
  }
  if (inFlight && inFlight.userId === userId) return inFlight.promise;

  const promise = withTimeout<any>(supabase.rpc("is_platform_admin", { _user_id: userId }), 10000)
    .then((res: any) => {
      const value = res?.data === true;
      if (!res?.error) cache = { userId, value, at: Date.now() };
      inFlight = null;
      return value;
    })
    .catch((error) => {
      inFlight = null;
      cache = null;
      throw error;
    });

  inFlight = { userId, promise };
  return promise;
}

if (typeof window !== "undefined") {
  window.addEventListener("yesclin:identity-changed", invalidatePlatformAdminCache);
  window.addEventListener("yc:signout", invalidatePlatformAdminCache);
}
