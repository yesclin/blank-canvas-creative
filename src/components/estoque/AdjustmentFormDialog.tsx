import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreateInventoryMovement } from "@/hooks/useInventoryMovements";
import { useInventoryBatches } from "@/hooks/useInventoryBatches";
import { adjustmentReasons } from "@/types/inventory-batches";
import type { InventoryItem } from "@/types/inventory-items";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: InventoryItem[];
}

export function AdjustmentFormDialog({ open, onOpenChange, items }: Props) {
  const createMovement = useCreateInventoryMovement();
  const [itemId, setItemId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const selectedItem = items.find(i => i.id === itemId);
  const { data: batches = [] } = useInventoryBatches({ itemId: itemId || undefined, status: 'active' });

  const isLoading = createMovement.isPending;
  const isValid = itemId && quantity && reason;

  const reset = () => { setItemId(""); setBatchId(""); setQuantity(""); setReason(""); setNotes(""); };

  const handleSave = async () => {
    if (!isValid) return;
    try {
      await createMovement.mutateAsync({
        item_id: itemId,
        batch_id: batchId || undefined,
        movement_type: 'adjustment',
        quantity: parseFloat(quantity),
        reason,
        notes: notes || undefined,
      });
      reset();
      onOpenChange(false);
    } catch (e) { console.error(e); }
  };

  return (
    <Dialog open={open} onOpenChange={v => !isLoading && (v ? onOpenChange(v) : (reset(), onOpenChange(false)))}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajuste de Estoque</DialogTitle>
          <DialogDescription>Registre um ajuste de inventário (valores positivos ou negativos)</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Item *</Label>
            <Select value={itemId} onValueChange={v => { setItemId(v); setBatchId(""); }} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {items.filter(i => i.is_active && i.controls_stock).map(i => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedItem?.controls_batch && batches.length > 0 && (
            <div className="grid gap-2">
              <Label>Lote (opcional)</Label>
              <Select value={batchId} onValueChange={setBatchId} disabled={isLoading}>
                <SelectTrigger><SelectValue placeholder="Todos os lotes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem lote específico</SelectItem>
                  {batches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.batch_number} (Disp: {b.quantity_available})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-2">
            <Label>Quantidade (use negativo para reduzir) *</Label>
            <Input type="number" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} disabled={isLoading} />
          </div>
          <div className="grid gap-2">
            <Label>Motivo *</Label>
            <Select value={reason} onValueChange={setReason} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
              <SelectContent>
                {adjustmentReasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} disabled={isLoading} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!isValid || isLoading}>
            {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registrando...</> : "Registrar Ajuste"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
