import { Clock, CalendarClock, TrendingDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import type { ProfessionalIdleAlert } from "@/hooks/useIdleAgendaAlerts";

interface IdleAgendaInsightProps {
  alerts: ProfessionalIdleAlert[];
  maxAlerts?: number;
}

export function IdleAgendaInsight({ alerts, maxAlerts = 3 }: IdleAgendaInsightProps) {
  const navigate = useNavigate();
  
  if (alerts.length === 0) return null;
  
  const displayAlerts = alerts.slice(0, maxAlerts);
  const remainingCount = alerts.length - maxAlerts;
  
  const getAlertIcon = (type: ProfessionalIdleAlert['alertType']) => {
    switch (type) {
      case 'low_occupancy':
        return <TrendingDown className="h-4 w-4" />;
      case 'many_free_hours':
        return <Clock className="h-4 w-4" />;
      case 'long_idle_period':
        return <CalendarClock className="h-4 w-4" />;
    }
  };
  
  const getAlertColor = (type: ProfessionalIdleAlert['alertType']) => {
    switch (type) {
      case 'low_occupancy':
        return 'text-amber-600';
      case 'many_free_hours':
        return 'text-blue-600';
      case 'long_idle_period':
        return 'text-purple-600';
    }
  };
  
  return (
    <div className="space-y-2">
      {displayAlerts.map((alert, index) => (
        <TooltipProvider key={`${alert.professional.id}-${index}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <div className={`${getAlertColor(alert.alertType)}`}>
                    {getAlertIcon(alert.alertType)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {alert.professional.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {alert.occupancyPercent}% ocupado
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => navigate('/app/agenda')}
                  >
                    Agendar
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-2">
                <p className="font-medium">Horários livres {alert.dateLabel}:</p>
                <ul className="text-sm space-y-1">
                  {alert.idlePeriods.slice(0, 5).map((period, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {period.start} - {period.end} ({period.durationMinutes}min)
                    </li>
                  ))}
                  {alert.idlePeriods.length > 5 && (
                    <li className="text-muted-foreground">
                      +{alert.idlePeriods.length - 5} períodos...
                    </li>
                  )}
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      
      {remainingCount > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          +{remainingCount} profissiona{remainingCount === 1 ? 'l' : 'is'} com horários livres
        </p>
      )}
    </div>
  );
}
