import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentViewRole } from "@/contexts/UserViewModeContext";
import { withTimeout } from "@/lib/asyncTimeout";
import { logAuthDiagnostic } from "@/lib/authDiagnostics";
import { clearUnsafeAuthCache } from "@/lib/authSessionIsolation";
import { useActiveClinicScope, type ActiveClinicScope } from "@/hooks/useActiveClinicScope";

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

const EMPTY_PERMISSIONS_STATE: PermissionsState = {
  permissions: [],
  role: null,
  isLoading: false,
  isAdmin: false,
  isOwner: false,
  professionalId: null,
};

// Provider Component
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { viewedRole, isImpersonating } = useCurrentViewRole();
  const { scope, isLoading: scopeLoading } = useActiveClinicScope();
  const [state, setState] = useState<PermissionsState>({
    permissions: [],
    role: null,
    isLoading: true,
    isAdmin: false,
    isOwner: false,
    professionalId: null,
  });

  // Ref que guarda quem é o usuário ativo "esperado" e o id da última
  // requisição. Toda resposta async precisa validar antes de aplicar estado:
  // se o auth.uid() mudou no meio do caminho, descartamos.
  const requestRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(null);

  const fetchPermissionsOnce = useCallback(async (reqId: number, currentScope: ActiveClinicScope) => {
    const stillCurrent = (expectedUserId: string | null) => {
      if (reqId !== requestRef.current) return false;
      if (expectedUserId !== null && activeUserIdRef.current !== expectedUserId) return false;
      return true;
    };

    const userId = currentScope.userId;
    const clinicId = currentScope.clinicId;
    const role = currentScope.role;
    if (!userId) {
      activeUserIdRef.current = null;
      return { kind: "no-user" as const };
    }
    activeUserIdRef.current = userId;
    if (!clinicId || !role) {
      return { kind: "no-role" as const, userId };
    }

    logAuthDiagnostic("permissions-role-loaded", {
      authUid: userId,
      profileUserId: userId,
      roleUserId: userId,
      activeClinicId: clinicId,
      displaySource: "active-clinic-scope + get_user_all_permissions",
    });

    const isOwner = role === "owner";
    const isAdmin = ["owner", "admin"].includes(role);

    const { data: professionalData } = await withTimeout<any>(supabase
      .from("professionals")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle());
    if (!stillCurrent(userId)) return { kind: "stale" as const };
    const professionalId = professionalData?.id || null;

    const { data: permsData, error } = await withTimeout<any>(
      supabase.rpc("get_user_all_permissions", { _user_id: userId, _clinic_id: clinicId })
    );
    if (!stillCurrent(userId)) return { kind: "stale" as const };

    let permissions: ModulePermission[];
    if (error) {
      console.error("[PERMISSIONS] RPC failed — bloqueando permissões para evitar fallback inseguro", error);
      throw error;
    } else {
      permissions = (permsData || []).map((p: any) => ({
        module: p.module as AppModule,
        actions: (p.actions || []) as AppAction[],
        restrictions: (p.restrictions || {}) as Record<string, boolean>,
      }));
    }

    return { kind: "ok" as const, role, isOwner, isAdmin, professionalId, permissions, userId };
  }, []);

  const fetchPermissions = useCallback(async () => {
    if (scopeLoading) return;
    const reqId = ++requestRef.current;
    if (!scope.userId) {
      activeUserIdRef.current = null;
      setState(EMPTY_PERMISSIONS_STATE);
      return;
    }
    activeUserIdRef.current = scope.userId;
    setState((current) =>
      current.role === scope.role && current.permissions.length > 0
        ? current
        : { permissions: [], role: null, isLoading: true, isAdmin: false, isOwner: false, professionalId: null },
    );
    const maxAttempts = 3;
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fetchPermissionsOnce(reqId, scope);
        if (reqId !== requestRef.current) return; // resposta obsoleta
        if (result.kind === "stale") return;
        if (result.kind === "no-user") {
          clearUnsafeAuthCache();
          setState(EMPTY_PERMISSIONS_STATE);
          return;
        }
        if (result.kind === "no-role") {
          clearUnsafeAuthCache();
          setState(EMPTY_PERMISSIONS_STATE);
          return;
        }
        // Última checagem antes de aplicar: o usuário não pode ter mudado.
        if (activeUserIdRef.current !== result.userId) return;
        setState({
          permissions: result.permissions,
          role: result.role,
          isLoading: false,
          isAdmin: result.isAdmin,
          isOwner: result.isOwner,
          professionalId: result.professionalId,
        });
        if (import.meta.env.DEV) {
          console.log("[PERMISSIONS] carregadas", { role: result.role, permissions: result.permissions.length, attempt });
        }
        return;
      } catch (error) {
        lastError = error;
        console.warn(`[PERMISSIONS] tentativa ${attempt}/${maxAttempts} falhou`, error);
        if (reqId !== requestRef.current) return;
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 400 * attempt));
        }
      }
    }
    if (reqId !== requestRef.current) return;
    console.error("[APP_ERROR] permissions fetch failed — estado limpo para evitar dados antigos", lastError);
    clearUnsafeAuthCache();
    setState(EMPTY_PERMISSIONS_STATE);
  }, [fetchPermissionsOnce, scope, scopeLoading]);

  useEffect(() => {
    fetchPermissions();

    const bootTimeout = window.setTimeout(() => {
      setState((current) => {
        if (!current.isLoading) return current;
        console.error("[BOOT_TIMEOUT] PermissionsProvider demorou demais");
        return { permissions: [], role: null, isLoading: false, isAdmin: false, isOwner: false, professionalId: null };
      });
    }, 10000);

    const onIdentityChanged = () => {
      requestRef.current++;
      activeUserIdRef.current = null;
      clearUnsafeAuthCache();
      setState({ permissions: [], role: null, isLoading: true, isAdmin: false, isOwner: false, professionalId: null });
      setTimeout(() => fetchPermissions(), 0);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("yesclin:identity-changed", onIdentityChanged);
    }

    return () => {
      window.clearTimeout(bootTimeout);
      if (typeof window !== "undefined") {
        window.removeEventListener("yesclin:identity-changed", onIdentityChanged);
      }
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
