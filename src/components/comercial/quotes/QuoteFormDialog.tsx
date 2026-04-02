import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCreateQuote } from "@/hooks/crm/useQuotes";
import { useCrmProfessionals, useCrmLeadsForSelect } from "@/hooks/crm/useCrmOptions";
import { QuoteItemsEditor } from "./QuoteItemsEditor";
import type { CrmQuoteItemFormData } from "@/types/quote";
import { calculateQuoteTotals } from "@/types/quote";
import { Loader2 } from "lucide-react";

interface QuoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillLeadId?: string;
  prefillOpportunityId?: string;
}

const defaultItem = (): CrmQuoteItemFormData => ({
  description: "",
  quantity: 1,
  unit_value: 0,
  discount_percent: 0,
});

export function QuoteFormDialog({ open, onOpenChange, prefillLeadId, prefillOpportunityId }: QuoteFormDialogProps) {
  const createQuote = useCreateQuote();
  const { data: professionals } = useCrmProfessionals();
  const { data: leads } = useCrmLeadsForSelect();

  const [form, setForm] = useState({
    lead_id: prefillLeadId || "",
    opportunity_id: prefillOpportunityId || "",
    professional_id: "",
    valid_until: "",
    discount_percent: "0",
    notes: "",
    terms_text: "",
  });

  const [items, setItems] = useState<CrmQuoteItemFormData[]>([defaultItem()]);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const discountPct = parseFloat(form.discount_percent) || 0;
  const { subtotal, discountAmount, total } = calculateQuoteTotals(items, discountPct);

  const canSubmit = items.some(i => i.description.trim() && i.unit_value > 0) && !createQuote.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    await createQuote.mutateAsync({
      lead_id: form.lead_id || undefined,
      opportunity_id: form.opportunity_id || undefined,
      professional_id: form.professional_id || undefined,
      valid_until: form.valid_until || undefined,
      discount_percent: discountPct,
      notes: form.notes || undefined,
      terms_text: form.terms_text || undefined,
      items: items.filter(i => i.description.trim()),
    });

    // Reset
    setForm({ lead_id: "", opportunity_id: "", professional_id: "", valid_until: "", discount_percent: "0", notes: "", terms_text: "" });
    setItems([defaultItem()]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Orçamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Lead</Label>
              <Select value={form.lead_id} onValueChange={v => set("lead_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {(leads || []).map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Profissional</Label>
              <Select value={form.professional_id} onValueChange={v => set("professional_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {(professionals || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="valid_until">Válido até</Label>
              <Input id="valid_until" type="date" value={form.valid_until} onChange={e => set("valid_until", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="discount_percent">Desconto Geral (%)</Label>
              <Input id="discount_percent" type="number" min={0} max={100} step="0.01" value={form.discount_percent} onChange={e => set("discount_percent", e.target.value)} />
            </div>
          </div>

          <Separator />

          <QuoteItemsEditor items={items} onChange={setItems} />

          <Separator />

          {/* Totals */}
          <div className="bg-muted/50 rounded-md p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Desconto ({discountPct}%):</span>
                <span>- R$ {discountAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t">
              <span>Total:</span>
              <span>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} maxLength={2000} />
          </div>

          <div>
            <Label htmlFor="terms_text">Termos e Condições</Label>
            <Textarea id="terms_text" value={form.terms_text} onChange={e => set("terms_text", e.target.value)} rows={2} maxLength={5000} placeholder="Condições de pagamento, validade, etc." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!canSubmit}>
              {createQuote.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Orçamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
