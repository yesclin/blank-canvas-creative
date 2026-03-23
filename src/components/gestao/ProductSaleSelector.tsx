import { useState, useEffect, useCallback } from "react";
import { Package, Plus, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProducts } from "@/hooks/useProducts";
import { ProductSearchCombobox } from "./ProductSearchCombobox";
import { SelectedProductsList } from "./SelectedProductsList";
import type { Product } from "@/types/inventory";

export interface SelectedProduct {
  product: Product;
  quantity: number;
  stockError?: string;
}

export interface StockValidationError {
  productId: string;
  productName: string;
  requested: number;
  available: number;
  message: string;
}

interface ProductSaleSelectorProps {
  selectedProducts: SelectedProduct[];
  onProductsChange: (products: SelectedProduct[]) => void;
  onTotalChange: (total: number) => void;
  allowNegativeStock?: boolean;
  onValidationChange?: (errors: StockValidationError[]) => void;
  disabled?: boolean;
}

export function ProductSaleSelector({
  selectedProducts,
  onProductsChange,
  onTotalChange,
  allowNegativeStock = false,
  onValidationChange,
  disabled = false,
}: ProductSaleSelectorProps) {
  const { data: products = [], isLoading } = useProducts(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }, []);

  // Validate stock and calculate total
  useEffect(() => {
    const total = selectedProducts.reduce(
      (sum, item) => sum + item.product.sale_price * item.quantity,
      0
    );
    onTotalChange(total);

    // Validate stock for all selected products
    const errors: StockValidationError[] = [];
    const updatedProducts = selectedProducts.map((item) => {
      const available = item.product.stock_quantity;
      if (item.quantity > available && !allowNegativeStock) {
        const error: StockValidationError = {
          productId: item.product.id,
          productName: item.product.name,
          requested: item.quantity,
          available,
          message: `Quantidade (${item.quantity}) excede estoque disponível (${available})`,
        };
        errors.push(error);
        return { ...item, stockError: error.message };
      }
      return { ...item, stockError: undefined };
    });

    // Only update if there are changes to stockError
    const hasErrorChanges = updatedProducts.some(
      (updated, idx) => updated.stockError !== selectedProducts[idx].stockError
    );
    if (hasErrorChanges) {
      onProductsChange(updatedProducts);
    }

    onValidationChange?.(errors);
  }, [selectedProducts, onTotalChange, allowNegativeStock, onValidationChange]);

  const handleProductSelect = useCallback((productId: string) => {
    setSelectedProductId(productId);
    setQuantity(1);
  }, []);

  const handleAddProduct = useCallback(() => {
    if (!selectedProductId) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    // Check if product already exists in selection
    const existingIndex = selectedProducts.findIndex(
      (sp) => sp.product.id === selectedProductId
    );

    if (existingIndex >= 0) {
      // Update quantity of existing product
      const newProducts = [...selectedProducts];
      const newQty = newProducts[existingIndex].quantity + quantity;
      const maxQty = allowNegativeStock ? Infinity : product.stock_quantity;
      newProducts[existingIndex].quantity = Math.min(newQty, maxQty);
      onProductsChange(newProducts);
    } else {
      // Add new product
      onProductsChange([...selectedProducts, { product, quantity }]);
    }

    // Reset selection
    setSelectedProductId("");
    setQuantity(1);
  }, [selectedProductId, quantity, products, selectedProducts, allowNegativeStock, onProductsChange]);

  const handleRemoveProduct = useCallback((productId: string) => {
    onProductsChange(selectedProducts.filter((sp) => sp.product.id !== productId));
  }, [selectedProducts, onProductsChange]);

  const handleQuantityChange = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const product = selectedProducts.find((sp) => sp.product.id === productId);
    if (!product) return;

    const maxAllowed = allowNegativeStock ? Infinity : product.product.stock_quantity;
    const finalQuantity = Math.min(newQuantity, maxAllowed);

    onProductsChange(
      selectedProducts.map((sp) =>
        sp.product.id === productId ? { ...sp, quantity: finalQuantity } : sp
      )
    );
  }, [selectedProducts, allowNegativeStock, onProductsChange]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const maxQuantity = selectedProduct?.stock_quantity || 0;
  const canAddMore = selectedProduct && quantity <= maxQuantity;

  return (
    <div className="space-y-4">
      {/* Product Search Section */}
      <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4" />
          Adicionar Produtos à Venda
        </div>

        {/* Searchable Product Selector */}
        <div className="space-y-2">
          <Label htmlFor="product-search">Buscar Produto</Label>
          <ProductSearchCombobox
            products={products}
            selectedProductId={selectedProductId}
            onSelect={handleProductSelect}
            isLoading={isLoading}
            disabled={disabled}
          />
        </div>

        {/* Quantity and Add Button */}
        {selectedProduct && (
          <div className="grid grid-cols-[1fr,auto] gap-3 items-end animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={allowNegativeStock ? undefined : maxQuantity}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    const max = allowNegativeStock ? val : Math.min(val, maxQuantity);
                    setQuantity(Math.max(1, max));
                  }}
                  className="w-24 text-center"
                  disabled={disabled}
                />
                <div className="flex flex-col text-xs text-muted-foreground">
                  <span>Subtotal: {formatCurrency(selectedProduct.sale_price * quantity)}</span>
                  {!allowNegativeStock && quantity >= maxQuantity && (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Máximo disponível
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleAddProduct}
              disabled={disabled || !canAddMore}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        )}

        {/* Empty state hint */}
        {!isLoading && products.length === 0 && (
          <Alert>
            <AlertDescription className="text-sm">
              Nenhum produto cadastrado. Cadastre produtos na aba Estoque antes de registrar vendas.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Selected Products List */}
      <SelectedProductsList
        selectedProducts={selectedProducts}
        onQuantityChange={handleQuantityChange}
        onRemove={handleRemoveProduct}
        allowNegativeStock={allowNegativeStock}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
