import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { useCreateProduct } from "@/hooks/useProducts";
import { stockUnits } from "@/types/gestao";
import type { StockCategory } from "@/hooks/useStockData";

interface NewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: StockCategory[];
}

export function NewProductDialog({ open, onOpenChange, categories }: NewProductDialogProps) {
  const createMutation = useCreateProduct();
  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "un",
    current_stock: 0,
    min_stock: 0,
    cost_price: 0,
    sale_price: 0,
    description: "",
  });

  const resetForm = () => {
    setForm({
      name: "",
      category: "",
      unit: "un",
      current_stock: 0,
      min_stock: 0,
      cost_price: 0,
      sale_price: 0,
      description: "",
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      await createMutation.mutateAsync({
        name: form.name,
        category: form.category || undefined,
        unit: form.unit,
        current_stock: form.current_stock,
        min_stock: form.min_stock,
        cost_price: form.cost_price,
        sale_price: form.sale_price,
        description: form.description || undefined,
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("[NewProductDialog] Error:", error);
    }
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      resetForm();
      onOpenChange(false);
    }
  };

  const isLoading = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !isLoading && (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Item</DialogTitle>
          <DialogDescription>Cadastre aqui o item-base operacional da clínica</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Nome do Item *</Label>
            <Input
              placeholder="Ex: Seringa 10ml"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select
                value={form.category || "__none__"}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v === "__none__" ? "" : v }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem categoria</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Unidade *</Label>
              <Select
                value={form.unit}
                onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stockUnits.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Quantidade Atual</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.current_stock}
                onChange={(e) => setForm((f) => ({ ...f, current_stock: parseFloat(e.target.value) || 0 }))}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label>Quantidade Mínima</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.min_stock}
                onChange={(e) => setForm((f) => ({ ...f, min_stock: parseFloat(e.target.value) || 0 }))}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Custo Médio (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.cost_price}
                onChange={(e) => setForm((f) => ({ ...f, cost_price: parseFloat(e.target.value) || 0 }))}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label>Preço de Venda (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.sale_price}
                onChange={(e) => setForm((f) => ({ ...f, sale_price: parseFloat(e.target.value) || 0 }))}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações adicionais..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!form.name.trim() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Item"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
