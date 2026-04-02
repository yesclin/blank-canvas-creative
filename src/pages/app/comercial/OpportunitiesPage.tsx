import { useState } from "react";
import { Target, Plus, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOpportunities, type OpportunitiesFilters } from "@/hooks/crm/useOpportunities";
import { OpportunitiesFiltersBar } from "@/components/comercial/OpportunitiesFiltersBar";
import { OpportunityFormDialog } from "@/components/comercial/OpportunityFormDialog";
import { OpportunityDrawer } from "@/components/comercial/OpportunityDrawer";
import { ReportEmptyState } from "@/components/relatorios/ReportEmptyState";
import { OPPORTUNITY_STATUSES, getOpportunityStatusColor, type CrmOpportunity } from "@/types/crm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 20;

export default function OpportunitiesPage() {
  const [filters, setFilters] = useState<OpportunitiesFilters>({});
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useOpportunities(filters, page, PAGE_SIZE);

  const [formOpen, setFormOpen] = useState(false);
  const [editOpp, setEditOpp] = useState<CrmOpportunity | null>(null);
  const [detailsOpp, setDetailsOpp] = useState<CrmOpportunity | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const opportunities = data?.opportunities || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleNew = () => { setEditOpp(null); setFormOpen(true); };
  const handleEdit = (opp: CrmOpportunity) => { setEditOpp(opp); setFormOpen(true); };
  const handleView = (opp: CrmOpportunity) => { setDetailsOpp(opp); setDrawerOpen(true); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Oportunidades</h1>
            <p className="text-sm text-muted-foreground">
              {total > 0 ? `${total} oportunidade${total > 1 ? "s" : ""}` : "Pipeline de vendas e oportunidades de negócio"}
            </p>
          </div>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" /> Nova Oportunidade
        </Button>
      </div>

      {/* Filters */}
      <OpportunitiesFiltersBar filters={filters} onFiltersChange={(f) => { setFilters(f); setPage(1); }} />

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : isError ? (
        <ReportEmptyState
          title="Erro ao carregar oportunidades"
          description="Ocorreu um erro ao buscar as oportunidades. Tente novamente."
          actionLabel="Tentar novamente"
          onAction={() => refetch()}
        />
      ) : opportunities.length === 0 ? (
        <ReportEmptyState
          title="Nenhuma oportunidade encontrada"
          description={Object.values(filters).some(v => v) ? "Nenhuma oportunidade corresponde aos filtros." : "Crie sua primeira oportunidade de negócio."}
          icon={<Target className="h-8 w-8 text-muted-foreground" />}
          actionLabel={Object.values(filters).some(v => v) ? "Limpar filtros" : undefined}
          onAction={Object.values(filters).some(v => v) ? () => setFilters({}) : undefined}
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden md:table-cell">Lead</TableHead>
                  <TableHead className="hidden lg:table-cell">Especialidade</TableHead>
                  <TableHead className="hidden md:table-cell">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Prob.</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((opp) => {
                  const statusLabel = OPPORTUNITY_STATUSES.find(s => s.value === opp.status)?.label || opp.status;
                  return (
                    <TableRow
                      key={opp.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleView(opp)}
                    >
                      <TableCell>
                        <div className="font-medium">{opp.title}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {opp.lead?.name || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {opp.specialty?.name || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {opp.estimated_value != null ? (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {Number(opp.estimated_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getOpportunityStatusColor(opp.status)} variant="secondary">
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {opp.closing_probability}%
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {format(new Date(opp.created_at), "dd/MM/yy", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
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

      {/* Dialogs & Drawers */}
      <OpportunityFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditOpp(null); }}
        editOpportunity={editOpp}
      />
      <OpportunityDrawer
        opportunity={detailsOpp}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onEdit={handleEdit}
      />
    </div>
  );
}
