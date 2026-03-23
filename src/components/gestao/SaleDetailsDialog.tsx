import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ShoppingCart,
  Package,
  CreditCard,
  User,
  Calendar,
  FileText,
  X,
  Loader2,
  Receipt,
  ArrowUpCircle,
  Ban,
  AlertTriangle,
  ShieldX,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSale, useCancelSale } from "@/hooks/useSales";
import { useSalePermissions } from "@/hooks/useSalePermissions";
import { paymentStatusLabels, paymentStatusColors, type PaymentStatus } from "@/types/inventory";
import { paymentMethods } from "@/types/gestao";
import { toast } from "sonner";

interface SaleDetailsDialogProps {
  saleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleDetailsDialog({ saleId, open, onOpenChange }: SaleDetailsDialogProps) {
  const { data: sale, isLoading } = useSale(saleId || undefined);
  const cancelSale = useCancelSale();
  const { canCancelSale, isLoading: permissionsLoading, logDeniedAction } = useSalePermissions(sale?.patient_id || null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getPaymentMethodLabel = (method?: string | null) => {
    return paymentMethods.find((m) => m.value === method)?.label || method || "-";
  };

  const isCanceled = sale?.status === 'cancelado' || sale?.payment_status === 'cancelado';

  const handleCancelSale = async () => {
    if (!saleId) return;
    
    // Double-check permission before attempting cancellation
    if (!canCancelSale) {
      await logDeniedAction('CANCEL_SALE', saleId);
      toast.error("Você não tem permissão para cancelar vendas. Contate o administrador.");
      setShowCancelConfirm(false);
      return;
    }
    
    cancelSale.mutate({ id: saleId }, {
      onSuccess: (data) => {
        setShowCancelConfirm(false);
        toast.success(
          `Venda cancelada com sucesso! ${data?.items_reverted || 0} ${data?.items_reverted === 1 ? 'item devolvido' : 'itens devolvidos'} ao estoque.`,
          {
            description: "O estoque foi restaurado e a transação financeira foi revertida.",
            duration: 5000,
          }
        );
        onOpenChange(false);
      },
      onError: (error: Error) => {
        const errorMessage = error.message || "Erro desconhecido ao cancelar venda.";
        
        // Parse known error types for clearer messages
        let userFriendlyMessage = errorMessage;
        if (errorMessage.includes("permissão")) {
          userFriendlyMessage = "Você não tem permissão para cancelar vendas. Apenas administradores ou usuários com permissão de exclusão podem realizar esta ação.";
        } else if (errorMessage.includes("não encontrada")) {
          userFriendlyMessage = "A venda não foi encontrada. Ela pode ter sido excluída ou já cancelada.";
        } else if (errorMessage.includes("já cancelada") || errorMessage.includes("already")) {
          userFriendlyMessage = "Esta venda já foi cancelada anteriormente.";
        }
        
        toast.error("Falha ao cancelar venda", {
          description: userFriendlyMessage,
          duration: 6000,
        });
      },
    });
  };

  const handleCancelButtonClick = async () => {
    if (!canCancelSale) {
      // Log denied attempt
      await logDeniedAction('CANCEL_SALE_ATTEMPT', saleId || undefined);
      toast.error("Você não tem permissão para cancelar vendas.");
      return;
    }
    setShowCancelConfirm(true);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className={`h-5 w-5 ${isCanceled ? 'text-destructive' : 'text-primary'}`} />
            Detalhes da Venda
            {isCanceled && (
              <Badge variant="destructive" className="ml-2">
                Cancelada
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {sale?.sale_number ? `Venda ${sale.sale_number}` : "Visualize os detalhes da venda"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sale ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 pr-4">
              {/* Sale Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Data da Venda
                  </p>
                  <p className="font-medium">
                    {format(new Date(sale.sale_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Receipt className="h-3.5 w-3.5" />
                    Status
                  </p>
                  <Badge className={paymentStatusColors[sale.payment_status as PaymentStatus]}>
                    {paymentStatusLabels[sale.payment_status as PaymentStatus] || sale.payment_status}
                  </Badge>
                </div>
                {sale.patients && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      Cliente
                    </p>
                    <a 
                      href={`/app/prontuario/${sale.patient_id}`}
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      {sale.patients.full_name}
                      <Receipt className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    Forma de Pagamento
                  </p>
                  <p className="font-medium">{getPaymentMethodLabel(sale.payment_method)}</p>
                </div>
              </div>

              <Separator />

              {/* Sale Items */}
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4" />
                  Itens da Venda
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.sale_items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.total_price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator />

              {/* Sale Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Desconto</span>
                    <span>- {formatCurrency(sale.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className={isCanceled ? 'text-muted-foreground line-through' : 'text-green-600'}>
                    {formatCurrency(sale.total_amount)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {sale.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4" />
                      Observações
                    </h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {sale.notes}
                    </p>
                  </div>
                </>
              )}

              {/* Traceability Info */}
              <Separator />
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4" />
                  Rastreabilidade
                </h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">ID da Venda:</span> {sale.id}
                  </p>
                  {sale.transaction_id && (
                    <p>
                      <span className="font-medium">ID Transação Financeira:</span> {sale.transaction_id}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Criado em:</span>{" "}
                    {format(new Date(sale.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                  </p>
                  <p>
                    <span className="font-medium">Atualizado em:</span>{" "}
                    {format(new Date(sale.updated_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Cancel Action */}
              {!isCanceled && (
                <div className="pt-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={handleCancelButtonClick}
                            disabled={cancelSale.isPending || permissionsLoading}
                          >
                            {cancelSale.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processando...
                              </>
                            ) : !canCancelSale && !permissionsLoading ? (
                              <>
                                <ShieldX className="h-4 w-4 mr-2" />
                                Cancelar Venda
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4 mr-2" />
                                Cancelar Venda
                              </>
                            )}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {!canCancelSale && !permissionsLoading && (
                        <TooltipContent>
                          <p>Você não tem permissão para cancelar vendas</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              {isCanceled && (
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-destructive">
                    <Ban className="h-4 w-4" />
                    <span className="font-medium">Venda Cancelada</span>
                  </div>
                  {sale?.canceled_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Cancelada em {format(new Date(sale.canceled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <X className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Venda não encontrada</p>
          </div>
        )}
      </DialogContent>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancelar Venda
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta venda? Esta ação irá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Restaurar o estoque dos produtos vendidos</li>
                <li>Marcar a venda como cancelada</li>
              </ul>
              <span className="block mt-2 font-medium text-destructive">
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelSale.isPending}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSale}
              disabled={cancelSale.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelSale.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
