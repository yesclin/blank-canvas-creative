import { Link2, AlertTriangle, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useKitUsageByKit } from "@/hooks/useProcedureKitsCRUD";

interface KitUsageBadgeProps {
  kitId: string;
  compact?: boolean;
}

export function KitUsageBadge({ kitId, compact = false }: KitUsageBadgeProps) {
  const { data: usages = [], isLoading } = useKitUsageByKit(kitId);
  
  if (isLoading) {
    return null;
  }

  const usageCount = usages.length;
  const isUsed = usageCount > 0;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={isUsed ? "secondary" : "outline"} 
              className={!isUsed ? "border-amber-500 text-amber-600 bg-amber-50" : ""}
            >
              {isUsed ? (
                <>
                  <Link2 className="h-3 w-3 mr-1" />
                  {usageCount}
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Não usado
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            {isUsed ? (
              <div>
                <p className="font-medium mb-1">Usado em {usageCount} procedimento{usageCount > 1 ? 's' : ''}:</p>
                <ul className="text-sm space-y-0.5">
                  {usages.slice(0, 5).map((usage) => (
                    <li key={usage.id} className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-primary" />
                      {usage.procedure_name}
                    </li>
                  ))}
                  {usages.length > 5 && (
                    <li className="text-muted-foreground">
                      +{usages.length - 5} outros
                    </li>
                  )}
                </ul>
              </div>
            ) : (
              <p>Este kit ainda não está vinculado a nenhum procedimento</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isUsed ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Link2 className="h-4 w-4" />
                <span>Usado em {usageCount} procedimento{usageCount > 1 ? 's' : ''}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <ul className="text-sm space-y-0.5">
                {usages.slice(0, 5).map((usage) => (
                  <li key={usage.id} className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-primary" />
                    {usage.procedure_name}
                  </li>
                ))}
                {usages.length > 5 && (
                  <li className="text-muted-foreground">
                    +{usages.length - 5} outros
                  </li>
                )}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <div className="flex items-center gap-1 text-sm text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <span>Kit não utilizado</span>
        </div>
      )}
    </div>
  );
}
