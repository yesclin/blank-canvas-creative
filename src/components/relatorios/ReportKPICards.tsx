import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number | null;
  previousValue?: string | number;
  variation?: number;
  format?: 'currency' | 'percentage' | 'number';
  icon?: React.ReactNode;
  className?: string;
  masked?: boolean;
}

function formatValue(value: string | number | null, format?: 'currency' | 'percentage' | 'number', masked?: boolean): string {
  if (masked || value === null) return '•••••';
  if (typeof value === 'string') return value;
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    case 'percentage':
      return `${value}%`;
    default:
      return new Intl.NumberFormat('pt-BR').format(value);
  }
}

export function ReportKPICard({ 
  title, 
  value, 
  previousValue, 
  variation, 
  format, 
  icon,
  className,
  masked = false
}: KPICardProps) {
  const trend = variation ? (variation > 0 ? 'up' : variation < 0 ? 'down' : 'stable') : undefined;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{formatValue(value, format, masked)}</p>
            {variation !== undefined && !masked && (
              <div className="flex items-center gap-1">
                {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                {trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground" />}
                <span className={cn(
                  "text-sm font-medium",
                  trend === 'up' && "text-green-600",
                  trend === 'down' && "text-red-600",
                  trend === 'stable' && "text-muted-foreground"
                )}>
                  {variation > 0 ? '+' : ''}{variation}%
                </span>
                <span className="text-xs text-muted-foreground">vs período anterior</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ReportKPICardsProps {
  cards: KPICardProps[];
  columns?: 2 | 3 | 4 | 5;
}

export function ReportKPICards({ cards, columns = 4 }: ReportKPICardsProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns])}>
      {cards.map((card, index) => (
        <ReportKPICard key={index} {...card} />
      ))}
    </div>
  );
}
