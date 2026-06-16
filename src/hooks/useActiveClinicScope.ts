/**
 * useActiveClinicScope
 * --------------------------------------------------
 * Fonte ÚNICA do escopo ativo da sessão: { userId, clinicId, role, isSupportMode }.
 *
 * Antes deste hook, cada feature (useClinicData, useClinicFeatures,
 * useClinicSubscription, useCurrentUser, usePermissions, UserViewModeBootstrap)
 * disparava sua própria sequência de `getUser → profiles → user_roles`, o que
 * produzia 4-6 requests redundantes no boot e a cada invalidação — sentido
 * pelo usuário como "carregando várias vezes / tela branca".
 *
 * Agora é uma única query React Query cacheada por `authUserId` com
 * `staleTime` de 5 minutos. Hooks consumidores apenas leem o resultado.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/asyncTimeout";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";

export type ClinicRole = "owner" | "admin" | "profissional" | "recepcionista";

export interface ActiveClinicScope {
  userId: string | null;
  clinicId: string | null;
  role: ClinicRole | null;
  profileName: string | null;
  profileEmail: string | null;
  profileAvatarUrl: string | null;
  profileIsActive: boolean | null;
  isSupportMode: boolean;
}

const EMPTY: ActiveClinicScope = {
  userId: null,
  clinicId: null,
  role: null,
  profileName: null,
  profileEmail: null,
  profileAvatarUrl: null,
  profileIsActive: null,
  isSupportMode: false,
};

async function fetchScope(userId: string): Promise<ActiveClinicScope> {
  // 1) Suporte (impersonação) — só se o admin de suporte for o mesmo userId
  let resolvedClinicId: string | null = null;
  let isSupportMode = false;
  try {
    if (typeof window !== "undefined") {
      const supportClinicId = window.sessionStorage.getItem("yesclin_support_clinic_id");
      const supportAdminUserId = window.sessionStorage.getItem("yesclin_support_admin_user_id");
      if (supportClinicId && supportAdminUserId === userId) {
        const { data: isAdmin } = await withTimeout<any>(
          supabase.rpc("is_platform_admin", { _user_id: userId }),
        );
        if (isAdmin === true) {
          resolvedClinicId = supportClinicId;
          isSupportMode = true;
        }
      }
    }
  } catch {
    /* noop — segue fluxo normal */
  }

  // 2) Profile natural se não houver suporte
  let clinicId: string | null = resolvedClinicId;
  let profileName: string | null = null;
  let profileEmail: string | null = null;
  let profileAvatarUrl: string | null = null;
  let profileIsActive: boolean | null = null;
  if (!clinicId) {
    const { data: profile, error: profileError } = await withTimeout<any>(
      supabase
        .from("profiles")
        .select("clinic_id, user_id, full_name, email, avatar_url, is_active")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle(),
    );
    if (profileError) throw profileError;
    if (profile && profile.user_id === userId) {
      clinicId = profile.clinic_id ?? null;
      profileName = profile.full_name ?? null;
      profileEmail = profile.email ?? null;
      profileAvatarUrl = profile.avatar_url ?? null;
      profileIsActive = profile.is_active ?? true;
    }
  }

  // 3) Role
  let role: ClinicRole | null = null;
  if (clinicId) {
    const { data, error } = await withTimeout<any>(
      supabase
        .from("user_roles")
        .select("role, user_id")
        .eq("user_id", userId)
        .eq("clinic_id", clinicId)
        .limit(1)
        .maybeSingle(),
    );
    if (error) throw error;
    if (data && data.user_id === userId && data.role) {
      role = data.role as ClinicRole;
    }
  }

  return { userId, clinicId, role, profileName, profileEmail, profileAvatarUrl, profileIsActive, isSupportMode };
}

export function useActiveClinicScope() {
  const queryClient = useQueryClient();
  const { userId: authUserId, isLoading: authIdentityLoading } = useAuthIdentity();
  const [supportScopeKey, setSupportScopeKey] = useState(() => {
    if (typeof window === "undefined") return "none";
    return `${window.sessionStorage.getItem("yesclin_support_admin_user_id") ?? ""}:${window.sessionStorage.getItem("yesclin_support_clinic_id") ?? ""}`;
  });

  const query = useQuery({
    queryKey: ["active-clinic-scope", authUserId, supportScopeKey],
    queryFn: () => fetchScope(authUserId!),
    enabled: !authIdentityLoading && !!authUserId,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
    throwOnError: false,
  });

  // Invalidar APENAS em eventos reais de troca de identidade ou modo suporte.
  // TOKEN_REFRESHED e INITIAL_SESSION são ignorados para não causar refetch
  // em background a cada clique no menu.
  useEffect(() => {
    const onSupport = () => {
      setSupportScopeKey(`${window.sessionStorage.getItem("yesclin_support_admin_user_id") ?? ""}:${window.sessionStorage.getItem("yesclin_support_clinic_id") ?? ""}`);
      queryClient.invalidateQueries({ queryKey: ["active-clinic-scope"] });
    };
    const onIdentityChanged = (event: Event) => {
      const detail = (event as CustomEvent).detail as { prev?: string | null; next?: string | null } | undefined;
      const prev = detail?.prev ?? null;
      const next = detail?.next ?? null;
      if (prev === next) {
        if (import.meta.env.DEV) console.log("[DOUBLE_LOAD_DEBUG] scope identity-changed IGNORADO", { prev, next });
        return;
      }
      onSupport();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("yesclin:support-session-changed", onSupport);
      window.addEventListener("yesclin:identity-changed", onIdentityChanged);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("yesclin:support-session-changed", onSupport);
        window.removeEventListener("yesclin:identity-changed", onIdentityChanged);
      }
    };
  }, [queryClient]);

  return {
    scope: query.data ?? EMPTY,
    isLoading: authIdentityLoading || (query.isLoading && !query.data),
    isReady: !authIdentityLoading && !!authUserId && !!query.data,
    error: query.error ?? null,
    refetch: () => void query.refetch(),
  };
}
