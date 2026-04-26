import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserViewModeProvider, ViewableRole } from "@/contexts/UserViewModeContext";

/**
 * Resolves the authenticated user's real role from `user_roles` and exposes it
 * to UserViewModeProvider so the rest of the app (PermissionsProvider) can
 * react to the simulated view-role.
 */
export function UserViewModeBootstrap({ children }: { children: ReactNode }) {
  const [realRole, setRealRole] = useState<ViewableRole | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setRealRole(null);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const role = (data?.role as ViewableRole | undefined) ?? null;
      setRealRole(role);
    };

    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return <UserViewModeProvider realRole={realRole}>{children}</UserViewModeProvider>;
}
