import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, UserCog, CalendarDays, Activity, AlertTriangle, Wallet, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalClinics: number;
  activeClinics: number;
  trialClinics: number;
  blockedClinics: number;
  canceledClinics: number;
  newClinicsThisMonth: number;
  totalUsers: number;
  totalProfessionals: number;
  totalPatients: number;
  appointmentsThisMonth: number;
  recentErrors: number;
  monthlyRecurringRevenue: number;
  topPlans: Array<{ name: string; count: number }>;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const isoStart = startOfMonth.toISOString();

        const [
          totalClinics,
          newClinics,
          subs,
          users,
          professionals,
          patients,
          appts,
          errors,
          plans,
        ] = await Promise.all([
          supabase.from('clinics').select('id', { count: 'exact', head: true }),
          supabase.from('clinics').select('id', { count: 'exact', head: true }).gte('created_at', isoStart),
          supabase.from('clinic_subscriptions').select('status, contracted_amount, plan_id'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('professionals').select('id', { count: 'exact', head: true }),
          supabase.from('patients').select('id', { count: 'exact', head: true }),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('scheduled_date', startOfMonth.toISOString().slice(0, 10)),
          supabase.from('system_occurrences').select('id', { count: 'exact', head: true }).in('status', ['novo', 'em_analise']),
          supabase.from('subscription_plans').select('id, name'),
        ]);

        if (cancelled) return;

        const subsData = subs.data ?? [];
        const planMap = new Map((plans.data ?? []).map((p: any) => [p.id, p.name as string]));
        const counters = subsData.reduce(
          (acc: any, s: any) => {
            acc[s.status] = (acc[s.status] ?? 0) + 1;
            if (['active', 'trial', 'overdue'].includes(s.status) && s.contracted_amount) {
              acc.mrr += Number(s.contracted_amount);
            }
            const planName = planMap.get(s.plan_id);
            if (planName) acc.byPlan[planName] = (acc.byPlan[planName] ?? 0) + 1;
            return acc;
          },
          { active: 0, trial: 0, overdue: 0, blocked: 0, canceled: 0, mrr: 0, byPlan: {} as Record<string, number> }
        );

        const topPlans = Object.entries(counters.byPlan)
          .map(([name, count]) => ({ name, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        setStats({
          totalClinics: totalClinics.count ?? 0,
          activeClinics: counters.active,
          trialClinics: counters.trial,
          blockedClinics: counters.blocked,
          canceledClinics: counters.canceled,
          newClinicsThisMonth: newClinics.count ?? 0,
          totalUsers: users.count ?? 0,
          totalProfessionals: professionals.count ?? 0,
          totalPatients: patients.count ?? 0,
          appointmentsThisMonth: appts.count ?? 0,
          recentErrors: errors.count ?? 0,
          monthlyRecurringRevenue: counters.mrr,
          topPlans,
        });
      } catch (e) {
        console.error('[SuperAdminDashboard] load error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('pt-BR').format(n);
  const fmtMoney = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard da plataforma</h1>
        <p className="text-sm text-muted-foreground">Visão consolidada de clínicas, uso e receita.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total de clínicas" value={fmt(stats?.totalClinics ?? 0)} icon={Building2} loading={loading} />
        <MetricCard label="Clínicas ativas" value={fmt(stats?.activeClinics ?? 0)} icon={Activity} loading={loading} />
        <MetricCard label="Em trial" value={fmt(stats?.trialClinics ?? 0)} icon={Package} loading={loading} />
        <MetricCard label="Bloqueadas" value={fmt(stats?.blockedClinics ?? 0)} icon={AlertTriangle} loading={loading} />

        <MetricCard label="Canceladas" value={fmt(stats?.canceledClinics ?? 0)} icon={AlertTriangle} loading={loading} />
        <MetricCard label="Novas no mês" value={fmt(stats?.newClinicsThisMonth ?? 0)} icon={Building2} loading={loading} />
        <MetricCard label="Usuários" value={fmt(stats?.totalUsers ?? 0)} icon={Users} loading={loading} />
        <MetricCard label="Profissionais" value={fmt(stats?.totalProfessionals ?? 0)} icon={UserCog} loading={loading} />

        <MetricCard label="Pacientes" value={fmt(stats?.totalPatients ?? 0)} icon={Users} loading={loading} />
        <MetricCard label="Agendamentos no mês" value={fmt(stats?.appointmentsThisMonth ?? 0)} icon={CalendarDays} loading={loading} />
        <MetricCard label="Ocorrências em aberto" value={fmt(stats?.recentErrors ?? 0)} icon={AlertTriangle} loading={loading} />
        <MetricCard label="MRR previsto" value={fmtMoney(stats?.monthlyRecurringRevenue ?? 0)} icon={Wallet} loading={loading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Planos mais utilizados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-20" />
          ) : stats && stats.topPlans.length > 0 ? (
            <ul className="space-y-2">
              {stats.topPlans.map((p) => (
                <li key={p.name} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground">{fmt(p.count)} clínica(s)</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sem assinaturas ativas ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
