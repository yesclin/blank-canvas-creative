/**
 * Hook central do módulo Super Admin (SaaS).
 *
 * Verifica se o usuário logado é um Platform Admin (tabela platform_admins).
 * Esta verificação é independente do RBAC de clínica (owner/admin/etc).
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformAdminState {
  isPlatformAdmin: boolean;
  loading: boolean;
  userId: string | null;
  email: string | null;
  totalAdmins: number | null;
  refresh: () => Promise<void>;
}

export function usePlatformAdmin(): PlatformAdminState {
  const [state, setState] = useState<Omit<PlatformAdminState, 'refresh'>>({
    isPlatformAdmin: false,
    loading: true,
    userId: null,
    email: null,
    totalAdmins: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        setState({ isPlatformAdmin: false, loading: false, userId: null, email: null, totalAdmins: null });
        return;
      }

      const [{ data: isAdmin }, { data: total }] = await Promise.all([
        supabase.rpc('is_platform_admin', { _user_id: user.id }),
        supabase.rpc('count_platform_admins'),
      ]);

      setState({
        isPlatformAdmin: isAdmin === true,
        loading: false,
        userId: user.id,
        email: user.email ?? null,
        totalAdmins: typeof total === 'number' ? total : 0,
      });
    } catch (e) {
      console.error('[usePlatformAdmin] error:', e);
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => subscription.unsubscribe();
  }, [load]);

  return { ...state, refresh: load };
}
