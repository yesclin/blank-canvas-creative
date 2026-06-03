import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useClinicUsers";

/**
 * Overlay temporário de debug de identidade. Visível apenas em DEV ou quando
 * `sessionStorage.setItem("yc.auth.debug", "1")`. Mostra side-by-side:
 *  - auth.uid() (fonte canônica)
 *  - profile.user_id carregado
 *  - clinic_id ativa
 *  - role carregada
 *  - nome exibido na sidebar + sua origem
 *
 * Use para validar manualmente que NUNCA aparece um usuário diferente do
 * auth.uid() na sidebar.
 */
export function AuthDebugOverlay() {
  // Estritamente opt-in. Nunca aparece em preview/produção para clientes.
  // Para ativar localmente: definir VITE_ENABLE_AUTH_DEBUG="true" no .env.local
  // e, opcionalmente, sessionStorage.setItem("yc.auth.debug","1") em DEV.
  const envEnabled = import.meta.env.VITE_ENABLE_AUTH_DEBUG === "true";
  const devOptIn =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    window.sessionStorage.getItem("yc.auth.debug") === "1";
  const enabled = envEnabled || devOptIn;


  const { user } = useCurrentUser();
  const [collapsed, setCollapsed] = useState(false);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ user_id: string | null; clinic_id: string | null; full_name: string | null } | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const refresh = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      if (cancelled) return;
      setAuthUid(uid);

      if (!uid) {
        setProfile(null);
        setRole(null);
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("user_id, clinic_id, full_name")
        .eq("user_id", uid)
        .maybeSingle();
      if (cancelled) return;
      setProfile(prof ?? null);

      if (prof?.clinic_id) {
        const { data: r } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid)
          .eq("clinic_id", prof.clinic_id)
          .maybeSingle();
        if (cancelled) return;
        setRole((r?.role as string) ?? null);
      } else {
        setRole(null);
      }
    };

    refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => refresh());
    const onIdentity = () => refresh();
    window.addEventListener("yesclin:identity-changed", onIdentity);
    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("yesclin:identity-changed", onIdentity);
    };
  }, [enabled, user?.id]);

  if (!enabled) return null;

  const mismatch =
    !!authUid &&
    ((!!profile?.user_id && profile.user_id !== authUid) ||
      (!!user?.id && user.id !== authUid));

  const row = (label: string, value: string | null | undefined) => (
    <div className="flex gap-2 text-[11px] leading-tight">
      <span className="opacity-60 w-28 shrink-0">{label}</span>
      <span className="font-mono break-all">{value ?? "—"}</span>
    </div>
  );

  return (
    <div
      data-testid="auth-debug-overlay"
      style={{ position: "fixed", bottom: 8, right: 8, zIndex: 99999 }}
      className={`pointer-events-auto rounded-md border shadow-lg ${
        mismatch ? "bg-red-600 text-white border-red-800" : "bg-black/85 text-white border-white/10"
      } backdrop-blur px-3 py-2 max-w-[360px]`}
    >
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-[11px] uppercase tracking-wider opacity-90"
      >
        <span>auth debug {mismatch && "⚠ mismatch"}</span>
        <span>{collapsed ? "▲" : "▼"}</span>
      </button>
      {!collapsed && (
        <div className="mt-2 space-y-1">
          {row("auth.uid()", authUid)}
          {row("profile.user_id", profile?.user_id ?? null)}
          {row("clinic_id", profile?.clinic_id ?? null)}
          {row("role", role)}
          {row("sidebar name", user?.name ?? null)}
          {row("name source", user ? "profiles.full_name (useCurrentUser)" : "—")}
          {row("sidebar user.id", user?.id ?? null)}
        </div>
      )}
    </div>
  );
}
