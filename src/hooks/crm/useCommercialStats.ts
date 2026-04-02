import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  const { data } = await supabase
    .from("user_roles")
    .select("clinic_id")
    .eq("user_id", user.id)
    .single();
  if (!data?.clinic_id) throw new Error("Clínica não encontrada");
  return data.clinic_id;
}

export interface CommercialFilters {
  dateFrom?: string;
  dateTo?: string;
  professionalId?: string;
  specialtyId?: string;
  source?: string;
  assignedTo?: string;
}

export interface CommercialKPIs {
  totalLeads: number;
  openOpportunities: number;
  valueInNegotiation: number;
  conversionRate: number;
  avgTicket: number;
  avgCloseDays: number;
  wonCount: number;
  lostCount: number;
  totalQuotes: number;
  approvedQuotes: number;
  totalFollowups: number;
  overdueFollowups: number;
}

export function useCommercialKPIs(filters: CommercialFilters = {}) {
  return useQuery({
    queryKey: ["commercial-kpis", filters],
    queryFn: async (): Promise<CommercialKPIs> => {
      const clinicId = await getClinicId();

      // Leads
      let leadsQuery = supabase
        .from("crm_leads")
        .select("id, status, source, created_at", { count: "exact", head: true })
        .eq("clinic_id", clinicId);
      if (filters.dateFrom) leadsQuery = leadsQuery.gte("created_at", filters.dateFrom);
      if (filters.dateTo) leadsQuery = leadsQuery.lte("created_at", filters.dateTo + "T23:59:59");
      if (filters.source) leadsQuery = leadsQuery.eq("source", filters.source);
      if (filters.assignedTo) leadsQuery = leadsQuery.eq("assigned_to", filters.assignedTo);
      const { count: totalLeads } = await leadsQuery;

      // Converted leads
      let convertedQuery = supabase
        .from("crm_leads")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId)
        .eq("status", "convertido");
      if (filters.dateFrom) convertedQuery = convertedQuery.gte("created_at", filters.dateFrom);
      if (filters.dateTo) convertedQuery = convertedQuery.lte("created_at", filters.dateTo + "T23:59:59");
      const { count: convertedLeads } = await convertedQuery;

      // Opportunities
      let oppsQuery = supabase
        .from("crm_opportunities")
        .select("id, status, estimated_value, is_won, is_lost, created_at, closed_at")
        .eq("clinic_id", clinicId);
      if (filters.dateFrom) oppsQuery = oppsQuery.gte("created_at", filters.dateFrom);
      if (filters.dateTo) oppsQuery = oppsQuery.lte("created_at", filters.dateTo + "T23:59:59");
      if (filters.professionalId) oppsQuery = oppsQuery.eq("professional_id", filters.professionalId);
      if (filters.specialtyId) oppsQuery = oppsQuery.eq("specialty_id", filters.specialtyId);
      const { data: opps } = await oppsQuery;

      const openOpps = (opps || []).filter(o => o.status === "aberta");
      const wonOpps = (opps || []).filter(o => o.is_won);
      const lostOpps = (opps || []).filter(o => o.is_lost);

      const valueInNegotiation = openOpps.reduce((s, o) => s + (Number(o.estimated_value) || 0), 0);
      const wonValue = wonOpps.reduce((s, o) => s + (Number(o.estimated_value) || 0), 0);
      const avgTicket = wonOpps.length > 0 ? wonValue / wonOpps.length : 0;

      // Avg close days
      let totalDays = 0;
      let closedCount = 0;
      for (const o of wonOpps) {
        if (o.closed_at && o.created_at) {
          const days = (new Date(o.closed_at).getTime() - new Date(o.created_at).getTime()) / (1000 * 60 * 60 * 24);
          totalDays += days;
          closedCount++;
        }
      }

      // Quotes
      let quotesQuery = supabase
        .from("crm_quotes")
        .select("id, status", { count: "exact", head: false })
        .eq("clinic_id", clinicId);
      if (filters.dateFrom) quotesQuery = quotesQuery.gte("created_at", filters.dateFrom);
      if (filters.dateTo) quotesQuery = quotesQuery.lte("created_at", filters.dateTo + "T23:59:59");
      const { data: quotes } = await quotesQuery;

      const approvedQuotes = (quotes || []).filter(q => q.status === "approved" || q.status === "converted").length;

      // Follow-ups
      let fuQuery = supabase
        .from("crm_followups")
        .select("id, status, scheduled_at", { count: "exact", head: false })
        .eq("clinic_id", clinicId);
      if (filters.dateFrom) fuQuery = fuQuery.gte("scheduled_at", filters.dateFrom);
      if (filters.dateTo) fuQuery = fuQuery.lte("scheduled_at", filters.dateTo + "T23:59:59");
      const { data: followups } = await fuQuery;

      const overdueFollowups = (followups || []).filter(f =>
        f.status === "pending" && new Date(f.scheduled_at) < new Date()
      ).length;

      const conversionRate = (totalLeads || 0) > 0
        ? ((convertedLeads || 0) / (totalLeads || 1)) * 100
        : 0;

      return {
        totalLeads: totalLeads || 0,
        openOpportunities: openOpps.length,
        valueInNegotiation,
        conversionRate,
        avgTicket,
        avgCloseDays: closedCount > 0 ? totalDays / closedCount : 0,
        wonCount: wonOpps.length,
        lostCount: lostOpps.length,
        totalQuotes: (quotes || []).length,
        approvedQuotes,
        totalFollowups: (followups || []).length,
        overdueFollowups,
      };
    },
  });
}

