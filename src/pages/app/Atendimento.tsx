import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, Search, Calendar, Clock, User, Stethoscope, Play, 
  MoreVertical, Eye, StickyNote, Printer, Download, PenTool,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useScreenPermissionValidation } from "@/hooks/usePermissionValidation";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentSummaryModal } from "@/components/agenda/AppointmentSummaryModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0min";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

function formatDateLabel(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Hoje";
    if (isYesterday(d)) return "Ontem";
    return format(d, "dd 'de' MMMM", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

type StatusFilter = "all" | "em_atendimento" | "finalizado";

interface SessionRow {
  id: string;
  scheduled_date: string;
  start_time: string;
  started_at: string | null;
  finished_at: string | null;
  status: string;
  patient_name: string;
  patient_id: string;
  professional_id: string;
  professional_name: string;
  specialty_name: string | null;
  specialty_slug: string | null;
  procedure_name: string | null;
  is_paused: boolean;
  total_paused_seconds: number;
  effective_seconds: number;
  session_summary: any;
  session_notes: string | null;
  // Financial
  amount_expected: number;
  amount_received: number;
  payment_status: string;
  // Live clinical counts (fetched in bulk)
  anamnesis_count: number;
  evolutions_count: number;
  media_count: number;
  documents_count: number;
  alerts_count: number;
}

export default function Atendimento() {
  const { isLoading: permLoading, hasAccess } = useScreenPermissionValidation("prontuario", "view");
  const { clinic } = useClinicData();
  const clinicId = clinic?.id;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(null);

  // Fetch appointments that have been started
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ["atendimento-sessions", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_date,
          start_time,
          end_time,
          status,
          started_at,
          finished_at,
          patient_id,
          professional_id,
          specialty_id,
          procedure_id,
          amount_expected,
          amount_received,
          payment_status,
          patients(full_name),
          professionals(full_name),
          specialties(name),
          procedures(name),
          appointment_sessions(
            id,
            is_paused,
            total_paused_seconds,
            current_pause_started_at,
            session_summary,
            session_notes
          )
        `)
        .eq("clinic_id", clinicId)
        .not("started_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Error fetching sessions:", error);
        throw error;
      }

      const appointmentIds = (data || []).map((a: any) => a.id);

      // Fetch clinical counts in bulk for all appointments
      const [
        { data: anamCounts },
        { data: evolCounts },
        { data: mediaCounts },
        { data: docCounts },
        { data: alertCounts },
      ] = await Promise.all([
        supabase.from("anamnesis_records").select("appointment_id").in("appointment_id", appointmentIds.length ? appointmentIds : [""]),
        supabase.from("clinical_evolutions").select("appointment_id").in("appointment_id", appointmentIds.length ? appointmentIds : [""]),
        supabase.from("clinical_media").select("appointment_id").in("appointment_id", appointmentIds.length ? appointmentIds : [""]),
        supabase.from("clinical_documents").select("appointment_id").in("appointment_id", appointmentIds.length ? appointmentIds : [""]),
        supabase.from("clinical_alerts").select("appointment_id").in("appointment_id", appointmentIds.length ? appointmentIds : [""]).eq("is_active", true),
      ]);

      // Build count maps
      const countByAppointment = (items: any[] | null) => {
        const map: Record<string, number> = {};
        (items || []).forEach((item: any) => {
          if (item.appointment_id) {
            map[item.appointment_id] = (map[item.appointment_id] || 0) + 1;
          }
        });
        return map;
      };

      const anamMap = countByAppointment(anamCounts);
      const evolMap = countByAppointment(evolCounts);
      const mediaMap = countByAppointment(mediaCounts);
      const docMap = countByAppointment(docCounts);
      const alertMap = countByAppointment(alertCounts);

      return (data || []).map((apt: any): SessionRow => {
        const session = Array.isArray(apt.appointment_sessions)
          ? apt.appointment_sessions[0]
          : apt.appointment_sessions;

        const startedAt = apt.started_at ? new Date(apt.started_at).getTime() : 0;
        const finishedAt = apt.finished_at ? new Date(apt.finished_at).getTime() : Date.now();
        const totalSeconds = Math.floor((finishedAt - startedAt) / 1000);
        const pausedSeconds = session?.total_paused_seconds || 0;
        const effectiveSeconds = Math.max(0, totalSeconds - pausedSeconds);

        // Use live counts, fallback to summary if available
        const summary = session?.session_summary;

        return {
          id: apt.id,
          scheduled_date: apt.scheduled_date,
          start_time: apt.start_time,
          started_at: apt.started_at,
          finished_at: apt.finished_at,
          status: apt.status,
          patient_name: apt.patients?.full_name || "Paciente",
          patient_id: apt.patient_id,
          professional_name: apt.professionals?.full_name || "Profissional",
          specialty_name: apt.specialties?.name || null,
          procedure_name: apt.procedures?.name || null,
          is_paused: session?.is_paused || false,
          total_paused_seconds: pausedSeconds,
          effective_seconds: effectiveSeconds,
          session_summary: summary || null,
          session_notes: session?.session_notes || null,
          amount_expected: apt.amount_expected || 0,
          amount_received: apt.amount_received || 0,
          payment_status: apt.payment_status || "pendente",
          anamnesis_count: anamMap[apt.id] || summary?.anamnesis_count || 0,
          evolutions_count: evolMap[apt.id] || summary?.evolutions_count || 0,
          media_count: mediaMap[apt.id] || summary?.media_count || 0,
          documents_count: docMap[apt.id] || summary?.clinical_documents_count || 0,
          alerts_count: alertMap[apt.id] || summary?.alerts_count || 0,
        };
      });
    },
    enabled: !!clinicId,
    refetchInterval: 30000,
  });

  // Filter and search
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter((s) => {
      if (statusFilter === "em_atendimento" && s.status === "finalizado") return false;
      if (statusFilter === "finalizado" && s.status !== "finalizado") return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          s.patient_name.toLowerCase().includes(term) ||
          s.professional_name.toLowerCase().includes(term) ||
          (s.specialty_name && s.specialty_name.toLowerCase().includes(term)) ||
          (s.procedure_name && s.procedure_name.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [sessions, statusFilter, searchTerm]);

  // Group by date
  const groupedSessions = useMemo(() => {
    const groups: Record<string, SessionRow[]> = {};
    for (const s of filteredSessions) {
      const key = s.scheduled_date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredSessions]);

  // Stats
  const activeCount = sessions?.filter((s) => s.status !== "finalizado").length || 0;
  const todayFinished = sessions?.filter((s) => s.status === "finalizado" && isToday(parseISO(s.scheduled_date))).length || 0;

  // Handlers
  const handleOpenSummary = useCallback((session: SessionRow) => {
    navigate(`/app/atendimento/${session.id}`);
  }, [navigate]);

  const handleAddNote = useCallback((session: SessionRow) => {
    toast.info("Funcionalidade de notas complementares em desenvolvimento.");
  }, []);

  const handlePrint = useCallback((session: SessionRow) => {
    // Open the appointment in print mode
    const printUrl = `/app/prontuario/${session.patient_id}?appointmentId=${session.id}&print=true`;
    window.open(printUrl, "_blank");
  }, []);

  const handleDownloadPDF = useCallback((session: SessionRow) => {
    toast.info("Geração de PDF em desenvolvimento.");
  }, []);

  const handleSign = useCallback((session: SessionRow) => {
    toast.info("Assinatura de documento em desenvolvimento.");
  }, []);

  if (permLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!hasAccess) return null;

  const getStatusBadge = (status: string, isPaused: boolean) => {
    if (isPaused) {
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-[10px]">Pausado</Badge>;
    }
    switch (status) {
      case "em_atendimento":
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-[10px]">Em Atendimento</Badge>;
      case "finalizado":
        return <Badge variant="secondary" className="text-[10px]">Finalizado</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const getClinicalSummaryBadges = (s: SessionRow) => {
    const badges: { label: string; count: number; color: string }[] = [];
    if (s.anamnesis_count > 0) badges.push({ label: "Anam", count: s.anamnesis_count, color: "text-blue-600" });
    if (s.evolutions_count > 0) badges.push({ label: "Evol", count: s.evolutions_count, color: "text-violet-600" });
    if (s.media_count > 0) badges.push({ label: "Mídia", count: s.media_count, color: "text-teal-600" });
    if (s.documents_count > 0) badges.push({ label: "Doc", count: s.documents_count, color: "text-orange-600" });
    if (s.alerts_count > 0) badges.push({ label: "Alerta", count: s.alerts_count, color: "text-red-600" });
    return badges;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Atendimento
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Histórico de sessões clínicas realizadas
          </p>
        </div>
        <div className="flex gap-3">
          {activeCount > 0 && (
            <Badge className="bg-emerald-600 text-white gap-1 py-1 px-3">
              <Play className="h-3 w-3" />
              {activeCount} ativo{activeCount !== 1 ? "s" : ""}
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1 py-1 px-3">
            <Clock className="h-3 w-3" />
            {todayFinished} hoje
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente, profissional..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="em_atendimento">Em andamento</SelectItem>
            <SelectItem value="finalizado">Finalizados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Activity className="h-10 w-10 text-destructive/50 mb-3" />
              <h3 className="text-base font-medium text-destructive">Erro ao carregar atendimentos</h3>
              <p className="text-sm text-muted-foreground mt-1">Tente novamente em alguns instantes.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredSessions.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Activity className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                Nenhum atendimento encontrado
              </h3>
              <p className="text-sm text-muted-foreground/70 mt-1 max-w-md">
                Os atendimentos iniciados a partir da Agenda aparecerão aqui.
              </p>
              <Button
                variant="outline"
                className="mt-4 gap-2"
                onClick={() => navigate("/app/agenda")}
              >
                <Calendar className="h-4 w-4" />
                Ir para a Agenda
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session list grouped by date */}
      {!isLoading && !error && groupedSessions.map(([date, items]) => (
        <div key={date} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            {formatDateLabel(date)}
          </h2>
          <div className="space-y-2">
            {items.map((s) => {
              const clinicalBadges = getClinicalSummaryBadges(s);
              const pending = Math.max(0, s.amount_expected - s.amount_received);

              return (
                <Card
                  key={s.id}
                  className={cn(
                    "transition-colors hover:bg-muted/30 cursor-pointer group",
                    s.status !== "finalizado" && "border-l-2 border-l-emerald-500",
                    s.is_paused && "border-l-amber-500"
                  )}
                  onClick={() => {
                    if (s.status === "finalizado") {
                      handleOpenSummary(s);
                    } else {
                      navigate(`/app/prontuario/${s.patient_id}?appointmentId=${s.id}`);
                    }
                  }}
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Time */}
                        <div className="text-center flex-shrink-0 w-14">
                          <p className="text-sm font-mono font-medium text-foreground">
                            {s.start_time?.slice(0, 5)}
                          </p>
                        </div>

                        {/* Patient & details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {s.patient_name}
                            </p>
                            {getStatusBadge(s.status, s.is_paused)}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {s.professional_name}
                            </span>
                            {s.specialty_name && (
                              <span className="flex items-center gap-1">
                                <Stethoscope className="h-3 w-3" />
                                {s.specialty_name}
                              </span>
                            )}
                            {s.procedure_name && (
                              <span className="truncate">• {s.procedure_name}</span>
                            )}
                          </div>

                          {/* Clinical summary badges */}
                          {clinicalBadges.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              {clinicalBadges.map((b) => (
                                <span key={b.label} className={cn("text-[10px] font-medium", b.color)}>
                                  {b.count} {b.label}
                                </span>
                              ))}
                              {s.amount_expected > 0 && (
                                <>
                                  <span className="text-muted-foreground text-[10px]">•</span>
                                  <span className={cn(
                                    "text-[10px] font-medium",
                                    pending > 0 ? "text-red-600" : "text-green-600"
                                  )}>
                                    {pending > 0 ? `${formatCurrency(pending)} pend.` : "Pago"}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Duration & actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-mono font-medium text-foreground">
                            {formatDuration(s.effective_seconds)}
                          </p>
                          {s.total_paused_seconds > 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              {formatDuration(s.total_paused_seconds)} pausado
                            </p>
                          )}
                        </div>

                        {/* 3-dot menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => handleOpenSummary(s)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver atendimento
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddNote(s)}>
                              <StickyNote className="h-4 w-4 mr-2" />
                              Adicionar nota
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handlePrint(s)}>
                              <Printer className="h-4 w-4 mr-2" />
                              Imprimir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPDF(s)}>
                              <Download className="h-4 w-4 mr-2" />
                              Baixar PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSign(s)}>
                              <PenTool className="h-4 w-4 mr-2" />
                              Assinar documento
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Summary Modal */}
      {selectedSession && (
        <AppointmentSummaryModal
          open={summaryModalOpen}
          onOpenChange={setSummaryModalOpen}
          summary={selectedSession.session_summary || buildLiveSummary(selectedSession)}
          patientId={selectedSession.patient_id}
        />
      )}
    </div>
  );
}

/**
 * Build a SessionSummary-like object from live data when session_summary is not available
 * (e.g., for appointments finalized before the summary feature was added).
 */
function buildLiveSummary(s: SessionRow): any {
  return {
    patient_name: s.patient_name,
    professional_name: s.professional_name,
    specialty_name: s.specialty_name,
    procedure_name: s.procedure_name,
    scheduled_date: s.scheduled_date,
    started_at: s.started_at || "",
    finished_at: s.finished_at || "",
    duration_seconds: s.effective_seconds + s.total_paused_seconds,
    paused_seconds: s.total_paused_seconds,
    effective_seconds: s.effective_seconds,
    anamnesis_count: s.anamnesis_count,
    evolutions_count: s.evolutions_count,
    media_count: s.media_count,
    alerts_count: s.alerts_count,
    consents_count: 0,
    clinical_documents_count: s.documents_count,
    anamnesis_templates: [],
    evolution_notes: [],
    products_used: [],
    payment_status: s.payment_status,
    amount_expected: s.amount_expected,
    amount_received: s.amount_received,
    notes: s.session_notes,
  };
}
