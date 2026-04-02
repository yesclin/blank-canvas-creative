import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign } from "lucide-react";
import type { Appointment } from "@/types/agenda";
import { useReceiveAppointmentPayment } from "@/hooks/useReceiveAppointmentPayment";
import { usePaymentMethods, type PaymentMethod } from "@/hooks/usePaymentMethods";

interface AppointmentReceivePaymentDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  financialStatus: {
    paymentStatus: string;
    amountExpected: number;
    amountReceived: number;
    amountDue: number;
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function AppointmentReceivePaymentDialog({
  appointment,
  open,
  onOpenChange,
  financialStatus,
}: AppointmentReceivePaymentDialogProps) {
  const receiveMutation = useReceiveAppointmentPayment();
  const { data: paymentMethods } = usePaymentMethods();

  const [amountToReceive, setAmountToReceive] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [notes, setNotes] = useState("");
  const [payFull, setPayFull] = useState(false);
  const [createFinance, setCreateFinance] = useState(true);
  const [installments, setInstallments] = useState(1);
  const [authorizationCode, setAuthorizationCode] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Selected method details
  const selectedMethod: PaymentMethod | undefined = useMemo(
    () => (paymentMethods || []).find((m) => m.id === selectedMethodId),
    [paymentMethods, selectedMethodId]
  );

  // Reset form when dialog opens
  useEffect(() => {
    if (open && appointment) {
      const due = financialStatus.amountDue;
      setAmountToReceive(due > 0 ? due.toFixed(2) : "");
      setSelectedMethodId("");
      setTransactionDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setPayFull(false);
      setCreateFinance(true);
      setInstallments(1);
      setAuthorizationCode("");
      setDueDate("");
    }
  }, [open, appointment, financialStatus.amountDue]);

  // Pay full checkbox toggles amount
  useEffect(() => {
    if (payFull && financialStatus.amountDue > 0) {
      setAmountToReceive(financialStatus.amountDue.toFixed(2));
    }
  }, [payFull, financialStatus.amountDue]);

  if (!appointment) return null;

  const parsedAmount = parseFloat(amountToReceive) || 0;
  const canSubmit =
    parsedAmount > 0 &&
    selectedMethodId &&
    transactionDate &&
    !receiveMutation.isPending;

  const handleConfirm = async () => {
    if (!canSubmit || !selectedMethod) return;

    await receiveMutation.mutateAsync({
      appointmentId: appointment.id,
      clinicId: appointment.clinic_id,
      patientId: appointment.patient_id,
      professionalId: appointment.professional_id,
      patientName: appointment.patient?.full_name || appointment.patient_snapshot_name || "Paciente",
      appointmentType: appointment.appointment_type,
      amountExpected: financialStatus.amountExpected,
      amountReceivedBefore: financialStatus.amountReceived,
      amountToReceive: parsedAmount,
      paymentMethodId: selectedMethod.id,
      paymentMethodCode: selectedMethod.code,
      transactionDate,
      notes: notes.trim() || undefined,
      createFinanceTransaction: createFinance,
      installments: selectedMethod.allows_installments ? installments : 1,
      authorizationCode: selectedMethod.requires_authorization_code ? authorizationCode.trim() || undefined : undefined,
      dueDate: selectedMethod.requires_due_date ? dueDate || undefined : undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Receber Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Appointment context */}
          <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
            <p className="font-medium">
              {appointment.patient?.full_name || appointment.patient_snapshot_name || "Paciente"}
            </p>
            {appointment.procedure?.name && (
              <p className="text-muted-foreground">{appointment.procedure.name}</p>
            )}
            {appointment.specialty?.name && !appointment.procedure?.name && (
              <p className="text-muted-foreground">{appointment.specialty.name}</p>
            )}
            {appointment.professional?.full_name && (
              <p className="text-muted-foreground text-xs">
                Prof. {appointment.professional.full_name}
              </p>
            )}
          </div>

          {/* Financial summary */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-muted p-2">
              <p className="text-xs text-muted-foreground">Previsto</p>
              <p className="text-sm font-semibold">{formatCurrency(financialStatus.amountExpected)}</p>
            </div>
            <div className="rounded-md bg-muted p-2">
              <p className="text-xs text-muted-foreground">Recebido</p>
              <p className="text-sm font-semibold text-green-600">{formatCurrency(financialStatus.amountReceived)}</p>
            </div>
            <div className="rounded-md bg-muted p-2">
              <p className="text-xs text-muted-foreground">Pendente</p>
              <p className="text-sm font-semibold text-red-600">{formatCurrency(financialStatus.amountDue)}</p>
            </div>
          </div>

          {/* Amount */}
          <div>
            <Label>Valor a receber agora *</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={amountToReceive}
              onChange={(e) => setAmountToReceive(e.target.value)}
              placeholder="0,00"
            />
          </div>

          {/* Payment method - from DB */}
          <div>
            <Label>Forma de recebimento *</Label>
            <Select value={selectedMethodId} onValueChange={setSelectedMethodId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {(paymentMethods || []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conditional fields based on selected method */}
          {selectedMethod?.allows_installments && (
            <div>
              <Label>Parcelas</Label>
              <Input
                type="number"
                min={1}
                max={selectedMethod.max_installments}
                value={installments}
                onChange={(e) => setInstallments(Math.max(1, Math.min(selectedMethod.max_installments, parseInt(e.target.value) || 1)))}
              />
              <p className="text-xs text-muted-foreground mt-1">Máx. {selectedMethod.max_installments}x</p>
            </div>
          )}

          {selectedMethod?.requires_authorization_code && (
            <div>
              <Label>Código/NSU de autorização</Label>
              <Input
                value={authorizationCode}
                onChange={(e) => setAuthorizationCode(e.target.value)}
                placeholder="NSU ou código"
                maxLength={100}
              />
            </div>
          )}

          {selectedMethod?.requires_due_date && (
            <div>
              <Label>Data de vencimento</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          )}

          {/* Date */}
          <div>
            <Label>Data do recebimento *</Label>
            <Input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações opcionais..."
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="payFull"
                checked={payFull}
                onCheckedChange={(c) => setPayFull(!!c)}
              />
              <Label htmlFor="payFull" className="text-sm font-normal cursor-pointer">
                Quitar total pendente
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="createFinance"
                checked={createFinance}
                onCheckedChange={(c) => setCreateFinance(!!c)}
              />
              <Label htmlFor="createFinance" className="text-sm font-normal cursor-pointer">
                Gerar lançamento financeiro
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit}>
            {receiveMutation.isPending ? "Registrando..." : "Confirmar Recebimento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
