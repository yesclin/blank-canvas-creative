import { useState } from "react";
import { Plus, Trash2, Package, Boxes, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/useProducts";
import { useProductKitsList } from "@/hooks/useProductKitsCRUD";
import type { Product } from "@/types/inventory";
import type { ProductKit } from "@/types/product-kits";

// Type for unified items (product or kit)
export type ItemType = "product" | "kit";

export interface ProcedureProductItem {
  id: string; // product_id or kit_id
  type: ItemType;
  name: string;
  unit: string; // For products: unit, for kits: "kit"
  quantity: number;
  hasItems?: boolean; // For kits: whether it has products inside
}

interface ProcedureProductsSectionProps {
  items: ProcedureProductItem[];
  onChange: (items: ProcedureProductItem[]) => void;
  disabled?: boolean;
}

interface SelectableItem {
  id: string;
  type: ItemType;
  name: string;
  unit: string;
  hasItems?: boolean;
}

export function ProcedureProductsSection({
  items,
  onChange,
  disabled = false,
}: ProcedureProductsSectionProps) {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: kits = [], isLoading: kitsLoading } = useProductKitsList(false); // Only active kits
  
  const [selectedItemKey, setSelectedItemKey] = useState<string>(""); // format: "product:id" or "kit:id"
  const [quantity, setQuantity] = useState<string>("1");

  const isLoading = productsLoading || kitsLoading;

  // Build unified list of selectable items
  const allItems: SelectableItem[] = [
    ...products.map((p: Product) => ({
      id: p.id,
      type: "product" as ItemType,
      name: p.name,
      unit: p.unit,
    })),
    ...kits.map((k: ProductKit) => ({
      id: k.id,
      type: "kit" as ItemType,
      name: k.name,
      unit: "kit",
      hasItems: (k.items_count || 0) > 0,
    })),
  ];

  // Filter out already added items
  const availableItems = allItems.filter(
    (item) => !items.some((added) => added.id === item.id && added.type === item.type)
  );

  const handleAddItem = () => {
    if (!selectedItemKey || !quantity) return;

    const [type, id] = selectedItemKey.split(":") as [ItemType, string];
    const item = allItems.find((i) => i.id === id && i.type === type);
    if (!item) return;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return;

    // Warn if kit has no items but still allow adding
    const newItem: ProcedureProductItem = {
      id: item.id,
      type: item.type,
      name: item.name,
      unit: item.unit,
      quantity: qty,
      hasItems: item.hasItems,
    };

    onChange([...items, newItem]);
    setSelectedItemKey("");
    setQuantity("1");
  };

  const handleRemoveItem = (id: string, type: ItemType) => {
    onChange(items.filter((item) => !(item.id === id && item.type === type)));
  };

  const handleQuantityChange = (id: string, type: ItemType, newQuantity: string) => {
    const qty = parseFloat(newQuantity);
    if (isNaN(qty) || qty <= 0) return;

    onChange(
      items.map((item) =>
        item.id === id && item.type === type ? { ...item, quantity: qty } : item
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Materiais / Insumos Utilizados</Label>
      </div>

      {/* Add item form */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Select
            value={selectedItemKey}
            onValueChange={setSelectedItemKey}
            disabled={disabled || isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um produto ou kit..." />
            </SelectTrigger>
            <SelectContent>
              {availableItems.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  {items.length > 0
                    ? "Todos os itens já foram adicionados"
                    : "Nenhum produto ou kit disponível"}
                </div>
              ) : (
                <>
                  {/* Products group */}
                  {availableItems.filter((i) => i.type === "product").length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                        Produtos
                      </div>
                      {availableItems
                        .filter((i) => i.type === "product")
                        .map((item) => (
                          <SelectItem key={`product:${item.id}`} value={`product:${item.id}`}>
                            <div className="flex items-center gap-2">
                              <Package className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{item.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </>
                  )}
                  {/* Kits group */}
                  {availableItems.filter((i) => i.type === "kit").length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-1">
                        Kits
                      </div>
                      {availableItems
                        .filter((i) => i.type === "kit")
                        .map((item) => (
                          <SelectItem key={`kit:${item.id}`} value={`kit:${item.id}`}>
                            <div className="flex items-center gap-2">
                              <Boxes className="h-3.5 w-3.5 text-primary" />
                              <span>{item.name}</span>
                              {!item.hasItems && (
                                <AlertTriangle className="h-3 w-3 text-amber-500" />
                              )}
                            </div>
                          </SelectItem>
                        ))}
                    </>
                  )}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="w-24">
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Qtd"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={disabled}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAddItem}
          disabled={disabled || !selectedItemKey || !quantity}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="rounded-md border divide-y">
          {items.map((item) => (
            <div
              key={`${item.type}:${item.id}`}
              className="flex items-center justify-between p-3 gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {item.type === "kit" ? (
                    <Boxes className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <p className="text-sm font-medium truncate">{item.name}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={item.type === "kit" ? "default" : "secondary"} 
                    className="text-xs"
                  >
                    {item.type === "kit" ? "Kit" : item.unit}
                  </Badge>
                  {item.type === "kit" && !item.hasItems && (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Kit sem produtos
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-20 h-8 text-sm"
                  value={item.quantity}
                  onChange={(e) =>
                    handleQuantityChange(item.id, item.type, e.target.value)
                  }
                  disabled={disabled}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveItem(item.id, item.type)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 border rounded-md bg-muted/20">
          Nenhum material vinculado. Adicione produtos ou kits do estoque para consumo automático.
        </p>
      )}
    </div>
  );
}
