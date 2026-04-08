import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Search, Filter, Calendar, Clock, User, Stethoscope, Play, Eye, FileText, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useScreenPermissionValidation } from "@/hooks/usePermissionValidation";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isToday, isYesterday, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentSummaryModal } from "@/components/agenda/AppointmentSummaryModal";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatDuration(seconds: number): string {
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

type StatusFilter = "all" | "em_atendimento" | "finalizado";

export default function Atendimento() {
  const { isLoading: permLoading, hasAccess } = useScreenPermissionValidation("prontuario", "view");
  const { clinicId } = usePermissions();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  // Fetch appointments that have sessions (started appointments)
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["atendimento-sessions", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];

      // Fetch appointments that have been started (have started_at)
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
          patients(full_name, birth_date),
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
        .limit(100);

      if (error) {
        console.error("Error fetching sessions:", error);
        return [];
      }

      return (data || []).map((apt: any) => {
        const session = Array.isArray(apt.appointment_sessions)
          ? apt.appointment_sessions[0]
          : apt.appointment_sessions;

        const startedAt = apt.started_at ? new Date(apt.started_at).getTime() : 0;
        const finishedAt = apt.finished_at ? new Date(apt.finished_at).getTime() : Date.now();
        const totalSeconds = Math.floor((finishedAt - startedAt) / 1000);
        const pausedSeconds = session?.total_paused_seconds || 0;
        const effectiveSeconds = Math.max(0, totalSeconds - pausedSeconds);

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
          session_summary: session?.session_summary || null,
          session_notes: session?.session_notes || null,
        };
      });
    },
    enabled: !!clinicId,
    refetchInterval: 30000,
  });

  // Filter and search
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter((s: any) => {
      // Status filter
      if (statusFilter === "em_atendimento" && s.status === "finalizado") return false;
      if (statusFilter === "finalizado" && s.status !== "finalizado") return false;

      // Search
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
    const groups: Record<string, any[]> = {};
    for (const s of filteredSessions) {
      const key = s.scheduled_date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredSessions]);

  // Stats
  const activeCount = sessions?.filter((s: any) => s.status !== "finalizado").length || 0;
  const todayFinished = sessions?.filter((s: any) => s.status === "finalizado" && isToday(parseISO(s.scheduled_date))).length || 0;

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
        {/* Quick stats */}
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
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredSessions.length === 0 && (
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
      {!isLoading && groupedSessions.map(([date, items]) => (
        <div key={date} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            {formatDateLabel(date)}
          </h2>
          <div className="space-y-2">
            {items.map((s: any) => (
              <Card
                key={s.id}
                className={cn(
                  "transition-colors hover:bg-muted/30 cursor-pointer",
                  s.status !== "finalizado" && "border-l-2 border-l-emerald-500",
                  s.is_paused && "border-l-amber-500"
                )}
                onClick={() => {
                  if (s.status === "finalizado" && s.session_summary) {
                    setSelectedSession(s);
                    setSummaryModalOpen(true);
                  } else {
                    navigate(`/app/prontuario/${s.patient_id}`);
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
                      </div>
                    </div>

                    {/* Right: Duration & actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
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
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Summary Modal */}
      {selectedSession && (
        <AppointmentSummaryModal
          open={summaryModalOpen}
          onOpenChange={setSummaryModalOpen}
          summary={selectedSession.session_summary}
          appointmentId={selectedSession.id}
        />
      )}
    </div>
  );
}
