import { useState } from "react";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLeads, type LeadsFilters } from "@/hooks/crm/useLeads";
import { LeadsFiltersBar } from "@/components/comercial/LeadsFiltersBar";
import { LeadFormDialog } from "@/components/comercial/LeadFormDialog";
import { LeadDetailsDrawer } from "@/components/comercial/LeadDetailsDrawer";
import { OpportunityFormDialog } from "@/components/comercial/OpportunityFormDialog";
import { ReportEmptyState } from "@/components/relatorios/ReportEmptyState";
import { LEAD_STATUSES, LEAD_SOURCES, getLeadStatusColor, type CrmLead } from "@/types/crm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 20;

export default function LeadsPage() {
  const [filters, setFilters] = useState<LeadsFilters>({});
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useLeads(filters, page, PAGE_SIZE);

  const [formOpen, setFormOpen] = useState(false);
  const [editLead, setEditLead] = useState<CrmLead | null>(null);
  const [detailsLead, setDetailsLead] = useState<CrmLead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // For creating opportunity from lead
  const [oppFormOpen, setOppFormOpen] = useState(false);
  const [oppPrefillLead, setOppPrefillLead] = useState<CrmLead | null>(null);

  const leads = data?.leads || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleNewLead = () => { setEditLead(null); setFormOpen(true); };
  const handleEditLead = (lead: CrmLead) => { setEditLead(lead); setFormOpen(true); };
  const handleViewLead = (lead: CrmLead) => { setDetailsLead(lead); setDrawerOpen(true); };
  const handleCreateOpportunity = (lead: CrmLead) => { setOppPrefillLead(lead); setOppFormOpen(true); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Leads</h1>
            <p className="text-sm text-muted-foreground">
              {total > 0 ? `${total} lead${total > 1 ? "s" : ""} encontrado${total > 1 ? "s" : ""}` : "Gerencie seus contatos e potenciais clientes"}
            </p>
          </div>
        </div>
        <Button onClick={handleNewLead}>
          <Plus className="h-4 w-4 mr-2" /> Novo Lead
        </Button>
      </div>

      {/* Filters */}
      <LeadsFiltersBar filters={filters} onFiltersChange={(f) => { setFilters(f); setPage(1); }} />

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : isError ? (
        <ReportEmptyState
          title="Erro ao carregar leads"
          description="Ocorreu um erro ao buscar os leads. Tente novamente."
          actionLabel="Tentar novamente"
          onAction={() => refetch()}
        />
      ) : leads.length === 0 ? (
        <ReportEmptyState
          title="Nenhum lead encontrado"
          description={Object.values(filters).some(v => v) ? "Nenhum lead corresponde aos filtros aplicados." : "Comece cadastrando seu primeiro lead."}
          icon={<Users className="h-8 w-8 text-muted-foreground" />}
          actionLabel={Object.values(filters).some(v => v) ? "Limpar filtros" : undefined}
          onAction={Object.values(filters).some(v => v) ? () => setFilters({}) : undefined}
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead className="hidden lg:table-cell">Origem</TableHead>
                  <TableHead className="hidden lg:table-cell">Especialidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const statusLabel = LEAD_STATUSES.find(s => s.value === lead.status)?.label || lead.status;
                  const sourceLabel = LEAD_SOURCES.find(s => s.value === lead.source)?.label || lead.source || "—";
                  return (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewLead(lead)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{lead.name}</div>
                          {lead.email && <div className="text-xs text-muted-foreground">{lead.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{lead.phone || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{sourceLabel}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {lead.specialty_interest?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getLeadStatusColor(lead.status)} variant="secondary">
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {format(new Date(lead.created_at), "dd/MM/yy", { locale: ptBR })}
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
      <LeadFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditLead(null); }}
        editLead={editLead}
      />
      <LeadDetailsDrawer
        lead={detailsLead}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onEdit={handleEditLead}
        onCreateOpportunity={handleCreateOpportunity}
      />
      <OpportunityFormDialog
        open={oppFormOpen}
        onOpenChange={(v) => { setOppFormOpen(v); if (!v) setOppPrefillLead(null); }}
        prefillLead={oppPrefillLead}
      />
    </div>
  );
}
