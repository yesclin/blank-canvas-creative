/**
 * Central CORS helper for all YESCLIN Edge Functions.
 *
 * Rules:
 *  - Browser-facing functions echo back the caller's origin ONLY when it is in
 *    the allowlist. Unknown origins get the canonical production origin, so the
 *    browser blocks the response (no wildcard, no credentials leak).
 *  - Server-to-server functions (cron, workers, provider webhooks) do NOT grant
 *    any browser CORS access — use `NO_CORS_HEADERS`.
 */

/** Exact origins allowed in every environment (production + local dev). */
export const ALLOWED_EXACT_ORIGINS: string[] = [
  "https://yesclin.com.br",
  "https://www.yesclin.com.br",
  "https://yesclin.com",
  "https://www.yesclin.com",
  "https://yesclin.lovable.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
];

/**
 * Controlled preview/subdomain patterns. Anchored full-match only — no
 * substring matching, no broad wildcards.
 */
export const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/i,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i,
  /^https:\/\/[a-z0-9-]+\.lovable\.dev$/i,
  /^https:\/\/[a-z0-9-]+\.yesclin\.com$/i,
  /^https:\/\/[a-z0-9-]+\.yesclin\.com\.br$/i,
];

export const ALLOWED_REQUEST_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (ALLOWED_EXACT_ORIGINS.includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

export interface CorsOptions {
  /** Allowed methods, e.g. "POST, OPTIONS". Defaults to "POST, OPTIONS". */
  methods?: string;
  /** Extra request headers to allow, appended to the standard list. */
  extraHeaders?: string[];
}

/** Per-request CORS headers for browser-facing functions. */
export function getCorsHeaders(
  req: Request,
  options: CorsOptions = {},
): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_EXACT_ORIGINS[0];
  const headers = options.extraHeaders?.length
    ? `${ALLOWED_REQUEST_HEADERS}, ${options.extraHeaders.join(", ")}`
    : ALLOWED_REQUEST_HEADERS;

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": headers,
    "Access-Control-Allow-Methods": options.methods ?? "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

/**
 * Headers for server-to-server functions (cron/worker/provider webhooks).
 * Intentionally grants no browser access — CORS is not their security boundary,
 * their own secret/signature validation is.
 */
export const NO_CORS_HEADERS: Record<string, string> = {
  "Vary": "Origin",
};
