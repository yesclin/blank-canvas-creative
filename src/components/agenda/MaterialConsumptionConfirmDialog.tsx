import { Package, AlertTriangle, CheckCircle } from "lucide-react";
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
import type { MaterialConsumptionItem } from "@/hooks/useMaterialConsumption";

interface MaterialConsumptionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materials: MaterialConsumptionItem[];
  totalCost: number;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function MaterialConsumptionConfirmDialog({
  open,
  onOpenChange,
  materials,
  totalCost,
  onConfirm,
  onCancel,
  isProcessing = false,
}: MaterialConsumptionConfirmDialogProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totalItems = materials.reduce((sum, m) => sum + m.quantity, 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Confirmar Baixa de Estoque
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Deseja confirmar a baixa dos seguintes materiais do estoque?
              </p>

              <div className="max-h-48 overflow-y-auto space-y-2">
                {materials.map((material, index) => (
                  <div
                    key={`${material.material_id}-${index}`}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm text-foreground">
                        {material.material_name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-foreground">
                      {material.quantity} {material.unit}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="text-sm font-medium text-foreground">
                  Total: {materials.length} materiais ({totalItems.toFixed(2)} unidades)
                </div>
                <div className="text-lg font-bold text-primary">
                  {formatCurrency(totalCost)}
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Esta ação irá deduzir as quantidades do estoque. Esta operação não pode ser desfeita automaticamente.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isProcessing}
            className="bg-primary hover:bg-primary/90"
          >
            {isProcessing ? (
              "Processando..."
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Baixa
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
