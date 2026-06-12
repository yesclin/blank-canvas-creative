/**
 * useClinicFeatures
 * --------------------------------------------------
 * Hook global que retorna as features e limites efetivos da clínica
 * ativa (respeitando modo suporte do Super Admin).
 *
 * Fonte de verdade: view `clinic_effective_features` no Supabase, que
 * já consolida plano + overrides por clínica.
 *
 * Cache: React Query (staleTime 5min, refetch on window focus).
 * Reativo a:
 *  - login/logout
 *  - troca de modo suporte (custom event + storage)
 */
import { createContext, ReactNode, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/lib/asyncTimeout';
import { useActiveClinicScope } from '@/hooks/useActiveClinicScope';

type ClinicScope = { userId: string | null; clinicId: string | null };

async function fetchClinicFeatures(scope: ClinicScope | null | undefined): Promise<ClinicFeaturesData> {
  const empty: ClinicFeaturesData = {
    features: { ...DEFAULT_FEATURES },
    limits: { ...DEFAULT_LIMITS },
    subscription_status: null,
    plan_name: null,
    plan_slug: null,
    clinic_id: null,
  };

  const clinicId = scope?.clinicId ?? null;
  if (!clinicId) return empty;

  const { data, error } = await withTimeout<any>(supabase
    .from('clinic_effective_features')
    .select('*')
    .eq('clinic_id', clinicId)
    .maybeSingle());

  if (error || !data) {
    // Sem assinatura ainda → sem features. Mantém clinic_id para gates por clínica.
    return { ...empty, clinic_id: clinicId };
  }

  const features = { ...DEFAULT_FEATURES };
  (Object.keys(DEFAULT_FEATURES) as FeatureKey[]).forEach((k) => {
    features[k] = Boolean(data[k]);
  });

  const limits = { ...DEFAULT_LIMITS };
  (Object.keys(DEFAULT_LIMITS) as LimitKey[]).forEach((k) => {
    const v = data[k];
    limits[k] = v === null || v === undefined ? null : Number(v);
  });

  return {
    features,
    limits,
    subscription_status: data.subscription_status ?? null,
    plan_name: data.plan_name ?? null,
    plan_slug: data.plan_slug ?? null,
    clinic_id: clinicId,
  };
}

interface ClinicFeaturesContextValue extends ClinicFeaturesData {
  loading: boolean;
  hasFeature: (key: FeatureKey) => boolean;
  refetch: () => void;
}

const ClinicFeaturesContext = createContext<ClinicFeaturesContextValue | null>(null);

export function ClinicFeaturesProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { userId: authUserId, isLoading: authIdentityLoading } = useAuthIdentity();

  const { data: scope } = useQuery({
    queryKey: ['clinic-features-scope', authUserId],
    queryFn: () => resolveActiveClinicScope(authUserId!),
    enabled: !authIdentityLoading && !!authUserId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    throwOnError: false,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['clinic-effective-features', scope?.userId ?? null, scope?.clinicId ?? null],
    queryFn: () => fetchClinicFeatures(scope),
    enabled: !!scope?.userId,
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    throwOnError: false,
  });

  // Reagir a mudanças de auth e de modo suporte
  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-features-scope'] });
      queryClient.invalidateQueries({ queryKey: ['clinic-effective-features'] });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // TOKEN_REFRESHED não muda identidade nem clínica — invalidar aqui
      // causa refetch em background enquanto o usuário usa o sistema.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        if (import.meta.env.DEV) console.log('[CLINIC_FEATURES] invalidando por auth', { event });
        setTimeout(() => invalidate(), 0);
      }
    });

    const onSupport = () => invalidate();
    if (typeof window !== 'undefined') {
      window.addEventListener('yesclin:support-session-changed', onSupport);
    }

    return () => {
      sub.subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('yesclin:support-session-changed', onSupport);
      }
    };
  }, [queryClient]);

  const value: ClinicFeaturesContextValue = {
    features: data?.features ?? { ...DEFAULT_FEATURES },
    limits: data?.limits ?? { ...DEFAULT_LIMITS },
    subscription_status: data?.subscription_status ?? null,
    plan_name: data?.plan_name ?? null,
    plan_slug: data?.plan_slug ?? null,
    clinic_id: data?.clinic_id ?? null,
    loading: authIdentityLoading || isLoading,
    hasFeature: (key) => Boolean(data?.features?.[key]),
    refetch: () => {
      void refetch();
    },
  };

  return (
    <ClinicFeaturesContext.Provider value={value}>
      {children}
    </ClinicFeaturesContext.Provider>
  );
}

export function useClinicFeatures() {
  const ctx = useContext(ClinicFeaturesContext);
  if (!ctx) {
    throw new Error('useClinicFeatures deve ser usado dentro de <ClinicFeaturesProvider>');
  }
  return ctx;
}

/**
 * Helper utilitário para verificar se a clínica pode criar mais um recurso
 * de determinado tipo (profissionais, pacientes, especialidades, agendamentos...).
 *
 * - Se o limite for null → ilimitado.
 * - Se currentCount >= limite → bloqueia.
 */
export type ResourceType =
  | 'professionals'
  | 'patients'
  | 'specialties'
  | 'appointments_monthly'
  | 'whatsapp_instances';

const RESOURCE_TO_LIMIT: Record<ResourceType, LimitKey> = {
  professionals: 'max_professionals',
  patients: 'max_patients',
  specialties: 'max_specialties',
  appointments_monthly: 'max_appointments_monthly',
  whatsapp_instances: 'max_whatsapp_instances',
};

export function canCreateResource(
  type: ResourceType,
  currentCount: number,
  limits: Record<LimitKey, number | null>,
): { allowed: boolean; limit: number | null; remaining: number | null } {
  const limit = limits[RESOURCE_TO_LIMIT[type]];
  if (limit === null || limit === undefined) {
    return { allowed: true, limit: null, remaining: null };
  }
  const remaining = Math.max(0, limit - currentCount);
  return { allowed: currentCount < limit, limit, remaining };
}
