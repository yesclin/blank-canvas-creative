import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { useCrmProcedures } from "@/hooks/crm/useCrmOptions";
import type { CrmQuoteItemFormData } from "@/types/quote";
import { calculateItemTotal } from "@/types/quote";

interface QuoteItemsEditorProps {
  items: CrmQuoteItemFormData[];
  onChange: (items: CrmQuoteItemFormData[]) => void;
}

const emptyItem = (): CrmQuoteItemFormData => ({
  description: "",
  quantity: 1,
  unit_value: 0,
  discount_percent: 0,
});

export function QuoteItemsEditor({ items, onChange }: QuoteItemsEditorProps) {
  const { data: procedures } = useCrmProcedures();

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addItem = () => onChange([...items, emptyItem()]);

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, i) => i !== index));
  };

  const handleProcedureChange = (index: number, procedureId: string) => {
    const proc = procedures?.find((p: any) => p.id === procedureId);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      procedure_id: procedureId || undefined,
      description: proc?.name || updated[index].description,
    };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Itens do Orçamento</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Item
        </Button>
      </div>

      {items.map((item, index) => {
        const itemTotal = calculateItemTotal(item);
        return (
          <div key={index} className="border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
              {items.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(index)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Label className="text-xs">Procedimento</Label>
                <Select value={item.procedure_id || "none"} onValueChange={v => handleProcedureChange(index, v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {(procedures || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label className="text-xs">Descrição *</Label>
                <Input
                  className="h-8 text-xs"
                  value={item.description}
                  onChange={e => updateItem(index, "description", e.target.value)}
                  placeholder="Descrição do item"
                  required
                />
              </div>

              <div>
                <Label className="text-xs">Qtd</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={e => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                />
              </div>

              <div>
                <Label className="text-xs">Valor Unitário (R$)</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  step="0.01"
                  min={0}
                  value={item.unit_value}
                  onChange={e => updateItem(index, "unit_value", parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label className="text-xs">Desconto (%)</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  min={0}
                  max={100}
                  value={item.discount_percent}
                  onChange={e => updateItem(index, "discount_percent", parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="flex items-end">
                <div>
                  <Label className="text-xs">Total</Label>
                  <div className="h-8 flex items-center text-xs font-semibold">
                    R$ {itemTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
