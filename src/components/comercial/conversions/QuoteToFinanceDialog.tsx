import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign } from "lucide-react";
import { useConvertQuoteToFinance, type QuoteToFinanceData } from "@/hooks/crm/useConversions";
import { format } from "date-fns";
import type { CrmQuote } from "@/types/quote";

interface QuoteToFinanceDialogProps {
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

export function QuoteToFinanceDialog({ open, onOpenChange, quote }: QuoteToFinanceDialogProps) {
  const convert = useConvertQuoteToFinance();

  const [form, setForm] = useState({
    amount: "",
    paymentMethod: "",
    transactionDate: format(new Date(), "yyyy-MM-dd"),
    description: "",
    notes: "",
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  if (!quote) return null;

  const totalAmount = Number(quote.final_value) || 0;
  const defaultDescription = `Orçamento ${quote.quote_number || ""} - ${quote.patient?.full_name || quote.lead?.name || ""}`.trim();

  // Pre-fill on open
  if (open && !form.amount && !form.description) {
    setForm(p => ({
      ...p,
      amount: totalAmount.toString(),
      description: defaultDescription,
    }));
  }

  const amount = parseFloat(form.amount) || 0;
  const canSubmit = amount > 0 && form.description.trim().length > 0 && !!form.transactionDate;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const payload: QuoteToFinanceData = {
      quoteId: quote.id,
      patientId: quote.patient_id || undefined,
      professionalId: quote.professional_id || undefined,
      amount,
      description: form.description.trim(),
      paymentMethod: form.paymentMethod || undefined,
      transactionDate: form.transactionDate,
      notes: form.notes.trim() || undefined,
    };

    await convert.mutateAsync(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Lançar no Financeiro
          </DialogTitle>
          <DialogDescription>
            Criar lançamento financeiro a partir do orçamento <strong>{quote.quote_number}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Descrição *</Label>
            <Input value={form.description} onChange={e => set("description", e.target.value)} maxLength={500} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" min={0.01} value={form.amount} onChange={e => set("amount", e.target.value)} />
            </div>
            <div>
              <Label>Data *</Label>
              <Input type="date" value={form.transactionDate} onChange={e => set("transactionDate", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Forma de Pagamento</Label>
            <Select value={form.paymentMethod || "none"} onValueChange={v => set("paymentMethod", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} maxLength={1000} />
          </div>

          <div className="bg-muted/50 rounded-md p-3 text-sm">
            <p className="text-muted-foreground">
              Será criada uma receita pendente de <strong>R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>.
              O status do orçamento será atualizado para "Convertido".
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || convert.isPending}>
            {convert.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar Lançamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
