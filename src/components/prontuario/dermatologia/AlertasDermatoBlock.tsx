import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, 
  Plus, 
  X,
  Syringe,
  Sun,
  ShieldAlert,
  Activity,
  AlertCircle,
  Heart,
  Pill,
  Info
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

/**
 * Tipos de alerta dermatológico
 */
export const DERMATO_ALERT_TYPES = [
  { value: 'alergia_topico', label: 'Alergia a Tópico', icon: Syringe },
  { value: 'alergia_sistemico', label: 'Alergia Sistêmica', icon: Syringe },
  { value: 'fotossensibilidade', label: 'Fotossensibilidade', icon: Sun },
  { value: 'historico_cancer_pele', label: 'Histórico de Câncer de Pele', icon: ShieldAlert },
  { value: 'condicao_cronica', label: 'Condição Crônica', icon: Activity },
  { value: 'contraindicacao', label: 'Contraindicação', icon: AlertCircle },
  { value: 'medicamento_uso', label: 'Medicamento em Uso', icon: Pill },
  { value: 'outro', label: 'Outro', icon: Info },
] as const;

export type DermatoAlertType = typeof DERMATO_ALERT_TYPES[number]['value'];

/**
 * Níveis de severidade
 */
export const DERMATO_ALERT_SEVERITY = {
  critical: {
    label: 'Crítico',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
  },
  warning: {
    label: 'Atenção',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
  },
  info: {
    label: 'Informativo',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
  },
} as const;

export type DermatoAlertSeverity = keyof typeof DERMATO_ALERT_SEVERITY;

/**
 * Registro de alerta dermatológico
 */
export interface AlertaDermatoItem {
  id: string;
  patient_id: string;
  alert_type: DermatoAlertType;
  severity: DermatoAlertSeverity;
  title: string;
  description?: string;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  created_by: string;
  created_by_name?: string;
  acknowledged_at?: string;
  acknowledged_by_name?: string;
}

interface AlertasDermatoBlockProps {
  alertas: AlertaDermatoItem[];
  loading?: boolean;
  canEdit?: boolean;
  compact?: boolean;
  onAddAlert?: () => void;
  onDismissAlert?: (alertId: string) => void;
  onAcknowledgeAlert?: (alertId: string) => void;
}

/**
 * ALERTAS DERMATOLÓGICOS
 * 
 * Exibe alertas clínicos específicos para dermatologia:
 * - Alergias a tópicos e sistêmicos
 * - Risco de fotossensibilidade
 * - Histórico de câncer de pele
 * - Condições crônicas relevantes
 * 
 * Pode ser usado no topo do prontuário (compact) ou como bloco completo.
 */
export function AlertasDermatoBlock({
  alertas,
  loading = false,
  canEdit = false,
  compact = false,
  onAddAlert,
  onDismissAlert,
  onAcknowledgeAlert,
}: AlertasDermatoBlockProps) {
  const activeAlerts = alertas.filter(a => a.is_active);
  
  const groupedAlerts = {
    critical: activeAlerts.filter(a => a.severity === 'critical'),
    warning: activeAlerts.filter(a => a.severity === 'warning'),
    info: activeAlerts.filter(a => a.severity === 'info'),
  };

  const getAlertTypeConfig = (type: string) => {
    return DERMATO_ALERT_TYPES.find(t => t.value === type) || DERMATO_ALERT_TYPES[DERMATO_ALERT_TYPES.length - 1];
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  // Compact mode for header display
  if (compact) {
    if (activeAlerts.length === 0) return null;

    const criticalCount = groupedAlerts.critical.length;
    const warningCount = groupedAlerts.warning.length;

    return (
      <div className="flex items-center gap-2 flex-wrap">
        {criticalCount > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {criticalCount} alerta(s) crítico(s)
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge variant="outline" className="border-warning/50 text-warning flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {warningCount} atenção
          </Badge>
        )}
        {groupedAlerts.critical.slice(0, 2).map(alert => (
          <Badge 
            key={alert.id} 
            variant="outline" 
            className="border-destructive/30 text-destructive text-xs"
          >
            {alert.title}
          </Badge>
        ))}
      </div>
    );
  }

  // Full block mode
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Alertas Dermatológicos
            {activeAlerts.length > 0 && (
              <Badge variant="secondary">{activeAlerts.length}</Badge>
            )}
          </CardTitle>
          {canEdit && onAddAlert && (
            <Button variant="outline" size="sm" onClick={onAddAlert}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          )}
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
              
              const config = DERMATO_ALERT_SEVERITY[severity];
              
              return (
                <div key={severity} className="space-y-2">
                  {severityAlerts.map(alert => {
                    const typeConfig = getAlertTypeConfig(alert.alert_type);
                    const IconComponent = typeConfig.icon;
                    
                    return (
                      <div
                        key={alert.id}
                        className={cn(
                          "p-3 rounded-lg border flex items-start gap-3",
                          config.bgColor,
                          config.borderColor
                        )}
                      >
                        <div className={config.color}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("font-medium", config.color)}>
                              {alert.title}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {typeConfig.label}
                            </Badge>
                          </div>
                          {alert.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {alert.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>
                              Criado em {format(parseISO(alert.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              {alert.created_by_name && ` por ${alert.created_by_name}`}
                            </span>
                            {alert.expires_at && (
                              <span>
                                • Expira em {format(parseISO(alert.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                          {alert.acknowledged_at && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              Reconhecido por {alert.acknowledged_by_name} em {format(parseISO(alert.acknowledged_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!alert.acknowledged_at && onAcknowledgeAlert && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => onAcknowledgeAlert(alert.id)}
                            >
                              Reconhecer
                            </Button>
                          )}
                          {canEdit && onDismissAlert && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => onDismissAlert(alert.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}

        {/* Quick summary by type */}
        {activeAlerts.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Resumo por tipo:</p>
            <div className="flex flex-wrap gap-2">
              {DERMATO_ALERT_TYPES.map(type => {
                const count = activeAlerts.filter(a => a.alert_type === type.value).length;
                if (count === 0) return null;
                const IconComponent = type.icon;
                return (
                  <Badge key={type.value} variant="outline" className="text-xs flex items-center gap-1">
                    <IconComponent className="h-3 w-3" />
                    {type.label}: {count}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AlertasDermatoBlock;
