import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Target, DollarSign, Calendar, User, Edit, CheckCircle, XCircle, History } from "lucide-react";
import { OPPORTUNITY_STATUSES, getOpportunityStatusColor, type CrmOpportunity } from "@/types/crm";
import { useUpdateOpportunity, useOpportunityHistory } from "@/hooks/crm/useOpportunities";
import { Skeleton } from "@/components/ui/skeleton";

interface OpportunityDrawerProps {
  opportunity: CrmOpportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (opp: CrmOpportunity) => void;
}

export function OpportunityDrawer({ opportunity, open, onOpenChange, onEdit }: OpportunityDrawerProps) {
  const updateOpp = useUpdateOpportunity();
  const { data: history, isLoading: historyLoading } = useOpportunityHistory(opportunity?.id || null);

  if (!opportunity) return null;

  const statusLabel = OPPORTUNITY_STATUSES.find(s => s.value === opportunity.status)?.label || opportunity.status;

  const handleWin = async () => {
    await updateOpp.mutateAsync({ id: opportunity.id, title: opportunity.title, status: "ganha" });
  };

  const handleLose = async () => {
    await updateOpp.mutateAsync({ id: opportunity.id, title: opportunity.title, status: "perdida" });
  };

  const handleReopen = async () => {
    await updateOpp.mutateAsync({ id: opportunity.id, title: opportunity.title, status: "aberta" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {opportunity.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-2">
            <Badge className={getOpportunityStatusColor(opportunity.status)}>{statusLabel}</Badge>
            {opportunity.closing_probability > 0 && (
              <Badge variant="outline">{opportunity.closing_probability}% prob.</Badge>
            )}
          </div>

          {/* Value */}
          {opportunity.estimated_value != null && (
            <div className="flex items-center gap-2 text-lg font-semibold">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              R$ {Number(opportunity.estimated_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          )}

          {/* Relations */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase">Detalhes</h4>
            {opportunity.lead && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                Lead: {opportunity.lead.name}
              </div>
            )}
            {opportunity.specialty && (
              <div className="text-sm">Especialidade: {opportunity.specialty.name}</div>
            )}
            {opportunity.procedure && (
              <div className="text-sm">Procedimento: {opportunity.procedure.name}</div>
            )}
            {opportunity.professional && (
              <div className="text-sm">Profissional: {(opportunity.professional as any).full_name || (opportunity.professional as any).name}</div>
            )}
            {opportunity.expected_close_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Previsão: {format(new Date(opportunity.expected_close_date), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            )}
          </div>

          {/* Notes */}
          {opportunity.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase">Observações</h4>
                <p className="text-sm whitespace-pre-wrap">{opportunity.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* History */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-1">
              <History className="h-4 w-4" /> Histórico
            </h4>
            {historyLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (history || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem histórico registrado.</p>
            ) : (
              <div className="space-y-2">
                {(history || []).map((h) => (
                  <div key={h.id} className="text-xs border-l-2 border-muted pl-3 py-1">
                    <span className="font-medium">{h.field_changed}</span>: {h.old_value || "—"} → {h.new_value || "—"}
                    <div className="text-muted-foreground">
                      {format(new Date(h.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Dates */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>Criado em: {format(new Date(opportunity.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
            {opportunity.closed_at && (
              <div>Fechado em: {format(new Date(opportunity.closed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={() => { onEdit(opportunity); onOpenChange(false); }}>
              <Edit className="h-4 w-4 mr-2" /> Editar
            </Button>
            {opportunity.status === "aberta" && (
              <>
                <Button variant="outline" className="text-green-700" onClick={handleWin} disabled={updateOpp.isPending}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Marcar como Ganha
                </Button>
                <Button variant="outline" className="text-destructive" onClick={handleLose} disabled={updateOpp.isPending}>
                  <XCircle className="h-4 w-4 mr-2" /> Marcar como Perdida
                </Button>
              </>
            )}
            {(opportunity.status === "ganha" || opportunity.status === "perdida") && (
              <Button variant="outline" onClick={handleReopen} disabled={updateOpp.isPending}>
                Reabrir Oportunidade
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
