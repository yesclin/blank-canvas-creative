import { useState } from "react";
import { FileText, Plus, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuotes, type QuotesFilters } from "@/hooks/crm/useQuotes";
import { QuoteFiltersBar } from "@/components/comercial/quotes/QuoteFiltersBar";
import { QuoteFormDialog } from "@/components/comercial/quotes/QuoteFormDialog";
import { QuoteDetailsDrawer } from "@/components/comercial/quotes/QuoteDetailsDrawer";
import { QuotePdfPreviewDialog } from "@/components/comercial/quotes/QuotePdfPreviewDialog";
import { QuoteStatusBadge } from "@/components/comercial/quotes/QuoteStatusBadge";
import { ReportEmptyState } from "@/components/relatorios/ReportEmptyState";
import type { CrmQuote } from "@/types/quote";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PAGE_SIZE = 20;

export default function QuotesPage() {
  const [filters, setFilters] = useState<QuotesFilters>({});
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useQuotes(filters, page, PAGE_SIZE);

  const [formOpen, setFormOpen] = useState(false);
  const [detailsQuoteId, setDetailsQuoteId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pdfQuote, setPdfQuote] = useState<CrmQuote | null>(null);

  const quotes = data?.quotes || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleView = (q: CrmQuote) => {
    setDetailsQuoteId(q.id);
    setDrawerOpen(true);
  };

  const handleGeneratePdf = (quote: CrmQuote) => {
    setPdfQuote(quote);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Orçamentos</h1>
            <p className="text-sm text-muted-foreground">
              {total > 0 ? `${total} orçamento${total > 1 ? "s" : ""}` : "Propostas e orçamentos para pacientes e leads"}
            </p>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Orçamento
        </Button>
      </div>

      {/* Filters */}
      <QuoteFiltersBar filters={filters} onFiltersChange={(f) => { setFilters(f); setPage(1); }} />

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : isError ? (
        <ReportEmptyState
          title="Erro ao carregar orçamentos"
          description="Tente novamente."
          actionLabel="Tentar novamente"
          onAction={() => refetch()}
        />
      ) : quotes.length === 0 ? (
        <ReportEmptyState
          title="Nenhum orçamento encontrado"
          description={Object.values(filters).some(v => v) ? "Nenhum orçamento corresponde aos filtros." : "Crie seu primeiro orçamento."}
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
          actionLabel={Object.values(filters).some(v => v) ? "Limpar filtros" : undefined}
          onAction={Object.values(filters).some(v => v) ? () => setFilters({}) : undefined}
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead className="hidden md:table-cell">Lead / Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Validade</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => (
                  <TableRow
                    key={q.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleView(q)}
                  >
                    <TableCell className="font-medium">{q.quote_number || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {q.lead?.name || q.patient?.full_name || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {Number(q.final_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <QuoteStatusBadge status={q.status} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {q.valid_until ? format(new Date(q.valid_until), "dd/MM/yy") : "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {format(new Date(q.created_at), "dd/MM/yy", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <QuoteFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <QuoteDetailsDrawer
        quoteId={detailsQuoteId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onGeneratePdf={handleGeneratePdf}
      />

      <QuotePdfPreviewDialog
        open={!!pdfQuote}
        onOpenChange={(v) => { if (!v) setPdfQuote(null); }}
        quote={pdfQuote}
      />
    </div>
  );
}
