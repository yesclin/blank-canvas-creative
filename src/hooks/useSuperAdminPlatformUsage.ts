import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UsagePeriod = "today" | "7d" | "30d" | "90d" | "ytd" | "custom";
export type ClinicStatusFilter = "all" | "active" | "inactive" | "trial" | "subscribed";
export type PlanFilter = "all" | string;

export interface UsageFilters {
  period: UsagePeriod;
  customFrom?: string;
  customTo?: string;
  status: ClinicStatusFilter;
  plan: PlanFilter;
}

export interface ClinicUsageRow {
  id: string;
  name: string;
  plan_name: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  users_count: number;
  professionals_count: number;
  patients_count: number;
  appointments_count: number;
  finished_count: number;
  clinical_records_count: number;
  messages_count: number;
  last_access_at: string | null;
  health_score: number;
  health_label: "Saudável" | "Atenção" | "Risco" | "Crítico";
  is_active_in_period: boolean;
  has_login_recent: boolean;
  has_appt_recent: boolean;
  whatsapp_connected: boolean;
}

export interface UsageData {
  clinics: ClinicUsageRow[];
  totals: {
    clinicsTotal: number;
    activeClinics: number;
    activeUsers: number;
    activeProfessionals: number;
    patientsTotal: number;
    appointments: number;
    finishedAppointments: number;
    clinicalRecords: number;
    messages: number;
    activeIntegrations: number;
  };
  health: {
    activeRate: number;
    avgAppointments: number;
    avgPatients: number;
    avgProfessionals: number;
    inactive7d: number;
    churnRisk: number;
  };
  trend: { date: string; appointments: number; patients: number; records: number; messages: number }[];
  modules: { key: string; label: string; clinicsUsing: number; events: number; adoption: number; status: "Alto" | "Médio" | "Baixo" | "Não usado" }[];
  specialties: { slug: string; name: string; clinics: number; professionals: number; patients: number; appointments: number; records: number }[];
  consumption: { key: string; label: string; value: number }[];
  alerts: { id: string; clinic_id: string; clinic_name: string; severity: "baixa" | "média" | "alta" | "crítica"; reason: string; lastAt: string | null; suggested: string }[];
}

export function getPeriodRange(filters: UsageFilters) {
  const now = new Date();
  let from = new Date();
  let to = new Date();
  switch (filters.period) {
    case "today": from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
    case "7d": from = new Date(now.getTime() - 7 * 86400000); break;
    case "30d": from = new Date(now.getTime() - 30 * 86400000); break;
    case "90d": from = new Date(now.getTime() - 90 * 86400000); break;
    case "ytd": from = new Date(now.getFullYear(), 0, 1); break;
    case "custom":
      from = filters.customFrom ? new Date(filters.customFrom) : new Date(now.getTime() - 30 * 86400000);
      to = filters.customTo ? new Date(filters.customTo) : now;
      break;
  }
  const span = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));
  const prevFrom = new Date(from.getTime() - span * 86400000);
  return { from, to, prevFrom, span };
}

const OFFICIAL = [
  { slug: "geral", name: "Clínica Geral" },
  { slug: "psicologia", name: "Psicologia" },
  { slug: "nutricao", name: "Nutrição" },
  { slug: "fisioterapia", name: "Fisioterapia" },
  { slug: "pilates", name: "Pilates" },
  { slug: "estetica", name: "Estética / Harmonização Facial" },
  { slug: "odontologia", name: "Odontologia" },
  { slug: "dermatologia", name: "Dermatologia" },
  { slug: "pediatria", name: "Pediatria" },
];

async function safeSelect<T = any>(builder: any): Promise<T[]> {
  try {
    const { data, error } = await builder;
    if (error) {
      console.warn("[platform-usage] query error:", error.message);
      return [];
    }
    return (data ?? []) as T[];
  } catch (e) {
    console.warn("[platform-usage] query threw:", e);
    return [];
  }
}

function classifyHealth(score: number): ClinicUsageRow["health_label"] {
  if (score >= 80) return "Saudável";
  if (score >= 60) return "Atenção";
  if (score >= 40) return "Risco";
  return "Crítico";
}

