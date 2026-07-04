import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";
import { isRevenue, isExpense } from "@/utils/financeEnumMapper";

export type DashboardPeriod = "today" | "week" | "month" | "year" | "custom";

export interface FinanceDashboardFilters {
  period: DashboardPeriod;
  startDate?: string; // yyyy-MM-dd, for custom
  endDate?: string;
  professionalId?: string | null;
  specialtyId?: string | null;
}

function resolveRange(f: FinanceDashboardFilters) {
  const now = new Date();
  let start: Date, end: Date;
  switch (f.period) {
    case "today": start = startOfDay(now); end = endOfDay(now); break;
    case "week": start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfWeek(now, { weekStartsOn: 1 }); break;
    case "month": start = startOfMonth(now); end = endOfMonth(now); break;
    case "year": start = startOfYear(now); end = endOfYear(now); break;
    case "custom":
      start = f.startDate ? new Date(f.startDate + "T00:00:00") : startOfMonth(now);
      end = f.endDate ? new Date(f.endDate + "T23:59:59") : endOfMonth(now);
      break;
  }
  return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") };
}

async function getClinicId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("clinic_id").eq("user_id", user.id).maybeSingle();
  return profile?.clinic_id ?? null;
}

export interface FinanceDashboardData {
  revenue: { today: number; week: number; month: number; year: number };
  receivable: number; // pending revenue (not paid)
  payable: number;   // pending expense
  overdue: number;   // pending & due_date < today
  upcoming: number;  // pending & due_date >= today
  cashCurrent: number; // open cash register balance sum
  ticketAverage: number; // avg received revenue per transaction in period
  byProfessional: Array<{ id: string; name: string; total: number }>;
  bySpecialty: Array<{ id: string; name: string; total: number }>;
  byProcedure: Array<{ id: string; name: string; total: number }>;
  byPaymentMethod: Array<{ method: string; total: number }>;
  timeSeries: Array<{ date: string; receita: number; despesa: number }>;
}

