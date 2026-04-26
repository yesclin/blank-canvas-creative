/**
 * Analytics module — PostHog with LGPD-friendly consent gating.
 *
 * Rules:
 * - PostHog is ONLY loaded after explicit user consent.
 * - Consent decision is persisted in localStorage under CONSENT_KEY.
 * - Revoking consent disables PostHog and clears its identifiers.
 * - If the env vars are missing, all calls are no-ops (safe in dev).
 */

export const CONSENT_KEY = "yc_analytics_consent_v1";
export type ConsentValue = "granted" | "denied" | null;

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ??
  "https://us.i.posthog.com";

let initPromise: Promise<void> | null = null;
let posthogRef: typeof import("posthog-js").default | null = null;

export function getConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(CONSENT_KEY);
  if (v === "granted" || v === "denied") return v;
  return null;
}

export function setConsent(value: Exclude<ConsentValue, null>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent("yc-consent-change", { detail: value }));

  if (value === "granted") {
    void enableAnalytics();
  } else {
    disableAnalytics();
  }
}

export async function enableAnalytics(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY) return; // No key configured — silently skip.
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const mod = await import("posthog-js");
    const posthog = mod.default;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: "localStorage+cookie",
      autocapture: false,
    });
    posthogRef = posthog;
  })();

  return initPromise;
}

export function disableAnalytics(): void {
  if (posthogRef) {
    try {
      posthogRef.opt_out_capturing();
      posthogRef.reset();
    } catch {
      // ignore
    }
  }
  // Best-effort: drop posthog cookies if they were created
  if (typeof document !== "undefined") {
    document.cookie
      .split(";")
      .map((c) => c.trim().split("=")[0])
      .filter((name) => name.startsWith("ph_") || name.startsWith("__ph"))
      .forEach((name) => {
        document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });
  }
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (getConsent() !== "granted") return;
  if (!posthogRef) return;
  try {
    posthogRef.capture(event, props);
  } catch {
    // ignore
  }
}

/**
 * Bootstraps analytics on app start: only loads PostHog if the user
 * already granted consent in a previous session.
 */
export function bootstrapAnalytics(): void {
  if (getConsent() === "granted") {
    void enableAnalytics();
  }
}
