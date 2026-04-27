import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useClinicSubscription } from '@/hooks/useClinicSubscription';
import { ErrorBoundary } from './ErrorBoundary';

const ROUTES_ALWAYS_ALLOWED = ['/app/assinatura', '/app'];

/**
 * Bloqueia o app quando a assinatura está overdue/canceled/blocked,
 * exceto na rota de assinatura e no dashboard (leitura).
 * Também exibe um banner discreto durante o trial.
 */
export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      scope="SubscriptionGate"
      showHome={false}
      fallback={() => <>{children}</>}
    >
      <SubscriptionGateInner>{children}</SubscriptionGateInner>
    </ErrorBoundary>
  );
}

function SubscriptionGateInner({ children }: { children: React.ReactNode }) {
  let sub: ReturnType<typeof useClinicSubscription>;
  try {
    sub = useClinicSubscription();
  } catch (error) {
    console.error('[PROVIDER_ERROR] SubscriptionGate', error);
    return <>{children}</>;
  }
  const navigate = useNavigate();
  const location = useLocation();

  if (sub.loading) return <>{children}</>;

  const blocked = !sub.canMutate && sub.status !== null;
  const onAllowedRoute = ROUTES_ALWAYS_ALLOWED.some(
    (r) => location.pathname === r || location.pathname.startsWith(`${r}/`),
  );

  // Trial ativo: banner informativo
  if (sub.status === 'trial' && sub.days_remaining !== null) {
    return (
      <>
        <div className="border-b border-border bg-primary/10 px-4 py-2 text-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span>
                Você está no <strong>período de teste</strong>. Restam{' '}
                <strong>{sub.days_remaining} {sub.days_remaining === 1 ? 'dia' : 'dias'}</strong>.
              </span>
            </div>
            <Button size="sm" onClick={() => navigate('/app/assinatura')}>
              Assinar agora
            </Button>
          </div>
        </div>
        {children}
      </>
    );
  }

  // Bloqueado e tentando acessar rota não permitida → tela de bloqueio
  if (blocked && !onAllowedRoute) {
    return <SubscriptionBlockedScreen status={sub.status!} />;
  }

  // Bloqueado mas em rota permitida (dashboard/assinatura): apenas alerta
  if (blocked) {
    return (
      <>
        <div className="px-4 pt-4">
          <Alert variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>
                Seu período de teste expirou. Escolha um plano para continuar utilizando o YesClin.
              </span>
              <Button size="sm" variant="outline" onClick={() => navigate('/app/assinatura')}>
                Ver planos
              </Button>
            </AlertDescription>
          </Alert>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}

function SubscriptionBlockedScreen({ status }: { status: string }) {
  const navigate = useNavigate();
  const message =
    status === 'canceled'
      ? 'Sua assinatura foi cancelada.'
      : status === 'blocked'
        ? 'Sua clínica está temporariamente bloqueada.'
        : 'Seu período de teste expirou.';

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <Lock className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">{message}</h1>
      <p className="mb-6 max-w-md text-muted-foreground">
        Escolha um plano para continuar utilizando o YesClin. Suas informações estão preservadas e
        ficarão disponíveis assim que a assinatura for ativada.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => navigate('/app/assinatura')}>
          Ver planos
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => navigate('/app')}>
          Voltar ao painel
        </Button>
      </div>
    </div>
  );
}
