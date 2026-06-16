/**
 * useClinicContext / getCachedClinicContext
 * --------------------------------------------------
 * Camada de acesso ao escopo da clínica ativa SEM chamar
 * `supabase.auth.getUser()` em cada ação.
 *
 * Antes: cada hook tinha um `getClinicId()` local que disparava
 * `supabase.auth.getUser()` (round-trip ao servidor de Auth) seguido de uma
 * query a `profiles`. Em uma navegação típica isso somava centenas de chamadas
 * redundantes, atrasando todo clique e consumindo quota de Auth/Edge Functions.
 *
 * Agora: o `AuthIdentityProvider` valida o `userId` UMA vez por sessão e o
 * `useActiveClinicScope` resolve `{ userId, clinicId, role }` com cache de
 * 5 minutos. Hooks consomem essa fonte em vez de revalidar a cada chamada.
 *
 * - `useClinicContext()`     → para uso dentro de componentes/hooks (queries).
 * - `getCachedClinicContext()` → versão imperativa para mutations / utilitários.
 */
import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useActiveClinicScope, type ActiveClinicScope } from "@/hooks/useActiveClinicScope";

export interface ClinicContext {
  userId: string;
  clinicId: string;
  role: ActiveClinicScope["role"];
}

let latestScopeRef: ActiveClinicScope | null = null;

/** Lê o escopo já resolvido pelo `AuthIdentityProvider` + `useActiveClinicScope`. */
export function useClinicContext() {
  const { scope, isLoading, isReady, error } = useActiveClinicScope();
  // Mantém uma referência viva para o helper imperativo.
  useEffect(() => {
    if (scope.userId && scope.clinicId) latestScopeRef = scope;
  }, [scope]);
  return {
    userId: scope.userId,
    clinicId: scope.clinicId,
    role: scope.role,
    isLoading,
    isReady,
    error,
  };
}

/**
 * Versão imperativa para mutations e utilitários que não podem usar hooks.
 *
 * Não faz chamada de rede. Lê primeiro do snapshot do `useClinicContext` e,
 * como fallback, do cache do React Query (`active-clinic-scope`).
 * Lança erro claro se o app ainda não terminou o login.
 */
export function getCachedClinicContext(queryClient: QueryClient): ClinicContext {
  if (latestScopeRef?.userId && latestScopeRef?.clinicId) {
    return {
      userId: latestScopeRef.userId,
      clinicId: latestScopeRef.clinicId,
      role: latestScopeRef.role,
    };
  }
  const entries = queryClient.getQueriesData<ActiveClinicScope>({ queryKey: ["active-clinic-scope"] });
  for (const [, data] of entries) {
    if (data?.userId && data?.clinicId) {
      latestScopeRef = data;
      return { userId: data.userId, clinicId: data.clinicId, role: data.role };
    }
  }
  throw new Error("Contexto de clínica não inicializado. Faça login novamente.");
}

/** Atualiza manualmente o snapshot (usado pelo prefetch pós-login). */
export function primeClinicContext(scope: ActiveClinicScope) {
  if (scope.userId && scope.clinicId) latestScopeRef = scope;
}