export function useSuperAdminPlatformUsage(filters: UsageFilters) {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const range = useMemo(() => getPeriodRange(filters), [filters]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fromIso = range.from.toISOString();
    const toIso = range.to.toISOString();
    const prevFromIso = range.prevFrom.toISOString();

    (async () => {
      try {
        const [
          clinicsRes,
          subsRes,
          plansRes,
          professionalsRes,
          patientsRes,
          apptsRes,
          apptsPrevRes,
          evolutionsRes,
          docsRes,
          messagesRes,
          messagesPrevRes,
          accessRes,
          accessPrevRes,
          integrationsRes,
          automationsRes,
          financeRes,
          salesRes,
          stockRes,
          tissRes,
          teleRes,
          platformUsersRes,
          specialtiesRes,
          profSpecRes,
        ] = await Promise.allSettled([
          safeSelect(supabase.from("clinics").select("id,name,created_at")),
          safeSelect(supabase.from("clinic_subscriptions").select("clinic_id,plan_id,status,trial_ends_at,current_period_end")),
          safeSelect(supabase.from("subscription_plans").select("id,name")),
          safeSelect(supabase.from("professionals").select("id,clinic_id,is_active,user_id")),
          safeSelect(supabase.from("patients").select("id,clinic_id,created_at")),
          safeSelect(supabase.from("appointments").select("id,clinic_id,status,created_at,finished_at,specialty_id").gte("created_at", fromIso).lte("created_at", toIso)),
          safeSelect(supabase.from("appointments").select("id,clinic_id").gte("created_at", prevFromIso).lt("created_at", fromIso)),
          safeSelect(supabase.from("clinical_evolutions").select("id,clinic_id,created_at,specialty_id").gte("created_at", fromIso).lte("created_at", toIso)),
          safeSelect(supabase.from("clinical_documents").select("id,clinic_id,created_at").gte("created_at", fromIso).lte("created_at", toIso)),
          safeSelect(supabase.from("message_logs").select("id,clinic_id,status,created_at").gte("created_at", fromIso).lte("created_at", toIso)),
          safeSelect(supabase.from("message_logs").select("id,clinic_id").gte("created_at", prevFromIso).lt("created_at", fromIso)),
          safeSelect(supabase.from("access_logs").select("clinic_id,user_id,created_at").gte("created_at", fromIso).lte("created_at", toIso).limit(5000)),
          safeSelect(supabase.from("access_logs").select("clinic_id,user_id,created_at").gte("created_at", prevFromIso).lt("created_at", fromIso).limit(5000)),
          safeSelect(supabase.from("clinic_channel_integrations").select("clinic_id,channel,is_active,status")),
          safeSelect(supabase.from("automation_rules").select("clinic_id,is_active")),
          safeSelect(supabase.from("finance_transactions").select("id,clinic_id,created_at").gte("created_at", fromIso).lte("created_at", toIso)),
          safeSelect(supabase.from("sales").select("id,clinic_id,created_at").gte("created_at", fromIso).lte("created_at", toIso)),
          safeSelect(supabase.from("inventory_movements").select("id,clinic_id,created_at").gte("created_at", fromIso).lte("created_at", toIso)),
          safeSelect(supabase.from("tiss_guides").select("id,clinic_id,created_at").gte("created_at", fromIso).lte("created_at", toIso)),
          safeSelect(supabase.from("teleconsultation_sessions").select("id,clinic_id,created_at").gte("created_at", fromIso).lte("created_at", toIso)),
          safeSelect(supabase.from("platform_users").select("id,user_id,last_login_at,status")),
          safeSelect(supabase.from("specialties").select("id,clinic_id,name,slug")),
          safeSelect(supabase.from("professional_specialties").select("professional_id,specialty_id")),
        ]);

        if (cancelled) return;

        const get = <T,>(res: PromiseSettledResult<T[]>): T[] => (res.status === "fulfilled" ? res.value : []) as T[];

        const clinics = get<any>(clinicsRes);
        const subs = get<any>(subsRes);
        const plans = get<any>(plansRes);
        const professionals = get<any>(professionalsRes);
        const patients = get<any>(patientsRes);
        const appts = get<any>(apptsRes);
        const apptsPrev = get<any>(apptsPrevRes);
        const evolutions = get<any>(evolutionsRes);
        const docs = get<any>(docsRes);
        const messages = get<any>(messagesRes);
        const messagesPrev = get<any>(messagesPrevRes);
        const access = get<any>(accessRes);
        const accessPrev = get<any>(accessPrevRes);
        const integrations = get<any>(integrationsRes);
        const automations = get<any>(automationsRes);
        const finance = get<any>(financeRes);
        const sales = get<any>(salesRes);
        const stock = get<any>(stockRes);
        const tiss = get<any>(tissRes);
        const tele = get<any>(teleRes);
        const allSpecs = get<any>(specialtiesRes);
        const profSpec = get<any>(profSpecRes);

        // Indexes
        const planById = new Map(plans.map((p: any) => [p.id, p.name]));
        const subByClinic = new Map(subs.map((s: any) => [s.clinic_id, s]));
        const professionalsByClinic = groupCount(professionals, "clinic_id", (p: any) => p.is_active !== false);
        const patientsByClinic = groupCount(patients, "clinic_id");
        const apptsByClinic = groupCount(appts, "clinic_id");
        const finishedByClinic = groupCount(appts, "clinic_id", (a: any) => a.status === "finished" || a.status === "finalizado" || !!a.finished_at);
        const evolutionsByClinic = groupCount(evolutions, "clinic_id");
        const messagesByClinic = groupCount(messages, "clinic_id");

        const lastAccessByClinic = new Map<string, string>();
        const usersByClinic = new Map<string, Set<string>>();
        for (const r of access) {
          if (!r.clinic_id) continue;
          const prev = lastAccessByClinic.get(r.clinic_id);
          if (!prev || prev < r.created_at) lastAccessByClinic.set(r.clinic_id, r.created_at);
          if (r.user_id) {
            if (!usersByClinic.has(r.clinic_id)) usersByClinic.set(r.clinic_id, new Set());
            usersByClinic.get(r.clinic_id)!.add(r.user_id);
          }
        }

        const integrationsByClinic = new Map<string, any[]>();
        for (const i of integrations) {
          if (!integrationsByClinic.has(i.clinic_id)) integrationsByClinic.set(i.clinic_id, []);
          integrationsByClinic.get(i.clinic_id)!.push(i);
        }

        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
        const fifteenDaysAgo = new Date(Date.now() - 15 * 86400000);
        const apptByClinicAll = new Map<string, string>(); // last appt date
        for (const a of appts) {
          const prev = apptByClinicAll.get(a.clinic_id);
          if (!prev || prev < a.created_at) apptByClinicAll.set(a.clinic_id, a.created_at);
        }

        // Filter plan filter
        const planFilterId = filters.plan;
        const filteredClinics = clinics.filter((c: any) => {
          const sub = subByClinic.get(c.id);
          if (filters.status === "trial" && sub?.status !== "trial") return false;
          if (filters.status === "subscribed" && sub?.status !== "active") return false;
          if (filters.status === "active" || filters.status === "inactive") {
            const active = isClinicActive(c.id, { lastAccessByClinic, apptsByClinic, patientsByClinic, evolutionsByClinic, messagesByClinic });
            if (filters.status === "active" && !active) return false;
            if (filters.status === "inactive" && active) return false;
          }
          if (planFilterId !== "all" && sub?.plan_id !== planFilterId) return false;
          return true;
        });

        const clinicRows: ClinicUsageRow[] = filteredClinics.map((c: any) => {
          const sub = subByClinic.get(c.id);
          const planName = sub?.plan_id ? planById.get(sub.plan_id) ?? null : null;
          const last = lastAccessByClinic.get(c.id) ?? null;
          const usersCount = usersByClinic.get(c.id)?.size ?? 0;
          const profCount = professionalsByClinic.get(c.id) ?? 0;
          const apptCount = apptsByClinic.get(c.id) ?? 0;
          const patCount = patientsByClinic.get(c.id) ?? 0;
          const evoCount = evolutionsByClinic.get(c.id) ?? 0;
          const msgCount = messagesByClinic.get(c.id) ?? 0;
          const ints = integrationsByClinic.get(c.id) ?? [];
          const wpp = ints.find((i: any) => (i.channel ?? "").toLowerCase().includes("whats"));
          const wppOk = wpp ? (wpp.is_active && (wpp.status ?? "connected") !== "disconnected") : false;

          // Health score
          const lastDate = last ? new Date(last) : null;
          const freq = lastDate && lastDate > sevenDaysAgo ? 30 : lastDate && lastDate > fifteenDaysAgo ? 15 : 0;
          const apptScore = Math.min(25, apptCount / 4);
          const userScore = Math.min(20, usersCount * 4 + profCount * 2);
          const moduleScore = (evoCount > 0 ? 8 : 0) + (msgCount > 0 ? 4 : 0) + (patCount > 0 ? 3 : 0);
          const intScore = (wppOk ? 7 : 0) + Math.min(3, (automations.filter((a: any) => a.clinic_id === c.id && a.is_active).length));
          const score = Math.round(freq + apptScore + userScore + moduleScore + intScore);

          const hasLoginRecent = lastDate ? lastDate > sevenDaysAgo : false;
          const hasApptRecent = (() => {
            const d = apptByClinicAll.get(c.id);
            return d ? new Date(d) > fifteenDaysAgo : false;
          })();

          return {
            id: c.id,
            name: c.name,
            plan_name: planName,
            subscription_status: sub?.status ?? null,
            trial_ends_at: sub?.trial_ends_at ?? null,
            users_count: usersCount,
            professionals_count: profCount,
            patients_count: patCount,
            appointments_count: apptCount,
            finished_count: finishedByClinic.get(c.id) ?? 0,
            clinical_records_count: evoCount,
            messages_count: msgCount,
            last_access_at: last,
            health_score: Math.min(100, Math.max(0, score)),
            health_label: classifyHealth(Math.min(100, Math.max(0, score))),
            is_active_in_period: isClinicActive(c.id, { lastAccessByClinic, apptsByClinic, patientsByClinic, evolutionsByClinic, messagesByClinic }),
            has_login_recent: hasLoginRecent,
            has_appt_recent: hasApptRecent,
            whatsapp_connected: wppOk,
          };
        });

        // Totals
        const activeClinics = clinicRows.filter((c) => c.is_active_in_period).length;
        const activeUsersSet = new Set<string>();
        for (const set of usersByClinic.values()) for (const u of set) activeUsersSet.add(u);

        const totals = {
          clinicsTotal: clinics.length,
          activeClinics,
          activeUsers: activeUsersSet.size,
          activeProfessionals: professionals.filter((p: any) => p.is_active !== false).length,
          patientsTotal: patients.length,
          appointments: appts.length,
          finishedAppointments: appts.filter((a: any) => a.status === "finished" || a.status === "finalizado" || !!a.finished_at).length,
          clinicalRecords: evolutions.length + docs.length,
          messages: messages.length,
          activeIntegrations: integrations.filter((i: any) => i.is_active).length,
        };

        const health = {
          activeRate: clinics.length > 0 ? (activeClinics / clinics.length) * 100 : 0,
          avgAppointments: clinics.length > 0 ? appts.length / clinics.length : 0,
          avgPatients: clinics.length > 0 ? patients.length / clinics.length : 0,
          avgProfessionals: clinics.length > 0 ? professionals.length / clinics.length : 0,
          inactive7d: clinicRows.filter((c) => !c.has_login_recent).length,
          churnRisk: clinicRows.filter((c) => {
            if (!c.has_login_recent) return true;
            if (!c.has_appt_recent) return true;
            const prev = apptsPrev.filter((a: any) => a.clinic_id === c.id).length;
            const curr = c.appointments_count;
            if (prev > 0 && curr < prev * 0.5) return true;
            return false;
          }).length,
        };

        // Trend (group by day)
        const trendMap = new Map<string, { date: string; appointments: number; patients: number; records: number; messages: number }>();
        const ensureDay = (iso: string) => {
          const d = iso.slice(0, 10);
          if (!trendMap.has(d)) trendMap.set(d, { date: d, appointments: 0, patients: 0, records: 0, messages: 0 });
          return trendMap.get(d)!;
        };
        appts.forEach((a: any) => ensureDay(a.created_at).appointments++);
        patients.forEach((p: any) => p.created_at >= fromIso && p.created_at <= toIso && ensureDay(p.created_at).patients++);
        evolutions.forEach((e: any) => ensureDay(e.created_at).records++);
        messages.forEach((m: any) => ensureDay(m.created_at).messages++);
        const trend = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        // Modules
        const clinicCount = Math.max(1, clinics.length);
        const moduleStats = (using: number, events: number) => {
          const adoption = (using / clinicCount) * 100;
          const status: "Alto" | "Médio" | "Baixo" | "Não usado" =
            using === 0 ? "Não usado" : adoption >= 60 ? "Alto" : adoption >= 25 ? "Médio" : "Baixo";
          return { clinicsUsing: using, events, adoption, status };
        };
        const distinctClinics = (rows: any[]) => new Set(rows.map((r) => r.clinic_id).filter(Boolean)).size;
        const modules = [
          { key: "agenda", label: "Agenda", ...moduleStats(distinctClinics(appts), appts.length) },
          { key: "pacientes", label: "Pacientes", ...moduleStats(distinctClinics(patients), patients.length) },
          { key: "prontuario", label: "Prontuário", ...moduleStats(distinctClinics(evolutions), evolutions.length) },
          { key: "atendimento", label: "Atendimento", ...moduleStats(distinctClinics(appts.filter((a: any) => a.finished_at)), appts.filter((a: any) => a.finished_at).length) },
          { key: "comercial", label: "Comercial/CRM", ...moduleStats(distinctClinics(sales), sales.length) },
          { key: "marketing", label: "Marketing", ...moduleStats(distinctClinics(messages), messages.length) },
          { key: "financeiro", label: "Finanças", ...moduleStats(distinctClinics(finance), finance.length) },
          { key: "estoque", label: "Estoque", ...moduleStats(distinctClinics(stock), stock.length) },
          { key: "convenios", label: "Convênios", ...moduleStats(distinctClinics(tiss), tiss.length) },
          { key: "relatorios", label: "Relatórios", ...moduleStats(0, 0) },
          { key: "teleconsulta", label: "Teleconsulta", ...moduleStats(distinctClinics(tele), tele.length) },
          { key: "agendamento_publico", label: "Agendamento Público", ...moduleStats(distinctClinics(appts.filter((a: any) => a.created_source === "public" || a.booking_source === "public")), appts.filter((a: any) => a.created_source === "public" || a.booking_source === "public").length) },
          { key: "integracoes", label: "Integrações", ...moduleStats(distinctClinics(integrations.filter((i: any) => i.is_active)), integrations.filter((i: any) => i.is_active).length) },
        ];

        // Specialties (only official)
        const officialSpecRows = allSpecs.filter((s: any) => OFFICIAL.some((o) => o.slug === s.slug));
        const specByClinicSlug = new Map<string, Set<string>>();
        const profsBySpec = new Map<string, Set<string>>();
        for (const ps of profSpec) {
          const spec = officialSpecRows.find((s: any) => s.id === ps.specialty_id);
          if (!spec) continue;
          if (!profsBySpec.has(spec.slug)) profsBySpec.set(spec.slug, new Set());
          profsBySpec.get(spec.slug)!.add(ps.professional_id);
        }
        for (const s of officialSpecRows) {
          if (!specByClinicSlug.has(s.slug)) specByClinicSlug.set(s.slug, new Set());
          specByClinicSlug.get(s.slug)!.add(s.clinic_id);
        }
        const apptBySpec = new Map<string, number>();
        const recordsBySpec = new Map<string, number>();
        const specIdToSlug = new Map(officialSpecRows.map((s: any) => [s.id, s.slug]));
        for (const a of appts) {
          const slug = specIdToSlug.get(a.specialty_id);
          if (slug) apptBySpec.set(slug, (apptBySpec.get(slug) ?? 0) + 1);
        }
        for (const e of evolutions) {
          const slug = specIdToSlug.get(e.specialty_id);
          if (slug) recordsBySpec.set(slug, (recordsBySpec.get(slug) ?? 0) + 1);
        }
        const specialties = OFFICIAL.map((o) => ({
          slug: o.slug,
          name: o.name,
          clinics: specByClinicSlug.get(o.slug)?.size ?? 0,
          professionals: profsBySpec.get(o.slug)?.size ?? 0,
          patients: 0,
          appointments: apptBySpec.get(o.slug) ?? 0,
          records: recordsBySpec.get(o.slug) ?? 0,
        }));

        const consumption = [
          { key: "messages", label: "Mensagens WhatsApp enviadas", value: messages.filter((m: any) => (m.channel ?? "whatsapp").toLowerCase().includes("whats") || true).length },
          { key: "automations", label: "Automações ativas", value: automations.filter((a: any) => a.is_active).length },
          { key: "documents", label: "Documentos clínicos emitidos", value: docs.length },
          { key: "evolutions", label: "Registros clínicos", value: evolutions.length },
          { key: "sales", label: "Vendas registradas", value: sales.length },
          { key: "finance", label: "Transações financeiras", value: finance.length },
          { key: "stock", label: "Movimentações de estoque", value: stock.length },
          { key: "tiss", label: "Guias TISS geradas", value: tiss.length },
          { key: "tele", label: "Teleconsultas realizadas", value: tele.length },
        ];

        // Alerts
        const alerts: UsageData["alerts"] = [];
        for (const c of clinicRows) {
          if (!c.has_login_recent) alerts.push({ id: `${c.id}-login`, clinic_id: c.id, clinic_name: c.name, severity: "alta", reason: "Sem login nos últimos 7 dias", lastAt: c.last_access_at, suggested: "Contato comercial / sucesso do cliente" });
          if (!c.has_appt_recent) alerts.push({ id: `${c.id}-appt`, clinic_id: c.id, clinic_name: c.name, severity: "média", reason: "Sem agendamentos recentes (15 dias)", lastAt: c.last_access_at, suggested: "Verificar uso da agenda" });
          const prevCount = apptsPrev.filter((a: any) => a.clinic_id === c.id).length;
          if (prevCount > 0 && c.appointments_count < prevCount * 0.5) alerts.push({ id: `${c.id}-drop`, clinic_id: c.id, clinic_name: c.name, severity: "crítica", reason: "Queda brusca de uso (>50%)", lastAt: null, suggested: "Investigar e contatar gestor" });
          const ints = integrationsByClinic.get(c.id) ?? [];
          const wpp = ints.find((i: any) => (i.channel ?? "").toLowerCase().includes("whats"));
          if (wpp && (!wpp.is_active || wpp.status === "disconnected")) alerts.push({ id: `${c.id}-wpp`, clinic_id: c.id, clinic_name: c.name, severity: "média", reason: "WhatsApp desconectado", lastAt: null, suggested: "Reconectar instância" });
          const failedMsg = messages.filter((m: any) => m.clinic_id === c.id && (m.status === "failed" || m.status === "error")).length;
          if (failedMsg > 10) alerts.push({ id: `${c.id}-msgfail`, clinic_id: c.id, clinic_name: c.name, severity: "alta", reason: `Alto volume de falhas em mensagens (${failedMsg})`, lastAt: null, suggested: "Verificar instância WhatsApp" });
          if (prevCount > 0 && c.appointments_count > prevCount * 2) alerts.push({ id: `${c.id}-grow`, clinic_id: c.id, clinic_name: c.name, severity: "baixa", reason: "Crescimento acelerado", lastAt: null, suggested: "Avaliar upgrade de plano" });
        }

        if (cancelled) return;
        setData({ clinics: clinicRows, totals, health, trend, modules, specialties, consumption, alerts });
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        console.error("[useSuperAdminPlatformUsage]", e);
        setError(e?.message ?? "Erro ao carregar dados");
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [range.from, range.to, range.prevFrom, filters.status, filters.plan, refreshKey]);

  return { data, loading, error, refresh, range };
}

function groupCount(rows: any[], key: string, predicate?: (r: any) => boolean): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    if (predicate && !predicate(r)) continue;
    const k = r[key];
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

function isClinicActive(
  id: string,
  ctx: { lastAccessByClinic: Map<string, string>; apptsByClinic: Map<string, number>; patientsByClinic: Map<string, number>; evolutionsByClinic: Map<string, number>; messagesByClinic: Map<string, number> }
) {
  return (
    ctx.lastAccessByClinic.has(id) ||
    (ctx.apptsByClinic.get(id) ?? 0) > 0 ||
    (ctx.patientsByClinic.get(id) ?? 0) > 0 ||
    (ctx.evolutionsByClinic.get(id) ?? 0) > 0 ||
    (ctx.messagesByClinic.get(id) ?? 0) > 0
  );
}

export async function fetchSubscriptionPlans(): Promise<{ id: string; name: string }[]> {
  return safeSelect(supabase.from("subscription_plans").select("id,name").order("name"));
}
