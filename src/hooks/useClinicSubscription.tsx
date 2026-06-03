/**
 * useClinicSubscription
 * --------------------------------------------------
 * Estado da assinatura da clínica ativa: status, ciclo, plano, trial.
 * - Roda `expire_overdue_trials()` no login (idempotente).
 * - Expõe `canMutate` (false quando overdue/canceled/blocked).
 * - Reativo a auth + modo suporte.
 */
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/lib/asyncTimeout';
import { logAuthDiagnostic } from '@/lib/authDiagnostics';
import { useAuthIdentity } from '@/hooks/useAuthIdentity';

export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'overdue'
  | 'blocked'
  | 'canceled';

export interface ClinicSubscriptionData {
  clinic_id: string | null;
  status: SubscriptionStatus | null;
  cycle: 'monthly' | 'yearly' | null;
  plan_name: string | null;
  plan_slug: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  days_remaining: number | null;
  canMutate: boolean;
}

type ClinicScope = { userId: string | null; clinicId: string | null };

async function resolveClinicScope(expectedUserId: string): Promise<ClinicScope> {
  const { data: auth } = await withTimeout<any>(supabase.auth.getUser(), 10000, 'Tempo esgotado ao carregar sessão.');
  const userId = auth?.user?.id;
  if (!userId || userId !== expectedUserId) return { userId: null, clinicId: null };

  try {
    const supportClinicId =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('yesclin_support_clinic_id')
        : null;
    const supportAdminUserId =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('yesclin_support_admin_user_id')
        : null;
    if (supportClinicId && supportAdminUserId === userId) {
      const { data: isAdmin } = await withTimeout<any>(
        supabase.rpc('is_platform_admin', { _user_id: userId }),
        10000,
        'Tempo esgotado ao validar suporte.'
      );
      if (isAdmin === true) return { userId, clinicId: supportClinicId };
    }
  } catch {
    /* noop */
  }

  const { data: profile } = await withTimeout<any>(supabase
    .from('profiles')
    .select('clinic_id, user_id')
    .eq('user_id', userId)
    .maybeSingle(), 10000, 'Tempo esgotado ao carregar perfil.');
  const clinicId = profile?.user_id === userId ? profile?.clinic_id ?? null : null;
  logAuthDiagnostic('clinic-subscription-scope', { authUid: userId, profileUserId: profile?.user_id ?? null, activeClinicId: clinicId });
  return { userId, clinicId };
}

async function fetchSubscription(scope: ClinicScope | null | undefined): Promise<ClinicSubscriptionData> {
  const empty: ClinicSubscriptionData = {
    clinic_id: null,
    status: null,
    cycle: null,
    plan_name: null,
    plan_slug: null,
    trial_ends_at: null,
    current_period_end: null,
    days_remaining: null,
    canMutate: true,
  };

  // Tenta expirar trials vencidos antes de ler. Falha silenciosa.
  try {
    await withTimeout<any>(supabase.rpc('expire_overdue_trials'), 10000, 'Tempo esgotado ao verificar assinatura.');
  } catch {
    /* noop */
  }

  const clinicId = scope?.clinicId ?? null;
  if (!clinicId) return empty;

  const { data, error } = await withTimeout<any>(supabase
    .from('clinic_subscriptions')
    .select('status, cycle, trial_ends_at, current_period_end, plan_id, subscription_plans(name, slug)')
    .eq('clinic_id', clinicId)
    .maybeSingle(), 10000, 'Tempo esgotado ao carregar assinatura.');

  if (error || !data) return { ...empty, clinic_id: clinicId };

  const status = data.status as SubscriptionStatus;
  // Dias restantes em dias-de-calendário locais.
  // Usamos startOfDay para que o resultado NÃO dependa da hora atual:
  // só muda quando o relógio cruza a meia-noite local.
  const refIso =
    status === 'trial' && data.trial_ends_at
      ? data.trial_ends_at
      : data.current_period_end ?? null;

  let days: number | null = null;
  if (refIso) {
    const refDate = parseISO(refIso);
    if (!Number.isNaN(refDate.getTime())) {
      days = Math.max(0, differenceInCalendarDays(startOfDay(refDate), startOfDay(new Date())));
    }
  }

  return {
    clinic_id: clinicId,
    status,
    cycle: data.cycle as 'monthly' | 'yearly',
    plan_name: data.subscription_plans?.name ?? null,
    plan_slug: data.subscription_plans?.slug ?? null,
    trial_ends_at: data.trial_ends_at,
    current_period_end: data.current_period_end,
    days_remaining: days,
    canMutate: !['overdue', 'canceled', 'blocked'].includes(status),
  };
}

export function useClinicSubscription() {
  const queryClient = useQueryClient();
  const { userId: authUserId, isLoading: authIdentityLoading } = useAuthIdentity();

  const { data: scope } = useQuery({
    queryKey: ['clinic-subscription-scope', authUserId],
    queryFn: () => resolveClinicScope(authUserId!),
    enabled: !authIdentityLoading && !!authUserId,
    staleTime: 0,
    gcTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    throwOnError: false,
  });

  const query = useQuery({
    queryKey: ['clinic-subscription', scope?.userId ?? null, scope?.clinicId ?? null],
    queryFn: () => fetchSubscription(scope),
    enabled: !!scope?.userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    throwOnError: false,
  });

  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-subscription-scope'] });
      queryClient.invalidateQueries({ queryKey: ['clinic-subscription'] });
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // TOKEN_REFRESHED / INITIAL_SESSION não trocam clínica — ignorar para
      // evitar refetch em background da assinatura enquanto o usuário usa o app.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setTimeout(() => invalidate(), 0);
      }
    });
    const onSupport = () => invalidate();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'yesclin_support_clinic_id') invalidate();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('yesclin:support-session-changed', onSupport);
      window.addEventListener('storage', onStorage);
    }
    return () => {
      sub.subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('yesclin:support-session-changed', onSupport);
        window.removeEventListener('storage', onStorage);
      }
    };
  }, [queryClient]);

  return {
    ...(query.data ?? ({
      clinic_id: null,
      status: null,
      cycle: null,
      plan_name: null,
      plan_slug: null,
      trial_ends_at: null,
      current_period_end: null,
      days_remaining: null,
      canMutate: true,
    } satisfies ClinicSubscriptionData)),
    loading: authIdentityLoading || query.isLoading,
    refetch: () => void query.refetch(),
  };
}
