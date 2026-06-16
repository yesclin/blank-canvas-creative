import { createContext, createElement, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  clearAuthenticatedTab,
  clearIdentityScopedState,
  clearUnsafeAuthCache,
  emitIdentityChanged,
  getTabExpectedUserId,
  quarantineMismatchedAuthSession,
  rememberAuthenticatedUser,
} from "@/lib/authSessionIsolation";
import { wasLogoutRequestedByUser } from "@/lib/authIntent";
import { isTransientAuthError, tryRecoverSession } from "@/lib/authSessionRecovery";
import { clearReactQueryCache } from "@/lib/queryClientDiagnostics";
import { useQueryClient } from "@tanstack/react-query";

export interface AuthIdentityState {
  userId: string | null;
  isLoading: boolean;
}

const AuthIdentityContext = createContext<AuthIdentityState | null>(null);

/**
 * Fonte leve e verificada do auth.uid() atual.
 *
 * Não lê localStorage/sessionStorage como verdade; o valor vem de
 * supabase.auth.getUser() e é revalidado em eventos de auth. Hooks sensíveis
 * usam este userId no queryKey para impedir cache compartilhado entre contas.
 */
export function AuthIdentityProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let requestId = 0;

    const applyUserId = (nextUserId: string | null, reason: string) => {
      if (cancelled) return;
      const prevUserId = userIdRef.current;
      const expectedUserId = getTabExpectedUserId();

      if (nextUserId && expectedUserId && expectedUserId !== nextUserId) {
        requestId++;
        userIdRef.current = null;
        setUserId(null);
        setIsLoading(false);
        quarantineMismatchedAuthSession(`AuthIdentityProvider:${reason}`, expectedUserId, nextUserId);
        try { clearReactQueryCache(queryClient, "auth-identity-mismatch", { expectedUserId, nextUserId }); } catch { /* ignore */ }
        return;
      }

      if (prevUserId === nextUserId) {
        setIsLoading(false);
        return;
      }

      const isInitial = prevUserId === undefined;
      const isLogout = Boolean(prevUserId && !nextUserId);
      const isUserSwitch = Boolean(prevUserId && nextUserId && prevUserId !== nextUserId);

      if (nextUserId) rememberAuthenticatedUser(nextUserId);
      if (isLogout) clearAuthenticatedTab();
      if (isUserSwitch) clearIdentityScopedState();
      clearUnsafeAuthCache();

      userIdRef.current = nextUserId;
      setUserId(nextUserId);
      setIsLoading(false);

      if (!isInitial && (isLogout || isUserSwitch)) {
        try { clearReactQueryCache(queryClient, "auth-identity-changed", { prevUserId, nextUserId }); } catch { /* ignore */ }
        emitIdentityChanged(prevUserId ?? null, nextUserId, reason);
      }
    };

    const resolve = async () => {
      const reqId = ++requestId;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (cancelled || reqId !== requestId) return;
        if (import.meta.env.DEV) {
          console.log("SESSION_LOADED", { source: "AuthIdentityProvider", hasSession: !!sessionData.session, userId: sessionData.session?.user?.id ?? null });
        }
        if (!sessionData.session) {
          applyUserId(null, "resolve:no-session");
          return;
        }
        const sessionUserId = sessionData.session.user?.id ?? null;
        if (sessionUserId) {
          let userData: { user?: { id?: string | null } | null } = {};
          let userError: unknown = null;
          try {
            const userResult = await supabase.auth.getUser();
            userData = userResult.data ?? {};
            userError = userResult.error ?? null;
          } catch (error) {
            userError = error;
          }
          if (cancelled || reqId !== requestId) return;
          if (userError || !userData.user?.id) {
            console.error("[AUTH_IDENTITY] sessão local inválida ao validar auth.uid()", userError);
            if (isTransientAuthError(userError)) {
              applyUserId(sessionUserId, "resolve:getUser-transient");
              return;
            }
            clearAuthenticatedTab();
            clearUnsafeAuthCache();
            applyUserId(null, "resolve:getUser-invalid");
            return;
          }
          if (userData.user.id !== sessionUserId) {
            quarantineMismatchedAuthSession("AuthIdentityProvider:session-user-mismatch", sessionUserId, userData.user.id);
            applyUserId(null, "resolve:user-mismatch");
            return;
          }
          applyUserId(userData.user.id, "resolve:getUser");
          if (import.meta.env.DEV) console.log("SESSION_FOUND", { source: "AuthIdentityProvider", userId: userData.user.id });
        }
      } catch (error) {
        if (!cancelled && reqId === requestId) {
          console.error("[AUTH_IDENTITY] falha ao validar auth.uid()", error);
          // Falha de rede/getUser depois de uma sessão local existente NÃO é
          // logout. Preserva a sessão e evita voltar para /login indevidamente.
          if (userIdRef.current === undefined) {
            applyUserId(null, "resolve:error-no-session");
          } else {
            setIsLoading(false);
          }
        }
      } finally {
        if (!cancelled && reqId === requestId) setIsLoading(false);
      }
    };

    void resolve();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (import.meta.env.DEV) {
        console.log("AUTH_STATE_CHANGED", { source: "useAuthIdentity", event, userId: session?.user?.id ?? null });
      }
      if (event === "SIGNED_OUT") {
        requestId++;
        if (wasLogoutRequestedByUser()) {
          applyUserId(null, "SIGNED_OUT:intentional");
          return;
        }
        void (async () => {
          const result = await tryRecoverSession();
          if (cancelled) return;
          if (result.recovered === true) {
            applyUserId(result.session?.user?.id ?? null, "SIGNED_OUT:recovered");
            return;
          }
          if (result.definitive === false) {
            setIsLoading(false);
            return;
          }
          applyUserId(null, "SIGNED_OUT:confirmed");
        })();
        return;
      }

      // TOKEN_REFRESHED nunca troca identidade, profile, clínica ou permissões.
      // Se vier com uid diferente, tratamos como sessão divergente e bloqueamos.
      if (event === "TOKEN_REFRESHED") {
        const refreshedUserId = session?.user?.id ?? null;
        const currentUserId = userIdRef.current ?? null;
        if (refreshedUserId && currentUserId && refreshedUserId !== currentUserId) {
          applyUserId(refreshedUserId, "TOKEN_REFRESHED:mismatch");
        }
        return;
      }

      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        const nextUserId = session?.user?.id ?? null;
        if (nextUserId) {
          applyUserId(nextUserId, event);
        }
      }

      if (event === "USER_UPDATED") {
        const nextUserId = session?.user?.id ?? null;
        if (nextUserId) applyUserId(nextUserId, "USER_UPDATED");
      }
    });

    const onIdentityChanged = (event: Event) => {
      const detail = (event as CustomEvent).detail as { next?: string | null; prev?: string | null } | undefined;
      const nextUserId = detail?.next ?? null;
      // Evita ping-pong: se o evento corresponde ao userId que já temos,
      // ignora completamente (sem applyUserId, sem resolve()).
      if (nextUserId === (userIdRef.current ?? null)) {
        if (import.meta.env.DEV) {
          console.log("[DOUBLE_LOAD_DEBUG] identity-changed ignorado (mesmo user)", { nextUserId });
        }
        return;
      }
      requestId++;
      applyUserId(nextUserId, "yesclin:identity-changed");
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
  }, [queryClient]);

  return createElement(AuthIdentityContext.Provider, { value: { userId, isLoading } }, children);
}

export function useAuthIdentity(): AuthIdentityState {
  const ctx = useContext(AuthIdentityContext);
  if (!ctx) {
    throw new Error("useAuthIdentity deve ser usado dentro de <AuthIdentityProvider>");
  }
  return ctx;
}