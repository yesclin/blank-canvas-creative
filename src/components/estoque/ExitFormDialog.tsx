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
import { exitReasons } from "@/types/inventory-batches";
import type { InventoryItem } from "@/types/inventory-items";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: InventoryItem[];
}

export function ExitFormDialog({ open, onOpenChange, items }: Props) {
  const createMovement = useCreateInventoryMovement();
  const [itemId, setItemId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [movType, setMovType] = useState<'loss' | 'transfer'>('loss');
  const [notes, setNotes] = useState("");

  const selectedItem = items.find(i => i.id === itemId);
  const { data: batches = [] } = useInventoryBatches({ itemId: itemId || undefined, status: 'active' });

  const today = new Date().toISOString().split("T")[0];

  // Filter expired batches, sort FEFO
  const availableBatches = batches
    .filter(b => b.quantity_available > 0)
    .filter(b => !b.expiry_date || b.expiry_date >= today)
    .sort((a, b) => {
      if (a.expiry_date && b.expiry_date) return a.expiry_date.localeCompare(b.expiry_date);
      if (a.expiry_date) return -1;
      if (b.expiry_date) return 1;
      return 0;
    });

  const selectedBatch = batches.find(b => b.id === batchId);
  const maxQuantity = selectedBatch ? selectedBatch.quantity_available : undefined;

  const isLoading = createMovement.isPending;
  const qty = parseFloat(quantity) || 0;
  const isValid = itemId && qty > 0 && reason;
  const exceedsStock = selectedBatch && qty > selectedBatch.quantity_available;

  const reset = () => { setItemId(""); setBatchId(""); setQuantity(""); setReason(""); setMovType('loss'); setNotes(""); };

  const handleSave = async () => {
    if (!isValid || exceedsStock) return;
    try {
      await createMovement.mutateAsync({
        item_id: itemId,
        batch_id: batchId || undefined,
        movement_type: movType,
        quantity: qty,
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
          <DialogTitle>Nova Saída de Estoque</DialogTitle>
          <DialogDescription>Registre uma saída, perda ou transferência</DialogDescription>
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
          {selectedItem?.controls_batch && availableBatches.length > 0 && (
            <div className="grid gap-2">
              <Label>Lote (FEFO)</Label>
              <Select value={batchId} onValueChange={setBatchId} disabled={isLoading}>
                <SelectTrigger><SelectValue placeholder="Selecione o lote" /></SelectTrigger>
                <SelectContent>
                  {availableBatches.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.batch_number} (Disp: {b.quantity_available})
                      {b.expiry_date ? ` Val: ${b.expiry_date}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {exceedsStock && (
                <p className="text-xs text-destructive">Quantidade excede o saldo disponível no lote ({selectedBatch?.quantity_available})</p>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Quantidade *</Label>
              <Input type="number" min="0.01" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={movType} onValueChange={v => setMovType(v as any)} disabled={isLoading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="loss">Perda</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Motivo *</Label>
            <Select value={reason} onValueChange={setReason} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {exitReasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
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
          <Button onClick={handleSave} disabled={!isValid || isLoading || !!exceedsStock}>
            {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registrando...</> : "Registrar Saída"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
