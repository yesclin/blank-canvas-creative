import type { QueryClient } from "@tanstack/react-query";

type CacheMeta = Record<string, unknown>;

export function clearReactQueryCache(queryClient: QueryClient, reason: string, meta: CacheMeta = {}) {
  // Defesa em profundidade: só fazer reset global do cache em eventos REAIS
  // de troca de identidade / logout / mismatch. Refresh de token, INITIAL_SESSION
  // com o mesmo user e re-validações de getUser NÃO devem disparar reset —
  // isso causava o "segundo loading" ~1s após cada navegação.
  const allowed = /logout|mismatch|switch|signed_out|intentional|trocou user/i;
  if (!allowed.test(reason)) {
    if (import.meta.env.DEV) {
      console.log("[DOUBLE_LOAD_DEBUG] clearReactQueryCache IGNORADO", { reason, ...meta });
    }
    return;
  }
  if (import.meta.env.DEV) {
    console.warn("[RQ_CACHE] clear", { reason, ...meta });
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("yesclin:react-query-cleared", { detail: { reason, ...meta } }));
  }
  queryClient.cancelQueries();
  queryClient.removeQueries({ type: "inactive" });
  queryClient.resetQueries({ type: "active" });
}

export function hardClearReactQueryCache(queryClient: QueryClient, reason: string, meta: CacheMeta = {}) {
  if (import.meta.env.DEV) {
    console.warn("[RQ_CACHE] hard-clear", { reason, ...meta });
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("yesclin:react-query-cleared", { detail: { reason, ...meta, hard: true } }));
  }
  queryClient.cancelQueries();
  queryClient.removeQueries();
}

export function logReactQueryEvent(event: unknown) {
  if (!import.meta.env.DEV || typeof window === "undefined") return;
  const lastEvent = window.__ycLastEvent ?? "unknown";
  if (!lastEvent.startsWith("click") && !lastEvent.startsWith("keydown") && !lastEvent.startsWith("popstate")) return;

  const payload = event as { type?: string; query?: { queryKey?: unknown; state?: { status?: string; fetchStatus?: string } } };
  if (!payload.query?.queryKey) return;

  console.log("[RQ_QUERY] evento após interação", {
    type: payload.type,
    queryKey: payload.query.queryKey,
    status: payload.query.state?.status,
    fetchStatus: payload.query.state?.fetchStatus,
    lastEvent,
  });
}

/**
 * Loga refetches "tardios" — disparados DEPOIS da tela já ter renderizado.
 * Útil para identificar qual query/provider está causando flicker pós-load.
 *
 * Janela: marcamos o início de cada rota em `(window as Window & { __ycRouteRenderedAt?: number }).__ycRouteRenderedAt` (em
 * `RouteFreshnessMarker`). Qualquer query que entre em `fetching` mais de
 * `LATE_THRESHOLD_MS` depois disso é considerada tardia.
 */
const LATE_THRESHOLD_MS = 500;
export function logLateRefetch(event: unknown) {
  if (!import.meta.env.DEV || typeof window === "undefined") return;
  const payload = event as { type?: string; query?: { queryKey?: unknown; state?: { fetchStatus?: string } } };
  if (payload.type !== "updated") return;
  if (payload.query?.state?.fetchStatus !== "fetching") return;
  const renderedAt = (window as Window & { __ycRouteRenderedAt?: number }).__ycRouteRenderedAt;
  if (!renderedAt) return;
  const elapsed = performance.now() - renderedAt;
  if (elapsed < LATE_THRESHOLD_MS) return;
  console.warn("[LATE_REFETCH] query refetched após render", {
    elapsedMs: Math.round(elapsed),
    queryKey: payload.query?.queryKey,
    route: window.location.pathname,
  });
}
