import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentViewRole } from "@/contexts/UserViewModeContext";
import { withTimeout } from "@/lib/asyncTimeout";

// Types
export type AppModule = 
  | "dashboard"
  | "agenda"
  
  | "pacientes"
  | "prontuario"
  | "comunicacao"
  | "financeiro"
  | "meu_financeiro"
  | "convenios"
  | "estoque"
  | "relatorios"
  | "configuracoes"
  | "comercial";

export type AppAction = "view" | "create" | "edit" | "delete" | "export";

export interface ModulePermission {
  module: AppModule;
  actions: AppAction[];
  restrictions: Record<string, boolean>;
}

export interface PermissionsState {
  permissions: ModulePermission[];
  role: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  /** The professional_id linked to the current user (null if not a professional) */
  professionalId: string | null;
}

interface PermissionsContextType extends PermissionsState {
  can: (module: AppModule, action?: AppAction) => boolean;
  canAny: (module: AppModule, actions: AppAction[]) => boolean;
  hasRestriction: (module: AppModule, restriction: string) => boolean;
  getModulePermissions: (module: AppModule) => ModulePermission | null;
  refetch: () => Promise<void>;
  /** Only OWNER can manage users */
  canManageUsers: boolean;
  /** Owner/Admin can manage clinic settings, procedures, templates, etc. */
  canManageClinic: boolean;
  /** Owner/Admin can manage enabled specialties */
  canManageSpecialties: boolean;
  /** Owner/Admin/Profissional can perform clinical care - Receptionist CANNOT */
  canPerformClinicalCare: boolean;
  /** Owner/Admin/Profissional can access clinical content - Receptionist CANNOT */
  canAccessClinicalContent: boolean;
  /** Owner/Admin can access system configurations - Receptionist CANNOT */
  canAccessConfigurations: boolean;
  /** Check if user is a receptionist */
  isRecepcionista: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | null>(null);

// Provider Component
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { viewedRole, isImpersonating } = useCurrentViewRole();
  const [state, setState] = useState<PermissionsState>({
    permissions: [],
    role: null,
    isLoading: true,
    isAdmin: false,
    isOwner: false,
    professionalId: null,
  });

  const fetchPermissionsOnce = useCallback(async () => {
    const { data: { user } } = await withTimeout<any>(supabase.auth.getUser());
    if (!user) {
      return { kind: "no-user" as const };
    }

    // Get user role
    const { data: roleData, error: roleErr } = await withTimeout<any>(supabase
      .from("user_roles")
      .select("role, clinic_id")
      .eq("user_id", user.id)
      .maybeSingle());

    if (roleErr) throw roleErr;

    if (!roleData) {
      return { kind: "no-role" as const };
    }

    const role = roleData.role;
    const isOwner = role === "owner";
    const isAdmin = ["owner", "admin"].includes(role);

    // Get linked professional_id (if user is linked to a professional)
    const { data: professionalData } = await withTimeout<any>(supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle());
    const professionalId = professionalData?.id || null;

    // Get permissions using the database function
    const { data: permsData, error } = await withTimeout<any>(
      supabase.rpc("get_user_all_permissions", { _user_id: user.id })
    );

    let permissions: ModulePermission[];
    if (error) {
      console.warn("[PERMISSIONS] RPC failed, falling back to templates", error);
      const { data: templates } = await withTimeout<any>(supabase
        .from("permission_templates")
        .select("module, actions, restrictions")
        .eq("role", role));
      permissions = (templates || []).map((t: any) => ({
        module: t.module as AppModule,
        actions: (t.actions || []) as AppAction[],
        restrictions: (t.restrictions || {}) as Record<string, boolean>,
      }));
    } else {
      permissions = (permsData || []).map((p: any) => ({
        module: p.module as AppModule,
        actions: (p.actions || []) as AppAction[],
        restrictions: (p.restrictions || {}) as Record<string, boolean>,
      }));
    }

    return { kind: "ok" as const, role, isOwner, isAdmin, professionalId, permissions };
  }, []);

