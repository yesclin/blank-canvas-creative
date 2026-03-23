import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle, 
  Info,
  ArrowRight
} from 'lucide-react';
import type { DashboardInsight } from '@/types/dashboard';
import { useNavigate } from 'react-router-dom';

interface InsightsCardProps {
  insights: DashboardInsight[];
}

export function InsightsCard({ insights }: InsightsCardProps) {
  const navigate = useNavigate();

  const getInsightIcon = (type: DashboardInsight['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getInsightBg = (type: DashboardInsight['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-destructive/10 border-destructive/30';
      case 'warning':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800';
      case 'opportunity':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'info':
        return 'bg-muted border-border';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          O que merece atenção hoje?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.slice(0, 4).map((insight) => (
          <div
            key={insight.id}
            className={`p-3 rounded-lg border ${getInsightBg(insight.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-foreground">
                    {insight.title}
                  </h4>
                  {insight.value && (
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {insight.value}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {insight.description}
                </p>
                {insight.action && insight.link && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-1 text-xs"
                    onClick={() => navigate(insight.link!)}
                  >
                    {insight.action}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {insights.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500 opacity-50" />
            <p className="text-sm">Tudo em ordem por aqui! 🎉</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