export function useFinanceDashboard(filters: FinanceDashboardFilters) {
  return useQuery<FinanceDashboardData>({
    queryKey: ["finance-dashboard", filters],
    queryFn: async () => {
      const clinicId = await getClinicId();
      if (!clinicId) throw new Error("Clínica não encontrada");
      const { start, end } = resolveRange(filters);
      const today = format(new Date(), "yyyy-MM-dd");

      // Base tx query in the period
      let q = supabase
        .from("finance_transactions")
        .select("id,type,status,amount,transaction_date,due_date,paid_at,payment_method,professional_id,appointment_id,reference_type,reference_id")
        .eq("clinic_id", clinicId)
        .gte("transaction_date", start)
        .lte("transaction_date", end);
      if (filters.professionalId) q = q.eq("professional_id", filters.professionalId);
      const { data: txs, error } = await q;
      if (error) throw error;
      const rows = txs ?? [];

      const paidRevenueRows = rows.filter(r => isRevenue(r.type) && r.status === "pago");
      const revenuePeriod = paidRevenueRows.reduce((s, r) => s + Number(r.amount || 0), 0);

      // Revenue windows (today/week/month/year) — separate queries
      const now = new Date();
      const windows = {
        today: [format(startOfDay(now), "yyyy-MM-dd"), format(endOfDay(now), "yyyy-MM-dd")],
        week: [format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"), format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")],
        month: [format(startOfMonth(now), "yyyy-MM-dd"), format(endOfMonth(now), "yyyy-MM-dd")],
        year: [format(startOfYear(now), "yyyy-MM-dd"), format(endOfYear(now), "yyyy-MM-dd")],
      } as const;

      async function sumRevenue([s, e]: readonly [string, string]) {
        let qq = supabase.from("finance_transactions")
          .select("amount,type,status")
          .eq("clinic_id", clinicId)
          .gte("transaction_date", s).lte("transaction_date", e)
          .eq("status", "pago");
        if (filters.professionalId) qq = qq.eq("professional_id", filters.professionalId);
        const { data } = await qq;
        return (data ?? []).filter(r => isRevenue(r.type)).reduce((a, r) => a + Number(r.amount || 0), 0);
      }
      const [rToday, rWeek, rMonth, rYear] = await Promise.all([
        sumRevenue(windows.today), sumRevenue(windows.week), sumRevenue(windows.month), sumRevenue(windows.year),
      ]);

      // Receivable / payable / overdue / upcoming — from ALL pending (not restricted to period)
      let pendQ = supabase.from("finance_transactions")
        .select("type,amount,due_date,status")
        .eq("clinic_id", clinicId)
        .in("status", ["pendente", "atrasado"]);
      if (filters.professionalId) pendQ = pendQ.eq("professional_id", filters.professionalId);
      const { data: pendData } = await pendQ;
      const pend = pendData ?? [];
      const receivable = pend.filter(r => isRevenue(r.type)).reduce((a, r) => a + Number(r.amount || 0), 0);
      const payable = pend.filter(r => isExpense(r.type)).reduce((a, r) => a + Number(r.amount || 0), 0);
      const overdue = pend.filter(r => r.due_date && r.due_date < today).reduce((a, r) => a + Number(r.amount || 0), 0);
      const upcoming = pend.filter(r => !r.due_date || r.due_date >= today).reduce((a, r) => a + Number(r.amount || 0), 0);

      // Current cash: sum opening + movements for open registers of clinic
      let cashCurrent = 0;
      try {
        const { data: cregs } = await supabase.from("cash_registers")
          .select("id,opening_amount,status")
          .eq("clinic_id", clinicId).eq("status", "aberto");
        if (cregs && cregs.length) {
          const ids = cregs.map(c => c.id);
          const { data: movs } = await supabase.from("cash_movements")
            .select("cash_register_id,amount,movement_type").in("cash_register_id", ids);
          const balances: Record<string, number> = {};
          cregs.forEach(c => balances[c.id] = Number(c.opening_amount || 0));
          (movs ?? []).forEach(m => {
            const sign = m.movement_type === "sangria" || m.movement_type === "saida" ? -1 : 1;
            balances[m.cash_register_id] = (balances[m.cash_register_id] || 0) + sign * Number(m.amount || 0);
          });
          cashCurrent = Object.values(balances).reduce((a, b) => a + b, 0);
        }
      } catch { /* tables may not yet be granted; ignore */ }

      const ticketAverage = paidRevenueRows.length ? revenuePeriod / paidRevenueRows.length : 0;

      // By professional
      const profIds = Array.from(new Set(paidRevenueRows.map(r => r.professional_id).filter(Boolean))) as string[];
      let profMap: Record<string, string> = {};
      if (profIds.length) {
        const { data: profs } = await supabase.from("professionals")
          .select("id,full_name").in("id", profIds);
        (profs ?? []).forEach(p => profMap[p.id] = p.full_name);
      }
      const byProfessional = Object.entries(
        paidRevenueRows.reduce<Record<string, number>>((acc, r) => {
          const k = r.professional_id || "sem_profissional";
          acc[k] = (acc[k] || 0) + Number(r.amount || 0);
          return acc;
        }, {})
      ).map(([id, total]) => ({ id, name: profMap[id] || "Sem profissional", total }))
        .sort((a, b) => b.total - a.total);

      // By procedure (via appointments -> procedure_id)
      const apptIds = Array.from(new Set(paidRevenueRows.map(r => r.appointment_id).filter(Boolean))) as string[];
      let procMap: Record<string, { id: string; name: string; specialty_id: string | null }> = {};
      let apptProc: Record<string, string> = {};
      let apptSpec: Record<string, string | null> = {};
      if (apptIds.length) {
        const { data: appts } = await supabase.from("appointments")
          .select("id,procedure_id,specialty_id").in("id", apptIds);
        (appts ?? []).forEach(a => {
          if (a.procedure_id) apptProc[a.id] = a.procedure_id;
          apptSpec[a.id] = (a as any).specialty_id ?? null;
        });
        const procIds = Array.from(new Set(Object.values(apptProc)));
        if (procIds.length) {
          const { data: procs } = await supabase.from("procedures")
            .select("id,name,specialty_id").in("id", procIds);
          (procs ?? []).forEach(p => procMap[p.id] = { id: p.id, name: p.name, specialty_id: (p as any).specialty_id ?? null });
        }
      }
      const procAgg: Record<string, number> = {};
      const specAgg: Record<string, number> = {};
      paidRevenueRows.forEach(r => {
        const apId = r.appointment_id as string | null;
        const pId = apId ? apptProc[apId] : undefined;
        if (pId) procAgg[pId] = (procAgg[pId] || 0) + Number(r.amount || 0);
        const sId = apId ? (apptSpec[apId] ?? (pId ? procMap[pId]?.specialty_id ?? null : null)) : null;
        const sKey = sId || "sem_especialidade";
        specAgg[sKey] = (specAgg[sKey] || 0) + Number(r.amount || 0);
      });

      const byProcedure = Object.entries(procAgg).map(([id, total]) => ({
        id, name: procMap[id]?.name || "Procedimento", total,
      })).sort((a, b) => b.total - a.total);

      // Specialty names
      const specIds = Object.keys(specAgg).filter(k => k !== "sem_especialidade");
      let specMap: Record<string, string> = {};
      if (specIds.length) {
        const { data: specs } = await supabase.from("specialties")
          .select("id,name").in("id", specIds);
        (specs ?? []).forEach(s => specMap[s.id] = s.name);
      }
      let bySpecialty = Object.entries(specAgg).map(([id, total]) => ({
        id, name: id === "sem_especialidade" ? "Sem especialidade" : (specMap[id] || "Especialidade"), total,
      })).sort((a, b) => b.total - a.total);
      if (filters.specialtyId) {
        bySpecialty = bySpecialty.filter(s => s.id === filters.specialtyId);
      }

      // By payment method
      const pmAgg: Record<string, number> = {};
      paidRevenueRows.forEach(r => {
        const k = r.payment_method || "não informado";
        pmAgg[k] = (pmAgg[k] || 0) + Number(r.amount || 0);
      });
      const byPaymentMethod = Object.entries(pmAgg).map(([method, total]) => ({ method, total }))
        .sort((a, b) => b.total - a.total);

      // Time series (daily) receita vs despesa within the period
      const daily: Record<string, { receita: number; despesa: number }> = {};
      rows.forEach(r => {
        if (r.status !== "pago") return;
        const d = r.transaction_date;
        if (!daily[d]) daily[d] = { receita: 0, despesa: 0 };
        if (isRevenue(r.type)) daily[d].receita += Number(r.amount || 0);
        else if (isExpense(r.type)) daily[d].despesa += Number(r.amount || 0);
      });
      const timeSeries = Object.entries(daily)
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        revenue: { today: rToday, week: rWeek, month: rMonth, year: rYear },
        receivable, payable, overdue, upcoming,
        cashCurrent, ticketAverage,
        byProfessional, bySpecialty, byProcedure, byPaymentMethod, timeSeries,
      };
    },
    staleTime: 30_000,
  });
}
