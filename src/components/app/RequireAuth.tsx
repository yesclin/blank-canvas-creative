import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLoadingFallback } from "./AppLoadingFallback";
import { withTimeout } from "@/lib/asyncTimeout";

type RequireAuthProps = {
  children: ReactNode;
};

/**
 * Garante que nenhuma rota autenticada renderize sem sessão.
 * Enquanto carrega, renderiza um estado neutro (evita "piscar" rota sem layout).
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          15000,
          "Tempo esgotado ao carregar autenticação."
        );
        if (!mounted) return;
        console.log("[AUTH] carregado", { authenticated: Boolean(data.session) });
        setIsAuthed(Boolean(data.session));
      } catch (error) {
        console.error("[APP_ERROR]", error);
        if (mounted) setIsAuthed(false);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsAuthed(Boolean(session));
      setIsLoading(false);
    });

    return () => {
      mounted = false;
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
