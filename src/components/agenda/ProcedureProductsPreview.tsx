import { Package, AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProcedureProductsByProcedure, ProcedureProduct } from "@/hooks/useProcedureProductsCRUD";
import { useProcedureStockValidation } from "@/hooks/useProcedureStockValidation";

interface ProcedureProductsPreviewProps {
  procedureId: string | null;
  procedureName?: string;
}

export function ProcedureProductsPreview({ 
  procedureId,
  procedureName 
}: ProcedureProductsPreviewProps) {
  const { 
    data: products = [], 
    isLoading, 
    isError 
  } = useProcedureProductsByProcedure(procedureId);

  const {
    data: stockValidation,
    isLoading: isValidating,
  } = useProcedureStockValidation(procedureId);

  if (!procedureId || procedureId === "none") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Package className="h-4 w-4" />
          Carregando produtos...
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-3 border rounded-lg bg-destructive/10 border-destructive/20">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          Erro ao carregar produtos do procedimento
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-3 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          Nenhum produto configurado para este procedimento
        </div>
      </div>
    );
  }

  // Calculate total estimated cost
  const totalCost = products.reduce((sum, p) => {
    return sum + (p.product_cost_price || 0) * p.quantity;
  }, 0);

  const hasStockIssues = stockValidation && !stockValidation.isValid;

  return (
    <div className="p-3 border rounded-lg bg-accent/30 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4 text-primary" />
          Produtos a consumir
        </div>
        <div className="flex items-center gap-2">
          {!isValidating && stockValidation && (
            stockValidation.isValid ? (
              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Estoque OK
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Estoque insuficiente
              </Badge>
            )
          )}
          <Badge variant="secondary" className="text-xs">
            {products.length} {products.length === 1 ? 'item' : 'itens'}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-1.5">
        {products.map((product) => {
          const stockItem = stockValidation?.items.find(
            (item) => item.productId === product.product_id
          );
          return (
            <ProductRow 
              key={product.id} 
              product={product} 
              stockInfo={stockItem}
            />
          );
        })}
      </div>

      {totalCost > 0 && (
        <div className="pt-2 border-t flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Custo estimado:</span>
          <span className="font-medium">
            {totalCost.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
        </div>
      )}

      {hasStockIssues && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-xs">
            {stockValidation.allowNegativeStock 
              ? "Alguns produtos estão com estoque insuficiente. O procedimento poderá ser executado, mas o estoque ficará negativo."
              : "Alguns produtos estão com estoque insuficiente. Reponha o estoque antes de executar o procedimento."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface ProductRowProps {
  product: ProcedureProduct;
  stockInfo?: {
    availableStock: number;
    hasEnoughStock: boolean;
    deficit: number;
  };
}

function ProductRow({ product, stockInfo }: ProductRowProps) {
  const unitCost = product.product_cost_price || 0;
  const totalCost = unitCost * product.quantity;
  const hasStockIssue = stockInfo && !stockInfo.hasEnoughStock;

  return (
    <div className={`flex items-center justify-between text-sm py-1 px-2 rounded ${
      hasStockIssue ? 'bg-amber-50 border border-amber-200' : 'bg-background/50'
    }`}>
      <div className="flex items-center gap-2">
        <span className="font-medium">{product.product_name}</span>
        {product.product_unit && (
          <span className="text-xs text-muted-foreground">
            ({product.product_unit})
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Badge 
          variant="outline" 
          className={`text-xs font-normal ${hasStockIssue ? 'border-amber-400 text-amber-700' : ''}`}
        >
          Qtd: {product.quantity}
          {stockInfo && (
            <span className={`ml-1 ${hasStockIssue ? 'text-amber-600' : 'text-muted-foreground'}`}>
              (disp: {stockInfo.availableStock})
            </span>
          )}
        </Badge>
        {totalCost > 0 && (
          <span className="text-xs text-muted-foreground">
            {totalCost.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
