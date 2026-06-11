export function logAuthDiagnostic(event: string, payload: Record<string, unknown>) {
  if (!import.meta.env.DEV || typeof window === "undefined") return;
  console.info(`[AUTH_DIAGNOSTIC] ${event}`, payload);
}