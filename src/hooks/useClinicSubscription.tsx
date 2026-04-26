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
import { supabase } from '@/integrations/supabase/client';

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

async function resolveClinicId(): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return null;

  try {
    const supportClinicId =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('yesclin_support_clinic_id')
        : null;
    if (supportClinicId) {
      const { data: isAdmin } = await supabase.rpc('is_platform_admin', { _user_id: userId });
      if (isAdmin === true) return supportClinicId;
    }
  } catch {
    /* noop */
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('clinic_id')
    .eq('user_id', userId)
    .maybeSingle();
  return profile?.clinic_id ?? null;
}

async function fetchSubscription(): Promise<ClinicSubscriptionData> {
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
    await supabase.rpc('expire_overdue_trials');
  } catch {
    /* noop */
  }

  const clinicId = await resolveClinicId();
  if (!clinicId) return empty;

  const { data, error } = await supabase
    .from('clinic_subscriptions')
    .select('status, cycle, trial_ends_at, current_period_end, plan_id, subscription_plans(name, slug)')
    .eq('clinic_id', clinicId)
    .maybeSingle();

  if (error || !data) return { ...empty, clinic_id: clinicId };

  const status = data.status as SubscriptionStatus;
  const ref =
    status === 'trial' && data.trial_ends_at
      ? new Date(data.trial_ends_at)
      : data.current_period_end
        ? new Date(data.current_period_end)
        : null;
  const days =
    ref && !Number.isNaN(ref.getTime())
      ? Math.max(0, Math.ceil((ref.getTime() - Date.now()) / 86400000))
      : null;

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

  const query = useQuery({
    queryKey: ['clinic-subscription'],
    queryFn: fetchSubscription,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['clinic-subscription'] });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED'].includes(event)) invalidate();
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
    loading: query.isLoading,
    refetch: () => void query.refetch(),
  };
}
