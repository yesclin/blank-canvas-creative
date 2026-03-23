import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle,
  Skull,
  Users,
  Eye,
  Lock,
} from "lucide-react";
import type { AlertaPsicologia, TipoAlertaPsicologia } from "./AlertasPsicologiaBlock";

interface AlertasBannerPsicologiaProps {
  alertas: AlertaPsicologia[];
  onViewAlerts?: () => void;
}

const typeLabels: Record<TipoAlertaPsicologia, string> = {
  risco_autoagressao: 'Risco Autoagressão',
  risco_social: 'Risco Social',
  atencao_especial: 'Atenção Especial',
  medicacao: 'Medicação',
  outro: 'Alerta',
};

/**
 * Banner de Alertas Psicologia - exibido no topo do prontuário
 * 
 * Destaca de forma sensível:
 * - Risco de autoagressão (vermelho)
 * - Risco social (âmbar)
 * - Atenção especial (azul)
 */
export function AlertasBannerPsicologia({ 
  alertas, 
  onViewAlerts 
}: AlertasBannerPsicologiaProps) {
  const activeAlertas = alertas.filter(a => a.is_active);
  
  if (activeAlertas.length === 0) return null;

  // Check for high-risk alerts
  const hasRiscoAutoagressao = activeAlertas.some(a => a.alert_type === 'risco_autoagressao');
  const hasRiscoSocialCritico = activeAlertas.some(
    a => a.alert_type === 'risco_social' && a.severity === 'critical'
  );
  const hasHighRisk = hasRiscoAutoagressao || hasRiscoSocialCritico;

  // Determine banner style based on severity
  const bannerStyle = hasRiscoAutoagressao 
    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
    : hasRiscoSocialCritico
    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
    : 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800';

  const iconColor = hasRiscoAutoagressao
    ? 'text-red-600 dark:text-red-400'
    : hasRiscoSocialCritico
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-purple-600 dark:text-purple-400';

  // Group alerts by type
  const alertsByType = activeAlertas.reduce((acc, alert) => {
    if (!acc[alert.alert_type]) {
      acc[alert.alert_type] = [];
    }
    acc[alert.alert_type].push(alert);
    return acc;
  }, {} as Record<TipoAlertaPsicologia, AlertaPsicologia[]>);

  return (
    <div 
      className={`rounded-lg border p-3 ${bannerStyle} cursor-pointer transition-colors hover:opacity-90`}
      onClick={onViewAlerts}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`mt-0.5 ${iconColor}`}>
          {hasRiscoAutoagressao ? (
            <Skull className="h-5 w-5" />
          ) : hasRiscoSocialCritico ? (
            <Users className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`font-medium text-sm ${iconColor}`}>
              Alertas Clínicos
            </span>
            <Badge variant="outline" className="text-xs bg-white/50 dark:bg-black/20">
              <Lock className="h-3 w-3 mr-1" />
              Acesso Restrito
            </Badge>
          </div>

          {/* Alert badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {alertsByType.risco_autoagressao && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                <Skull className="h-3 w-3 mr-1" />
                {alertsByType.risco_autoagressao.length} {typeLabels.risco_autoagressao}
              </Badge>
            )}
            {alertsByType.risco_social && (
              <Badge className="text-xs bg-amber-500 hover:bg-amber-600">
                <Users className="h-3 w-3 mr-1" />
                {alertsByType.risco_social.length} {typeLabels.risco_social}
              </Badge>
            )}
            {alertsByType.atencao_especial && (
              <Badge variant="secondary" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                {alertsByType.atencao_especial.length} {typeLabels.atencao_especial}
              </Badge>
            )}
            {(alertsByType.medicacao || alertsByType.outro) && (
              <Badge variant="outline" className="text-xs">
                +{(alertsByType.medicacao?.length || 0) + (alertsByType.outro?.length || 0)} outro(s)
              </Badge>
            )}
          </div>
        </div>

        {/* Click hint */}
        <span className="text-xs text-muted-foreground hidden sm:block">
          Clique para ver
        </span>
      </div>
    </div>
  );
}
