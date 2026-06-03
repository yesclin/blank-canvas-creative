/**
 * Hook central do módulo Super Admin (SaaS).
 *
 * Verifica se o usuário logado é um Platform Admin (tabela platform_admins).
 * Esta verificação é independente do RBAC de clínica (owner/admin/etc).
 *
 * Implementado em cima de React Query para que múltiplos consumidores
 * (Layout, ProtectedRoute, páginas) compartilhem o mesmo cache. Isso evita
 * o spinner central reaparecer a cada navegação interna do /super-admin.
 */
import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/lib/asyncTimeout';
import { useAuthIdentity } from '@/hooks/useAuthIdentity';

interface PlatformAdminState {
  isPlatformAdmin: boolean;
  loading: boolean;
  userId: string | null;
  email: string | null;
  totalAdmins: number | null;
  refresh: () => Promise<void>;
}

interface PlatformAdminData {
  isPlatformAdmin: boolean;
  userId: string | null;
  email: string | null;
  totalAdmins: number | null;
}

async function fetchPlatformAdmin(expectedUserId: string): Promise<PlatformAdminData> {
  const { data: auth } = await withTimeout<any>(supabase.auth.getUser());
  const user = auth?.user;
  if (!user || user.id !== expectedUserId) {
    if (user?.id && user.id !== expectedUserId) {
      console.error('[AUTH_SECURITY] platform-admin descartado por auth.uid divergente', {
        queryUserId: expectedUserId,
        currentUserId: user.id,
      });
    }
    return { isPlatformAdmin: false, userId: null, email: null, totalAdmins: null };
  }
  const [{ data: isAdmin }, { data: total }] = await Promise.all([
    withTimeout<any>(supabase.rpc('is_platform_admin', { _user_id: user.id })),
    withTimeout<any>(supabase.rpc('count_platform_admins')),
  ]);
  return {
    isPlatformAdmin: isAdmin === true,
    userId: user.id,
    email: user.email ?? null,
    totalAdmins: typeof total === 'number' ? total : 0,
  };
}

// Chave estável compartilhada entre todos os consumidores.
const PLATFORM_ADMIN_KEY = ['platform-admin', 'me'] as const;

export function usePlatformAdmin(): PlatformAdminState {
  const queryClient = useQueryClient();
  const { userId: authUserId, isLoading: authIdentityLoading } = useAuthIdentity();

  const query = useQuery({
    queryKey: [...PLATFORM_ADMIN_KEY, authUserId],
    queryFn: () => fetchPlatformAdmin(authUserId!),
    enabled: !authIdentityLoading && !!authUserId,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        queryClient.removeQueries({ queryKey: PLATFORM_ADMIN_KEY });
      }
      // TOKEN_REFRESHED / INITIAL_SESSION: ignorar — não invalidar nem
      // mostrar loading global; o cache atual continua válido.
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: PLATFORM_ADMIN_KEY });
    await query.refetch();
  }, [queryClient, query]);

  const data = query.data;
  return {
    isPlatformAdmin: data?.isPlatformAdmin ?? false,
    loading: authIdentityLoading || (query.isLoading && !!authUserId && !data),
    userId: data?.userId ?? null,
    email: data?.email ?? null,
    totalAdmins: data?.totalAdmins ?? null,
    refresh,
  };
}
