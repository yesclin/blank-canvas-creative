import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DollarSign, Package, Lock, Info, ChevronDown, TrendingDown, AlertTriangle } from "lucide-react";
import { useAppointmentCostDetails } from "@/hooks/useAppointmentCostDetails";
import { useFinancialAccessControl } from "@/hooks/useFinancialAccessControl";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AppointmentCostDetailsProps {
  appointmentId: string;
  appointmentStatus?: string;
  compact?: boolean;
}

export function AppointmentCostDetails({ 
  appointmentId, 
  appointmentStatus,
  compact = false,
}: AppointmentCostDetailsProps) {
  const { canViewCost, isLoading: permissionsLoading } = useFinancialAccessControl();
  const { data: costDetails, isLoading } = useAppointmentCostDetails(appointmentId);
  const [isOpen, setIsOpen] = useState(false);

  // Only show for users with financial access

  // Don't show if not finalized
  if (appointmentStatus !== "finalizado") {
    return null;
  }

  // Show lock message if no permission
  if (!permissionsLoading && !canViewCost) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Custos visíveis apenas para perfis autorizados</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || permissionsLoading) {
    return (
      <Card>
        <CardHeader className="py-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!costDetails) {
    return null;
  }

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const hasMaterials = costDetails.consumed_materials.length > 0;
  const hasCost = costDetails.procedure_cost !== null && costDetails.procedure_cost > 0;

  // Se não há custo nem materiais, mostrar aviso
  if (!hasMaterials && !hasCost) {
    return (
      <Card className="border-dashed border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              Procedimento sem custo configurado — configure em Materiais
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    // Versão compacta para exibição em listas
    return (
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="font-mono cursor-help">
                <TrendingDown className="h-3 w-3 mr-1" />
                {formatCurrency(costDetails.procedure_cost || costDetails.total_materials_cost)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1 text-xs">
                <p className="font-medium">{costDetails.procedure_name || "Procedimento"}</p>
                <p className="text-muted-foreground">
                  {hasMaterials 
                    ? `${costDetails.consumed_materials.length} insumo(s) consumido(s)` 
                    : "Custo histórico"}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="py-3">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Custo do Procedimento
                  <Badge variant="secondary" className="font-mono ml-2">
                    {formatCurrency(costDetails.procedure_cost || costDetails.total_materials_cost)}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="text-xs">
                        Valor histórico calculado no momento da execução. 
                        Não é afetado por alterações futuras nos custos dos produtos.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )} />
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {/* Procedure Cost Summary */}
              {hasCost && (
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                  <span className="text-sm text-muted-foreground">
                    {costDetails.procedure_name || "Procedimento"}
                  </span>
                  <Badge variant="secondary" className="font-mono">
                    {formatCurrency(costDetails.procedure_cost)}
                  </Badge>
                </div>
              )}

              {/* Consumed Materials List */}
              {hasMaterials && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="h-3 w-3" />
                    <span>Insumos consumidos ({costDetails.consumed_materials.length})</span>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {costDetails.consumed_materials.map((material) => (
                      <div 
                        key={material.id}
                        className="flex items-center justify-between text-xs p-2 rounded bg-muted/30 hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Package className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate font-medium">{material.material_name}</span>
                          <span className="text-muted-foreground shrink-0">
                            × {material.quantity} {material.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-muted-foreground">
                            @ {formatCurrency(material.unit_cost)}
                          </span>
                          <span className="font-mono font-medium">
                            {formatCurrency(material.total_cost)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Materials Total */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs font-medium">Total de insumos</span>
                    <span className="text-sm font-mono font-bold text-primary">
                      {formatCurrency(costDetails.total_materials_cost)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
}
