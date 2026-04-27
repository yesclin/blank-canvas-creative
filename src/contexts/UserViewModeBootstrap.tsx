import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserViewModeProvider, ViewableRole } from "@/contexts/UserViewModeContext";
import { withTimeout } from "@/lib/asyncTimeout";

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
      try {
        const { data: { user } } = await withTimeout<any>(supabase.auth.getUser());
        if (!user) {
          if (!cancelled) setRealRole(null);
          return;
        }
        const { data } = await withTimeout<any>(supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle());
        if (cancelled) return;
        const role = (data?.role as ViewableRole | undefined) ?? null;
        setRealRole(role);
      } catch (error) {
        console.error("[APP_ERROR]", error);
        if (!cancelled) setRealRole(null);
      }
    };

    load();
    // Defer query execution out of the auth callback to avoid Supabase deadlocks.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => {
        if (!cancelled) load();
      }, 0);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return <UserViewModeProvider realRole={realRole}>{children}</UserViewModeProvider>;
}
