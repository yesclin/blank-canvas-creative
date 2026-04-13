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
import { useCreateInventoryBatch } from "@/hooks/useInventoryBatches";
import type { InventoryItem } from "@/types/inventory-items";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: InventoryItem[];
}

export function EntryFormDialog({ open, onOpenChange, items }: Props) {
  const createMovement = useCreateInventoryMovement();
  const createBatch = useCreateInventoryBatch();
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [manufacturingDate, setManufacturingDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [notes, setNotes] = useState("");

  const selectedItem = items.find(i => i.id === itemId);
  const showBatch = selectedItem?.controls_batch;
  const showExpiry = selectedItem?.controls_expiry;

  const reset = () => {
    setItemId(""); setQuantity(""); setUnitCost(""); setBatchNumber("");
    setManufacturingDate(""); setExpiryDate(""); setInvoiceNumber("");
    setStorageLocation(""); setNotes("");
  };

  const isLoading = createMovement.isPending || createBatch.isPending;
  const isValid = itemId && quantity && parseFloat(quantity) > 0;

  const handleSave = async () => {
    if (!isValid) return;
    try {
      const qty = parseFloat(quantity);
      const cost = unitCost ? parseFloat(unitCost) : selectedItem?.default_cost_price || 0;
      let batchId: string | undefined;

      if (showBatch && batchNumber) {
        const batch = await createBatch.mutateAsync({
          item_id: itemId,
          batch_number: batchNumber,
          manufacturing_date: manufacturingDate || undefined,
          expiry_date: expiryDate || undefined,
          invoice_number: invoiceNumber || undefined,
          unit_cost: cost,
          quantity_received: qty,
          storage_location: storageLocation || undefined,
        });
        batchId = batch.id;
      }

      await createMovement.mutateAsync({
        item_id: itemId,
        batch_id: batchId,
        movement_type: 'purchase_entry',
        quantity: qty,
        unit_cost: cost,
        reason: invoiceNumber ? `NF: ${invoiceNumber}` : 'Entrada por compra',
        notes: notes || undefined,
      });

      reset();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !isLoading && (v ? onOpenChange(v) : (reset(), onOpenChange(false)))}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Entrada de Estoque</DialogTitle>
          <DialogDescription>Registre uma entrada de produto no estoque</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Item *</Label>
            <Select value={itemId} onValueChange={v => { setItemId(v); const it = items.find(i => i.id === v); if (it) setUnitCost(String(it.default_cost_price || '')); }} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Selecione o item" /></SelectTrigger>
              <SelectContent>
                {items.filter(i => i.is_active && i.controls_stock).map(i => (
                  <SelectItem key={i.id} value={i.id}>{i.name} ({i.unit_of_measure})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Quantidade *</Label>
              <Input type="number" min="0.01" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label>Custo Unitário (R$)</Label>
              <Input type="number" min="0" step="0.01" value={unitCost} onChange={e => setUnitCost(e.target.value)} disabled={isLoading} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Nº Nota Fiscal</Label>
            <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} disabled={isLoading} placeholder="Ex: NF-001234" />
          </div>
          {showBatch && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Número do Lote</Label>
                  <Input value={batchNumber} onChange={e => setBatchNumber(e.target.value)} disabled={isLoading} />
                </div>
                <div className="grid gap-2">
                  <Label>Local de Armazenamento</Label>
                  <Input value={storageLocation} onChange={e => setStorageLocation(e.target.value)} disabled={isLoading} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Data Fabricação</Label>
                  <Input type="date" value={manufacturingDate} onChange={e => setManufacturingDate(e.target.value)} disabled={isLoading} />
                </div>
                {showExpiry && (
                  <div className="grid gap-2">
                    <Label>Data Validade</Label>
                    <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} disabled={isLoading} />
                  </div>
                )}
              </div>
            </>
          )}
          <div className="grid gap-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} disabled={isLoading} placeholder="Observações..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!isValid || isLoading}>
            {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registrando...</> : "Registrar Entrada"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
