import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  | "configuracoes";

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState({ permissions: [], role: null, isLoading: false, isAdmin: false, isOwner: false, professionalId: null });
        return;
      }

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role, clinic_id")
        .eq("user_id", user.id)
        .single();

      if (!roleData) {
        setState({ permissions: [], role: null, isLoading: false, isAdmin: false, isOwner: false, professionalId: null });
        return;
      }
      
      // Get linked professional_id (if user is linked to a professional)
      const { data: professionalData } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      
      const professionalId = professionalData?.id || null;

      const role = roleData.role;
      // Owner has TOTAL BYPASS - highest privilege level
      const isOwner = role === "owner";
      // Admin has elevated privileges but can still be restricted
      const isAdmin = ["owner", "admin"].includes(role);

      // Get permissions using the database function
      const { data: permsData, error } = await supabase
        .rpc("get_user_all_permissions", { _user_id: user.id });

      if (error) {
        console.error("Error fetching permissions:", error);
        // Fallback to template permissions
        const { data: templates } = await supabase
          .from("permission_templates")
          .select("module, actions, restrictions")
          .eq("role", role);

        const permissions = (templates || []).map(t => ({
          module: t.module as AppModule,
          actions: (t.actions || []) as AppAction[],
          restrictions: (t.restrictions || {}) as Record<string, boolean>,
        }));

        setState({ permissions, role, isLoading: false, isAdmin, isOwner, professionalId });
        return;
      }

      const permissions = (permsData || []).map((p: any) => ({
        module: p.module as AppModule,
        actions: (p.actions || []) as AppAction[],
        restrictions: (p.restrictions || {}) as Record<string, boolean>,
      }));

      setState({ permissions, role, isLoading: false, isAdmin, isOwner, professionalId });
    } catch (error) {
      console.error("Error in fetchPermissions:", error);
      setState({ permissions: [], role: null, isLoading: false, isAdmin: false, isOwner: false, professionalId: null });
    }
  }, []);

  useEffect(() => {
    fetchPermissions();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchPermissions();
    });

    return () => subscription.unsubscribe();
  }, [fetchPermissions]);

  // Check if user can perform action on module
  // OWNER ALWAYS BYPASSES ALL PERMISSION CHECKS
  const can = useCallback((module: AppModule, action: AppAction = "view"): boolean => {
    // If still loading, deny access (avoid optimistic UI that could reveal privileged UI)
    if (state.isLoading) return false;
    
    // OWNER has TOTAL BYPASS - ignores all permission checks
    if (state.isOwner) return true;
    
    // Admin has full access (but can be restricted in future if needed)
    if (state.isAdmin) return true;
    
    // If no permissions loaded (no user or no role), deny by default
    if (state.permissions.length === 0) return false;
    
    const perm = state.permissions.find(p => p.module === module);
    if (!perm) return false;
    
    // Check if blocked
    if (perm.restrictions?.blocked) return false;
    
    return perm.actions.includes(action);
  }, [state.permissions, state.isAdmin, state.isOwner, state.isLoading]);

  // Check if user can perform any of the given actions
  const canAny = useCallback((module: AppModule, actions: AppAction[]): boolean => {
    return actions.some(action => can(module, action));
  }, [can]);

  // Check if user has a specific restriction
  const hasRestriction = useCallback((module: AppModule, restriction: string): boolean => {
    // Owner bypasses all restrictions
    if (state.isOwner) return false;
    const perm = state.permissions.find(p => p.module === module);
    return perm?.restrictions?.[restriction] ?? false;
  }, [state.permissions, state.isOwner]);

  // Get full permissions for a module
  const getModulePermissions = useCallback((module: AppModule): ModulePermission | null => {
    return state.permissions.find(p => p.module === module) || null;
  }, [state.permissions]);

  // Only OWNER can manage users and permissions
  const canManageUsers = state.isOwner;
  
  // Owner/Admin can manage clinic settings (procedures, templates, rules, specialties)
  const canManageClinic = state.isOwner || state.isAdmin;
  const canManageSpecialties = state.isOwner || state.isAdmin;
  
  // Check if user is a receptionist
  const isRecepcionista = state.role === 'recepcionista';
  
  // Owner/Admin/Profissional can access clinical content - Receptionist CANNOT
  const canAccessClinicalContent = !isRecepcionista && (state.isOwner || state.isAdmin || state.role === 'profissional');
  
  // Owner/Admin can access system configurations - Receptionist CANNOT
  const canAccessConfigurations = state.isOwner || state.isAdmin;
  
  // Owner/Admin/Profissional can perform clinical care - Receptionist CANNOT
  const canPerformClinicalCare = state.isOwner || state.isAdmin || state.role === 'profissional';

  const value: PermissionsContextType = {
    ...state,
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
