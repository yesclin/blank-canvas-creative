import { useMarketingDashboard } from "@/hooks/useMarketingDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarCheck, UserX, Cake, Clock, CheckCircle,
  Send, AlertCircle, MessageCircle, Users,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MarketingPainel() {
  const { data, isLoading } = useMarketingDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Message Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={MessageCircle} label="Mensagens Preparadas" value={data.totalPrepared} variant="default" />
        <StatCard icon={Send} label="Enviadas" value={data.totalSent} variant="success" />
        <StatCard icon={Clock} label="Pendentes" value={data.totalPending} variant="warning" />
        <StatCard icon={AlertCircle} label="Com Falha" value={data.totalFailed} variant="destructive" />
      </div>

      {/* Operational Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tomorrow Appointments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              Consultas Amanhã
              <Badge variant="secondary" className="ml-auto">{data.patientsWithAppointmentTomorrow.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[200px]">
              {data.patientsWithAppointmentTomorrow.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma consulta amanhã</p>
              ) : (
                <div className="space-y-2">
                  {data.patientsWithAppointmentTomorrow.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground">{p.professional_name}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">{p.start_time?.substring(0, 5)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Birthdays This Month */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cake className="h-4 w-4 text-pink-500" />
              Aniversariantes do Mês
              <Badge variant="secondary" className="ml-auto">{data.birthdaysThisMonth.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[200px]">
              {data.birthdaysThisMonth.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum aniversariante</p>
              ) : (
                <div className="space-y-2">
                  {data.birthdaysThisMonth.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                      <p className="font-medium truncate">{p.full_name}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {p.birth_date ? format(parseISO(p.birth_date), "dd/MM", { locale: ptBR }) : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Absences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserX className="h-4 w-4 text-destructive" />
              Faltas Recentes (30 dias)
              <Badge variant="secondary" className="ml-auto">{data.recentAbsences.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[200px]">
              {data.recentAbsences.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma falta recente</p>
              ) : (
                <div className="space-y-2">
                  {data.recentAbsences.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                      <p className="font-medium truncate">{p.full_name}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {format(parseISO(p.scheduled_date), "dd/MM", { locale: ptBR })}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* No Return + Completed Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Sem Retorno 30d" value={data.patientsNoReturn30} variant="warning" />
        <StatCard icon={Users} label="Sem Retorno 60d" value={data.patientsNoReturn60} variant="warning" />
        <StatCard icon={Users} label="Sem Retorno 90d" value={data.patientsNoReturn90} variant="destructive" />
        <StatCard icon={CheckCircle} label="Finalizados Hoje" value={data.completedToday} variant="success" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, variant }: {
  icon: React.ElementType;
  label: string;
  value: number;
  variant: 'default' | 'success' | 'warning' | 'destructive';
}) {
  const colors = {
    default: 'text-muted-foreground',
    success: 'text-green-600',
    warning: 'text-amber-600',
    destructive: 'text-destructive',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${colors[variant]}`} />
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
