import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Catch-all route. Em vez de exibir uma tela 404 dura, redireciona com base
 * no estado de autenticação:
 *  - Se autenticado: vai para /app
 *  - Se não autenticado: vai para /login
 *
 * Mantém uma tela de transição amigável enquanto verifica a sessão para
 * evitar flash de conteúdo ou loop de redirecionamento.
 */
const NotFound = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    console.warn(
      "[NotFound] Rota não encontrada, redirecionando:",
      location.pathname,
    );

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setIsAuthed(Boolean(data.session));
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Redirecionando…</p>
        </div>
      </div>
    );
  }

  return <Navigate to={isAuthed ? "/app" : "/login"} replace />;
};

export default NotFound;
