import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AppLoadingFallback } from "./AppLoadingFallback";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";

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
  const { userId, isLoading } = useAuthIdentity();

  if (isLoading) {
    return <AppLoadingFallback message="Carregando autenticação..." />;
  }

  // Se estamos offline e já estávamos autenticados, não redirecionar para
  // /login — apenas manter a tela atual. Quando voltar a rede, o supabase
  // refaz refresh sem perder a sessão.
  if (!userId) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
