import { ReactNode } from "react";
import { UserViewModeProvider, ViewableRole } from "@/contexts/UserViewModeContext";
import { useActiveClinicScope } from "@/hooks/useActiveClinicScope";

/**
 * Resolves the authenticated user's real role from `user_roles` and exposes it
 * to UserViewModeProvider so the rest of the app (PermissionsProvider) can
 * react to the simulated view-role.
 */
export function UserViewModeBootstrap({ children }: { children: ReactNode }) {
  const { scope } = useActiveClinicScope();
  return <UserViewModeProvider realRole={(scope.role as ViewableRole | null) ?? null} userId={scope.userId}>{children}</UserViewModeProvider>;
}
