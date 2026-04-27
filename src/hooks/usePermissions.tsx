import { useState, useEffect, useCallback, useMemo, createContext, useContext, ReactNode } from "react";
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

  const fetchPermissions = useCallback(async () => {
    try {
      const { data: { user } } = await withTimeout<any>(supabase.auth.getUser());
      if (!user) {
        setState({ permissions: [], role: null, isLoading: false, isAdmin: false, isOwner: false, professionalId: null });
        console.log("[PERMISSIONS] carregadas", { role: null, permissions: 0 });
        return;
      }

      // Get user role
      const { data: roleData } = await withTimeout<any>(supabase
        .from("user_roles")
        .select("role, clinic_id")
        .eq("user_id", user.id)
        .maybeSingle());

      if (!roleData) {
        setState({ permissions: [], role: null, isLoading: false, isAdmin: false, isOwner: false, professionalId: null });
        console.log("[PERMISSIONS] carregadas", { role: null, permissions: 0 });
        return;
      }
      
      // Get linked professional_id (if user is linked to a professional)
      const { data: professionalData } = await withTimeout<any>(supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle());
      
      const professionalId = professionalData?.id || null;

      const role = roleData.role;
      // Owner has TOTAL BYPASS - highest privilege level
      const isOwner = role === "owner";
      // Admin has elevated privileges but can still be restricted
      const isAdmin = ["owner", "admin"].includes(role);

      // Get permissions using the database function
      const { data: permsData, error } = await withTimeout<any>(
        supabase.rpc("get_user_all_permissions", { _user_id: user.id })
      );

      if (error) {
        console.error("Error fetching permissions:", error);
        // Fallback to template permissions
        const { data: templates } = await withTimeout<any>(supabase
          .from("permission_templates")
          .select("module, actions, restrictions")
          .eq("role", role));

        const permissions = (templates || []).map(t => ({
          module: t.module as AppModule,
          actions: (t.actions || []) as AppAction[],
          restrictions: (t.restrictions || {}) as Record<string, boolean>,
        }));

        setState({ permissions, role, isLoading: false, isAdmin, isOwner, professionalId });
        console.log("[PERMISSIONS] carregadas", { role, permissions: permissions.length });
        return;
      }

      const permissions = (permsData || []).map((p: any) => ({
        module: p.module as AppModule,
        actions: (p.actions || []) as AppAction[],
        restrictions: (p.restrictions || {}) as Record<string, boolean>,
      }));

      setState({ permissions, role, isLoading: false, isAdmin, isOwner, professionalId });
      console.log("[PERMISSIONS] carregadas", { role, permissions: permissions.length });
    } catch (error) {
      console.error("[APP_ERROR]", error);
      setState({ permissions: [], role: null, isLoading: false, isAdmin: false, isOwner: false, professionalId: null });
      console.log("[PERMISSIONS] carregadas", { role: null, permissions: 0, failed: true });
    }
  }, []);

  useEffect(() => {
    fetchPermissions();

    // Listen for auth changes — defer Supabase queries out of the callback to
    // avoid deadlocks (anti-pattern: awaiting Supabase calls inside the auth
    // listener can block subsequent events).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => fetchPermissions(), 0);
    });

    return () => subscription.unsubscribe();
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