  const fetchPermissions = useCallback(async () => {
    const maxAttempts = 3;
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fetchPermissionsOnce();
        if (result.kind === "no-user") {
          setState({ permissions: [], role: null, isLoading: false, isAdmin: false, isOwner: false, professionalId: null });
          return;
        }
        if (result.kind === "no-role") {
          // Preserve previous role if we already had one (transient inconsistency
          // right after auth events). Only surface the empty state on first load.
          setState((prev) => prev.role
            ? { ...prev, isLoading: false }
            : { permissions: [], role: null, isLoading: false, isAdmin: false, isOwner: false, professionalId: null });
          return;
        }
        setState({
          permissions: result.permissions,
          role: result.role,
          isLoading: false,
          isAdmin: result.isAdmin,
          isOwner: result.isOwner,
          professionalId: result.professionalId,
        });
        console.log("[PERMISSIONS] carregadas", { role: result.role, permissions: result.permissions.length, attempt });
        return;
      } catch (error) {
        lastError = error;
        console.warn(`[PERMISSIONS] tentativa ${attempt}/${maxAttempts} falhou`, error);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 400 * attempt));
        }
      }
    }
    // After retries, preserve previous state if we already had a valid role,
    // so a transient blip doesn't kick the user to the error screen.
    setState((prev) => {
      if (prev.role) {
        console.warn("[PERMISSIONS] retries esgotados — mantendo estado anterior", lastError);
        return { ...prev, isLoading: false };
      }
      console.error("[APP_ERROR] permissions fetch failed", lastError);
      return { permissions: [], role: null, isLoading: false, isAdmin: false, isOwner: false, professionalId: null };
    });
  }, [fetchPermissionsOnce]);

  useEffect(() => {
    fetchPermissions();

    const bootTimeout = window.setTimeout(() => {
      setState((current) => {
        if (!current.isLoading) return current;
        console.error("[BOOT_TIMEOUT] PermissionsProvider demorou demais");
        return { ...current, isLoading: false };
      });
    }, 10000);

    // Listen for auth changes — defer Supabase queries out of the callback to
    // avoid deadlocks. Only refetch on real identity changes; ignore noisy
    // events like TOKEN_REFRESHED and INITIAL_SESSION which would otherwise
    // wipe permissions mid-session and trigger the error screen.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setTimeout(() => fetchPermissions(), 0);
      }
    });

    return () => {
      window.clearTimeout(bootTimeout);
      subscription.unsubscribe();
    };
  }, [fetchPermissions]);

  // ===== Effective state with view-mode override (impersonation) =====
  // realRole comes from DB (state.role); when an owner is "viewing as" another
  // role, we recompute the effective role/flags. We DO NOT bypass DB security —
  // this is purely a frontend simulation for UX validation.
  const effective = useMemo(() => {
    const realRole = state.role;
    const realIsOwner = realRole === "owner";
    // Only owners may impersonate; ignore any view override otherwise.
    const activeRole = realIsOwner && isImpersonating && viewedRole ? viewedRole : realRole;
    const isOwner = activeRole === "owner";
    const isAdmin = activeRole === "owner" || activeRole === "admin";
    return { activeRole, isOwner, isAdmin, realIsOwner };
  }, [state.role, isImpersonating, viewedRole]);

  // Load template permissions for the simulated role when impersonating.
  // (When not impersonating, we use whatever the DB returned for the real user.)
  const [simulatedPermissions, setSimulatedPermissions] = useState<ModulePermission[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!isImpersonating || !effective.realIsOwner || !viewedRole || viewedRole === "owner") {
      setSimulatedPermissions(null);
      return;
    }
    (async () => {
      const { data: templates } = await withTimeout<any>(supabase
        .from("permission_templates")
        .select("module, actions, restrictions")
        .eq("role", viewedRole));
      if (cancelled) return;
      const perms = (templates || []).map((t: any) => ({
        module: t.module as AppModule,
        actions: (t.actions || []) as AppAction[],
        restrictions: (t.restrictions || {}) as Record<string, boolean>,
      }));
      setSimulatedPermissions(perms);
    })();
    return () => { cancelled = true; };
  }, [isImpersonating, effective.realIsOwner, viewedRole]);

  const effectivePermissions = simulatedPermissions ?? state.permissions;

  // Check if user can perform action on module
  const can = useCallback((module: AppModule, action: AppAction = "view"): boolean => {
    if (state.isLoading) return false;
    if (effective.isOwner) return true;
    if (effective.isAdmin) return true;
    if (effectivePermissions.length === 0) return false;
    const perm = effectivePermissions.find(p => p.module === module);
    if (!perm) return false;
    if (perm.restrictions?.blocked) return false;
    return perm.actions.includes(action);
  }, [effectivePermissions, effective.isAdmin, effective.isOwner, state.isLoading]);

  const canAny = useCallback((module: AppModule, actions: AppAction[]): boolean => {
    return actions.some(action => can(module, action));
  }, [can]);

  const hasRestriction = useCallback((module: AppModule, restriction: string): boolean => {
    if (effective.isOwner) return false;
    const perm = effectivePermissions.find(p => p.module === module);
    return perm?.restrictions?.[restriction] ?? false;
  }, [effectivePermissions, effective.isOwner]);

  const getModulePermissions = useCallback((module: AppModule): ModulePermission | null => {
    return effectivePermissions.find(p => p.module === module) || null;
  }, [effectivePermissions]);

  // Derived flags use the EFFECTIVE (possibly simulated) role
  const canManageUsers = effective.isOwner;
  const canManageClinic = effective.isOwner || effective.isAdmin;
  const canManageSpecialties = effective.isOwner || effective.isAdmin;
  const isRecepcionista = effective.activeRole === 'recepcionista';
  const canAccessClinicalContent = !isRecepcionista && (effective.isOwner || effective.isAdmin || effective.activeRole === 'profissional');
  const canAccessConfigurations = effective.isOwner || effective.isAdmin;
  const canPerformClinicalCare = effective.isOwner || effective.isAdmin || effective.activeRole === 'profissional';

  const value: PermissionsContextType = {
    ...state,
    // Override with effective values so consumers see the simulated role
    role: effective.activeRole,
    isOwner: effective.isOwner,
    isAdmin: effective.isAdmin,
    permissions: effectivePermissions,
    can,
    canAny,
    hasRestriction,
    getModulePermissions,
    refetch: fetchPermissions,
    canManageUsers,
    canManageClinic,
    canManageSpecialties,
    canPerformClinicalCare,
    canAccessClinicalContent,
    canAccessConfigurations,
    isRecepcionista,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

// Hook to use permissions
export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}

// Simplified hook for quick checks
export function useCanAccess(module: AppModule, action: AppAction = "view"): boolean {
  const { can, isLoading } = usePermissions();
  if (isLoading) return false;
  return can(module, action);
}
