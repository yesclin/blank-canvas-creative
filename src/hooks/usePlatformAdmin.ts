/**
 * Hook central do módulo Super Admin (SaaS).
 *
 * Verifica se o usuário logado é um Platform Admin (tabela platform_admins).
 * Esta verificação é independente do RBAC de clínica (owner/admin/etc).
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/lib/asyncTimeout';

interface PlatformAdminState {
  isPlatformAdmin: boolean;
  loading: boolean;
  userId: string | null;
  email: string | null;
  totalAdmins: number | null;
  refresh: () => Promise<void>;
}

export function usePlatformAdmin(): PlatformAdminState {
  const requestRef = useRef(0);
  const [state, setState] = useState<Omit<PlatformAdminState, 'refresh'>>({
    isPlatformAdmin: false,
    loading: true,
    userId: null,
    email: null,
    totalAdmins: null,
  });

  const load = useCallback(async () => {
    const reqId = ++requestRef.current;
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data: auth } = await withTimeout<any>(supabase.auth.getUser());
      const user = auth?.user;
      if (!user) {
        if (reqId !== requestRef.current) return;
        setState({ isPlatformAdmin: false, loading: false, userId: null, email: null, totalAdmins: null });
        return;
      }

      const [{ data: isAdmin }, { data: total }] = await Promise.all([
        withTimeout<any>(supabase.rpc('is_platform_admin', { _user_id: user.id })),
        withTimeout<any>(supabase.rpc('count_platform_admins')),
      ]);

      if (reqId !== requestRef.current) return;
      setState({
        isPlatformAdmin: isAdmin === true,
        loading: false,
        userId: user.id,
        email: user.email ?? null,
        totalAdmins: typeof total === 'number' ? total : 0,
      });
    } catch (e) {
      if (reqId !== requestRef.current) return;
      console.error('[usePlatformAdmin] error:', e);
      setState({ isPlatformAdmin: false, loading: false, userId: null, email: null, totalAdmins: null });
    }
  }, []);

  useEffect(() => {
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        requestRef.current++;
        setState({ isPlatformAdmin: false, loading: false, userId: null, email: null, totalAdmins: null });
        return;
      }
      requestRef.current++;
      setState({ isPlatformAdmin: false, loading: true, userId: null, email: null, totalAdmins: null });
      setTimeout(() => load(), 0);
    });
    return () => subscription.unsubscribe();
  }, [load]);

  return { ...state, refresh: load };
}
