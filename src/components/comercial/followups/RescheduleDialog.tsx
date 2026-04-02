import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: string;
  onConfirm: (newDate: string) => void;
  isPending?: boolean;
}

export function RescheduleDialog({ open, onOpenChange, currentDate, onConfirm, isPending }: RescheduleDialogProps) {
  const [newDate, setNewDate] = useState(currentDate?.slice(0, 16) || "");

  const handleConfirm = () => {
    if (!newDate) return;
    onConfirm(new Date(newDate).toISOString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reagendar Follow-up</DialogTitle>
        </DialogHeader>
        <div>
          <Label htmlFor="new-date">Nova Data/Hora *</Label>
          <Input id="new-date" type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!newDate || isPending} onClick={handleConfirm}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reagendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
