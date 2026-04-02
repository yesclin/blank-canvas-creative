import { useState } from "react";
import { RefreshCw, Users, Target, FileText, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CommercialFiltersBar } from "@/components/comercial/reports/CommercialFiltersBar";
import { useCommercialKPIs, useCommercialFunnel, type CommercialFilters } from "@/hooks/crm/useCommercialStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data } = await supabase.from("user_roles").select("clinic_id").eq("user_id", user.id).single();
  if (!data?.clinic_id) throw new Error("Clínica não encontrada");
  return data.clinic_id;
}

function useRecentConversions(filters: CommercialFilters) {
  return useQuery({
    queryKey: ["recent-conversions", filters],
    queryFn: async () => {
      const clinicId = await getClinicId();
      let q = supabase
        .from("crm_leads")
        .select("id, name, phone, status, converted_patient_id, updated_at")
        .eq("clinic_id", clinicId)
        .eq("status", "convertido")
        .not("converted_patient_id", "is", null)
        .order("updated_at", { ascending: false })
        .limit(20);
      if (filters.dateFrom) q = q.gte("updated_at", filters.dateFrom);
      if (filters.dateTo) q = q.lte("updated_at", filters.dateTo + "T23:59:59");
      const { data } = await q;
      return data || [];
    },
  });
}

function useRecentQuoteConversions(filters: CommercialFilters) {
  return useQuery({
    queryKey: ["recent-quote-conversions", filters],
    queryFn: async () => {
      const clinicId = await getClinicId();
      let q = supabase
        .from("crm_quotes")
        .select(`
          id, quote_number, status, final_value, converted_at,
          lead:crm_leads!crm_quotes_lead_id_fkey(id, name),
          patient:patients!crm_quotes_patient_id_fkey(id, full_name)
        `)
        .eq("clinic_id", clinicId)
        .eq("status", "converted")
        .not("converted_at", "is", null)
        .order("converted_at", { ascending: false })
        .limit(20);
      if (filters.dateFrom) q = q.gte("converted_at", filters.dateFrom);
      if (filters.dateTo) q = q.lte("converted_at", filters.dateTo + "T23:59:59");
      const { data } = await q;
      return data || [];
    },
  });
}

export default function ConversionsPage() {
  const [filters, setFilters] = useState<CommercialFilters>({});
  const { data: kpis, isLoading: kpisLoading } = useCommercialKPIs(filters);
  const { data: funnel } = useCommercialFunnel(filters);
  const { data: leadConversions, isLoading: lcLoading } = useRecentConversions(filters);
  const { data: quoteConversions, isLoading: qcLoading } = useRecentQuoteConversions(filters);

  const fmtCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <RefreshCw className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Conversões</h1>
          <p className="text-sm text-muted-foreground">Acompanhamento de conversões de leads, orçamentos e oportunidades</p>
        </div>
      </div>

      <CommercialFiltersBar filters={filters} onChange={setFilters} />

      {/* Summary KPIs */}
      {kpisLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold">{kpis.conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">leads → pacientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Oportunidades Ganhas</p>
              <p className="text-2xl font-bold">{kpis.wonCount}</p>
              <p className="text-xs text-muted-foreground">{kpis.lostCount} perdidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Orçamentos Aprovados</p>
              <p className="text-2xl font-bold">{kpis.approvedQuotes}</p>
              <p className="text-xs text-muted-foreground">de {kpis.totalQuotes} total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Ticket Médio</p>
              <p className="text-2xl font-bold">{fmtCurrency(kpis.avgTicket)}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Funnel visualization */}
      {funnel && funnel.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2">
              {funnel.map((stage, i) => (
                <div key={stage.stage} className="flex items-center gap-2">
                  <div className="text-center min-w-[80px]">
                    <div className="text-xl font-bold">{stage.count}</div>
                    <div className="text-xs text-muted-foreground">{stage.label}</div>
                  </div>
                  {i < funnel.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lead Conversions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Leads Convertidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lcLoading ? <Skeleton className="h-32" /> : (
              (leadConversions || []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma conversão de lead no período.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Lead</TableHead>
                      <TableHead className="text-xs">Telefone</TableHead>
                      <TableHead className="text-xs">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(leadConversions || []).map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs font-medium">{l.name}</TableCell>
                        <TableCell className="text-xs">{l.phone || "—"}</TableCell>
                        <TableCell className="text-xs">{format(new Date(l.updated_at), "dd/MM/yy", { locale: ptBR })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}
          </CardContent>
        </Card>

        {/* Quote Conversions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Orçamentos Convertidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {qcLoading ? <Skeleton className="h-32" /> : (
              (quoteConversions || []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum orçamento convertido no período.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nº</TableHead>
                      <TableHead className="text-xs">Cliente</TableHead>
                      <TableHead className="text-xs text-right">Valor</TableHead>
                      <TableHead className="text-xs">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(quoteConversions || []).map((q: any) => (
                      <TableRow key={q.id}>
                        <TableCell className="text-xs font-medium">{q.quote_number || "—"}</TableCell>
                        <TableCell className="text-xs">{q.patient?.full_name || q.lead?.name || "—"}</TableCell>
                        <TableCell className="text-xs text-right">{fmtCurrency(Number(q.final_value))}</TableCell>
                        <TableCell className="text-xs">{q.converted_at ? format(new Date(q.converted_at), "dd/MM/yy", { locale: ptBR }) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
