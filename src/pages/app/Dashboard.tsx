import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardRealData } from '@/hooks/useDashboardRealData';
import { GreetingCard } from '@/components/dashboard/GreetingCard';
import { AgendaToday } from '@/components/dashboard/AgendaToday';
import { FinanceOverview } from '@/components/dashboard/FinanceOverview';
import { InsightsCard } from '@/components/dashboard/InsightsCard';
import { TeamStatus } from '@/components/dashboard/TeamStatus';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { OnboardingBanner } from '@/components/onboarding/OnboardingBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { StockPredictionAlerts } from '@/components/estoque/StockPredictionAlerts';
import type { DashboardPeriod } from '@/types/dashboard';

export default function Dashboard() {
  const {
    period,
    setPeriod,
    appointments,
    finance,
    professionals,
    insights,
    stats,
    greeting,
    isLoading,
  } = useDashboardRealData();

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <OnboardingBanner />
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <Skeleton className="h-24 flex-1" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Skeleton className="h-[500px]" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Onboarding Banner */}
      <OnboardingBanner />

      {/* Header with Greeting and Period Filter */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1">
          <GreetingCard 
            text={greeting.text}
            userName={greeting.userName}
            context={greeting.context}
          />
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as DashboardPeriod)}>
            <TabsList>
              <TabsTrigger value="today">Hoje</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Grid Layout - 60/40 */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column - 60% (3 of 5 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Agenda do Dia */}
          <AgendaToday 
            appointments={appointments} 
            stats={stats}
            period={period}
          />
        </div>

        {/* Right Column - 40% (2 of 5 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <QuickActions />
          
          {/* Stock Prediction Alerts */}
          <StockPredictionAlerts compact maxItems={3} />
          
          {/* Visão Financeira */}
          <FinanceOverview finance={finance} />
          
          {/* Insights Inteligentes */}
          <InsightsCard insights={insights} />
          
          {/* Visão da Equipe */}
          <TeamStatus professionals={professionals} />
        </div>
      </div>
    </div>
  );
}
