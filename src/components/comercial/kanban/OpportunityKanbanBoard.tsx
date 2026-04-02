import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { usePipelineStages } from "@/hooks/crm/usePipelineStages";
import { useKanbanOpportunities, useMoveOpportunityStage, useWinOpportunity, useLoseOpportunity } from "@/hooks/crm/useKanbanOpportunities";
import { OpportunityKanbanColumn } from "./OpportunityKanbanColumn";
import { MoveStageDialog } from "./MoveStageDialog";
import { LossReasonDialog } from "./LossReasonDialog";
import { OpportunityDrawer } from "@/components/comercial/OpportunityDrawer";
import { OpportunityFormDialog } from "@/components/comercial/OpportunityFormDialog";
import type { CrmOpportunity } from "@/types/crm";
import { ReportEmptyState } from "@/components/relatorios/ReportEmptyState";
import { Target } from "lucide-react";

export function OpportunityKanbanBoard() {
  const queryClient = useQueryClient();
  const { data: stages, isLoading: stagesLoading } = usePipelineStages();
  const { data: opportunities, isLoading: oppsLoading, isError, refetch } = useKanbanOpportunities();
  const moveStage = useMoveOpportunityStage();
  const winOpp = useWinOpportunity();
  const loseOpp = useLoseOpportunity();

  // Selected opportunity states
  const [selectedOpp, setSelectedOpp] = useState<CrmOpportunity | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editOpp, setEditOpp] = useState<CrmOpportunity | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  // Move stage dialog
  const [moveOpp, setMoveOpp] = useState<CrmOpportunity | null>(null);

  // Loss dialog
  const [loseTargetOpp, setLoseTargetOpp] = useState<CrmOpportunity | null>(null);

  // Win target
  const [winTargetOpp, setWinTargetOpp] = useState<CrmOpportunity | null>(null);

  // Group opportunities by stage
  const groupedOpps = useMemo(() => {
    if (!stages || !opportunities) return {};
    const map: Record<string, typeof opportunities> = {};
    for (const stage of stages) {
      map[stage.id] = [];
    }
    // Also collect unassigned
    const unassigned: typeof opportunities = [];
    for (const opp of opportunities) {
      if (opp.pipeline_stage_id && map[opp.pipeline_stage_id]) {
        map[opp.pipeline_stage_id].push(opp);
      } else {
        unassigned.push(opp);
      }
    }
    // Assign unassigned to first stage
    if (stages.length > 0 && unassigned.length > 0) {
      map[stages[0].id] = [...unassigned, ...(map[stages[0].id] || [])];
    }
    return map;
  }, [stages, opportunities]);

  const isLoading = stagesLoading || oppsLoading;

  const handleView = (opp: CrmOpportunity) => {
    setSelectedOpp(opp);
    setDrawerOpen(true);
  };

  const handleEdit = (opp: CrmOpportunity) => {
    setEditOpp(opp);
    setFormOpen(true);
  };

  const handleMoveStage = (opp: CrmOpportunity) => setMoveOpp(opp);

  const handleWin = (opp: CrmOpportunity) => {
    // Find "Fechado" stage
    const fechadoStage = stages?.find(s => s.name === "Fechado");
    if (fechadoStage) {
      winOpp.mutate({ opportunityId: opp.id, stageId: fechadoStage.id });
    }
  };

  const handleLose = (opp: CrmOpportunity) => setLoseTargetOpp(opp);

  const handleMoveConfirm = (stageId: string, stageName: string) => {
    if (!moveOpp) return;
    moveStage.mutate({
      opportunityId: moveOpp.id,
      fromStageId: moveOpp.pipeline_stage_id,
      toStageId: stageId,
      toStageName: stageName,
    });
    setMoveOpp(null);
  };

  const handleLoseConfirm = (lossReasonId: string, lossReasonText: string) => {
    if (!loseTargetOpp) return;
    const perdidoStage = stages?.find(s => s.name === "Perdido");
    loseOpp.mutate({
      opportunityId: loseTargetOpp.id,
      stageId: perdidoStage?.id || loseTargetOpp.pipeline_stage_id || "",
      lossReasonId,
      lossReasonText,
    });
    setLoseTargetOpp(null);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-72 shrink-0">
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-24 w-full mb-2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ReportEmptyState
        title="Erro ao carregar pipeline"
        description="Verifique se você está logado e possui uma clínica associada. Consulte o console para detalhes técnicos."
        actionLabel="Tentar novamente"
        onAction={() => {
          queryClient.invalidateQueries({ queryKey: ["crm-pipeline-stages"] });
          queryClient.invalidateQueries({ queryKey: ["crm-kanban-opportunities"] });
          refetch();
        }}
      />
    );
  }

  if (!stages || stages.length === 0) {
    return (
      <ReportEmptyState
        title="Pipeline não configurado"
        description="Nenhuma etapa foi encontrada. Entre em contato com o administrador."
        icon={<Target className="h-8 w-8 text-muted-foreground" />}
      />
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(stage => (
          <OpportunityKanbanColumn
            key={stage.id}
            stage={stage}
            opportunities={groupedOpps[stage.id] || []}
            onViewOpportunity={handleView}
            onMoveStage={handleMoveStage}
            onWin={handleWin}
            onLose={handleLose}
          />
        ))}
      </div>

      {/* Move Stage Dialog */}
      <MoveStageDialog
        open={!!moveOpp}
        onOpenChange={(v) => { if (!v) setMoveOpp(null); }}
        stages={stages}
        currentStageId={moveOpp?.pipeline_stage_id || null}
        onConfirm={handleMoveConfirm}
        isPending={moveStage.isPending}
      />

      {/* Loss Reason Dialog */}
      <LossReasonDialog
        open={!!loseTargetOpp}
        onOpenChange={(v) => { if (!v) setLoseTargetOpp(null); }}
        onConfirm={handleLoseConfirm}
        isPending={loseOpp.isPending}
      />

      {/* Opportunity Drawer */}
      <OpportunityDrawer
        opportunity={selectedOpp}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onEdit={handleEdit}
      />

      {/* Edit Dialog */}
      <OpportunityFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditOpp(null); }}
        editOpportunity={editOpp}
      />
    </>
  );
}