// Funnel data
export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  value: number;
}

export function useCommercialFunnel(filters: CommercialFilters = {}) {
  return useQuery({
    queryKey: ["commercial-funnel", filters],
    queryFn: async (): Promise<FunnelStage[]> => {
      const clinicId = await getClinicId();

      // Leads by status
      let leadsQ = supabase
        .from("crm_leads")
        .select("status")
        .eq("clinic_id", clinicId);
      if (filters.dateFrom) leadsQ = leadsQ.gte("created_at", filters.dateFrom);
      if (filters.dateTo) leadsQ = leadsQ.lte("created_at", filters.dateTo + "T23:59:59");
      const { data: leads } = await leadsQ;

      // Opps by status
      let oppsQ = supabase
        .from("crm_opportunities")
        .select("status, estimated_value, is_won, is_lost")
        .eq("clinic_id", clinicId);
      if (filters.dateFrom) oppsQ = oppsQ.gte("created_at", filters.dateFrom);
      if (filters.dateTo) oppsQ = oppsQ.lte("created_at", filters.dateTo + "T23:59:59");
      const { data: opps } = await oppsQ;

      const leadCount = (leads || []).length;
      const qualifiedLeads = (leads || []).filter(l => l.status === "qualificado" || l.status === "negociando" || l.status === "convertido").length;
      const totalOpps = (opps || []).length;
      const wonOpps = (opps || []).filter(o => o.is_won);
      const wonValue = wonOpps.reduce((s, o) => s + (Number(o.estimated_value) || 0), 0);
      const allValue = (opps || []).reduce((s, o) => s + (Number(o.estimated_value) || 0), 0);

      return [
        { stage: "leads", label: "Leads", count: leadCount, value: 0 },
        { stage: "qualified", label: "Qualificados", count: qualifiedLeads, value: 0 },
        { stage: "opportunities", label: "Oportunidades", count: totalOpps, value: allValue },
        { stage: "won", label: "Ganhas", count: wonOpps.length, value: wonValue },
      ];
    },
  });
}

// Loss reasons
export interface LossReasonStat {
  reason: string;
  count: number;
}

export function useLossReasons(filters: CommercialFilters = {}) {
  return useQuery({
    queryKey: ["commercial-loss-reasons", filters],
    queryFn: async (): Promise<LossReasonStat[]> => {
      const clinicId = await getClinicId();

      let q = supabase
        .from("crm_opportunities")
        .select("loss_reason")
        .eq("clinic_id", clinicId)
        .eq("is_lost", true)
        .not("loss_reason", "is", null);
      if (filters.dateFrom) q = q.gte("created_at", filters.dateFrom);
      if (filters.dateTo) q = q.lte("created_at", filters.dateTo + "T23:59:59");
      const { data } = await q;

      const counts: Record<string, number> = {};
      for (const o of data || []) {
        const r = (o as any).loss_reason || "Não informado";
        counts[r] = (counts[r] || 0) + 1;
      }

      return Object.entries(counts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);
    },
  });
}

