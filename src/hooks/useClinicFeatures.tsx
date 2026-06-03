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
import { logAuthDiagnostic } from '@/lib/authDiagnostics';
import { useAuthIdentity } from '@/hooks/useAuthIdentity';

/**
 * Flags de plano (controlam módulos administrativos/comerciais).
 * IMPORTANTE: recursos clínicos próprios de uma especialidade
 * (odontograma, mapa facial, etc.) NÃO são gateados por plano —
 * são liberados pela especialidade ativa da clínica.
 */
export type FeatureKey =
  | 'feature_whatsapp'
  | 'feature_teleconsulta'
  | 'feature_crm'
  | 'feature_marketing'
  | 'feature_automations'
  | 'feature_inventory'
  | 'feature_insurances'
  | 'feature_advanced_reports'
  | 'feature_audit'
  | 'feature_priority_support';

export type LimitKey =
  | 'max_professionals'
  | 'max_patients'
  | 'max_specialties'
  | 'max_appointments_monthly'
  | 'max_whatsapp_instances';

export interface ClinicFeaturesData {
  features: Record<FeatureKey, boolean>;
  limits: Record<LimitKey, number | null>;
  subscription_status: string | null;
  plan_name: string | null;
  plan_slug: string | null;
  clinic_id: string | null;
}

const DEFAULT_FEATURES: Record<FeatureKey, boolean> = {
  feature_whatsapp: false,
  feature_teleconsulta: false,
  feature_crm: false,
  feature_marketing: false,
  feature_automations: false,
  feature_inventory: false,
  feature_insurances: false,
  feature_advanced_reports: false,
  feature_audit: false,
  feature_priority_support: false,
};

const DEFAULT_LIMITS: Record<LimitKey, number | null> = {
  max_professionals: null,
  max_patients: null,
  max_specialties: null,
  max_appointments_monthly: null,
  max_whatsapp_instances: null,
};

type ClinicScope = { userId: string | null; clinicId: string | null };

async function resolveActiveClinicScope(expectedUserId: string): Promise<ClinicScope> {
  const { data: auth } = await withTimeout<any>(supabase.auth.getUser());
  const userId = auth?.user?.id;
  if (!userId || userId !== expectedUserId) return { userId: null, clinicId: null };

  // Modo suporte (impersonação): se admin de plataforma e há clinic_id
  // em localStorage, usar essa clínica.
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
      const { data: isAdmin } = await withTimeout<any>(supabase.rpc('is_platform_admin', {
        _user_id: userId,
      }));
      if (isAdmin === true) return { userId, clinicId: supportClinicId };
    }
  } catch {
    // ignora — segue para clinic_id natural
  }

  const { data: profile } = await withTimeout<any>(supabase
    .from('profiles')
    .select('clinic_id, user_id')
    .eq('user_id', userId)
    .maybeSingle());

  const clinicId = profile?.user_id === userId ? profile?.clinic_id ?? null : null;
  logAuthDiagnostic('clinic-features-scope', { authUid: userId, profileUserId: profile?.user_id ?? null, activeClinicId: clinicId });
  return { userId, clinicId };
}

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
    staleTime: 0,
    gcTime: 60 * 1000,
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
