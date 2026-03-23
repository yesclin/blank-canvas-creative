import { Building2, Users, FileText, Clock, CheckCircle, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConveniosStats as ConveniosStatsType } from "@/types/convenios";

interface ConveniosStatsProps {
  stats: ConveniosStatsType;
}

export function ConveniosStats({ stats }: ConveniosStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Convênios Ativos</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeInsurances}</div>
          <p className="text-xs text-muted-foreground">
            de {stats.totalInsurances} cadastrados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pacientes Vinculados</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPatientInsurances}</div>
          <p className="text-xs text-muted-foreground">
            carteirinhas ativas
          </p>
        </CardContent>
      </Card>

      <Card className={stats.pendingAuthorizations > 0 ? "border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Autorizações Pendentes</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingAuthorizations}</div>
          <p className="text-xs text-muted-foreground">
            aguardando resposta
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Guias em Aberto</CardTitle>
          <FileText className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.openGuides}</div>
          <p className="text-xs text-muted-foreground">
            de {stats.totalGuides} total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Guias Aprovadas</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.approvedGuides}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(stats.totalApprovedValue)} aprovado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Repasses Pendentes</CardTitle>
          <DollarSign className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.pendingFees}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(stats.totalPendingValue)} a receber
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Autorizações Aprovadas</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.approvedAuthorizations}</div>
          <p className="text-xs text-muted-foreground">
            prontas para uso
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {stats.totalGuides > 0 
              ? Math.round((stats.approvedGuides / stats.totalGuides) * 100)
              : 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            das guias
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
