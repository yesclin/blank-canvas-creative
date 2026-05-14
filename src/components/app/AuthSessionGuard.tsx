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
} from "@/lib/authSessionIsolation";
import { clearSupportSessionIfMismatch } from "@/lib/supportSession";
import { wasLogoutRequestedByUser } from "@/lib/authIntent";

/**
 * Guard de seguranca contra mistura de contas.
 *
 * Regras:
 * - SIGNED_OUT  -> limpa cache + modo suporte; reseta ref.
 * - SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED / INITIAL_SESSION:
 *     Se o user.id atual difere do anterior conhecido (e havia um anterior),
 *     limpa cache + modo suporte e dispara evento global de troca de identidade.
 * - Tambem checa periodicamente (a cada 30s) a sessao real no Supabase para
 *   detectar mudancas vindas de outras abas que nao dispararam evento.
 *
 * Nunca redireciona, nunca faz signOut. So higieniza estado local.
 */
export function AuthSessionGuard() {
  const qc = useQueryClient();
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const hardReset = (reason: string, prev: string | null, next: string | null) => {
      console.warn("[AUTH_GUARD] Higienizando cache:", reason, { prev, next });
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
        console.error("[AUTH_SECURITY] Troca inesperada de usuário detectada; sessão será encerrada", {
          eventLabel,
          expectedUserId: expected,
          receivedUserId: newUserId,
        });
        hardReset(`${eventLabel} user divergente`, expected, null);
        clearAuthenticatedTab();
        setTimeout(() => {
          void supabase.auth.signOut();
        }, 0);
        currentUserIdRef.current = null;
        return;
      }

      if (prev && prev !== newUserId) {
        hardReset(`${eventLabel} trocou user`, prev, newUserId);
      }
      // Sempre que sabemos quem é o usuário ativo, garantimos que a sessão
      // de suporte (impersonação leve) não pertence a outro usuário.
      clearSupportSessionIfMismatch(newUserId);
      clearUnsafeAuthCache();
      currentUserIdRef.current = newUserId;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        if (currentUserIdRef.current) hardReset("SIGNED_OUT", currentUserIdRef.current, null);
        clearAuthenticatedTab();
        try { qc.clear(); } catch { /* ignore */ }
        currentUserIdRef.current = null;
        return;
      }

      if (!session) {
        if (event === "INITIAL_SESSION") {
          clearAuthenticatedTab();
          handleUserId(null, event);
        }
        return;
      }

      const match = ensureSessionMatchesTab(session);

      if (!match.ok) {
        handleUserId(match.userId, event, match.expectedUserId);
        return;
      }

      // SIGNED_IN explícito sempre limpa o cache do React Query, mesmo
      // quando prev === new — garante que nenhum dado de qualquer usuário
      // anterior (ex.: logout/login na mesma aba) consiga sobreviver.
      if (event === "SIGNED_IN") {
        try { qc.clear(); } catch { /* ignore */ }
      }

      handleUserId(match.userId, event);
    });

    // Polling defensivo: detecta troca de sessao silenciosa entre abas.
    const pollId = window.setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const match = ensureSessionMatchesTab(session);
        if (match.ok) {
          handleUserId(match.userId, "POLL");
        } else {
          handleUserId(match.userId, "POLL", match.expectedUserId);
        }
      } catch {
        /* ignore */
      }
    }, 30000);

    return () => {
      subscription.unsubscribe();
      window.clearInterval(pollId);
    };
  }, [qc]);

  return null;
}
