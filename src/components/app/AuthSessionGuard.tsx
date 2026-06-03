import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  clearAuthenticatedTab,
  clearIdentityScopedState,
  clearUnsafeAuthCache,
  emitIdentityChanged,
  ensureSessionMatchesTab,
  getTabExpectedUserId,
  quarantineMismatchedAuthSession,
} from "@/lib/authSessionIsolation";
import { clearSupportSessionIfMismatch } from "@/lib/supportSession";
import { wasLogoutRequestedByUser } from "@/lib/authIntent";
import { tryRecoverSession } from "@/lib/authSessionRecovery";

/**
 * Guard de seguranca contra mistura de contas.
 *
 * REGRAS INVIOLÁVEIS (NÃO QUEBRAR):
 *  - NUNCA chamar supabase.auth.signOut() automaticamente daqui.
 *  - NUNCA limpar tab/cache em SIGNED_OUT sem reconfirmação resiliente
 *    (multi-tentativa + refresh) quando o logout NÃO foi pedido pelo usuário.
 *  - Mismatch de identidade NÃO desloga: apenas higieniza cache local
 *    e emite evento. O fluxo de re-auth do app cuida do resto.
 *  - Sem polling de getSession (race com auto-refresh).
 */
export function AuthSessionGuard() {
  const qc = useQueryClient();
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const hardReset = (reason: string, prev: string | null, next: string | null) => {
      if (import.meta.env.DEV) {
        console.warn("[AUTH_GUARD] Higienizando cache:", reason, { prev, next });
      }
      clearIdentityScopedState();
      try {
        qc.clear();
      } catch {
        /* ignore */
      }
      emitIdentityChanged(prev, next, reason);
    };

    const handleUserId = (newUserId: string | null, eventLabel: string, explicitPrevious?: string | null) => {
      const prev = currentUserIdRef.current;

      if (!newUserId) {
        if (prev) hardReset(`${eventLabel} sem user`, prev, null);
        currentUserIdRef.current = null;
        return;
      }

      const expected = explicitPrevious ?? getTabExpectedUserId();
      if (expected && expected !== newUserId) {
        // Mismatch detectado: bloquear a sessão local divergente. Aceitar a
        // nova identidade automaticamente é justamente o vazamento reportado:
        // a UI pode passar a mostrar B para uma aba que esperava A.
        quarantineMismatchedAuthSession(`${eventLabel} user divergente`, expected, newUserId);
        try { qc.clear(); } catch { /* ignore */ }
        currentUserIdRef.current = null;
        return;
      }

      if (prev && prev !== newUserId) {
        hardReset(`${eventLabel} trocou user`, prev, newUserId);
      }
      clearSupportSessionIfMismatch(newUserId);
      clearUnsafeAuthCache();
      currentUserIdRef.current = newUserId;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        // Se o usuário pediu logout explicitamente, aplica imediatamente.
        if (wasLogoutRequestedByUser()) {
          if (currentUserIdRef.current) hardReset("SIGNED_OUT (intencional)", currentUserIdRef.current, null);
          clearAuthenticatedTab();
          try { qc.clear(); } catch { /* ignore */ }
          currentUserIdRef.current = null;
          return;
        }
        // Sem intenção: NUNCA derruba imediatamente. Tenta recuperar.
        void (async () => {
          const result = await tryRecoverSession();
          if (result.recovered === true) {
            if (import.meta.env.DEV) {
              console.warn("[AUTH_GUARD] SIGNED_OUT espúrio recuperado — sessão preservada");
            }
            return;
          }
          if (result.definitive === false) {
            if (import.meta.env.DEV) {
              console.warn("[AUTH_GUARD] SIGNED_OUT inconclusivo (rede) — preservando sessão");
            }
            return;
          }
          if (currentUserIdRef.current) hardReset("SIGNED_OUT confirmado", currentUserIdRef.current, null);
          clearAuthenticatedTab();
          try { qc.clear(); } catch { /* ignore */ }
          currentUserIdRef.current = null;
        })();
        return;
      }

      if (!session) {
        // INITIAL_SESSION sem sessão: só limpa tab key se realmente não havia
        // usuário antes — evita derrubar refresh em andamento.
        if (event === "INITIAL_SESSION" && !currentUserIdRef.current) {
          clearAuthenticatedTab();
        }
        return;
      }

      const match = ensureSessionMatchesTab(session);
      handleUserId(match.userId, event, match.ok ? undefined : match.expectedUserId);

      if (event === "SIGNED_IN") {
        // SIGNED_IN explícito limpa cache de query para evitar vazamento.
        try { qc.clear(); } catch { /* ignore */ }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [qc]);

  return null;
}
