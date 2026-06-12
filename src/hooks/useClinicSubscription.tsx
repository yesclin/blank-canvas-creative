/**
 * useClinicSubscription
 * --------------------------------------------------
 * Estado da assinatura da clínica ativa: status, ciclo, plano, trial.
 * - Roda `expire_overdue_trials()` no login (idempotente).
 * - Expõe `canMutate` (false quando overdue/canceled/blocked).
 * - Reativo a auth + modo suporte via `useActiveClinicScope`.
 */
import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/lib/asyncTimeout';
import { useActiveClinicScope } from '@/hooks/useActiveClinicScope';

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

async function fetchSubscription(clinicId: string | null): Promise<ClinicSubscriptionData> {
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

  if (!clinicId) return empty;

  const { data, error } = await withTimeout<any>(supabase
    .from('clinic_subscriptions')
    .select('status, cycle, trial_ends_at, current_period_end, plan_id, subscription_plans(name, slug)')
    .eq('clinic_id', clinicId)
    .maybeSingle(), 10000, 'Tempo esgotado ao carregar assinatura.');

  if (error || !data) return { ...empty, clinic_id: clinicId };

  const status = data.status as SubscriptionStatus;
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
  const { scope, isLoading: scopeLoading } = useActiveClinicScope();
  const clinicId = scope.clinicId;
  const userId = scope.userId;

  const query = useQuery({
    queryKey: ['clinic-subscription', userId, clinicId],
    queryFn: () => fetchSubscription(clinicId),
    enabled: !scopeLoading && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
    throwOnError: false,
  });

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
    loading: scopeLoading || (query.isLoading && !query.data),
    refetch: () => void query.refetch(),
  };
}
