import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClinicFeatures, type FeatureKey } from '@/hooks/useClinicFeatures';

interface ProtectedFeatureRouteProps {
  feature: FeatureKey;
  children: ReactNode;
  /**
   * Se informado, redireciona em vez de exibir a tela de upgrade.
   * Ex.: redirectTo="/app".
   */
  redirectTo?: string;
}

/**
 * Bloqueia uma rota inteira quando a feature não está habilitada no plano.
 * Por padrão, mostra uma tela de upgrade dentro do AppLayout.
 */
export function ProtectedFeatureRoute({
  feature,
  children,
  redirectTo,
}: ProtectedFeatureRouteProps) {
  const { hasFeature, loading, plan_name } = useClinicFeatures();
  void plan_name;
  const location = useLocation();

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (hasFeature(feature)) return <>{children}</>;

  if (redirectTo) return <Navigate to={redirectTo} replace state={{ from: location }} />;

  return <FeatureUpgradeScreen feature={feature} planName={plan_name} />;
}

function FeatureUpgradeScreen({
  feature,
  planName,
}: {
  feature: FeatureKey;
  planName: string | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Lock className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Recurso indisponível no seu plano
      </h1>
      <p className="text-muted-foreground max-w-md mb-6">
        Este recurso não está disponível no seu plano atual. Fale com o suporte para fazer upgrade.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <a href="/app/assinatura">
            Ver planos
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="mailto:suporte@yesclin.com.br?subject=Upgrade%20de%20plano">
            Falar com o suporte
          </a>
        </Button>
      </div>
    </div>
  );
}
