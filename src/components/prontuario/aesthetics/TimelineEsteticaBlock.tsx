/**
 * ESTÉTICA - Linha do Tempo / Histórico
 * 
 * Consolidação cronológica de todos os registros:
 * - Anamneses
 * - Avaliações
 * - Mapas Faciais
 * - Produtos Utilizados
 * - Evoluções
 * - Termos de Consentimento
 * - Fotos Antes/Depois
 * - Alertas
 * 
 * Exibição somente leitura.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  History,
  Calendar,
  FileText,
  ClipboardList,
  Sparkles,
  Map,
  Package,
  FileCheck,
  Camera,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  CheckCircle2,
  FileSignature,
  Filter,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useTimelineEsteticaData,
  type TimelineEvent,
  type TimelineEventType,
} from '@/hooks/aesthetics/useTimelineEsteticaData';

interface TimelineEsteticaBlockProps {
  patientId: string;
}

const EVENT_TYPE_CONFIG: Record<TimelineEventType, { 
  label: string; 
  icon: React.ReactNode; 
  color: string;
  bgColor: string;
}> = {
  anamnese: {
    label: 'Anamnese',
    icon: <ClipboardList className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  avaliacao: {
    label: 'Avaliação',
    icon: <Sparkles className="h-4 w-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  evolucao: {
    label: 'Evolução',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  facial_map: {
    label: 'Mapa Facial',
    icon: <Map className="h-4 w-4" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
  produto: {
    label: 'Produto',
    icon: <Package className="h-4 w-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  consentimento: {
    label: 'Consentimento',
    icon: <FileCheck className="h-4 w-4" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  before_after: {
    label: 'Foto',
    icon: <Camera className="h-4 w-4" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  alerta: {
    label: 'Alerta',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  documento: {
    label: 'Documento',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};

function TimelineEventCard({ event, expanded, onToggle }: { 
  event: TimelineEvent; 
  expanded: boolean;
  onToggle: () => void;
}) {
  const config = EVENT_TYPE_CONFIG[event.type];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`p-2 rounded-full ${config.bgColor} ${config.color} shrink-0`}>
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{event.title}</span>
              <Badge variant="secondary" className="text-xs">
                {config.label}
              </Badge>
              {event.status === 'signed' && (
                <Badge variant="outline" className="text-xs gap-1 text-primary">
                  <CheckCircle2 className="h-3 w-3" />
                  Assinado
                </Badge>
              )}
              {event.status === 'draft' && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Rascunho
                </Badge>
              )}
            </div>

            {event.subtitle && (
              <p className="text-sm text-foreground mt-0.5">{event.subtitle}</p>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(parseISO(event.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
              {event.professionalName && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {event.professionalName}
                </span>
              )}
            </div>

            {/* Expanded details */}
            {expanded && event.metadata && (
              <div className="mt-3 pt-3 border-t space-y-2">
                {event.description && (
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                )}
                
                {/* Type-specific details */}
                {event.type === 'produto' && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {event.metadata.batch_number && (
                      <div>
                        <span className="text-muted-foreground">Lote: </span>
                        <span>{event.metadata.batch_number as string}</span>
                      </div>
                    )}
                    {event.metadata.manufacturer && (
                      <div>
                        <span className="text-muted-foreground">Fabricante: </span>
                        <span>{event.metadata.manufacturer as string}</span>
                      </div>
                    )}
                    {event.metadata.procedure_type && (
                      <div>
                        <span className="text-muted-foreground">Tipo: </span>
                        <span>{event.metadata.procedure_type as string}</span>
                      </div>
                    )}
                  </div>
                )}

                {event.type === 'consentimento' && (
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">v{event.metadata.term_version as string}</Badge>
                    {event.metadata.has_signature && (
                      <Badge variant="secondary" className="gap-1">
                        <FileSignature className="h-3 w-3" />
                        Com assinatura
                      </Badge>
                    )}
                  </div>
                )}

                {event.type === 'facial_map' && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Pontos de aplicação: </span>
                    <span className="font-medium">{event.metadata.applicationCount as number}</span>
                  </div>
                )}

                {event.type === 'before_after' && (
                  <div className="flex items-center gap-2 text-xs">
                    {event.metadata.has_before && (
                      <Badge variant="outline">Foto Antes</Badge>
                    )}
                    {event.metadata.has_after && (
                      <Badge variant="outline">Foto Depois</Badge>
                    )}
                    {event.metadata.consent_for_marketing && (
                      <Badge variant="secondary">Marketing autorizado</Badge>
                    )}
                  </div>
                )}

                {event.type === 'alerta' && (
                  <div className="flex items-center gap-2 text-xs">
                    <Badge 
                      variant={event.metadata.is_active ? "destructive" : "secondary"}
                    >
                      {event.metadata.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="outline">
                      {event.metadata.severity as string}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expand button */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={onToggle}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TimelineEsteticaBlock({ patientId }: TimelineEsteticaBlockProps) {
  const [viewMode, setViewMode] = useState<'all' | 'by-date' | 'by-month'>('all');
  const [filterType, setFilterType] = useState<TimelineEventType | 'all'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { events, groupedByDate, groupedByMonth, counts, isLoading } = useTimelineEsteticaData(patientId);

  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter((e) => e.type === filterType);
  }, [events, filterType]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Linha do Tempo</h2>
          <Badge variant="secondary">{counts.total} registro(s)</Badge>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => {
          const count = counts[type as TimelineEventType] || 0;
          if (count === 0) return null;
          return (
            <Card 
              key={type} 
              className={`p-2 cursor-pointer transition-all ${
                filterType === type 
                  ? 'ring-2 ring-primary' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setFilterType(filterType === type ? 'all' : type as TimelineEventType)}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${config.bgColor} ${config.color}`}>
                  {config.icon}
                </div>
                <div>
                  <p className="text-lg font-semibold">{count}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={(v) => setFilterType(v as TimelineEventType | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    {config.icon}
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
          <TabsList>
            <TabsTrigger value="all" className="text-xs">Cronológico</TabsTrigger>
            <TabsTrigger value="by-date" className="text-xs">Por Dia</TabsTrigger>
            <TabsTrigger value="by-month" className="text-xs">Por Mês</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Empty state */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {filterType === 'all' 
                ? 'Nenhum registro encontrado' 
                : `Nenhum registro do tipo "${EVENT_TYPE_CONFIG[filterType].label}"`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px] pr-2">
          {viewMode === 'all' && (
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <TimelineEventCard
                  key={event.id}
                  event={event}
                  expanded={expandedIds.has(event.id)}
                  onToggle={() => toggleExpanded(event.id)}
                />
              ))}
            </div>
          )}

          {viewMode === 'by-date' && (
            <div className="space-y-6">
              {Object.entries(groupedByDate)
                .filter(([_, evts]) => 
                  filterType === 'all' || evts.some((e) => e.type === filterType)
                )
                .map(([dateKey, evts]) => {
                  const filtered = filterType === 'all' 
                    ? evts 
                    : evts.filter((e) => e.type === filterType);
                  
                  if (filtered.length === 0) return null;

                  return (
                    <div key={dateKey}>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h3 className="font-medium">
                          {format(parseISO(dateKey), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {filtered.length}
                        </Badge>
                      </div>
                      <div className="space-y-2 ml-6 border-l-2 border-muted pl-4">
                        {filtered.map((event) => (
                          <TimelineEventCard
                            key={event.id}
                            event={event}
                            expanded={expandedIds.has(event.id)}
                            onToggle={() => toggleExpanded(event.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {viewMode === 'by-month' && (
            <div className="space-y-6">
              {Object.entries(groupedByMonth)
                .filter(([_, evts]) => 
                  filterType === 'all' || evts.some((e) => e.type === filterType)
                )
                .map(([monthKey, evts]) => {
                  const filtered = filterType === 'all' 
                    ? evts 
                    : evts.filter((e) => e.type === filterType);
                  
                  if (filtered.length === 0) return null;

                  const [year, month] = monthKey.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1, 1);

                  return (
                    <div key={monthKey}>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h3 className="font-medium capitalize">
                          {format(date, "MMMM 'de' yyyy", { locale: ptBR })}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {filtered.length}
                        </Badge>
                      </div>
                      <div className="space-y-2 ml-6 border-l-2 border-muted pl-4">
                        {filtered.map((event) => (
                          <TimelineEventCard
                            key={event.id}
                            event={event}
                            expanded={expandedIds.has(event.id)}
                            onToggle={() => toggleExpanded(event.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}
