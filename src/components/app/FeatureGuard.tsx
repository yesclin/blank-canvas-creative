import { ReactNode } from 'react';
import { useClinicFeatures, type FeatureKey } from '@/hooks/useClinicFeatures';

interface FeatureGuardProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
  /**
   * Quando true, mostra o fallback padrão "Disponível apenas em planos
   * superiores". Se um `fallback` for passado, ele tem prioridade.
   */
  showDefaultFallback?: boolean;
}

/**
 * Esconde conteúdo quando a feature não está habilitada no plano da clínica.
 * Não exibe nada enquanto carrega (evita flash).
 */
export function FeatureGuard({
  feature,
  children,
  fallback,
  showDefaultFallback = false,
}: FeatureGuardProps) {
  const { hasFeature, loading } = useClinicFeatures();
  if (loading) return null;
  if (hasFeature(feature)) return <>{children}</>;
  if (fallback) return <>{fallback}</>;
  if (showDefaultFallback) return <DefaultUpgradeMessage />;
  return null;
}

export function DefaultUpgradeMessage() {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
      Este recurso não está disponível no seu plano atual. Fale com o suporte para fazer upgrade.
    </div>
  );
}
