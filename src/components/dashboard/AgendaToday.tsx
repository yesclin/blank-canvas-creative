import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Star, 
  UserPlus, 
  DollarSign,
  Play,
  CheckCircle,
  XCircle,
  Timer,
  Zap
} from 'lucide-react';
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

export function AgendaToday({ appointments, stats, period = 'today' }: AgendaTodayProps) {
  const navigate = useNavigate();

  const getStatusIcon = (status: DashboardAppointment['status']) => {
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
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {periodTitles[period]}
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Redireciona para agenda filtrada pelo dia atual
              const today = new Date().toISOString().split('T')[0];
              navigate(`/app/agenda?date=${today}`);
            }}
          >
            Ver completa
          </Button>
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-bold text-primary">{stats.totalAppointments}</span>
            </div>
            <span className="text-muted-foreground">Total</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="font-bold text-green-600">{stats.completedAppointments}</span>
            </div>
            <span className="text-muted-foreground">Realizados</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="font-bold text-blue-600">{stats.remainingAppointments}</span>
            </div>
            <span className="text-muted-foreground">Restantes</span>
          </div>
          {stats.absences > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <span className="font-bold text-red-600">{stats.absences}</span>
              </div>
              <span className="text-muted-foreground">Faltas</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="px-6 pb-4 space-y-2">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className={`
                  p-3 rounded-lg border transition-colors cursor-pointer
                  hover:bg-muted/50
                  ${appointment.status === 'em_atendimento' ? 'bg-purple-50/50 border-purple-200' : ''}
                  ${appointment.status === 'faltou' ? 'opacity-60' : ''}
                `}
                onClick={() => navigate(`/app/prontuario/${appointment.patient_id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Time Column */}
                  <div className="flex-shrink-0 text-center">
                    <div 
                      className="w-1 h-full absolute left-0 top-0 rounded-l"
                      style={{ backgroundColor: appointment.professional_color }}
                    />
                    <div className="text-sm font-bold text-foreground">
                      {appointment.time}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {appointment.end_time}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground truncate">
                        {appointment.patient_name}
                      </span>
                      
                      {/* Indicators */}
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
                      {appointment.is_recurring && (
                        <Star className="h-3 w-3 text-amber-500" />
                      )}
                      {appointment.has_pending_payment && (
                        <DollarSign className="h-3 w-3 text-orange-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: appointment.professional_color }}
                      />
                      <span>{appointment.professional_name}</span>
                      <span>•</span>
                      <span>{appointment.procedure_name || appointmentTypeLabels[appointment.appointment_type]}</span>
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
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${statusColors[appointment.status]}`}
                    >
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
            ))}
            
            {appointments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Nenhum atendimento agendado</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
