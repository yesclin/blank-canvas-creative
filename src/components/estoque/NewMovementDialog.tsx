import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateStockMovement } from "@/hooks/useStockMovements";
import { movementReasons, type MovementType } from "@/types/gestao";
import type { StockMovementType } from "@/types/inventory";
import type { StockProduct } from "@/hooks/useStockData";

interface NewMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: StockProduct[];
}

export function NewMovementDialog({ open, onOpenChange, products }: NewMovementDialogProps) {
  const createMovement = useCreateStockMovement();
  const [movementType, setMovementType] = useState<MovementType>("entrada");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setMovementType("entrada");
    setProductId("");
    setQuantity("");
    setReason("");
    setUnitCost("");
    setNotes("");
  };

  const handleSave = async () => {
    if (!productId || !quantity || parseFloat(quantity) <= 0) return;
    try {
      await createMovement.mutateAsync({
        product_id: productId,
        movement_type: movementType as StockMovementType,
        quantity: parseFloat(quantity),
        unit_cost: unitCost ? parseFloat(unitCost) : undefined,
        notes: [reason, notes].filter(Boolean).join(" - ") || undefined,
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("[NewMovementDialog] Error:", error);
    }
  };

  const handleClose = () => {
    if (!createMovement.isPending) {
      resetForm();
      onOpenChange(false);
    }
  };

  const isLoading = createMovement.isPending;
  const isValid = productId && quantity && parseFloat(quantity) > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !isLoading && (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Movimentação</DialogTitle>
          <DialogDescription>Registre entrada, saída ou ajuste do item no estoque</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Tipo de Movimentação *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={movementType === "entrada" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setMovementType("entrada")}
                disabled={isLoading}
              >
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Entrada
              </Button>
              <Button
                type="button"
                variant={movementType === "saida" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setMovementType("saida")}
                disabled={isLoading}
              >
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Saída
              </Button>
              <Button
                type="button"
                variant={movementType === "ajuste" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setMovementType("ajuste")}
                disabled={isLoading}
              >
                Ajuste
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Item *</Label>
            <Select value={productId} onValueChange={setProductId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o item" />
              </SelectTrigger>
              <SelectContent>
                {products
                  .filter((p) => p.is_active)
                  .map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.current_quantity} {product.unit})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label>Motivo</Label>
              <Select value={reason} onValueChange={setReason} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {movementReasons[movementType].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {movementType === "entrada" && (
            <div className="grid gap-2">
              <Label>Custo Unitário (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              "Registrar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
