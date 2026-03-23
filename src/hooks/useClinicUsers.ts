import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClinicUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: "owner" | "admin" | "profissional" | "recepcionista";
  is_active: boolean;
  avatar_url: string | null;
  clinic_id: string;
  created_at: string;
  is_primary_admin: boolean;
}

export interface CreateUserData {
  full_name: string;
  email: string;
  password: string;
  role: "admin" | "profissional" | "recepcionista";
}

const MAX_USERS_PER_CLINIC = 3;

const ROLE_PRIORITY: Record<ClinicUser["role"], number> = {
  owner: 4, // Owner has highest priority and full bypass
  admin: 2,
  profissional: 1,
  recepcionista: 1,
};

// Owner protection: owner can never be deactivated, deleted, or demoted
const isProtectedOwner = (user: ClinicUser) => user.role === "owner";

export function useClinicUsers() {
  const [users, setUsers] = useState<ClinicUser[]>([]);
  const [currentUser, setCurrentUser] = useState<ClinicUser | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Usuário não autenticado");
        setIsLoading(false);
        return;
      }

      // Get user's clinic
      const { data: profile } = await supabase
        .from("profiles")
        .select("clinic_id, full_name, avatar_url")
        .eq("user_id", user.id)
        .single();

      if (!profile?.clinic_id) {
        setError("Clínica não encontrada");
        setIsLoading(false);
        return;
      }

      setClinicId(profile.clinic_id);

      // Get current user's role
      const { data: currentUserRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("clinic_id", profile.clinic_id)
        .single();

      // Get all profiles in the same clinic
      const { data: clinicProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url, is_active, created_at")
        .eq("clinic_id", profile.clinic_id);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        setError("Erro ao carregar usuários");
        setIsLoading(false);
        return;
      }

      // Get roles for all users
      const userIds = clinicProfiles?.map(p => p.user_id) || [];
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("clinic_id", profile.clinic_id)
        .in("user_id", userIds);

      // Get clinic creation info to identify primary admin
      const { data: clinic } = await supabase
        .from("clinics")
        .select("created_at")
        .eq("id", profile.clinic_id)
        .single();

      // Get user emails from auth (we need to get this differently)
      // For now, we'll use a placeholder - in production this would come from a secure function
      
      // Build user list
      const userList: ClinicUser[] = (clinicProfiles || []).map(p => {
        const userRole = roles?.find(r => r.user_id === p.user_id);
        const role = (userRole?.role || "profissional") as ClinicUser["role"];
        
        // The first owner/admin created with the clinic is the primary admin
        const isElevated = ROLE_PRIORITY[role] >= ROLE_PRIORITY.admin;
        const isPrimaryAdmin = isElevated && (
          ROLE_PRIORITY[role] === ROLE_PRIORITY.owner || p.created_at === clinic?.created_at
        );

        return {
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name || "Usuário",
          email: "", // Will be filled by edge function or profile data
          role,
          is_active: p.is_active ?? true,
          avatar_url: p.avatar_url,
          clinic_id: profile.clinic_id,
          created_at: p.created_at,
          is_primary_admin: isPrimaryAdmin,
        };
      });

      // Sort: primary admin first, then by name
      userList.sort((a, b) => {
        if (a.is_primary_admin && !b.is_primary_admin) return -1;
        if (!a.is_primary_admin && b.is_primary_admin) return 1;
        const prioDiff = (ROLE_PRIORITY[b.role] ?? 0) - (ROLE_PRIORITY[a.role] ?? 0);
        if (prioDiff !== 0) return prioDiff;
        return a.full_name.localeCompare(b.full_name);
      });

      setUsers(userList);

      // Set current user info
      const currentUserInfo = userList.find(u => u.user_id === user.id);
      if (currentUserInfo) {
        setCurrentUser({
          ...currentUserInfo,
          email: user.email || "",
          role: (currentUserRole?.role || "profissional") as ClinicUser["role"],
        });
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Error in fetchUsers:", err);
      setError("Erro ao carregar usuários");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const activeUsersCount = users.filter(u => u.is_active).length;
  const canCreateUser = activeUsersCount < MAX_USERS_PER_CLINIC;
  // Only OWNER can manage users (not admin)
  const isOwner = currentUser?.role === "owner";
  const isAdmin = !!currentUser?.role && (ROLE_PRIORITY[currentUser.role] >= ROLE_PRIORITY.admin);
  // Only owner can manage users
  const canManageUsers = isOwner;

  const logAuditAction = useCallback(async (
    action: string,
    targetUserId: string | null,
    targetEmail: string | null,
    details: Record<string, any> = {}
  ) => {
    if (!clinicId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("user_audit_logs").insert({
        clinic_id: clinicId,
        action,
        target_user_id: targetUserId,
        target_email: targetEmail,
        performed_by: user.id,
        details,
      });
    } catch (err) {
      console.error("Error logging audit action:", err);
    }
  }, [clinicId]);

  const toggleUserStatus = useCallback(async (userId: string) => {
    // Only OWNER can toggle user status
    if (!canManageUsers) {
      toast.error("Apenas o proprietário pode alterar status de usuários");
      return false;
    }

    const user = users.find(u => u.user_id === userId);
    if (!user) return false;

    // OWNER PROTECTION: owner can never be deactivated
    if (isProtectedOwner(user)) {
      toast.error("O proprietário do sistema não pode ser desativado");
      return false;
    }

    if (user.is_primary_admin) {
      toast.error("O administrador principal não pode ser desativado");
      return false;
    }

    const newStatus = !user.is_active;

    // Check limit when activating
    if (newStatus && activeUsersCount >= MAX_USERS_PER_CLINIC) {
      toast.error(`Limite de ${MAX_USERS_PER_CLINIC} usuários ativos atingido`);
      return false;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: newStatus })
        .eq("user_id", userId);

      if (error) throw error;

      // Log audit action
      await logAuditAction(
        newStatus ? "user_activated" : "user_deactivated",
        userId,
        user.email,
        { full_name: user.full_name, role: user.role }
      );

      toast.success(newStatus ? "Usuário ativado" : "Usuário desativado");
      await fetchUsers();
      return true;
    } catch (err) {
      console.error("Error toggling user status:", err);
      toast.error("Erro ao alterar status do usuário");
      return false;
    }
  }, [canManageUsers, users, activeUsersCount, fetchUsers, logAuditAction]);

  const updateUserRole = useCallback(async (userId: string, newRole: ClinicUser["role"]) => {
    // Only OWNER can change roles
    if (!canManageUsers || !clinicId) {
      toast.error("Apenas o proprietário pode alterar perfis de usuários");
      return false;
    }

    const user = users.find(u => u.user_id === userId);
    if (!user) return false;

    // OWNER PROTECTION: owner can never be demoted
    if (isProtectedOwner(user)) {
      toast.error("O proprietário do sistema não pode ter seu perfil alterado");
      return false;
    }

    // Cannot promote anyone to owner (owner role is immutable)
    if (newRole as string === "owner") {
      toast.error("Não é possível promover usuários a proprietário");
      return false;
    }

    if (user.is_primary_admin && newRole !== "owner" && newRole !== "admin") {
      toast.error("O administrador principal deve manter perfil de administrador");
      return false;
    }

    const oldRole = user.role;

    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId)
        .eq("clinic_id", clinicId);

      if (error) throw error;

      // Log audit action
      await logAuditAction(
        "user_role_changed",
        userId,
        user.email,
        { full_name: user.full_name, old_role: oldRole, new_role: newRole }
      );

      toast.success("Perfil atualizado com sucesso");
      await fetchUsers();
      return true;
    } catch (err) {
      console.error("Error updating user role:", err);
      toast.error("Erro ao atualizar perfil");
      return false;
    }
  }, [canManageUsers, clinicId, users, fetchUsers, logAuditAction]);

  return {
    users,
    currentUser,
    clinicId,
    isLoading,
    error,
    refetch: fetchUsers,
    activeUsersCount,
    maxUsers: MAX_USERS_PER_CLINIC,
    canCreateUser,
    isAdmin,
    isOwner,
    canManageUsers,
    toggleUserStatus,
    updateUserRole,
  };
}

// Lightweight hook just for current user (sidebar)
export function useCurrentUser() {
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: "owner" | "admin" | "profissional" | "recepcionista";
    avatarUrl: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          setIsLoading(false);
          return;
        }

        // Get profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, clinic_id")
          .eq("user_id", authUser.id)
          .single();

        // Get role if profile exists
        let roleValue: "owner" | "admin" | "profissional" | "recepcionista" = "admin";
        
        if (profile?.clinic_id) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", authUser.id)
            .eq("clinic_id", profile.clinic_id)
            .single();
          
          if (roleData?.role) {
            roleValue = roleData.role as typeof roleValue;
          }
        }

        // Always set user data - use auth email and name from profile or email
        setUser({
          id: authUser.id,
          name: profile?.full_name || authUser.email?.split("@")[0] || "Usuário",
          email: authUser.email || "",
          role: roleValue,
          avatarUrl: profile?.avatar_url || null,
        });
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading current user:", err);
        // Even on error, try to show basic auth user info
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser({
            id: authUser.id,
            name: authUser.email?.split("@")[0] || "Usuário",
            email: authUser.email || "",
            role: "admin",
            avatarUrl: null,
          });
        }
        setIsLoading(false);
      }
    }

    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, isLoading };
}
