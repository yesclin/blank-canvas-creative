import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  AlertTriangle, 
  Info, 
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgendaInsight } from "@/types/agenda";

interface AgendaInsightsProps {
  insights: AgendaInsight[];
  onInsightAction?: (insight: AgendaInsight) => void;
}

export function AgendaInsights({ insights, onInsightAction }: AgendaInsightsProps) {
  const getInsightIcon = (type: AgendaInsight['type']) => {
    switch (type) {
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
      case 'suggestion':
        return Lightbulb;
    }
  };

  const getInsightStyles = (type: AgendaInsight['type']) => {
    switch (type) {
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
      case 'suggestion':
        return {
          border: 'border-green-200 dark:border-green-800',
          bg: 'bg-green-50 dark:bg-green-950/30',
          icon: 'text-green-600',
          badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        };
    }
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Insights da Agenda</CardTitle>
        </div>
        <CardDescription>
          Alertas e sugestões inteligentes baseados nos dados da agenda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => {
          const Icon = getInsightIcon(insight.type);
          const styles = getInsightStyles(insight.type);
          
          return (
            <div 
              key={insight.id}
              className={cn(
                "p-4 rounded-lg border",
                styles.border,
                styles.bg
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5", styles.icon)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{insight.title}</h4>
                    <Badge variant="secondary" className={cn("text-xs", styles.badge)}>
                      {insight.type === 'warning' && 'Atenção'}
                      {insight.type === 'info' && 'Informação'}
                      {insight.type === 'suggestion' && 'Sugestão'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {insight.description}
                  </p>
                  <p className="text-sm">
                    💡 {insight.recommendation}
                  </p>
                  
                  {insight.action && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="px-0 mt-2"
                      onClick={() => onInsightAction?.(insight)}
                    >
                      {insight.action.label}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
