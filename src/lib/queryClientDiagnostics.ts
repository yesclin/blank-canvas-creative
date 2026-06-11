import type { QueryClient } from "@tanstack/react-query";

type CacheMeta = Record<string, unknown>;

export function clearReactQueryCache(queryClient: QueryClient, reason: string, meta: CacheMeta = {}) {
  if (import.meta.env.DEV) {
    console.warn("[RQ_CACHE] clear", { reason, ...meta });
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("yesclin:react-query-cleared", { detail: { reason, ...meta } }));
  }
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