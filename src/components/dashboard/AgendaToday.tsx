import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  AlertTriangle,
  Star,
  UserPlus,
  DollarSign,
  Play,
  CheckCircle,
  XCircle,
  Timer,
  Zap,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DashboardAppointment, DashboardStats, DashboardPeriod } from '@/types/dashboard';
import { statusLabels, statusColors, appointmentTypeLabels } from '@/types/dashboard';
import { useNavigate } from 'react-router-dom';

interface AgendaTodayProps {
  appointments: DashboardAppointment[];
  stats: DashboardStats;
  period?: DashboardPeriod;
}

const periodTitles: Record<DashboardPeriod, string> = {
  today: 'Agenda do Dia',
  week: 'Agenda da Semana',
  month: 'Agenda do Mês',
};

const typeBadgeColors: Record<DashboardAppointment['appointment_type'], string> = {
  consulta: 'bg-blue-50 border-blue-200 text-blue-700',
  retorno: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  procedimento: 'bg-violet-50 border-violet-200 text-violet-700',
  encaixe: 'bg-amber-50 border-amber-200 text-amber-700',
};

function getStatusIcon(status: DashboardAppointment['status']) {
  switch (status) {
    case 'em_atendimento':
      return <Play className="h-3 w-3" />;
    case 'finalizado':
      return <CheckCircle className="h-3 w-3" />;
    case 'faltou':
      return <XCircle className="h-3 w-3" />;
    case 'chegou':
      return <Timer className="h-3 w-3" />;
    default:
      return null;
  }
}

interface GroupedAppointments {
  key: string;
  label: string;
  sublabel?: string;
  items: DashboardAppointment[];
}

function groupAppointments(
  appointments: DashboardAppointment[],
  period: DashboardPeriod
): GroupedAppointments[] {
  if (period === 'today') {
    return [{ key: 'today', label: '', items: appointments }];
  }

  const groups = new Map<string, GroupedAppointments>();

  for (const apt of appointments) {
    if (!apt.scheduled_date) continue;
    const date = parseISO(apt.scheduled_date);
    let key: string;
    let label: string;
    let sublabel: string | undefined;

    if (period === 'week') {
      key = apt.scheduled_date;
      label = format(date, 'EEEE', { locale: ptBR }).toUpperCase();
      sublabel = format(date, "dd/MM", { locale: ptBR });
    } else {
      // month
      key = apt.scheduled_date;
      label = format(date, 'dd/MM', { locale: ptBR });
      sublabel = format(date, 'EEEE', { locale: ptBR });
    }

    if (!groups.has(key)) {
      groups.set(key, { key, label, sublabel, items: [] });
    }
    groups.get(key)!.items.push(apt);
  }

  return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key));
}

export function AgendaToday({ appointments, stats, period = 'today' }: AgendaTodayProps) {
  const navigate = useNavigate();

  const grouped = useMemo(() => groupAppointments(appointments, period), [appointments, period]);

  const handleVerCompleta = () => {
    const today = new Date().toISOString().split('T')[0];
    navigate(`/app/agenda?date=${today}`);
  };

  const renderAppointment = (appointment: DashboardAppointment) => (
    <div
      key={appointment.id}
      className={`
        p-3 rounded-lg border transition-colors cursor-pointer relative
        hover:bg-muted/50
        ${appointment.status === 'em_atendimento' ? 'bg-purple-50/50 border-purple-200' : ''}
        ${appointment.status === 'faltou' ? 'opacity-60' : ''}
      `}
      onClick={() => navigate(`/app/prontuario/${appointment.patient_id}`)}
    >
      <div
        className="w-1 absolute left-0 top-2 bottom-2 rounded-l"
        style={{ backgroundColor: appointment.professional_color }}
      />
      <div className="flex items-start justify-between gap-3 pl-2">
        {/* Time Column */}
        <div className="flex-shrink-0 text-center min-w-[48px]">
          <div className="text-sm font-bold text-foreground">{appointment.time}</div>
          <div className="text-xs text-muted-foreground">{appointment.end_time}</div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-foreground truncate">
              {appointment.patient_name}
            </span>

            {/* Type Badge - SEMPRE VISÍVEL */}
            <Badge
              variant="outline"
              className={`text-xs ${typeBadgeColors[appointment.appointment_type]}`}
            >
              {appointmentTypeLabels[appointment.appointment_type]}
            </Badge>

            {appointment.is_first_visit && (
              <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-300 text-yellow-700">
                <UserPlus className="h-3 w-3 mr-1" />
                1ª consulta
              </Badge>
            )}
            {appointment.has_clinical_alert && (
              <Badge variant="outline" className="text-xs bg-red-50 border-red-300 text-red-700">
                <AlertTriangle className="h-3 w-3" />
              </Badge>
            )}
            {appointment.is_recurring && <Star className="h-3 w-3 text-amber-500" />}
            {appointment.has_pending_payment && (
              <DollarSign className="h-3 w-3 text-orange-500" />
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: appointment.professional_color }}
            />
            <span>{appointment.professional_name}</span>
            {appointment.procedure_name && (
              <>
                <span>•</span>
                <span>{appointment.procedure_name}</span>
              </>
            )}
            {appointment.insurance_name && (
              <>
                <span>•</span>
                <span className="text-primary">{appointment.insurance_name}</span>
              </>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0">
          <Badge variant="outline" className={`text-xs ${statusColors[appointment.status]}`}>
            {getStatusIcon(appointment.status)}
            <span className="ml-1">{statusLabels[appointment.status]}</span>
          </Badge>
          {appointment.appointment_type === 'encaixe' && (
            <Badge variant="outline" className="text-xs ml-1 bg-amber-50 border-amber-300 text-amber-700">
              <Zap className="h-3 w-3" />
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  const totalLabel =
    period === 'today' ? 'Hoje' : period === 'week' ? 'Semana' : 'Mês';

  const kpis = [
    {
      label: totalLabel,
      value: stats.totalAppointments,
      bg: 'bg-primary/10',
      text: 'text-primary',
    },
    {
      label: 'Confirmados',
      value: stats.confirmedAppointments,
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
    },
    {
      label: 'Não confirmados',
      value: stats.unconfirmedAppointments,
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
    },
    {
      label: 'Faltas',
      value: stats.absences,
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {periodTitles[period]}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleVerCompleta}>
            Ver completa
          </Button>
        </div>

        {/* KPI Row - dinâmico por período */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className={`flex items-center gap-2 rounded-md px-2.5 py-2 ${kpi.bg}`}
            >
              <span className={`text-lg font-bold ${kpi.text}`}>{kpi.value}</span>
              <span className="text-xs text-muted-foreground leading-tight">
                {kpi.label}
              </span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="px-6 pb-4 space-y-4">
            {appointments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Nenhum atendimento agendado</p>
              </div>
            )}

            {period === 'today'
              ? (
                <div className="space-y-2">
                  {appointments.map(renderAppointment)}
                </div>
              )
              : grouped.map((group) => (
                <div key={group.key} className="space-y-2">
                  {/* Group Header */}
                  <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-1.5 border-b flex items-baseline gap-2">
                    <span className="text-xs font-bold tracking-wider text-foreground">
                      {group.label}
                    </span>
                    {group.sublabel && (
                      <span className="text-xs text-muted-foreground capitalize">
                        {group.sublabel}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {group.items.length} atendimento{group.items.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.items.map(renderAppointment)}
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
