import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";
import type { PipelineStage } from "@/hooks/crm/usePipelineStages";
import type { CrmOpportunity } from "@/types/crm";
import { OpportunityKanbanCard } from "./OpportunityKanbanCard";

interface OpportunityKanbanColumnProps {
  stage: PipelineStage;
  opportunities: (CrmOpportunity & { lead?: { id: string; name: string; phone?: string } | null })[];
  onViewOpportunity: (opp: CrmOpportunity) => void;
  onMoveStage: (opp: CrmOpportunity) => void;
  onWin: (opp: CrmOpportunity) => void;
  onLose: (opp: CrmOpportunity) => void;
}

export function OpportunityKanbanColumn({
  stage,
  opportunities,
  onViewOpportunity,
  onMoveStage,
  onWin,
  onLose,
}: OpportunityKanbanColumnProps) {
  const totalValue = opportunities.reduce((sum, o) => sum + (Number(o.estimated_value) || 0), 0);

  return (
    <div className="flex flex-col w-72 min-w-[288px] shrink-0 bg-muted/30 rounded-lg border">
      {/* Header */}
      <div className="p-3 border-b space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color || '#888' }} />
            <h3 className="text-sm font-semibold truncate">{stage.name}</h3>
          </div>
          <Badge variant="secondary" className="text-xs">{opportunities.length}</Badge>
        </div>
        {totalValue > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {opportunities.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Nenhuma oportunidade</p>
        ) : (
          opportunities.map(opp => (
            <OpportunityKanbanCard
              key={opp.id}
              opportunity={opp}
              onView={() => onViewOpportunity(opp)}
              onMoveStage={() => onMoveStage(opp)}
              onWin={() => onWin(opp)}
              onLose={() => onLose(opp)}
            />
          ))
        )}
      </div>
    </div>
  );
}
