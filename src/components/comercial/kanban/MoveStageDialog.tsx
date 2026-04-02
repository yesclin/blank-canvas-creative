import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PipelineStage } from "@/hooks/crm/usePipelineStages";
import { Loader2 } from "lucide-react";

interface MoveStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: PipelineStage[];
  currentStageId: string | null;
  onConfirm: (stageId: string, stageName: string) => void;
  isPending?: boolean;
}

export function MoveStageDialog({ open, onOpenChange, stages, currentStageId, onConfirm, isPending }: MoveStageDialogProps) {
  const [selectedStageId, setSelectedStageId] = useState("");

  const availableStages = stages.filter(s => s.id !== currentStageId);
  const selectedStage = stages.find(s => s.id === selectedStageId);

  const handleConfirm = () => {
    if (!selectedStage) return;
    onConfirm(selectedStage.id, selectedStage.name);
    setSelectedStageId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Mover para Etapa</DialogTitle>
        </DialogHeader>
        <div>
          <Label>Nova Etapa *</Label>
          <Select value={selectedStageId} onValueChange={setSelectedStageId}>
            <SelectTrigger><SelectValue placeholder="Selecione a etapa" /></SelectTrigger>
            <SelectContent>
              {availableStages.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color || '#888' }} />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!selectedStageId || isPending} onClick={handleConfirm}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Mover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
