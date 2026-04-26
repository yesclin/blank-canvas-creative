/**
 * Analytics module — LGPD-friendly consent registry.
 *
 * PostHog is intentionally disabled at runtime for now. The app must never
 * import or initialize third-party analytics during boot, because a failing
 * analytics bundle can leave React in a blank-screen state before an
 * ErrorBoundary can recover.
 *
 * Consent is still stored so analytics can be re-enabled later behind a safe
 * feature flag/server-side configuration without changing the UI contract.
 */

export const CONSENT_KEY = "yc_analytics_consent_v1";
export type ConsentValue = "granted" | "denied" | null;

type AnalyticsEventDetail = {
  type: "consent" | "track" | "bootstrap" | "disable";
  value?: ConsentValue;
  event?: string;
};

function emitAnalyticsEvent(detail: AnalyticsEventDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("yc-analytics-event", { detail }));
}

export function getConsent(): ConsentValue {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage?.getItem(CONSENT_KEY);
    if (value === "granted" || value === "denied") return value;
  } catch {
    return null;
  }

  return null;
}

export function setConsent(value: Exclude<ConsentValue, null>): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage?.setItem(CONSENT_KEY, value);
  } catch {
    // Consent storage is best-effort; never block the application.
  }

  window.dispatchEvent(new CustomEvent("yc-consent-change", { detail: value }));
  emitAnalyticsEvent({ type: "consent", value });

  if (value === "denied") {
    disableAnalytics();
  }
}

export async function enableAnalytics(): Promise<void> {
  emitAnalyticsEvent({ type: "bootstrap" });
  // PostHog disabled by design until the integration is verified safe.
  return;
}

export function disableAnalytics(): void {
  emitAnalyticsEvent({ type: "disable" });

  if (typeof document === "undefined") return;

  try {
    document.cookie
      .split(";")
      .map((cookie) => cookie.trim().split("=")[0])
      .filter((name) => name.startsWith("ph_") || name.startsWith("__ph"))
      .forEach((name) => {
        document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });
  } catch {
    // Cookie cleanup is best-effort.
  }
}

export function track(event: string, _props?: Record<string, unknown>): void {
  emitAnalyticsEvent({ type: "track", event });
  // No-op while PostHog is disabled.
}

export function bootstrapAnalytics(): void {
  emitAnalyticsEvent({ type: "bootstrap" });
  // No-op while PostHog is disabled.
}
