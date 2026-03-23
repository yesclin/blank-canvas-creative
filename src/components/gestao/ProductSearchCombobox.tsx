import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Package, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/inventory";

interface ProductSearchComboboxProps {
  products: Product[];
  selectedProductId: string;
  onSelect: (productId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ProductSearchCombobox({
  products,
  selectedProductId,
  onSelect,
  isLoading = false,
  disabled = false,
}: ProductSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const searchLower = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.barcode?.toLowerCase().includes(searchLower) ||
        p.category?.toLowerCase().includes(searchLower)
    );
  }, [products, search]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStockBadgeVariant = (stock: number, minStock: number) => {
    if (stock === 0) return "destructive";
    if (stock <= minStock) return "secondary";
    return "outline";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10 py-2"
          disabled={disabled || isLoading}
        >
          {selectedProduct ? (
            <div className="flex items-center gap-2 text-left flex-1 min-w-0">
              <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate font-medium">{selectedProduct.name}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatCurrency(selectedProduct.sale_price)}</span>
                  <Badge
                    variant={getStockBadgeVariant(
                      selectedProduct.stock_quantity,
                      selectedProduct.min_stock_quantity
                    )}
                    className="text-xs h-5"
                  >
                    {selectedProduct.stock_quantity} em estoque
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground flex items-center gap-2">
              <Search className="h-4 w-4" />
              Buscar produto por nome, SKU ou código...
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Digite para buscar..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <span className="text-muted-foreground">Carregando produtos...</span>
              ) : (
                <span className="text-muted-foreground">Nenhum produto encontrado.</span>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock_quantity === 0;
                return (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={() => {
                      if (!isOutOfStock) {
                        onSelect(product.id);
                        setOpen(false);
                        setSearch("");
                      }
                    }}
                    disabled={isOutOfStock}
                    className={cn(
                      "flex flex-col items-start gap-1 py-3",
                      isOutOfStock && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            "h-4 w-4",
                            selectedProductId === product.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(product.sale_price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-6 text-xs">
                      {product.sku && (
                        <span className="text-muted-foreground">SKU: {product.sku}</span>
                      )}
                      <Badge
                        variant={getStockBadgeVariant(
                          product.stock_quantity,
                          product.min_stock_quantity
                        )}
                        className="text-xs"
                      >
                        {isOutOfStock ? "Sem estoque" : `${product.stock_quantity} disponível`}
                      </Badge>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
