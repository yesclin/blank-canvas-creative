import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  AlertTriangle, 
  TrendingDown, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  Package,
  Info,
  ExternalLink,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useStockAlerts, type StockAlert } from "@/hooks/useStockPredictionAlerts";
import { useNavigate } from "react-router-dom";

interface StockPredictionAlertsProps {
  compact?: boolean;
  maxItems?: number;
  showHeader?: boolean;
  className?: string;
}

export function StockPredictionAlerts({ 
  compact = false, 
  maxItems = 5,
  showHeader = true,
  className 
}: StockPredictionAlertsProps) {
  const navigate = useNavigate();
  const { alerts, criticalCount, warningCount, totalCount, isLoading, enabled, predictionDays } = useStockAlerts();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  const toggleExpanded = (productId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };
  
  if (!enabled) return null;
  
  if (isLoading) {
    return (
      <Card className={cn("border-muted", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (alerts.length === 0) return null;
  
  const displayAlerts = maxItems ? alerts.slice(0, maxItems) : alerts;
  const hasMore = alerts.length > displayAlerts.length;
  
  const getSeverityStyles = (severity: StockAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          border: 'border-red-200 dark:border-red-800',
          bg: 'bg-red-50 dark:bg-red-950/30',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
      case 'warning':
        return {
          border: 'border-amber-200 dark:border-amber-800',
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          icon: 'text-amber-600',
          badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
        };
      case 'info':
        return {
          border: 'border-blue-200 dark:border-blue-800',
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        };
    }
  };
  
  const getSeverityIcon = (severity: StockAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return AlertTriangle;
      case 'warning':
        return TrendingDown;
      case 'info':
        return Info;
    }
  };
  
  const cardBorderClass = criticalCount > 0 
    ? 'border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20' 
    : warningCount > 0 
      ? 'border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/20'
      : '';

  return (
    <Card className={cn(cardBorderClass, className)}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Previsão de Estoque</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <Badge variant="destructive">{criticalCount} crítico{criticalCount > 1 ? 's' : ''}</Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="outline" className="border-amber-500 text-amber-600">
                  {warningCount} alerta{warningCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            Projeção de consumo para os próximos {predictionDays} dias com base na agenda
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent className={cn("space-y-3", !showHeader && "pt-4")}>
        {displayAlerts.map((alert) => {
          const styles = getSeverityStyles(alert.severity);
          const Icon = getSeverityIcon(alert.severity);
          const isExpanded = expandedItems.has(alert.product_id);
          
          return (
            <Collapsible 
              key={alert.product_id}
              open={isExpanded}
              onOpenChange={() => toggleExpanded(alert.product_id)}
            >
              <div className={cn(
                "rounded-lg border p-3",
                styles.border,
                styles.bg
              )}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-start gap-3 cursor-pointer">
                    <div className={cn("mt-0.5", styles.icon)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">{alert.product_name}</h4>
                          <Badge variant="secondary" className={cn("text-xs", styles.badge)}>
                            {alert.severity === 'critical' && 'Crítico'}
                            {alert.severity === 'warning' && 'Atenção'}
                            {alert.severity === 'info' && 'Informativo'}
                          </Badge>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <span>
                          Atual: <strong>{alert.current_stock}</strong> {alert.product_unit}
                        </span>
                        <span>
                          Consumo previsto: <strong>{alert.predicted_consumption}</strong>
                        </span>
                        <span>
                          Projeção: <strong className={alert.projected_stock < 0 ? 'text-red-600' : ''}>
                            {alert.projected_stock}
                          </strong>
                        </span>
                      </div>
                      
                      {alert.first_shortage_date && (
                        <p className="text-sm text-red-600 mt-1 font-medium">
                          ⚠️ Falta prevista em {format(parseISO(alert.first_shortage_date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  {alert.impacting_procedures.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-current/10">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Procedimentos que consomem este produto:
                      </p>
                      <div className="space-y-1">
                        {alert.impacting_procedures.map((proc, idx) => (
                          <div 
                            key={`${proc.procedure_id}-${idx}`}
                            className="flex items-center justify-between text-sm bg-background/50 rounded px-2 py-1"
                          >
                            <span>{proc.procedure_name}</span>
                            <span className="text-muted-foreground">
                              {proc.quantity} {alert.product_unit}/execução
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
        
        {hasMore && (
          <Button 
            variant="ghost" 
            className="w-full" 
            size="sm"
            onClick={() => navigate('/app/gestao/estoque')}
          >
            Ver todos os {totalCount} alertas
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
