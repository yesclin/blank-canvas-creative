import { ReactNode, useEffect, useRef, useState } from "react";
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
  // We never block rendering on this provider — children render immediately.
  // The role hydrates asynchronously and is non-essential for the initial boot.
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const load = async () => {
      try {
        const { data: { user } } = await withTimeout<any>(
          supabase.auth.getUser(),
          8000,
          "Tempo esgotado ao carregar sessão (UserViewMode).",
        );
        if (!user) {
          if (!cancelledRef.current) setRealRole(null);
          return;
        }
        const { data } = await withTimeout<any>(supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle(), 8000, "Tempo esgotado ao carregar papel do usuário.");
        if (cancelledRef.current) return;
        const role = (data?.role as ViewableRole | undefined) ?? null;
        setRealRole(role);
      } catch (error) {
        // NUNCA derrubar o boot por causa do view-mode.
        console.error("[PROVIDER_ERROR] UserViewModeBootstrap", error);
        if (!cancelledRef.current) setRealRole(null);
      }
    };

    load();
    // Defer query execution out of the auth callback to avoid Supabase deadlocks.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => {
        if (!cancelledRef.current) load();
      }, 0);
    });
    return () => {
      cancelledRef.current = true;
      subscription.unsubscribe();
    };
  }, []);

  return <UserViewModeProvider realRole={realRole}>{children}</UserViewModeProvider>;
}
