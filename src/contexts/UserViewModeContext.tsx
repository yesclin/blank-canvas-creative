import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type ViewableRole = "owner" | "admin" | "profissional" | "recepcionista";

const STORAGE_KEY = "yc.viewedRole";

interface UserViewModeContextType {
  /** Real role from the database (never changes via UI) */
  realRole: ViewableRole | null;
  /** The role currently being simulated. Falls back to realRole. */
  viewedRole: ViewableRole | null;
  /** True when the user is simulating a role different from their real one */
  isImpersonating: boolean;
  /** Whether the current real user is allowed to switch view roles (owner only) */
  canSwitchView: boolean;
  setViewedRole: (role: ViewableRole) => void;
  resetViewedRole: () => void;
}

const UserViewModeContext = createContext<UserViewModeContextType | null>(null);

interface ProviderProps {
  children: ReactNode;
  realRole: ViewableRole | null;
  userId: string | null;
}

export function UserViewModeProvider({ children, realRole, userId }: ProviderProps) {
  const [viewedRoleState, setViewedRoleState] = useState<ViewableRole | null>(null);

  // Only owner can switch view
  const canSwitchView = realRole === "owner";

  // Load persisted viewed role on mount / when realRole resolves
  useEffect(() => {
    if (!realRole || !userId) {
      setViewedRoleState(null);
      return;
    }
    if (realRole !== "owner") {
      // Non-owners always view as themselves; clear any leftover storage
      localStorage.removeItem(STORAGE_KEY);
      setViewedRoleState(null);
      return;
    }
    try {
      const storedRaw = sessionStorage.getItem(STORAGE_KEY);
      const stored = storedRaw?.startsWith(`${userId}:`)
        ? (storedRaw.slice(userId.length + 1) as ViewableRole)
        : null;
      if (stored && ["owner", "admin", "profissional", "recepcionista"].includes(stored)) {
        setViewedRoleState(stored === "owner" ? null : stored);
      } else if (storedRaw) {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [realRole, userId]);

  // Listen for explicit signout to clear simulation
  useEffect(() => {
    const handler = () => {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
      setViewedRoleState(null);
    };
    window.addEventListener("yc:signout", handler);
    return () => window.removeEventListener("yc:signout", handler);
  }, []);

  const setViewedRole = useCallback(
    (role: ViewableRole) => {
      if (!canSwitchView || !userId) return;
      try {
        if (role === "owner") {
          sessionStorage.removeItem(STORAGE_KEY);
        } else {
          sessionStorage.setItem(STORAGE_KEY, `${userId}:${role}`);
        }
      } catch {}
      setViewedRoleState(role === "owner" ? null : role);
    },
    [canSwitchView, userId]
  );

  const resetViewedRole = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    setViewedRoleState(null);
  }, []);

  const effectiveViewedRole = viewedRoleState ?? realRole;
  const isImpersonating = !!viewedRoleState && viewedRoleState !== realRole;

  return (
    <UserViewModeContext.Provider
      value={{
        realRole,
        viewedRole: effectiveViewedRole,
        isImpersonating,
        canSwitchView,
        setViewedRole,
        resetViewedRole,
      }}
    >
      {children}
    </UserViewModeContext.Provider>
  );
}

export function useCurrentViewRole() {
  const ctx = useContext(UserViewModeContext);
  if (!ctx) {
    // Safe defaults if used outside the provider (shouldn't happen in app shell)
    return {
      realRole: null,
      viewedRole: null,
      isImpersonating: false,
      canSwitchView: false,
      setViewedRole: () => {},
      resetViewedRole: () => {},
    } as UserViewModeContextType;
  }
  return ctx;
}
