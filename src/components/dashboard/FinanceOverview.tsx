import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Wallet, Target, CreditCard, Building2, Lock } from 'lucide-react';
import { useFinancialAccessControl } from '@/hooks/useFinancialAccessControl';
import type { DashboardFinance } from '@/types/dashboard';

interface FinanceOverviewProps {
  finance: DashboardFinance;
}

export function FinanceOverview({ finance }: FinanceOverviewProps) {
  const { canViewRevenue, canViewCost, isLoading } = useFinancialAccessControl();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const particularPercent = finance.month.accumulated > 0 
    ? Math.round((finance.month.particular / finance.month.accumulated) * 100)
    : 0;

  // Se não tem permissão para ver faturamento, mostra mensagem de acesso restrito
  if (!isLoading && !canViewRevenue) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Visão Financeira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Você não tem permissão para visualizar dados financeiros.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Visão Financeira
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Today's Finance */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            Hoje
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-green-50 border border-green-100">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Previsto</span>
              </div>
              <div className="text-lg font-bold text-green-700">
                {formatCurrency(finance.today.expected)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <CreditCard className="h-4 w-4" />
                <span className="text-xs font-medium">Recebido</span>
              </div>
              <div className="text-lg font-bold text-blue-700">
                {formatCurrency(finance.today.received)}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">A receber</span>
            <span className="font-medium text-orange-600">
              {formatCurrency(finance.today.pending)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ticket médio</span>
            <span className="font-medium">
              {formatCurrency(finance.today.ticketAverage)}
            </span>
          </div>
        </div>

        {/* Month's Finance */}
        <div className="space-y-3 pt-3 border-t">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            Mês Atual
          </h4>
          
          {/* Goal Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span>Meta mensal</span>
              </div>
              <span className="font-medium">{finance.month.goalPercent}%</span>
            </div>
            <Progress value={finance.month.goalPercent} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(finance.month.accumulated)}</span>
              <span>{formatCurrency(finance.month.goal)}</span>
            </div>
          </div>

          {/* Particular vs Convênio */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-600" />
                <span>Particular</span>
              </div>
              <span className="font-medium text-green-600">
                {formatCurrency(finance.month.particular)} ({particularPercent}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span>Convênios</span>
              </div>
              <span className="font-medium text-blue-600">
                {formatCurrency(finance.month.convenio)} ({100 - particularPercent}%)
              </span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-muted">
              <div 
                className="bg-green-500 transition-all"
                style={{ width: `${particularPercent}%` }}
              />
              <div 
                className="bg-blue-500 transition-all"
                style={{ width: `${100 - particularPercent}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
