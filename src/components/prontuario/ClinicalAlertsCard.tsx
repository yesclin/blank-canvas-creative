import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Bell, 
  Plus, 
  X,
  Pill,
  Syringe,
  HeartPulse,
  FileSearch,
  RotateCcw,
  Ban
} from "lucide-react";
import { ClinicalAlert, alertSeverityConfig, alertTypeLabels, AlertType } from "@/types/prontuario";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClinicalAlertsCardProps {
  alerts: ClinicalAlert[];
  onAddAlert?: () => void;
  onDismissAlert?: (alertId: string) => void;
}

const alertTypeIcons: Record<AlertType, React.ReactNode> = {
  allergy: <Syringe className="h-4 w-4" />,
  medication: <Pill className="h-4 w-4" />,
  disease: <HeartPulse className="h-4 w-4" />,
  exam: <FileSearch className="h-4 w-4" />,
  return: <RotateCcw className="h-4 w-4" />,
  contraindication: <Ban className="h-4 w-4" />,
  other: <Bell className="h-4 w-4" />,
};

export function ClinicalAlertsCard({ alerts, onAddAlert, onDismissAlert }: ClinicalAlertsCardProps) {
  const activeAlerts = alerts.filter(a => a.is_active);
  const groupedAlerts = {
    critical: activeAlerts.filter(a => a.severity === 'critical'),
    warning: activeAlerts.filter(a => a.severity === 'warning'),
    info: activeAlerts.filter(a => a.severity === 'info'),
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Alertas Clínicos
            {activeAlerts.length > 0 && (
              <Badge variant="secondary">{activeAlerts.length}</Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onAddAlert}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeAlerts.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhum alerta ativo
          </p>
        ) : (
          <>
            {(['critical', 'warning', 'info'] as const).map(severity => {
              const severityAlerts = groupedAlerts[severity];
              if (severityAlerts.length === 0) return null;
              
              const config = alertSeverityConfig[severity];
              
              return (
                <div key={severity} className="space-y-2">
                  {severityAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${config.bgColor} flex items-start gap-3`}
                    >
                      <div className={config.color}>
                        {alertTypeIcons[alert.alert_type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${config.color}`}>
                            {alert.title}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {alertTypeLabels[alert.alert_type]}
                          </Badge>
                        </div>
                        {alert.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {alert.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Criado em {format(parseISO(alert.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      {onDismissAlert && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onDismissAlert(alert.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
}
