import { Calculator, Package, Layers, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProcedureCostDetail } from "@/hooks/useProcedureCostCalculation";

interface ProcedureCostSummaryCardProps {
  procedureId: string;
  procedureName: string;
}

export function ProcedureCostSummaryCard({ procedureId, procedureName }: ProcedureCostSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: costDetail, isLoading } = useProcedureCostDetail(procedureId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!costDetail) {
    return null;
  }

  const hasItems = costDetail.materials.length > 0 || costDetail.kits.length > 0;

  return (
    <Card className={!hasItems ? "border-dashed border-muted-foreground/30" : ""}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {procedureName}
                {!hasItems && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Sem insumos
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Vincule materiais ou kits para calcular o custo</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  {costDetail.materials.length} materiais
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  {costDetail.kits.length} kits
                </span>
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(costDetail.total_cost)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Custo estimado</span>
            </div>
          </div>
        </CardHeader>
        
        {hasItems && (
          <>
            <CardContent className="pb-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full">
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Ocultar detalhes
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Ver composição do custo
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </CardContent>
            
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                {costDetail.materials.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Materiais Avulsos
                      <span className="text-muted-foreground font-normal">
                        ({formatCurrency(costDetail.material_cost)})
                      </span>
                    </h4>
                    <div className="space-y-1 pl-6">
                      {costDetail.materials.map((mat) => (
                        <div key={mat.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span>{mat.name}</span>
                            <span className="text-muted-foreground">
                              ({mat.quantity} {mat.unit})
                            </span>
                            {mat.is_required && (
                              <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                            )}
                          </div>
                          <span className="font-medium">{formatCurrency(mat.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {costDetail.kits.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Kits de Materiais
                      <span className="text-muted-foreground font-normal">
                        ({formatCurrency(costDetail.kit_cost)})
                      </span>
                    </h4>
                    <div className="space-y-3 pl-6">
                      {costDetail.kits.map((kit) => (
                        <div key={kit.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{kit.name}</span>
                              <span className="text-muted-foreground">
                                (×{kit.quantity})
                              </span>
                              {kit.is_required && (
                                <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                              )}
                            </div>
                            <span className="font-medium">{formatCurrency(kit.total)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground pl-4">
                            {kit.items.slice(0, 3).map((item, idx) => (
                              <span key={idx}>
                                {item.material_name} ({item.quantity} {item.unit})
                                {idx < Math.min(kit.items.length - 1, 2) && ", "}
                              </span>
                            ))}
                            {kit.items.length > 3 && (
                              <span> e +{kit.items.length - 3} itens</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <span>Este custo impacta o cálculo de margem do procedimento</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">Total: </span>
                    <span className="text-lg font-bold">{formatCurrency(costDetail.total_cost)}</span>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </>
        )}
      </Collapsible>
    </Card>
  );
}
