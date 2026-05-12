import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLoadingFallback } from "./AppLoadingFallback";
import { withTimeout } from "@/lib/asyncTimeout";
import { clearAuthenticatedTab, ensureSessionMatchesTab } from "@/lib/authSessionIsolation";

type RequireAuthProps = {
  children: ReactNode;
};

/**
 * Garante que nenhuma rota autenticada renderize sem sessão.
 *
 * Regras de ouro (NÃO QUEBRAR):
 *  1. Registrar `onAuthStateChange` ANTES de chamar `getSession()`.
 *     Caso contrário perdemos o evento `INITIAL_SESSION` e o usuário pode ser
 *     redirecionado para /login com a sessão já válida no storage.
 *  2. Nunca redirecionar enquanto `isLoading` for `true`.
 *  3. Nunca chamar `signOut()` aqui — só leitura de sessão.
 *  4. Watchdog de 8s: se `getSession()` travar, libera o gate como "sem sessão"
 *     em vez de deixar o app preso em "Carregando autenticação...".
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    let mismatchHandled = false;

    const rejectMismatchedSession = (source: string, userId: string, expectedUserId: string) => {
      if (mismatchHandled) return;
      mismatchHandled = true;
      console.error("[AUTH_SECURITY] Sessão de outro usuário bloqueada", {
        source,
        expectedUserId,
        receivedUserId: userId,
      });
      clearAuthenticatedTab();
      setIsAuthed(false);
      setIsLoading(false);
      setTimeout(() => {
        void supabase.auth.signOut();
      }, 0);
    };

    const acceptSession = (session: unknown, source: string) => {
      const match = ensureSessionMatchesTab(session as any);
      if (!match.ok) {
        rejectMismatchedSession(source, match.userId, match.expectedUserId);
        return false;
      }
      setIsAuthed(Boolean(match.userId));
      setIsLoading(false);
      return true;
    };

    // 1) Listener PRIMEIRO. O Supabase dispara INITIAL_SESSION assim que
    //    a sessão é hidratada do storage — esse é o caminho mais confiável
    //    para saber se o usuário está logado.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (import.meta.env.DEV) {
        console.log("[AUTH] event", event, { hasSession: Boolean(session) });
      }
      // CRÍTICO: só desautenticar em SIGNED_OUT explícito.
      // Eventos como TOKEN_REFRESHED/USER_UPDATED podem chegar com session=null
      // em falhas transitórias de refresh — nesses casos, mantemos o usuário
      // logado e deixamos o Supabase tentar renovar novamente, em vez de
      // redirecionar para /login (causando o "desloga sozinho").
      if (event === "SIGNED_OUT") {
        clearAuthenticatedTab();
        setIsAuthed(false);
        setIsLoading(false);
        return;
      }
      if (session) {
        acceptSession(session, event);
      } else if (event === "INITIAL_SESSION") {
        // Único caso onde session=null sem SIGNED_OUT é decisivo:
        // o storage realmente não tem sessão na inicialização.
        clearAuthenticatedTab();
        setIsAuthed(false);
        setIsLoading(false);
      }
      // Demais eventos com session=null: ignorar (não derrubar o usuário).
    });

    // 2) Buscar sessão atual (cobre o caso de o listener não disparar
    //    INITIAL_SESSION ou de já estarmos autenticados antes do mount).
    (async () => {
      try {
        const { data } = await withTimeout<{ data: { session: unknown | null } }>(
          supabase.auth.getSession(),
          8000,
          "Tempo esgotado ao carregar autenticação."
        );
        if (!mounted) return;
        if (import.meta.env.DEV) {
          console.log("[AUTH] getSession", { hasSession: Boolean(data.session) });
        }
        acceptSession(data.session, "getSession");
      } catch (error) {
        // Importante: NÃO marcar como autenticado nem deslogar.
        // Apenas liberar o gate para que o redirect aconteça normalmente.
        console.error("[AUTH_ERROR] getSession falhou", error);
        if (!mounted) return;
        setIsLoading(false);
      }
    })();

    // 3) Watchdog: se nada resolveu em 8s, liberar o gate.
    const watchdog = window.setTimeout(() => {
      if (!mounted) return;
      setIsLoading((prev) => {
        if (!prev) return prev;
        console.error("[AUTH_TIMEOUT] RequireAuth liberando gate por timeout");
        return false;
      });
    }, 8000);

    return () => {
      mounted = false;
      window.clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <AppLoadingFallback message="Carregando autenticação..." />;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
