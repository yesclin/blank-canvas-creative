import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Guard de seguranca contra mistura de contas.
 *
 * - No SIGNED_OUT: limpa queryClient + chaves de modo suporte.
 * - No SIGNED_IN com user.id diferente do anterior: limpa queryClient + modo
 *   suporte, evitando que dados em cache de outro usuario vazem para a nova
 *   sessao na mesma aba.
 * - No INITIAL_SESSION: apenas registra o user.id ativo (sem limpar).
 *
 * NAO faz signOut, NAO redireciona, NAO bloqueia render. So higieniza cache.
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id ?? null;
      const prevUserId = currentUserIdRef.current;

      if (event === "INITIAL_SESSION") {
        currentUserIdRef.current = newUserId;
        return;
      }

      if (event === "SIGNED_OUT") {
        if (import.meta.env.DEV) console.log("[AUTH_GUARD] SIGNED_OUT - limpando cache");
        currentUserIdRef.current = null;
        clearSupportSession();
        qc.clear();
        return;
      }

      if (event === "SIGNED_IN") {
        // Trocou de usuario na mesma aba -> higienizar tudo.
        if (prevUserId && newUserId && prevUserId !== newUserId) {
          console.warn("[AUTH_GUARD] Troca de usuario detectada - limpando cache", {
            prev: prevUserId,
            next: newUserId,
          });
          clearSupportSession();
          qc.clear();
        }
        currentUserIdRef.current = newUserId;
      }
    });

    return () => subscription.unsubscribe();
  }, [qc]);

  return null;
}