// Performance by source
export interface SourcePerformance {
  source: string;
  leads: number;
  converted: number;
  rate: number;
}

export function usePerformanceBySource(filters: CommercialFilters = {}) {
  return useQuery({
    queryKey: ["commercial-perf-source", filters],
    queryFn: async (): Promise<SourcePerformance[]> => {
      const clinicId = await getClinicId();

      let q = supabase
        .from("crm_leads")
        .select("source, status")
        .eq("clinic_id", clinicId);
      if (filters.dateFrom) q = q.gte("created_at", filters.dateFrom);
      if (filters.dateTo) q = q.lte("created_at", filters.dateTo + "T23:59:59");
      const { data } = await q;

      const bySource: Record<string, { leads: number; converted: number }> = {};
      for (const l of data || []) {
        const src = (l as any).source || "outro";
        if (!bySource[src]) bySource[src] = { leads: 0, converted: 0 };
        bySource[src].leads++;
        if ((l as any).status === "convertido") bySource[src].converted++;
      }

      return Object.entries(bySource)
        .map(([source, d]) => ({
          source,
          leads: d.leads,
          converted: d.converted,
          rate: d.leads > 0 ? (d.converted / d.leads) * 100 : 0,
        }))
        .sort((a, b) => b.leads - a.leads);
    },
  });
}

// Performance by user
export interface UserPerformance {
  userId: string;
  userName: string;
  leads: number;
  opportunities: number;
  wonValue: number;
}

export function usePerformanceByUser(filters: CommercialFilters = {}) {
  return useQuery({
    queryKey: ["commercial-perf-user", filters],
    queryFn: async (): Promise<UserPerformance[]> => {
      const clinicId = await getClinicId();

      // Leads by assigned_to
      let leadsQ = supabase
        .from("crm_leads")
        .select("assigned_to")
        .eq("clinic_id", clinicId)
        .not("assigned_to", "is", null);
      if (filters.dateFrom) leadsQ = leadsQ.gte("created_at", filters.dateFrom);
      if (filters.dateTo) leadsQ = leadsQ.lte("created_at", filters.dateTo + "T23:59:59");
      const { data: leads } = await leadsQ;

      // Opps by assigned
      let oppsQ = supabase
        .from("crm_opportunities")
        .select("assigned_to_user_id, estimated_value, is_won")
        .eq("clinic_id", clinicId)
        .not("assigned_to_user_id", "is", null);
      if (filters.dateFrom) oppsQ = oppsQ.gte("created_at", filters.dateFrom);
      if (filters.dateTo) oppsQ = oppsQ.lte("created_at", filters.dateTo + "T23:59:59");
      const { data: opps } = await oppsQ;

      // Get user names
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("clinic_id", clinicId);
      const nameMap: Record<string, string> = {};
      for (const p of profiles || []) nameMap[(p as any).user_id] = (p as any).full_name;

      const userMap: Record<string, UserPerformance> = {};
      for (const l of leads || []) {
        const uid = (l as any).assigned_to;
        if (!uid) continue;
        if (!userMap[uid]) userMap[uid] = { userId: uid, userName: nameMap[uid] || uid, leads: 0, opportunities: 0, wonValue: 0 };
        userMap[uid].leads++;
      }
      for (const o of opps || []) {
        const uid = (o as any).assigned_to_user_id;
        if (!uid) continue;
        if (!userMap[uid]) userMap[uid] = { userId: uid, userName: nameMap[uid] || uid, leads: 0, opportunities: 0, wonValue: 0 };
        userMap[uid].opportunities++;
        if ((o as any).is_won) userMap[uid].wonValue += Number((o as any).estimated_value) || 0;
      }

      return Object.values(userMap).sort((a, b) => b.wonValue - a.wonValue);
    },
  });
}
