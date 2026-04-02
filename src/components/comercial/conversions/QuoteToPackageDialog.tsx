import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package } from "lucide-react";
import { useConvertQuoteToPackage, type QuoteToPackageData } from "@/hooks/crm/useConversions";
import type { CrmQuote } from "@/types/quote";

interface QuoteToPackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: CrmQuote | null;
}

const PAYMENT_METHODS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência" },
];

export function QuoteToPackageDialog({ open, onOpenChange, quote }: QuoteToPackageDialogProps) {
  const convert = useConvertQuoteToPackage();

  const [form, setForm] = useState({
    name: "",
    totalSessions: "1",
    paymentMethod: "",
    validUntil: "",
    notes: "",
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  if (!quote) return null;

  const patientId = quote.patient_id;
  const patientName = quote.patient?.full_name || quote.lead?.name || "—";
  const totalAmount = Number(quote.final_value) || 0;

  // Derive name from items
  const defaultName = (quote.items || []).map(i => i.description).filter(Boolean).join(" + ") || `Pacote - ${quote.quote_number}`;

  const canSubmit = !!patientId && form.name.trim().length > 0 && parseInt(form.totalSessions) > 0;

  const handleSubmit = async () => {
    if (!canSubmit || !patientId) return;

    const payload: QuoteToPackageData = {
      quoteId: quote.id,
      patientId,
      name: form.name.trim(),
      totalSessions: parseInt(form.totalSessions) || 1,
      totalAmount,
      procedureId: quote.items?.[0]?.procedure_id || undefined,
      professionalId: quote.professional_id || undefined,
      paymentMethod: form.paymentMethod || undefined,
      validUntil: form.validUntil || undefined,
      notes: form.notes.trim() || undefined,
    };

    await convert.mutateAsync(payload);
    onOpenChange(false);
  };

  // Pre-fill name on open
  if (open && !form.name) {
    setForm(p => ({ ...p, name: defaultName }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Converter em Pacote de Tratamento
          </DialogTitle>
          <DialogDescription>
            Criar pacote a partir do orçamento <strong>{quote.quote_number}</strong>.
          </DialogDescription>
        </DialogHeader>

        {!patientId ? (
          <div className="text-sm text-destructive py-4">
            Este orçamento não possui um paciente vinculado. Converta o lead em paciente primeiro.
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Paciente</Label>
              <p className="text-sm font-medium">{patientName}</p>
            </div>

            <div>
              <Label>Nome do Pacote *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} maxLength={200} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Total de Sessões *</Label>
                <Input type="number" min={1} max={999} value={form.totalSessions} onChange={e => set("totalSessions", e.target.value)} />
              </div>
              <div>
                <Label>Valor Total</Label>
                <div className="h-9 flex items-center text-sm font-medium">
                  R$ {totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={form.paymentMethod} onValueChange={v => set("paymentMethod", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Válido até</Label>
                <Input type="date" value={form.validUntil} onChange={e => set("validUntil", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} maxLength={1000} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {patientId && (
            <Button onClick={handleSubmit} disabled={!canSubmit || convert.isPending}>
              {convert.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Pacote
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
