const TAB_USER_KEY = "yc.auth.expectedUserId";
const VIEW_ROLE_KEY = "yc.viewedRole";
const SUPPORT_CLINIC_KEY = "yesclin_support_clinic_id";
const SUPPORT_SESSION_KEY = "yesclin_support_session_id";

type SessionLike = {
  user?: {
    id?: string | null;
    email?: string | null;
  } | null;
} | null | undefined;

export type SessionMatchResult =
  | { ok: true; userId: string | null; expectedUserId: string | null }
  | { ok: false; userId: string; expectedUserId: string };

export function getSessionUserId(session: SessionLike): string | null {
  return session?.user?.id ?? null;
}

export function getTabExpectedUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(TAB_USER_KEY);
  } catch {
    return null;
  }
}

export function setTabExpectedUserId(userId: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (userId) {
      window.sessionStorage.setItem(TAB_USER_KEY, userId);
    } else {
      window.sessionStorage.removeItem(TAB_USER_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function clearIdentityScopedState() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SUPPORT_CLINIC_KEY);
    window.localStorage.removeItem(SUPPORT_SESSION_KEY);
    window.localStorage.removeItem(VIEW_ROLE_KEY);
    window.dispatchEvent(new CustomEvent("yesclin:support-session-changed"));
  } catch {
    /* ignore */
  }
}

export function clearAuthenticatedTab() {
  setTabExpectedUserId(null);
  clearIdentityScopedState();
}

export function rememberAuthenticatedUser(userId: string | null | undefined) {
  if (userId) setTabExpectedUserId(userId);
}

export function ensureSessionMatchesTab(session: SessionLike): SessionMatchResult {
  const userId = getSessionUserId(session);
  const expectedUserId = getTabExpectedUserId();

  if (!userId) {
    setTabExpectedUserId(null);
    return { ok: true, userId: null, expectedUserId };
  }

  if (expectedUserId && expectedUserId !== userId) {
    return { ok: false, userId, expectedUserId };
  }

  if (!expectedUserId) {
    setTabExpectedUserId(userId);
  }

  return { ok: true, userId, expectedUserId: expectedUserId ?? userId };
}

export function emitIdentityChanged(prev: string | null, next: string | null, reason: string) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent("yesclin:identity-changed", { detail: { prev, next, reason } })
    );
  } catch {
    /* ignore */
  }
}