import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download } from "lucide-react";
import type { CrmQuote } from "@/types/quote";
import { QuoteStatusBadge } from "./QuoteStatusBadge";

interface QuotePdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: CrmQuote | null;
}

export function QuotePdfPreviewDialog({ open, onOpenChange, quote }: QuotePdfPreviewDialogProps) {
  if (!quote) return null;

  const handleDownload = () => {
    // Generate a printable HTML version
    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Orçamento ${quote.quote_number || ""}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .meta { color: #666; font-size: 13px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 13px; }
  th { background: #f9fafb; font-weight: 600; }
  .text-right { text-align: right; }
  .totals { background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; }
  .totals .row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 14px; }
  .totals .total { font-weight: bold; font-size: 18px; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 8px; }
  .notes { margin-top: 20px; font-size: 13px; color: #555; }
  .terms { margin-top: 12px; font-size: 11px; color: #888; white-space: pre-wrap; }
  @media print { body { padding: 0; } }
</style></head><body>
<h1>Orçamento ${quote.quote_number || ""}</h1>
<div class="meta">
  ${quote.lead?.name ? `<div>Lead: ${quote.lead.name}</div>` : ""}
  ${quote.professional?.name ? `<div>Profissional: ${quote.professional.name}</div>` : ""}
  ${quote.valid_until ? `<div>Válido até: ${format(new Date(quote.valid_until), "dd/MM/yyyy")}</div>` : ""}
  <div>Criado em: ${format(new Date(quote.created_at), "dd/MM/yyyy", { locale: ptBR })}</div>
</div>
<table>
  <thead><tr><th>Descrição</th><th class="text-right">Qtd</th><th class="text-right">Unitário</th><th class="text-right">Total</th></tr></thead>
  <tbody>
    ${(quote.items || []).map(item => `
      <tr>
        <td>${item.description}</td>
        <td class="text-right">${item.quantity}</td>
        <td class="text-right">R$ ${Number(item.unit_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
        <td class="text-right">R$ ${Number(item.total_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join("")}
  </tbody>
</table>
<div class="totals">
  <div class="row"><span>Subtotal:</span><span>R$ ${Number(quote.total_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
  ${Number(quote.discount_value) > 0 ? `<div class="row" style="color:#dc2626"><span>Desconto:</span><span>- R$ ${Number(quote.discount_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>` : ""}
  <div class="row total"><span>Total:</span><span>R$ ${Number(quote.final_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
</div>
${quote.notes ? `<div class="notes"><strong>Observações:</strong><br>${quote.notes}</div>` : ""}
${quote.terms_text ? `<div class="terms"><strong>Termos e Condições:</strong><br>${quote.terms_text}</div>` : ""}
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview - Orçamento {quote.quote_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <QuoteStatusBadge status={quote.status} />
          </div>

          <div className="text-sm space-y-1">
            {quote.lead?.name && <div>Lead: {quote.lead.name}</div>}
            {quote.professional?.name && <div>Profissional: {quote.professional.name}</div>}
            {quote.valid_until && <div>Válido até: {format(new Date(quote.valid_until), "dd/MM/yyyy")}</div>}
          </div>

          <Separator />

          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2 font-medium">Descrição</th>
                  <th className="text-right p-2 font-medium">Qtd</th>
                  <th className="text-right p-2 font-medium">Unitário</th>
                  <th className="text-right p-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {(quote.items || []).map(item => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2">{item.description}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-right">R$ {Number(item.unit_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="p-2 text-right font-medium">R$ {Number(item.total_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-muted/50 rounded-md p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal:</span><span>R$ {Number(quote.total_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
            {Number(quote.discount_value) > 0 && (
              <div className="flex justify-between text-destructive"><span>Desconto:</span><span>- R$ {Number(quote.discount_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total:</span><span>R$ {Number(quote.final_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" /> Imprimir / PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
