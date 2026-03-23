import { AlertTriangle, Package, XCircle, CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { StockValidationResult } from "@/hooks/useProcedureStockValidation";

interface StockValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validationResult: StockValidationResult | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function StockValidationDialog({
  open,
  onOpenChange,
  validationResult,
  onConfirm,
  onCancel,
}: StockValidationDialogProps) {
  if (!validationResult) return null;

  const { items, allowNegativeStock, isValid, totalDeficit } = validationResult;
  const insufficientItems = items.filter((item) => !item.hasEnoughStock);

  // If stock is valid, no dialog needed
  if (isValid) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Estoque Insuficiente
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                {allowNegativeStock
                  ? "Os seguintes produtos não possuem estoque suficiente para este procedimento. Deseja continuar mesmo assim?"
                  : "Não é possível iniciar o atendimento. Os seguintes produtos não possuem estoque suficiente:"}
              </p>

              <div className="space-y-2">
                {insufficientItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm text-foreground">
                        {item.productName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge
                        variant="outline"
                        className="text-destructive border-destructive"
                      >
                        {item.availableStock} / {item.requiredQuantity}
                      </Badge>
                      <span className="text-destructive font-medium">
                        -{item.deficit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {allowNegativeStock ? (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    A clínica permite estoque negativo. O procedimento será
                    executado e o estoque ficará negativo em{" "}
                    <strong>{totalDeficit}</strong> unidade(s).
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Reponha o estoque antes de iniciar o atendimento ou ajuste a
                    configuração da clínica para permitir estoque negativo.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          {allowNegativeStock && (
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Continuar Mesmo Assim
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
