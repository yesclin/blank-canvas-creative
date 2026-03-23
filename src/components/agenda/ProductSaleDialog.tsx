import { useState, useCallback, useMemo } from "react";
import { ShoppingCart, Loader2, ShieldX, ShieldAlert, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductSaleSelector, type SelectedProduct, type StockValidationError } from "@/components/gestao/ProductSaleSelector";
import { useCreateSale } from "@/hooks/useSales";
import { useSalePermissions } from "@/hooks/useSalePermissions";
import { usePatients } from "@/hooks/usePatients";
import { toast } from "sonner";
import { paymentMethods } from "@/types/gestao";

interface ProductSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Patient ID - optional for standalone sales, required when from appointment */
  patientId?: string | null;
  /** Patient name - optional for standalone sales */
  patientName?: string | null;
  /** Appointment ID - when provided, indicates sale is from appointment context */
  appointmentId?: string | null;
  onSuccess?: () => void;
}

export function ProductSaleDialog({
  open,
  onOpenChange,
  patientId: initialPatientId,
  patientName: initialPatientName,
  appointmentId,
  onSuccess,
}: ProductSaleDialogProps) {
  const createSale = useCreateSale();
  const { data: patients = [], isLoading: patientsLoading } = usePatients();
  
  // Track selected patient (use initial values if provided)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(initialPatientId ?? null);
  
  // Determine if sale is from appointment context (patient is required)
  const isFromAppointment = Boolean(appointmentId && initialPatientId);
  
  // Get current patient info
  const currentPatientId = isFromAppointment ? initialPatientId : selectedPatientId;
  const currentPatientName = isFromAppointment 
    ? initialPatientName 
    : patients.find(p => p.id === selectedPatientId)?.full_name ?? null;
  
  const salePermissions = useSalePermissions(currentPatientId ?? null);
  
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [productSaleTotal, setProductSaleTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<StockValidationError[]>([]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }, []);

  const handleProductTotalChange = useCallback((total: number) => {
    setProductSaleTotal(total);
  }, []);

  const handleValidationChange = useCallback((errors: StockValidationError[]) => {
    setValidationErrors(errors);
  }, []);

  // Validation: patient required ONLY when from appointment context
  const patientError = useMemo(() => {
    if (isFromAppointment && !currentPatientId) {
      return "Paciente é obrigatório para vendas vinculadas a atendimentos.";
    }
    return null;
  }, [isFromAppointment, currentPatientId]);

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    const hasProducts = selectedProducts.length > 0;
    const noStockErrors = validationErrors.length === 0;
    const notBlocked = !salePermissions.isBlocked;
    const patientValid = !patientError;
    const notProcessing = !createSale.isPending;
    
    return hasProducts && noStockErrors && notBlocked && patientValid && notProcessing;
  }, [selectedProducts, validationErrors, salePermissions.isBlocked, patientError, createSale.isPending]);

  // Get descriptive button text based on current state
  const getSubmitButtonText = useCallback(() => {
    if (createSale.isPending) return "Processando...";
    if (salePermissions.isBlocked) return "Bloqueado";
    if (validationErrors.length > 0) return "Corrija os erros de estoque";
    if (selectedProducts.length === 0) return "Adicione produtos";
    if (patientError) return "Paciente obrigatório";
    return "Registrar Venda";
  }, [createSale.isPending, salePermissions.isBlocked, validationErrors.length, selectedProducts.length, patientError]);

  const handleSubmit = async () => {
    if (!canSubmit || createSale.isPending) return;

    try {
      await createSale.mutateAsync({
        sale_date: new Date().toISOString().split('T')[0],
        patient_id: currentPatientId || undefined,
        appointment_id: appointmentId || undefined,
        payment_method: paymentMethod || undefined,
        payment_status: 'pago',
        notes: notes || undefined,
        items: selectedProducts.map(sp => ({
          product_id: sp.product.id,
          product_name: sp.product.name,
          quantity: sp.quantity,
          unit_price: sp.product.sale_price,
        })),
      });

      toast.success("Venda registrada com sucesso!");
      
      // Reset form
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao criar venda:", error);
      
      // Provide clear, user-friendly error messages
      const errorMessage = error?.message?.toLowerCase() || "";
      
      if (errorMessage.includes("stock") || errorMessage.includes("estoque") || errorMessage.includes("insufficient")) {
        toast.error("Estoque insuficiente: A quantidade solicitada excede o disponível. Verifique os produtos e tente novamente.", {
          duration: 5000,
        });
      } else if (errorMessage.includes("patient") || errorMessage.includes("paciente") || errorMessage.includes("not found")) {
        toast.error("Paciente inválido: O paciente selecionado não foi encontrado ou está inativo.", {
          duration: 5000,
        });
      } else if (errorMessage.includes("permission") || errorMessage.includes("denied") || errorMessage.includes("unauthorized")) {
        toast.error("Sem permissão: Você não tem autorização para registrar esta venda.", {
          duration: 5000,
        });
      } else if (errorMessage.includes("network") || errorMessage.includes("connection") || errorMessage.includes("timeout")) {
        toast.error("Erro de conexão: Verifique sua internet e tente novamente.", {
          duration: 5000,
        });
      } else {
        toast.error(`Erro ao registrar venda: ${error?.message || "Ocorreu um erro inesperado. Tente novamente."}`, {
          duration: 5000,
        });
      }
    }
  };

  const resetForm = () => {
    setSelectedProducts([]);
    setProductSaleTotal(0);
    setPaymentMethod("");
    setNotes("");
    if (!isFromAppointment) {
      setSelectedPatientId(null);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Lançar Venda de Produtos
          </DialogTitle>
          <DialogDescription>
            {currentPatientName 
              ? <>Registrar venda de produtos para <strong>{currentPatientName}</strong></>
              : "Registrar venda de produtos"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Loading State */}
          {(salePermissions.isLoading || patientsLoading) ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : salePermissions.isBlocked ? (
            /* Permission/LGPD Block Alert */
            <Alert variant="destructive">
              <ShieldX className="h-4 w-4" />
              <AlertTitle>Ação Bloqueada</AlertTitle>
              <AlertDescription>
                {salePermissions.blockReason}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* LGPD Warning (when enabled but has consent) */}
              {currentPatientId && salePermissions.lgpdStatus.isEnforcementEnabled && salePermissions.lgpdStatus.hasValidConsent && (
                <Alert className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>LGPD Ativo</AlertTitle>
                  <AlertDescription>
                    O paciente possui consentimento LGPD válido. Esta venda será vinculada ao prontuário.
                  </AlertDescription>
                </Alert>
              )}

              {/* Stock Validation Errors Alert */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Estoque Insuficiente</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {validationErrors.map((error) => (
                        <li key={error.productId} className="text-sm">
                          <strong>{error.productName}</strong>: {error.message}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Patient Selection/Display */}
              {isFromAppointment ? (
                /* Read-only patient info when from appointment */
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground">Paciente (vinculado ao atendimento)</Label>
                  <p className="font-medium">{currentPatientName}</p>
                </div>
              ) : (
                /* Patient selector for standalone sales - NOT required */
                <div className="space-y-2">
                  <Label htmlFor="patient-select">
                    Paciente <span className="text-muted-foreground text-xs">(opcional - vincule a um paciente se desejar)</span>
                  </Label>
                  <Select 
                    value={selectedPatientId || "none"} 
                    onValueChange={(value) => setSelectedPatientId(value === "none" ? null : value)}
                    disabled={createSale.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Venda sem paciente vinculado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">Sem paciente (venda avulsa)</span>
                      </SelectItem>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Vendas avulsas não ficam vinculadas ao histórico de nenhum paciente.
                  </p>
                </div>
              )}

              {/* Product Selector */}
              <ProductSaleSelector
                selectedProducts={selectedProducts}
                onProductsChange={setSelectedProducts}
                onTotalChange={handleProductTotalChange}
                onValidationChange={handleValidationChange}
                disabled={createSale.isPending}
              />

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="payment-method">Forma de Pagamento</Label>
                <Select 
                  value={paymentMethod} 
                  onValueChange={setPaymentMethod}
                  disabled={createSale.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Observações sobre a venda..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={createSale.isPending}
                />
              </div>

              {/* Total */}
              {selectedProducts.length > 0 && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total da Venda</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(productSaleTotal)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={createSale.isPending}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!canSubmit || salePermissions.isLoading || patientsLoading}
            className="min-w-[140px]"
          >
            {createSale.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              getSubmitButtonText()
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
