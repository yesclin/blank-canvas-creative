import { supabase } from "@/integrations/supabase/client";

const TAB_USER_KEY = "yc.auth.expectedUserId";
const QUARANTINE_KEY = "yc.auth.quarantinedAt";
const VIEW_ROLE_KEY = "yc.viewedRole";
const SUPPORT_CLINIC_KEY = "yesclin_support_clinic_id";
const SUPPORT_SESSION_KEY = "yesclin_support_session_id";
export const SUPPORT_ADMIN_USER_KEY = "yesclin_support_admin_user_id";

/**
 * Chaves legadas/inseguras que NUNCA devem servir como fonte de verdade
 * de identidade. Limpamos no bootstrap e em todo logout para evitar que
 * caches antigos consigam trocar o usuário ativo.
 */
const LEGACY_UNSAFE_KEYS = [
  "currentUser",
  "userProfile",
  "selectedUser",
  "selectedClinicUser",
  "currentRole",
  "userRole",
  "clinicRole",
  "platformRole",
  "profile",
  "authUser",
  "mockUser",
  "demoUser",
  "impersonatedUser",
  "activeUser",
  "activeProfile",
  "selectedClinic",
  "selectedClinicId",
  "activeClinic",
  "activeClinicId",
  "currentClinic",
  "currentClinicId",
  "clinic",
  "clinicId",
  "permissions",
  "userPermissions",
  "currentPermissions",
  "currentProfile",
  "yc.currentUser",
  "yc.profile",
  "yc.role",
  "yc.clinic",
  "yc.clinicId",
  "yc.permissions",
];

export function clearUnsafeAuthCache() {
  if (typeof window === "undefined") return;
  try {
    for (const key of LEGACY_UNSAFE_KEYS) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
    const localAuthKeys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && /^sb-.+-auth-token$/.test(key)) localAuthKeys.push(key);
    }
    localAuthKeys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

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

export function markAuthQuarantined() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(QUARANTINE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function clearAuthQuarantine() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(QUARANTINE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasRecentAuthQuarantine(maxAgeMs = 15_000): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(QUARANTINE_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts) || Date.now() - ts > maxAgeMs) {
      window.sessionStorage.removeItem(QUARANTINE_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function clearIdentityScopedState() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SUPPORT_CLINIC_KEY);
    window.localStorage.removeItem(SUPPORT_SESSION_KEY);
    window.localStorage.removeItem(SUPPORT_ADMIN_USER_KEY);
    window.localStorage.removeItem(VIEW_ROLE_KEY);
    clearUnsafeAuthCache();
    window.dispatchEvent(new CustomEvent("yesclin:support-session-changed"));
  } catch {
    /* ignore */
  }
}

export function clearAuthenticatedTab() {
  setTabExpectedUserId(null);
  clearIdentityScopedState();
}

export function clearSupabaseAuthStorage() {
  if (typeof window === "undefined") return;
  try {
    for (const store of [window.localStorage, window.sessionStorage]) {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (key && /^sb-.+-auth-token$/.test(key)) keys.push(key);
      }
      keys.forEach((key) => store.removeItem(key));
    }
  } catch {
    /* ignore */
  }
}

export function quarantineMismatchedAuthSession(reason: string, expectedUserId: string, receivedUserId: string) {
  console.error("[AUTH_SECURITY] Sessão divergente bloqueada — removendo token local", {
    reason,
    expectedUserId,
    receivedUserId,
  });
  markAuthQuarantined();
  clearAuthenticatedTab();
  clearSupabaseAuthStorage();
  emitIdentityChanged(expectedUserId, null, reason);
  setTimeout(() => {
    void supabase.auth.signOut({ scope: "local" }).catch((error: unknown) => {
      console.error("[AUTH_SECURITY] falha ao encerrar sessão local divergente", error);
    });
  }, 0);
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