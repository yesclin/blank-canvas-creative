import { Minus, Plus, Trash2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { SelectedProduct } from "./ProductSaleSelector";

interface SelectedProductsListProps {
  selectedProducts: SelectedProduct[];
  onQuantityChange: (productId: string, newQuantity: number) => void;
  onRemove: (productId: string) => void;
  allowNegativeStock?: boolean;
  formatCurrency: (value: number) => string;
}

export function SelectedProductsList({
  selectedProducts,
  onQuantityChange,
  onRemove,
  allowNegativeStock = false,
  formatCurrency,
}: SelectedProductsListProps) {
  const hasErrors = selectedProducts.some((item) => item.stockError);
  const total = selectedProducts.reduce(
    (sum, item) => sum + item.product.sale_price * item.quantity,
    0
  );

  if (selectedProducts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Produtos Selecionados ({selectedProducts.length})
        </Label>
        {hasErrors && (
          <span className="text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Há erros de estoque
          </span>
        )}
      </div>

      <div className="divide-y border rounded-lg overflow-hidden">
        {selectedProducts.map((item) => (
          <div
            key={item.product.id}
            className={`flex flex-col p-3 transition-colors ${
              item.stockError ? "bg-destructive/5" : "hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(item.product.sale_price)} × {item.quantity}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Quantity controls */}
                <div className="flex items-center border rounded-md">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-r-none"
                    onClick={() => onQuantityChange(item.product.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-10 text-center text-sm font-medium tabular-nums">
                    {item.quantity}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-l-none"
                    onClick={() => onQuantityChange(item.product.id, item.quantity + 1)}
                    disabled={
                      !allowNegativeStock && item.quantity >= item.product.stock_quantity
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Subtotal */}
                <span className="font-medium text-sm w-24 text-right tabular-nums">
                  {formatCurrency(item.product.sale_price * item.quantity)}
                </span>

                {/* Remove button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(item.product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Error message */}
            {item.stockError && (
              <div className="flex items-center gap-2 mt-2 text-destructive text-xs">
                <XCircle className="h-3 w-3 shrink-0" />
                <span>{item.stockError}</span>
              </div>
            )}
          </div>
        ))}

        {/* Total row */}
        <div className="flex items-center justify-between p-3 bg-muted/50">
          <span className="font-medium">Total da Venda</span>
          <span className="font-bold text-lg tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {hasErrors && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs">
            Corrija os erros de estoque antes de salvar a venda.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
