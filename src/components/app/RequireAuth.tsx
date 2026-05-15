import { ReactNode, useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLoadingFallback } from "./AppLoadingFallback";
import { withTimeout } from "@/lib/asyncTimeout";
import { clearAuthenticatedTab, ensureSessionMatchesTab } from "@/lib/authSessionIsolation";
import { wasLogoutRequestedByUser, clearLogoutIntent } from "@/lib/authIntent";
import { tryRecoverSession } from "@/lib/authSessionRecovery";

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
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine === false : false,
  );
  const isAuthedRef = useRef(false);

  // Track online/offline. NUNCA derruba sessão — apenas evita redirecionar
  // para /login enquanto o navegador está sem rede.
  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let mismatchHandled = false;

    const rejectMismatchedSession = (source: string, userId: string, expectedUserId: string) => {
      // Mismatch de identidade NÃO desloga automaticamente. Apenas registra
      // e aceita a nova identidade real — o app irá re-renderizar com ela.
      // Logout só deve ocorrer por ação explícita do usuário.
      if (mismatchHandled) return;
      mismatchHandled = true;
      console.warn("[AUTH_SECURITY] Identidade divergente em RequireAuth — preservando sessão atual", {
        source,
        expectedUserId,
        receivedUserId: userId,
      });
      try {
        window.sessionStorage.setItem("yc.auth.expectedUserId", userId);
      } catch { /* ignore */ }
      isAuthedRef.current = Boolean(userId);
      setIsAuthed(Boolean(userId));
      setIsLoading(false);
    };

    const acceptSession = (session: unknown, source: string) => {
      const match = ensureSessionMatchesTab(session as any);
      if (!match.ok) {
        rejectMismatchedSession(source, match.userId, match.expectedUserId);
        return false;
      }
      const authed = Boolean(match.userId);
      isAuthedRef.current = authed;
      setIsAuthed(authed);
      setIsLoading(false);
      return true;
    };

    /**
     * Confirma um SIGNED_OUT espúrio. Quando o evento NÃO foi disparado por
     * uma ação do usuário (clique em Sair, trial expirado, etc.), revalida
     * com getSession antes de aceitar o logout — evita derrubar o usuário
     * por falha transitória de refresh ou oscilação de rede.
     */
    const confirmSignedOutOrRevert = async (event: string) => {
      if (wasLogoutRequestedByUser()) {
        clearLogoutIntent();
        clearAuthenticatedTab();
        isAuthedRef.current = false;
        setIsAuthed(false);
        setIsLoading(false);
        return;
      }
      // Sem intenção: não confiar cegamente. Tentar reconfirmar.
      try {
        // Pequeno delay permite que o supabase termine o ciclo interno antes
        // de reler a sessão (evita ler estado intermediário).
        await new Promise((r) => setTimeout(r, 250));
        const { data } = await withTimeout<{ data: { session: any | null } }>(
          supabase.auth.getSession(),
          5000,
          "getSession reconfirmação",
        );
        if (!mounted) return;
        if (data?.session) {
          if (import.meta.env.DEV) {
            console.warn("[AUTH] SIGNED_OUT espúrio ignorado — sessão ainda válida", { event });
          }
          acceptSession(data.session, `${event}-reconfirm`);
          return;
        }
        // Sessão realmente perdida.
        if (import.meta.env.DEV) {
          console.log("[AUTH] SIGNED_OUT confirmado após reconfirmação", { event });
        }
        clearAuthenticatedTab();
        isAuthedRef.current = false;
        setIsAuthed(false);
        setIsLoading(false);
      } catch (err) {
        // Falha de rede ao reconfirmar: NÃO derrubar usuário.
        // Mantemos isAuthed atual e deixamos o próximo evento decidir.
        if (import.meta.env.DEV) {
          console.warn("[AUTH] Falha ao reconfirmar SIGNED_OUT — mantendo estado atual", err);
        }
      }
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

      if (event === "SIGNED_OUT") {
        // Não chamar await dentro do listener (deadlock). Disparar async fora.
        void confirmSignedOutOrRevert(event);
        return;
      }

      if (session) {
        acceptSession(session, event);
        return;
      }

      // session=null sem SIGNED_OUT:
      //  - INITIAL_SESSION: storage realmente vazio, é decisivo SOMENTE se
      //    estamos online. Se offline, aguardamos voltar a internet.
      if (event === "INITIAL_SESSION") {
        if (typeof navigator !== "undefined" && navigator.onLine === false) {
          if (import.meta.env.DEV) {
            console.warn("[AUTH] INITIAL_SESSION null offline — aguardando rede");
          }
          // Mantemos isLoading=true; o watchdog libera se necessário.
          return;
        }
        clearAuthenticatedTab();
        isAuthedRef.current = false;
        setIsAuthed(false);
        setIsLoading(false);
        return;
      }
      // TOKEN_REFRESHED/USER_UPDATED com session=null = falha transitória;
      // ignorar para não derrubar o usuário.
    });

    // 2) Buscar sessão atual SOMENTE como sinal POSITIVO.
    (async () => {
      try {
        const { data } = await withTimeout<{ data: { session: any | null } }>(
          supabase.auth.getSession(),
          8000,
          "Tempo esgotado ao carregar autenticação.",
        );
        if (!mounted) return;
        if (import.meta.env.DEV) {
          console.log("[AUTH] getSession", { hasSession: Boolean(data.session) });
        }
        if (data.session) {
          acceptSession(data.session, "getSession");
        }
        // session null => aguarda listener; não muda isAuthed.
      } catch (error) {
        // Importante: NÃO marcar como autenticado nem deslogar.
        console.error("[AUTH_ERROR] getSession falhou", error);
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

  // Se estamos offline e já estávamos autenticados, não redirecionar para
  // /login — apenas manter a tela atual. Quando voltar a rede, o supabase
  // refaz refresh sem perder a sessão.
  if (!isAuthed && isOffline && isAuthedRef.current) {
    return <AppLoadingFallback message="Sem conexão. Reconectando..." />;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
