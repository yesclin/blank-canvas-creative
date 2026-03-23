import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "./useClinicData";
import { toast } from "sonner";

export type UserType = 'proprietario_admin' | 'profissional_saude' | 'recepcionista';
export type AppRole = 'owner' | 'admin' | 'profissional' | 'recepcionista';

export interface SystemUser {
  id: string; // profile id
  user_id: string;
  clinic_id: string;
  nome: string;
  email: string | null;
  tipo_usuario: UserType;
  app_role: AppRole;
  status_ativo: boolean;
  data_criacao: string;
  avatar_url: string | null;
  professional_id?: string | null;
}

/**
 * Maps app_role to user_type for display purposes
 */
export function mapRoleToUserType(role: AppRole): UserType {
  switch (role) {
    case 'owner':
    case 'admin':
      return 'proprietario_admin';
    case 'profissional':
      return 'profissional_saude';
    case 'recepcionista':
      return 'recepcionista';
    default:
      return 'recepcionista';
  }
}

/**
 * Maps user_type to app_role for database operations
 */
export function mapUserTypeToRole(type: UserType): AppRole {
  switch (type) {
    case 'proprietario_admin':
      return 'admin'; // New admins get 'admin' role, not 'owner'
    case 'profissional_saude':
      return 'profissional';
    case 'recepcionista':
      return 'recepcionista';
    default:
      return 'recepcionista';
  }
}

/**
 * User type labels for display
 */
export const USER_TYPE_LABELS: Record<UserType, string> = {
  'proprietario_admin': 'Proprietário/Admin',
  'profissional_saude': 'Profissional de Saúde',
  'recepcionista': 'Recepcionista',
};

/**
 * User type descriptions for display
 */
export const USER_TYPE_DESCRIPTIONS: Record<UserType, string> = {
  'proprietario_admin': 'Acesso total ao sistema. Gerencia usuários, configurações, procedimentos e relatórios. Não executa atendimento clínico.',
  'profissional_saude': 'Executa atendimentos, acessa prontuários e agenda própria. Requer especialidade clínica vinculada.',
  'recepcionista': 'Gerencia agenda e cadastros. Acesso limitado a dados clínicos.',
};

/**
 * Check if user type can have clinical specialties
 */
export function canHaveSpecialties(type: UserType): boolean {
  return type === 'profissional_saude';
}

/**
 * Check if user type can perform clinical care
 */
export function canPerformClinicalCare(type: UserType): boolean {
  return type === 'profissional_saude';
}

/**
 * Check if user type can access clinical content
 * Receptionists CANNOT access clinical content
 */
export function canAccessClinicalContent(type: UserType): boolean {
  return type !== 'recepcionista';
}

/**
 * Check if user type has full system access
 */
export function hasFullAccess(type: UserType): boolean {
  return type === 'proprietario_admin';
}

/**
 * Get allowed modules for receptionist
 */
export const RECEPTIONIST_ALLOWED_MODULES = ['agenda', 'pacientes', 'convenios'] as const;

/**
 * Get blocked modules for receptionist
 */
export const RECEPTIONIST_BLOCKED_MODULES = ['prontuario', 'configuracoes', 'relatorios', 'financeiro', 'estoque', 'comunicacao'] as const;

/**
 * Hook to fetch all users for the current clinic
 * Only active admins/owners should use this
 */
export function useClinicUsers() {
  const { clinic } = useClinicData();
  
  return useQuery({
    queryKey: ["clinic-users", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          user_id,
          clinic_id,
          full_name,
          email,
          is_active,
          created_at,
          avatar_url
        `)
        .eq("clinic_id", clinic.id)
        .order("full_name");
      
      if (profilesError) throw profilesError;
      if (!profiles) return [];
      
      // Fetch roles for these users
      const userIds = profiles.map(p => p.user_id);
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("clinic_id", clinic.id)
        .in("user_id", userIds);
      
      if (rolesError) throw rolesError;
      
      // Fetch professional info
      const { data: professionals } = await supabase
        .from("professionals")
        .select("id, user_id")
        .eq("clinic_id", clinic.id)
        .in("user_id", userIds);
      
      // Map to SystemUser format
      return profiles.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        const professional = professionals?.find(p => p.user_id === profile.user_id);
        const appRole = (userRole?.role as AppRole) || 'recepcionista';
        
        return {
          id: profile.id,
          user_id: profile.user_id,
          clinic_id: profile.clinic_id,
          nome: profile.full_name,
          email: profile.email,
          tipo_usuario: mapRoleToUserType(appRole),
          app_role: appRole,
          status_ativo: profile.is_active,
          data_criacao: profile.created_at,
          avatar_url: profile.avatar_url,
          professional_id: professional?.id || null,
        } as SystemUser;
      });
    },
    enabled: !!clinic?.id,
  });
}

/**
 * Hook to update user status (active/inactive)
 * Only owners can deactivate users
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  const { clinic } = useClinicData();
  
  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("user_id", userId)
        .eq("clinic_id", clinic?.id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clinic-users", clinic?.id] });
      toast.success(
        variables.isActive 
          ? "Usuário ativado com sucesso" 
          : "Usuário desativado com sucesso"
      );
    },
    onError: (error: Error) => {
      console.error("Error updating user status:", error);
      toast.error("Erro ao atualizar status do usuário");
    },
  });
}

/**
 * Hook to update user role
 * Only owners can change roles
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { clinic } = useClinicData();
  
  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // First delete existing role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("clinic_id", clinic?.id);
      
      // Then insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          clinic_id: clinic?.id,
          role: newRole,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-users", clinic?.id] });
      toast.success("Papel do usuário atualizado com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error updating user role:", error);
      toast.error("Erro ao atualizar papel do usuário");
    },
  });
}

/**
 * Hook to get current user info
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select(`
          id,
          user_id,
          clinic_id,
          full_name,
          email,
          is_active,
          created_at,
          avatar_url
        `)
        .eq("user_id", user.id)
        .single();
      
      if (!profile) return null;
      
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("clinic_id", profile.clinic_id)
        .single();
      
      const appRole = (roleData?.role as AppRole) || 'recepcionista';
      
      return {
        id: profile.id,
        user_id: profile.user_id,
        clinic_id: profile.clinic_id,
        nome: profile.full_name,
        email: profile.email || user.email,
        tipo_usuario: mapRoleToUserType(appRole),
        app_role: appRole,
        status_ativo: profile.is_active,
        data_criacao: profile.created_at,
        avatar_url: profile.avatar_url,
      } as SystemUser;
    },
  });
}

/**
 * Hook to check if current user can access the system
 * User must be active and have a valid clinic
 */
export function useCanAccessSystem() {
  const { data: currentUser, isLoading } = useCurrentUser();
  
  return {
    canAccess: currentUser?.status_ativo && !!currentUser?.clinic_id,
    isLoading,
    user: currentUser,
  };
}
