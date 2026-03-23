import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  History,
  Search,
  Filter,
  Clock,
  User,
  FileText,
  Brain,
  Target,
  ClipboardCheck,
  FileSignature,
  ChevronDown,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { AnamnesePsicologiaData } from "@/hooks/prontuario/psicologia/useAnamnesePsicologiaData";
import type { SessaoPsicologia } from "@/hooks/prontuario/psicologia/useSessoesPsicologiaData";
import type { PlanoTerapeuticoData } from "@/hooks/prontuario/psicologia/usePlanoTerapeuticoData";
import type { InstrumentoPsicologico } from "@/hooks/prontuario/psicologia/useInstrumentosPsicologicosData";

// Define a consent type locally to avoid import issues
interface ConsentRecord {
  id: string;
  term_title: string;
  consent_type: string;
  accepted_at: string;
  term_version?: string;
}

/**
 * Tipos de evento na linha do tempo
 */
type TimelineEventType = 
  | 'anamnese' 
  | 'sessao' 
  | 'plano' 
  | 'instrumento' 
  | 'termo';

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string;
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, string>;
  status?: string;
  professionalName?: string;
}

const eventTypeConfig: Record<TimelineEventType, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  anamnese: {
    label: 'Anamnese',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  sessao: {
    label: 'Sessão',
    icon: <Brain className="h-4 w-4" />,
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  plano: {
    label: 'Plano Terapêutico',
    icon: <Target className="h-4 w-4" />,
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  instrumento: {
    label: 'Instrumento/Teste',
    icon: <ClipboardCheck className="h-4 w-4" />,
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  termo: {
    label: 'Termo/Consentimento',
    icon: <FileSignature className="h-4 w-4" />,
    color: 'text-slate-700 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-950/30',
  },
};

interface HistoricoPsicologiaBlockProps {
  anamneses: AnamnesePsicologiaData[];
  sessoes: SessaoPsicologia[];
  planos: PlanoTerapeuticoData[];
  instrumentos: InstrumentoPsicologico[];
  consents: ConsentRecord[];
  loading?: boolean;
}

/**
 * HISTÓRICO / LINHA DO TEMPO - Bloco exclusivo para Psicologia
 * 
 * Consolida em uma única visualização cronológica:
 * - Anamneses psicológicas
 * - Sessões de atendimento
 * - Planos terapêuticos
 * - Instrumentos/testes aplicados
 * - Termos e consentimentos
 * 
 * Exibição apenas para leitura.
 */
export function HistoricoPsicologiaBlock({
  anamneses,
  sessoes,
  planos,
  instrumentos,
  consents,
  loading = false,
}: HistoricoPsicologiaBlockProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TimelineEventType | "all">("all");
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Convert all data sources into unified timeline events
  const timelineEvents = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Anamneses
    anamneses.forEach(item => {
      events.push({
        id: `anamnese-${item.id}`,
        type: 'anamnese',
        date: item.created_at,
        title: `Anamnese Psicológica (v${item.version})`,
        subtitle: item.queixa_principal ? `Queixa: ${item.queixa_principal.substring(0, 80)}...` : undefined,
        description: item.historico_emocional_comportamental || undefined,
        metadata: {
          ...(item.contexto_familiar ? { 'Contexto Familiar': 'Registrado' } : {}),
          ...(item.fatores_risco ? { 'Fatores de Risco': 'Registrado' } : {}),
        },
        professionalName: item.created_by_name,
      });
    });

    // Sessões
    sessoes.forEach(item => {
      const statusLabels: Record<string, string> = {
        rascunho: 'Rascunho',
        assinada: 'Assinada',
      };
      events.push({
        id: `sessao-${item.id}`,
        type: 'sessao',
        date: item.data_sessao,
        title: `Sessão de Psicoterapia`,
        subtitle: item.relato_paciente ? item.relato_paciente.substring(0, 80) + '...' : undefined,
        description: item.observacoes_terapeuta || undefined,
        status: statusLabels[item.status] || item.status,
        metadata: {
          ...(item.abordagem_terapeutica ? { 'Abordagem': item.abordagem_terapeutica.substring(0, 30) } : {}),
          ...(item.duracao_minutos ? { 'Duração': `${item.duracao_minutos} min` } : {}),
        },
        professionalName: item.profissional_nome,
      });
    });

    // Planos Terapêuticos
    planos.forEach(item => {
      events.push({
        id: `plano-${item.id}`,
        type: 'plano',
        date: item.created_at,
        title: `Plano Terapêutico (v${item.version})`,
        subtitle: item.objetivos_terapeuticos ? item.objetivos_terapeuticos.substring(0, 80) + '...' : undefined,
        description: item.estrategias_intervencao || undefined,
        status: item.is_current ? 'Atual' : 'Anterior',
        metadata: {
          ...(item.frequencia_recomendada ? { 'Frequência': item.frequencia_recomendada } : {}),
          ...(item.metas_curto_prazo ? { 'Metas CP': 'Definidas' } : {}),
        },
        professionalName: item.created_by_name,
      });
    });

    // Instrumentos
    instrumentos.forEach(item => {
      events.push({
        id: `instrumento-${item.id}`,
        type: 'instrumento',
        date: item.data_aplicacao,
        title: item.nome_instrumento,
        subtitle: item.finalidade || undefined,
        description: item.observacoes || undefined,
        metadata: {
          ...(item.documento_url ? { 'Anexo': 'Disponível' } : {}),
        },
        professionalName: item.profissional_nome,
      });
    });

    // Termos/Consentimentos
    consents.forEach(item => {
      events.push({
        id: `termo-${item.id}`,
        type: 'termo',
        date: item.accepted_at,
        title: item.term_title,
        subtitle: `Tipo: ${item.consent_type}`,
        metadata: {
          ...(item.term_version ? { 'Versão': item.term_version } : {}),
        },
      });
    });

    // Sort by date descending (most recent first)
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [anamneses, sessoes, planos, instrumentos, consents]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    return timelineEvents.filter(event => {
      const matchesSearch = search === "" ||
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
        event.description?.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "all" || event.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [timelineEvents, search, typeFilter]);

  // Group events by month/year
  const groupedEvents = useMemo(() => {
    return filteredEvents.reduce((acc, event) => {
      const monthYear = format(parseISO(event.date), "MMMM 'de' yyyy", { locale: ptBR });
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(event);
      return acc;
    }, {} as Record<string, TimelineEvent[]>);
  }, [filteredEvents]);

  const toggleExpand = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold">Histórico / Linha do Tempo</h2>
          <Badge variant="secondary">{timelineEvents.length} registros</Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TimelineEventType | "all")}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="anamnese">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Anamneses
              </div>
            </SelectItem>
            <SelectItem value="sessao">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                Sessões
              </div>
            </SelectItem>
            <SelectItem value="plano">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                Planos Terapêuticos
              </div>
            </SelectItem>
            <SelectItem value="instrumento">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-amber-600" />
                Instrumentos/Testes
              </div>
            </SelectItem>
            <SelectItem value="termo">
              <div className="flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-slate-600" />
                Termos/Consentimentos
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Quick stats */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{anamneses.length} anamneses</span>
          <span>•</span>
          <span>{sessoes.length} sessões</span>
          <span>•</span>
          <span>{planos.length} planos</span>
          <span>•</span>
          <span>{instrumentos.length} instrumentos</span>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {Object.keys(groupedEvents).length > 0 ? (
              Object.entries(groupedEvents).map(([monthYear, events]) => (
                <div key={monthYear}>
                  {/* Month/Year Header */}
                  <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-4 py-2 border-b flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm capitalize">{monthYear}</h3>
                    <Badge variant="outline" className="text-xs">{events.length}</Badge>
                  </div>

                  {/* Events */}
                  <div className="divide-y">
                    {events.map(event => {
                      const config = eventTypeConfig[event.type];
                      const isExpanded = expandedEvents.has(event.id);
                      const hasExpandableContent = event.description || 
                        (event.metadata && Object.keys(event.metadata).length > 0);

                      return (
                        <Collapsible
                          key={event.id}
                          open={isExpanded}
                          onOpenChange={() => hasExpandableContent && toggleExpand(event.id)}
                        >
                          <div 
                            className={`p-4 hover:bg-muted/50 transition-colors ${hasExpandableContent ? 'cursor-pointer' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Type Icon */}
                              <div className={`mt-0.5 p-2 rounded-full ${config.bgColor} ${config.color}`}>
                                {config.icon}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <CollapsibleTrigger asChild>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{event.title}</span>
                                      {hasExpandableContent && (
                                        isExpanded ? 
                                          <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
                                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </div>
                                  </CollapsibleTrigger>
                                  <Badge variant="outline" className={`text-xs ${config.color}`}>
                                    {config.label}
                                  </Badge>
                                  {event.status && (
                                    <Badge variant="secondary" className="text-xs">
                                      {event.status}
                                    </Badge>
                                  )}
                                </div>

                                {event.subtitle && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {event.subtitle}
                                  </p>
                                )}

                                {/* Date and Professional */}
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {format(parseISO(event.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                  </div>
                                  {event.professionalName && (
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      <span>{event.professionalName}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Expandable Content */}
                                <CollapsibleContent>
                                  <div className="mt-3 pt-3 border-t space-y-2">
                                    {event.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {event.description}
                                      </p>
                                    )}
                                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {Object.entries(event.metadata).map(([key, value]) => (
                                          <Badge key={key} variant="outline" className="text-xs">
                                            {key}: {value}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </div>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium mb-1">Nenhum registro encontrado</p>
                <p className="text-sm">
                  {search || typeFilter !== "all" 
                    ? "Tente ajustar os filtros de busca" 
                    : "Os registros do acompanhamento aparecerão aqui"}
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
