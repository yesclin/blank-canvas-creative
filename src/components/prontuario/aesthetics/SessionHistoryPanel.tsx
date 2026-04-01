import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Copy,
  Calendar,
  Syringe,
  Droplets,
  Sparkles,
  CheckCircle2,
  Clock,
  X,
  Download,
  Filter,
} from "lucide-react";
import type { FacialMap, FacialMapApplication, ProcedureType } from "./types";
import { getDefaultUnit } from "./types";

interface SessionHistoryPanelProps {
  allMaps: FacialMap[];
  currentMapId?: string | null;
  onViewSession: (mapId: string) => void;
  onDuplicateSession: (mapId: string) => void;
  onClose: () => void;
  loadMapApplications: (mapId: string) => Promise<FacialMapApplication[]>;
  canDuplicate?: boolean;
  onGeneratePdfForSession?: (mapId: string) => void;
}

const PROC_ICONS: Record<ProcedureType, typeof Syringe> = {
  toxin: Syringe,
  filler: Droplets,
  biostimulator: Sparkles,
};

interface SessionSummary {
  map: FacialMap;
  applications: FacialMapApplication[];
  totalsByProcedure: Record<string, { count: number; total: number; unit: string }>;
}

export function SessionHistoryPanel({
  allMaps,
  currentMapId,
  onViewSession,
  onDuplicateSession,
  onClose,
  loadMapApplications,
  canDuplicate = false,
  onGeneratePdfForSession,
}: SessionHistoryPanelProps) {
  const [filterProcedure, setFilterProcedure] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sessionSummaries, setSessionSummaries] = useState<SessionSummary[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  // Load application summaries for all maps
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingApps(true);
      const summaries: SessionSummary[] = [];
      
      for (const map of allMaps) {
        try {
          const apps = await loadMapApplications(map.id);
          const totalsByProcedure: Record<string, { count: number; total: number; unit: string }> = {};
          
          for (const app of apps) {
            if (!totalsByProcedure[app.procedure_type]) {
              totalsByProcedure[app.procedure_type] = { count: 0, total: 0, unit: getDefaultUnit(app.procedure_type as ProcedureType) };
            }
            totalsByProcedure[app.procedure_type].count += 1;
            totalsByProcedure[app.procedure_type].total += app.quantity;
          }
          
          summaries.push({ map, applications: apps, totalsByProcedure });
        } catch {
          summaries.push({ map, applications: [], totalsByProcedure: {} });
        }
      }
      
      if (!cancelled) {
        setSessionSummaries(summaries);
        setLoadingApps(false);
      }
    };
    
    load();
    return () => { cancelled = true; };
  }, [allMaps, loadMapApplications]);

  const filteredSessions = sessionSummaries.filter(s => {
    // Procedure filter
    if (filterProcedure !== 'all') {
      if (!Object.keys(s.totalsByProcedure).includes(filterProcedure)) return false;
    }
    // Status filter
    if (filterStatus !== 'all') {
      if (s.map.status !== filterStatus) return false;
    }
    // Date range filter
    if (filterDateFrom) {
      const mapDate = new Date(s.map.created_at).toISOString().slice(0, 10);
      if (mapDate < filterDateFrom) return false;
    }
    if (filterDateTo) {
      const mapDate = new Date(s.map.created_at).toISOString().slice(0, 10);
      if (mapDate > filterDateTo) return false;
    }
    return true;
  });

  const hasActiveFilters = filterProcedure !== 'all' || filterStatus !== 'all' || filterDateFrom || filterDateTo;

  return (
    <div className="bg-background rounded-xl border flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Histórico de Sessões</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredSessions.length} de {allMaps.length} sessão(ões)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3.5 w-3.5" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 bg-primary-foreground text-primary rounded-full h-4 w-4 text-[10px] flex items-center justify-center">
                !
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-3 border-b bg-muted/30 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground uppercase">Procedimento</Label>
              <Select value={filterProcedure} onValueChange={setFilterProcedure}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="toxin">Toxina</SelectItem>
                  <SelectItem value="filler">Preenchimento</SelectItem>
                  <SelectItem value="biostimulator">Bioestimulador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground uppercase">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Em andamento</SelectItem>
                  <SelectItem value="concluded">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground uppercase">Data inicial</Label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground uppercase">Data final</Label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setFilterProcedure('all');
                setFilterStatus('all');
                setFilterDateFrom('');
                setFilterDateTo('');
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      <ScrollArea className="flex-1 max-h-[400px]">
        <div className="p-3 space-y-2">
          {loadingApps ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Carregando sessões...</div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma sessão encontrada.</div>
          ) : (
            filteredSessions.map((session) => {
              const isCurrent = session.map.id === currentMapId;
              const isConcluded = session.map.status === 'concluded';
              const dateStr = format(new Date(session.map.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
              
              return (
                <div
                  key={session.map.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    isCurrent 
                      ? 'border-primary/40 bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium">{dateStr}</span>
                        {isCurrent && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-primary/40 text-primary">
                            Atual
                          </Badge>
                        )}
                        {isConcluded ? (
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 gap-0.5">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Concluída
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            Ativa
                          </Badge>
                        )}
                      </div>

                      {/* Procedure totals */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(session.totalsByProcedure).map(([proc, data]) => {
                          const Icon = PROC_ICONS[proc as ProcedureType] || Syringe;
                          return (
                            <span key={proc} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                              <Icon className="h-3 w-3" />
                              {data.total} {data.unit} ({data.count} pts)
                            </span>
                          );
                        })}
                        {Object.keys(session.totalsByProcedure).length === 0 && (
                          <span className="text-xs text-muted-foreground italic">Sem marcações</span>
                        )}
                      </div>

                      {session.map.general_notes && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                          {session.map.general_notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => onViewSession(session.map.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver
                        </Button>
                      )}
                      {canDuplicate && !isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => onDuplicateSession(session.map.id)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Duplicar
                        </Button>
                      )}
                      {onGeneratePdfForSession && session.applications.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => onGeneratePdfForSession(session.map.id)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
