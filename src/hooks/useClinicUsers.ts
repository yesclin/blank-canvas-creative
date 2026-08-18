import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { withTimeout } from "@/lib/asyncTimeout";
import { logAuthDiagnostic } from "@/lib/authDiagnostics";
import { useActiveClinicScope } from "@/hooks/useActiveClinicScope";
import { useClinicFeatures } from "@/hooks/useClinicFeatures";

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

interface ClinicUsersBackendUser {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  role: ClinicUser["role"];
  status: "active" | "inactive";
  clinic_id: string;
  avatar_url: string | null;
  created_at: string;
}

interface ClinicUsersBackendResponse {
  users: ClinicUsersBackendUser[];
}

// Não há limite hardcoded: o limite de usuários ativos vem do plano da
// clínica (view clinic_effective_features → max_professionals). `null`
// significa ilimitado (ex.: plano Clínica).


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
  const requestRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const reqId = ++requestRef.current;
    const stillCurrent = (expectedUserId: string | null) =>
      reqId === requestRef.current && (expectedUserId === null || activeUserIdRef.current === expectedUserId);

    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await withTimeout<any>(supabase.auth.getUser());
      if (!user) {
        activeUserIdRef.current = null;
        if (stillCurrent(null)) {
          setUsers([]);
          setCurrentUser(null);
          setClinicId(null);
          setError("Usuário não autenticado");
          setIsLoading(false);
        }
        return;
      }
      const expectedUserId = user.id;
      activeUserIdRef.current = expectedUserId;

      // Get user's clinic
      const { data: profile } = await withTimeout<any>(supabase
        .from("profiles")
        .select("clinic_id, user_id, full_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle());

      if (!stillCurrent(expectedUserId)) return;

      if (!profile?.clinic_id || profile.user_id !== expectedUserId) {
        setError("Clínica não encontrada");
        setIsLoading(false);
        return;
      }

      setClinicId(profile.clinic_id);

      // Get current user's role
      const { data: currentUserRole } = await withTimeout<any>(supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("clinic_id", profile.clinic_id)
        .maybeSingle());

      if (!stillCurrent(expectedUserId)) return;

      // FONTE PRIMÁRIA: profiles + user_roles da própria clínica (RLS garante o
      // isolamento por clinic_id). O e-mail vem de profiles.email, mantido em
      // sincronia com o Auth. A Edge Function protegida é apenas um
      // ENRIQUECIMENTO opcional para e-mails ausentes — se ela falhar, a lista
      // continua sendo exibida e o erro real é registrado no console.
      const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] = await Promise.all([
        withTimeout<any>(
          supabase
            .from("profiles")
            .select("id, user_id, clinic_id, full_name, email, avatar_url, is_active, created_at")
            .eq("clinic_id", profile.clinic_id)
            .order("full_name"),
        ),
        withTimeout<any>(
          supabase
            .from("user_roles")
            .select("user_id, role")
            .eq("clinic_id", profile.clinic_id),
        ),
      ]);

      if (!stillCurrent(expectedUserId)) return;

      if (profilesError || rolesError) {
        console.error("Error fetching clinic users:", profilesError ?? rolesError);
        setError(
          `Erro ao carregar usuários: ${(profilesError ?? rolesError)?.message ?? "falha desconhecida"}`,
        );
        setIsLoading(false);
        return;
      }

      const roleByUserId = new Map<string, ClinicUser["role"]>(
        (roles ?? []).map((r: any) => [r.user_id, r.role as ClinicUser["role"]]),
      );

      const emailByUserId = new Map<string, string>();
      (profiles ?? []).forEach((p: any) => {
        if (p.email) emailByUserId.set(p.user_id, p.email);
      });

      // Enriquecimento de e-mails faltantes via Edge Function (service_role
      // somente no servidor). Falha aqui NUNCA derruba a listagem.
      const missingEmails = (profiles ?? []).some((p: any) => !p.email);
      if (missingEmails) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token;
          if (accessToken) {
            const { data: enrich, error: enrichError } = await withTimeout<{
              data: ClinicUsersBackendResponse | null;
              error: unknown;
            }>(
              supabase.functions.invoke("list-clinic-users", {
                headers: { Authorization: `Bearer ${accessToken}` },
              }),
              12000,
            );
            if (enrichError) {
              console.warn("[useClinicUsers] enriquecimento de e-mails falhou:", enrichError);
            } else {
              (enrich?.users ?? []).forEach((u) => {
                if (u.email) emailByUserId.set(u.user_id, u.email);
              });
            }
          }
        } catch (enrichErr) {
          console.warn("[useClinicUsers] enriquecimento de e-mails indisponível:", enrichErr);
        }
        if (!stillCurrent(expectedUserId)) return;
      }

      // Get clinic creation info to identify primary admin
      const { data: clinic } = await withTimeout<any>(supabase
        .from("clinics")
        .select("created_at")
        .eq("id", profile.clinic_id)
        .maybeSingle());

      if (!stillCurrent(expectedUserId)) return;

      // Build user list
      const userList: ClinicUser[] = (profiles ?? []).map((p: any) => {
        const role = (roleByUserId.get(p.user_id) ?? "profissional") as ClinicUser["role"];

        // The first owner/admin created with the clinic is the primary admin
        const isElevated = ROLE_PRIORITY[role] >= ROLE_PRIORITY.admin;
        const isPrimaryAdmin = isElevated && (
          ROLE_PRIORITY[role] === ROLE_PRIORITY.owner || p.created_at === clinic?.created_at
        );

        return {
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name ?? "Usuário",
          email: emailByUserId.get(p.user_id) ?? "",
          role,
          is_active: p.is_active !== false,
          avatar_url: p.avatar_url ?? null,
          clinic_id: p.clinic_id,
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

      if (!stillCurrent(expectedUserId)) return;
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

      if (stillCurrent(expectedUserId)) setIsLoading(false);
    } catch (err) {
      if (reqId !== requestRef.current) return;
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
      const { data: { user } } = await withTimeout<any>(supabase.auth.getUser());
      if (!user) return;

      await withTimeout<any>(supabase.from("user_audit_logs").insert({
        clinic_id: clinicId,
        action,
        target_user_id: targetUserId,
        target_email: targetEmail,
        performed_by: user.id,
        details,
      }));
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
//
// CONTRATO DE SEGURANÇA:
//  - Nome, role e clínica só são exibidos se vierem confirmados do banco
//    para o auth.uid() atual.
//  - Em qualquer falha/timeout/perfil-faltando, retorna user=null + error.
//    NUNCA fabrica "Usuário/Administrador" a partir do prefixo do e-mail —
//    isso causava o bug "Arthur Lopes vira yi4405/Administrador" quando
//    a query de profile/role estourava timeout durante refresh de sessão.
export function useCurrentUser() {
  const { scope, isLoading } = useActiveClinicScope();
  const hasCompleteProfile = Boolean(scope.userId && scope.role && scope.profileName);
  const user = hasCompleteProfile ? {
    id: scope.userId!,
    name: scope.profileName!,
    email: scope.profileEmail || "",
    role: scope.role!,
    avatarUrl: scope.profileAvatarUrl || null,
  } : null;

  useEffect(() => {
    if (!user || !import.meta.env.DEV) return;
    logAuthDiagnostic("sidebar-display-applied", {
      authUid: user.id,
      profileUserId: user.id,
      roleUserId: user.id,
      activeClinicId: scope.clinicId,
      displaySource: "useActiveClinicScope -> useCurrentUser",
    });
  }, [user, scope.clinicId]);

  return {
    user,
    isLoading,
    error: !isLoading && scope.userId && !hasCompleteProfile ? "profile-or-role-missing" : null,
    reload: () => { /* cache compartilhado pelo useActiveClinicScope */ },
  };
}

