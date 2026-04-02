import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DollarSign, MoreVertical, User, Phone, Stethoscope, CheckCircle, XCircle, ArrowRight, Eye } from "lucide-react";
import type { CrmOpportunity } from "@/types/crm";

interface OpportunityKanbanCardProps {
  opportunity: CrmOpportunity & { lead?: { id: string; name: string; phone?: string } | null };
  onView: () => void;
  onMoveStage: () => void;
  onWin: () => void;
  onLose: () => void;
}

export function OpportunityKanbanCard({ opportunity, onView, onMoveStage, onWin, onLose }: OpportunityKanbanCardProps) {
  const leadName = opportunity.lead?.name || opportunity.patient?.full_name || "—";
  const leadPhone = opportunity.lead?.phone || null;
  const isClosed = opportunity.is_won || opportunity.is_lost;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border hover:border-primary/30 group"
      onClick={onView}
    >
      <CardContent className="p-3 space-y-2">
        {/* Title row */}
        <div className="flex items-start justify-between gap-1">
          <h4 className="text-sm font-semibold leading-tight line-clamp-2 flex-1">{opportunity.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" /> Ver Detalhes
              </DropdownMenuItem>
              {!isClosed && (
                <>
                  <DropdownMenuItem onClick={onMoveStage}>
                    <ArrowRight className="h-4 w-4 mr-2" /> Mover Etapa
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onWin} className="text-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" /> Marcar como Ganha
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onLose} className="text-destructive">
                    <XCircle className="h-4 w-4 mr-2" /> Marcar como Perdida
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Lead/Patient */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">{leadName}</span>
        </div>

        {leadPhone && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{leadPhone}</span>
          </div>
        )}

        {opportunity.specialty && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Stethoscope className="h-3 w-3 shrink-0" />
            <span className="truncate">{opportunity.specialty.name}</span>
          </div>
        )}

        {/* Footer: value + badges */}
        <div className="flex items-center justify-between pt-1">
          {opportunity.estimated_value != null ? (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-700">
              <DollarSign className="h-3 w-3" />
              {Number(opportunity.estimated_value).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
            </span>
          ) : (
            <span />
          )}
          <div className="flex gap-1">
            {opportunity.is_won && <Badge className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0">Ganha</Badge>}
            {opportunity.is_lost && <Badge className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0">Perdida</Badge>}
            {!isClosed && opportunity.closing_probability > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{opportunity.closing_probability}%</Badge>
            )}
          </div>
        </div>

        {/* Assigned */}
        {opportunity.assigned_profile && (
          <div className="text-[10px] text-muted-foreground truncate">
            Resp: {opportunity.assigned_profile.full_name}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
