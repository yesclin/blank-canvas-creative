import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, CheckCircle, XCircle, Copy, Send, DollarSign, Calendar, User } from "lucide-react";
import { useQuoteWithItems, useUpdateQuoteStatus, useDuplicateQuote } from "@/hooks/crm/useQuotes";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import type { CrmQuote } from "@/types/quote";

interface QuoteDetailsDrawerProps {
  quoteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGeneratePdf: (quote: CrmQuote) => void;
}

export function QuoteDetailsDrawer({ quoteId, open, onOpenChange, onGeneratePdf }: QuoteDetailsDrawerProps) {
  const { data: quote, isLoading } = useQuoteWithItems(quoteId);
  const updateStatus = useUpdateQuoteStatus();
  const duplicateQuote = useDuplicateQuote();

  const handleCopyText = () => {
    if (!quote) return;
    const itemsText = (quote.items || []).map((item, i) =>
      `${i + 1}. ${item.description} - ${item.quantity}x R$ ${Number(item.unit_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} = R$ ${Number(item.total_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    ).join("\n");

    const text = `*Orçamento ${quote.quote_number || ""}*\n\n${itemsText}\n\n*Total: R$ ${Number(quote.final_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}*${quote.valid_until ? `\nVálido até: ${format(new Date(quote.valid_until), "dd/MM/yyyy")}` : ""}${quote.terms_text ? `\n\n${quote.terms_text}` : ""}`;

    navigator.clipboard.writeText(text);
    import("sonner").then(({ toast }) => toast.success("Texto copiado para a área de transferência"));
  };

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isLoading ? "Carregando..." : `Orçamento ${quote?.quote_number || ""}`}
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-3 mt-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : quote ? (
          <div className="mt-6 space-y-5">
            <div className="flex items-center gap-2">
              <QuoteStatusBadge status={quote.status} />
            </div>

            {/* Info */}
            <div className="space-y-2 text-sm">
              {quote.lead && (
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> Lead: {quote.lead.name}</div>
              )}
              {quote.professional && (
                <div>Profissional: {quote.professional.name}</div>
              )}
              {quote.valid_until && (
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> Válido até: {format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: ptBR })}</div>
              )}
              <div className="text-xs text-muted-foreground">
                Criado em: {format(new Date(quote.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </div>
            </div>

            <Separator />

            {/* Items */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Itens</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Descrição</TableHead>
                    <TableHead className="text-xs text-right">Qtd</TableHead>
                    <TableHead className="text-xs text-right">Unitário</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(quote.items || []).map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs">{item.description}</TableCell>
                      <TableCell className="text-xs text-right">{item.quantity}</TableCell>
                      <TableCell className="text-xs text-right">R$ {Number(item.unit_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-xs text-right font-medium">R$ {Number(item.total_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="bg-muted/50 rounded-md p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {Number(quote.total_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              {Number(quote.discount_value) > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Desconto:</span>
                  <span>- R$ {Number(quote.discount_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1 border-t">
                <span>Total:</span>
                <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> R$ {Number(quote.final_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Notes */}
            {quote.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-1">Observações</h4>
                  <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
                </div>
              </>
            )}

            {quote.terms_text && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-1">Termos</h4>
                <p className="text-xs whitespace-pre-wrap text-muted-foreground">{quote.terms_text}</p>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {quote.status === "draft" && (
                <Button variant="outline" onClick={() => updateStatus.mutate({ id: quote.id, status: "sent" })} disabled={updateStatus.isPending}>
                  <Send className="h-4 w-4 mr-2" /> Marcar como Enviado
                </Button>
              )}
              {(quote.status === "draft" || quote.status === "sent" || quote.status === "viewed") && (
                <>
                  <Button variant="outline" className="text-green-700" onClick={() => updateStatus.mutate({ id: quote.id, status: "approved" })} disabled={updateStatus.isPending}>
                    <CheckCircle className="h-4 w-4 mr-2" /> Aprovar
                  </Button>
                  <Button variant="outline" className="text-destructive" onClick={() => updateStatus.mutate({ id: quote.id, status: "rejected" })} disabled={updateStatus.isPending}>
                    <XCircle className="h-4 w-4 mr-2" /> Recusar
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => onGeneratePdf(quote)}>
                <FileText className="h-4 w-4 mr-2" /> Gerar PDF
              </Button>
              <Button variant="outline" onClick={handleCopyText}>
                <Copy className="h-4 w-4 mr-2" /> Copiar para WhatsApp
              </Button>
              <Button variant="outline" onClick={() => duplicateQuote.mutate(quote.id)} disabled={duplicateQuote.isPending}>
                <Copy className="h-4 w-4 mr-2" /> Duplicar Orçamento
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
