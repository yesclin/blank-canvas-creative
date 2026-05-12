import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    const clearSupportSession = () => {
      try {
        window.localStorage.removeItem("yesclin_support_clinic_id");
        window.localStorage.removeItem("yesclin_support_session_id");
        window.dispatchEvent(new CustomEvent("yesclin:support-session-changed"));
      } catch {
        /* ignore */
      }
    };

    const hardReset = (reason: string, prev: string | null, next: string | null) => {
      console.warn("[AUTH_GUARD] Higienizando cache:", reason, { prev, next });
      clearSupportSession();
      try {
        qc.clear();
      } catch {
        /* ignore */
      }
      try {
        window.dispatchEvent(
          new CustomEvent("yesclin:identity-changed", { detail: { prev, next } })
        );
      } catch {
        /* ignore */
      }
    };

    const handleUserId = (newUserId: string | null, eventLabel: string) => {
      const prev = currentUserIdRef.current;

      if (!newUserId) {
        if (prev) hardReset(`${eventLabel} sem user`, prev, null);
        currentUserIdRef.current = null;
        return;
      }

      if (prev && prev !== newUserId) {
        hardReset(`${eventLabel} trocou user`, prev, newUserId);
      }
      currentUserIdRef.current = newUserId;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id ?? null;

      if (event === "SIGNED_OUT") {
        if (currentUserIdRef.current) hardReset("SIGNED_OUT", currentUserIdRef.current, null);
        currentUserIdRef.current = null;
        return;
      }

      // INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, etc.
      handleUserId(newUserId, event);
    });

    // Polling defensivo: detecta troca de sessao silenciosa entre abas.
    const pollId = window.setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        handleUserId(session?.user?.id ?? null, "POLL");
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
