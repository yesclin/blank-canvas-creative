/**
 * Returns the public URL of the application.
 * Priorities:
 * 1. VITE_APP_URL env variable (explicit override)
 * 2. window.location.origin (auto-detected from browser)
 * 
 * This ensures production never falls back to localhost.
 */
export function getAppUrl(): string {
  const envUrl = import.meta.env.VITE_APP_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
    // Remove trailing slash
    return envUrl.trim().replace(/\/+$/, "");
  }
  return window.location.origin;
}
