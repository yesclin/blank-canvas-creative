import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AuthIdentityState {
  userId: string | null;
  isLoading: boolean;
}

/**
 * Fonte leve e verificada do auth.uid() atual.
 *
 * Não lê localStorage/sessionStorage como verdade; o valor vem de
 * supabase.auth.getUser() e é revalidado em eventos de auth. Hooks sensíveis
 * usam este userId no queryKey para impedir cache compartilhado entre contas.
 */
export function useAuthIdentity(): AuthIdentityState {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let requestId = 0;

    const resolve = async () => {
      const reqId = ++requestId;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (cancelled || reqId !== requestId) return;
        if (!sessionData.session) {
          setUserId(null);
          return;
        }
        const { data, error } = await supabase.auth.getUser();
        if (cancelled || reqId !== requestId) return;
        if (error) throw error;
        userIdRef.current = data.user?.id ?? null;
        setUserId(userIdRef.current);
      } catch (error) {
        if (!cancelled && reqId === requestId) {
          console.error("[AUTH_IDENTITY] falha ao validar auth.uid()", error);
          userIdRef.current = null;
          setUserId(null);
        }
      } finally {
        if (!cancelled && reqId === requestId) setIsLoading(false);
      }
    };

    void resolve();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (import.meta.env.DEV) {
        console.log("AUTH STATE CHANGE", { source: "useAuthIdentity", event, userId: session?.user?.id ?? null });
      }
      if (event === "SIGNED_OUT") {
        requestId++;
        userIdRef.current = null;
        setUserId(null);
        setIsLoading(false);
        return;
      }

      // TOKEN_REFRESHED não troca identidade — re-resolver propaga refetch
      // a todos os hooks dependentes ("sistema atualiza sozinho").
      if (event === "TOKEN_REFRESHED") return;

      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        const nextUserId = session?.user?.id ?? null;
        if (nextUserId) {
          setUserId((prev) => prev ?? nextUserId);
          userIdRef.current = nextUserId;
          setIsLoading(false);
        }
        setTimeout(() => {
          if (!cancelled) void resolve();
        }, 0);
      }

      if (event === "USER_UPDATED") {
        const nextUserId = session?.user?.id ?? null;
        if (nextUserId && nextUserId !== userIdRef.current) {
          setTimeout(() => {
            if (!cancelled) void resolve();
          }, 0);
        }
      }
    });

    const onIdentityChanged = (event: Event) => {
      requestId++;
      const detail = (event as CustomEvent).detail as { next?: string | null } | undefined;
      userIdRef.current = detail?.next ?? null;
      setUserId(userIdRef.current);
      setIsLoading(false);
      setTimeout(() => {
        if (!cancelled) void resolve();
      }, 0);
    };
    window.addEventListener("yesclin:identity-changed", onIdentityChanged);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("yesclin:identity-changed", onIdentityChanged);
    };
  }, []);

  return { userId, isLoading };
}