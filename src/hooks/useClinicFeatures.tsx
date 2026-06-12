/**
 * useClinicFeatures
 * --------------------------------------------------
 * Hook global que retorna as features e limites efetivos da clínica
 * ativa (respeitando modo suporte do Super Admin).
 *
 * Fonte de verdade: view `clinic_effective_features` no Supabase, que
 * já consolida plano + overrides por clínica.
 *
 * O escopo (userId/clinicId) vem do `useActiveClinicScope` compartilhado,
 * evitando que este hook dispare seus próprios `profiles`/`user_roles`.
 */
import { createContext, ReactNode, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/lib/asyncTimeout';
import { useActiveClinicScope } from '@/hooks/useActiveClinicScope';

/**
 * Flags de plano (controlam módulos administrativos/comerciais).
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

async function fetchClinicFeatures(clinicId: string | null): Promise<ClinicFeaturesData> {
  const empty: ClinicFeaturesData = {
    features: { ...DEFAULT_FEATURES },
    limits: { ...DEFAULT_LIMITS },
    subscription_status: null,
    plan_name: null,
    plan_slug: null,
    clinic_id: null,
  };

  if (!clinicId) return empty;

  const { data, error } = await withTimeout<any>(supabase
    .from('clinic_effective_features')
    .select('*')
    .eq('clinic_id', clinicId)
    .maybeSingle());

  if (error || !data) {
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
  const { scope, isLoading: scopeLoading } = useActiveClinicScope();
  const clinicId = scope.clinicId;
  const userId = scope.userId;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['clinic-effective-features', userId, clinicId],
    queryFn: () => fetchClinicFeatures(clinicId),
    enabled: !scopeLoading && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
    throwOnError: false,
  });

  const value: ClinicFeaturesContextValue = {
    features: data?.features ?? { ...DEFAULT_FEATURES },
    limits: data?.limits ?? { ...DEFAULT_LIMITS },
    subscription_status: data?.subscription_status ?? null,
    plan_name: data?.plan_name ?? null,
    plan_slug: data?.plan_slug ?? null,
    clinic_id: data?.clinic_id ?? null,
    loading: scopeLoading || (isLoading && !data),
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
