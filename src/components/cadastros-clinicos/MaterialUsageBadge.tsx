import { Link2, Layers, Package, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMaterialUsageCount } from "@/hooks/useProcedureCostCalculation";

interface MaterialUsageBadgeProps {
  materialId: string;
  compact?: boolean;
}

export function MaterialUsageBadge({ materialId, compact = false }: MaterialUsageBadgeProps) {
  const { data: usageMap = {}, isLoading } = useMaterialUsageCount();
  
  if (isLoading) {
    return null;
  }

  const usage = usageMap[materialId] || { in_procedures: 0, in_kits: 0 };
  const totalUsage = usage.in_procedures + usage.in_kits;
  const isUsed = totalUsage > 0;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={isUsed ? "secondary" : "outline"} 
              className={!isUsed ? "border-muted-foreground/30 text-muted-foreground" : ""}
            >
              {isUsed ? (
                <>
                  <Link2 className="h-3 w-3 mr-1" />
                  {totalUsage}
                </>
              ) : (
                "Livre"
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {isUsed ? (
              <div className="space-y-1">
                {usage.in_procedures > 0 && (
                  <p className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {usage.in_procedures} procedimento{usage.in_procedures > 1 ? 's' : ''}
                  </p>
                )}
                {usage.in_kits > 0 && (
                  <p className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {usage.in_kits} kit{usage.in_kits > 1 ? 's' : ''}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Alterar o custo impacta esses itens
                </p>
              </div>
            ) : (
              <p>Este material não está vinculado a nenhum procedimento ou kit</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {isUsed ? (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {usage.in_procedures > 0 && (
            <span className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              {usage.in_procedures} proc.
            </span>
          )}
          {usage.in_kits > 0 && (
            <span className="flex items-center gap-1">
              <Layers className="h-4 w-4" />
              {usage.in_kits} kit{usage.in_kits > 1 ? 's' : ''}
            </span>
          )}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">Não vinculado</span>
      )}
    </div>
  );
}
