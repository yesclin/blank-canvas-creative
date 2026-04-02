import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLossReasons } from "@/hooks/crm/usePipelineStages";
import { Loader2 } from "lucide-react";

interface LossReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (lossReasonId: string, lossReasonText: string) => void;
  isPending?: boolean;
}

export function LossReasonDialog({ open, onOpenChange, onConfirm, isPending }: LossReasonDialogProps) {
  const { data: reasons } = useLossReasons();
  const [selectedReasonId, setSelectedReasonId] = useState("");
  const [customReason, setCustomReason] = useState("");

  const selectedReason = reasons?.find(r => r.id === selectedReasonId);
  const isOther = selectedReason?.name === "Outro";
  const finalText = isOther ? customReason.trim() : (selectedReason?.name || "");
  const canConfirm = selectedReasonId && (isOther ? customReason.trim().length > 0 : true);

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(selectedReasonId, finalText);
    setSelectedReasonId("");
    setCustomReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Motivo da Perda</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Motivo *</Label>
            <Select value={selectedReasonId} onValueChange={setSelectedReasonId}>
              <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
              <SelectContent>
                {(reasons || []).map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isOther && (
            <div>
              <Label>Descreva o motivo *</Label>
              <Textarea
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="Informe o motivo..."
                maxLength={500}
                rows={3}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            variant="destructive"
            disabled={!canConfirm || isPending}
            onClick={handleConfirm}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar Perda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
