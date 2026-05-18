export function logAuthDiagnostic(event: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const enabled = import.meta.env.DEV || window.sessionStorage.getItem("yc.auth.debug") === "1";
  if (!enabled) return;
  console.info(`[AUTH_DIAGNOSTIC] ${event}`, payload);
}