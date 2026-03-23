import { FileX, Calendar, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ReportEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function ReportEmptyState({
  title = 'Nenhum dado encontrado',
  description = 'Não há dados para exibir no período selecionado. Tente ajustar os filtros ou selecionar outro período.',
  icon,
  actionLabel,
  onAction,
}: ReportEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          {icon || <FileX className="h-8 w-8 text-muted-foreground" />}
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>
        
        <p className="text-muted-foreground max-w-md mb-6">
          {description}
        </p>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>Verifique o período</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4" />
            <span>Ajuste os filtros</span>
          </div>
        </div>

        {actionLabel && onAction && (
          <Button variant="outline" className="mt-6" onClick={onAction}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
