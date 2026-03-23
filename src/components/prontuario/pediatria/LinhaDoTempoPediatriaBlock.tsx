import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Clock,
  Calendar,
  Stethoscope,
  Syringe,
  Pill,
  FileText,
  Activity,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import { format, parseISO, isThisYear, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ===== TYPES =====
export type TimelineEventType = 
  | 'consulta' 
  | 'vacina' 
  | 'prescricao' 
  | 'diagnostico' 
  | 'exame'
  | 'evolucao'
  | 'alerta';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  subtitle?: string;
  description?: string;
  date: string;
  professional_name?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface TimelineData {
  events: TimelineEvent[];
}

// ===== CONSTANTS =====
const EVENT_TYPE_CONFIG: Record<TimelineEventType, { 
  label: string; 
  icon: React.ReactNode; 
  bgClass: string;
  borderClass: string;
  dotClass: string;
}> = {
  consulta: { 
    label: 'Consulta', 
    icon: <Stethoscope className="h-4 w-4" />, 
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/30',
    dotClass: 'bg-primary',
  },
  vacina: { 
    label: 'Vacina', 
    icon: <Syringe className="h-4 w-4" />, 
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-300',
    dotClass: 'bg-emerald-500',
  },
  prescricao: { 
    label: 'Prescrição', 
    icon: <Pill className="h-4 w-4" />, 
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-300',
    dotClass: 'bg-blue-500',
  },
  diagnostico: { 
    label: 'Diagnóstico', 
    icon: <ClipboardList className="h-4 w-4" />, 
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-300',
    dotClass: 'bg-purple-500',
  },
  exame: { 
    label: 'Exame', 
    icon: <Activity className="h-4 w-4" />, 
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-300',
    dotClass: 'bg-amber-500',
  },
  evolucao: { 
    label: 'Evolução', 
    icon: <FileText className="h-4 w-4" />, 
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-300',
    dotClass: 'bg-slate-500',
  },
  alerta: { 
    label: 'Alerta', 
    icon: <AlertTriangle className="h-4 w-4" />, 
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive/30',
    dotClass: 'bg-destructive',
  },
};

// ===== UTILITIES =====
function formatEventDate(dateStr: string): string {
  const date = parseISO(dateStr);
  
  if (isToday(date)) {
    return `Hoje, ${format(date, 'HH:mm', { locale: ptBR })}`;
  }
  if (isYesterday(date)) {
    return `Ontem, ${format(date, 'HH:mm', { locale: ptBR })}`;
  }
  if (isThisYear(date)) {
    return format(date, "d 'de' MMMM", { locale: ptBR });
  }
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

function groupEventsByMonth(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const grouped = new Map<string, TimelineEvent[]>();
  
  events.forEach(event => {
    const date = parseISO(event.date);
    const monthKey = format(date, 'yyyy-MM');
    const monthLabel = format(date, "MMMM 'de' yyyy", { locale: ptBR });
    
    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, []);
    }
    grouped.get(monthKey)!.push(event);
  });
  
  return grouped;
}

// ===== PROPS =====
interface LinhaDoTempoPediatriaBlockProps {
  patientId: string;
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
  className?: string;
}

// ===== COMPONENT =====
export function LinhaDoTempoPediatriaBlock({
  patientId,
  events,
  onEventClick,
  className,
}: LinhaDoTempoPediatriaBlockProps) {
  const [activeFilters, setActiveFilters] = useState<TimelineEventType[]>([]);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = [...events];
    
    if (activeFilters.length > 0) {
      filtered = filtered.filter(e => activeFilters.includes(e.type));
    }
    
    return filtered.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [events, activeFilters]);

  // Group by month
  const groupedEvents = useMemo(() => 
    groupEventsByMonth(filteredEvents),
    [filteredEvents]
  );

  // Event counts by type
  const eventCounts = useMemo(() => {
    const counts: Record<TimelineEventType, number> = {
      consulta: 0,
      vacina: 0,
      prescricao: 0,
      diagnostico: 0,
      exame: 0,
      evolucao: 0,
      alerta: 0,
    };
    events.forEach(e => { counts[e.type]++; });
    return counts;
  }, [events]);

  const toggleFilter = (type: TimelineEventType) => {
    setActiveFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  };

  // Auto-expand first month
  const monthKeys = Array.from(groupedEvents.keys());
  if (monthKeys.length > 0 && expandedMonths.size === 0) {
    expandedMonths.add(monthKeys[0]);
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Linha do Tempo</CardTitle>
            <Badge variant="secondary">{events.length} eventos</Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(activeFilters.length > 0 && "border-primary text-primary")}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtrar
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1">
                {activeFilters.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 pt-3">
            {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => {
              const eventType = type as TimelineEventType;
              const isActive = activeFilters.includes(eventType);
              const count = eventCounts[eventType];
              
              return (
                <Button
                  key={type}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter(eventType)}
                  className={cn(
                    "h-8",
                    !isActive && count === 0 && "opacity-50"
                  )}
                  disabled={count === 0}
                >
                  {config.icon}
                  <span className="ml-1">{config.label}</span>
                  <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                    {count}
                  </Badge>
                </Button>
              );
            })}
            {activeFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilters([])}
                className="h-8 text-muted-foreground"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum evento registrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(groupedEvents.entries()).map(([monthKey, monthEvents]) => {
                const isExpanded = expandedMonths.has(monthKey);
                const monthLabel = format(parseISO(monthEvents[0].date), "MMMM 'de' yyyy", { locale: ptBR });
                
                return (
                  <div key={monthKey}>
                    {/* Month Header */}
                    <button
                      onClick={() => toggleMonth(monthKey)}
                      className="flex items-center gap-2 w-full py-2 text-left hover:bg-muted/50 rounded-lg px-2 transition-colors"
                    >
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium capitalize">{monthLabel}</span>
                      <Badge variant="secondary" className="text-xs">
                        {monthEvents.length}
                      </Badge>
                      <div className="flex-1" />
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {/* Month Events */}
                    {isExpanded && (
                      <div className="relative ml-4 mt-2">
                        {/* Timeline Line */}
                        <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-border" />

                        <div className="space-y-3">
                          {monthEvents.map((event, idx) => {
                            const config = EVENT_TYPE_CONFIG[event.type];
                            
                            return (
                              <div 
                                key={event.id}
                                className={cn(
                                  "relative pl-8 group",
                                  onEventClick && "cursor-pointer"
                                )}
                                onClick={() => onEventClick?.(event)}
                              >
                                {/* Timeline Dot */}
                                <div className={cn(
                                  "absolute left-0 top-2 w-4 h-4 rounded-full border-2 border-background",
                                  config.dotClass
                                )} />

                                {/* Event Card */}
                                <div className={cn(
                                  "p-3 rounded-lg border transition-colors",
                                  config.bgClass,
                                  config.borderClass,
                                  onEventClick && "group-hover:shadow-md"
                                )}>
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">{config.icon}</span>
                                      <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-medium">{event.title}</span>
                                          <Badge variant="outline" className="text-xs">
                                            {config.label}
                                          </Badge>
                                          {event.status && (
                                            <Badge variant="secondary" className="text-xs">
                                              {event.status}
                                            </Badge>
                                          )}
                                        </div>
                                        {event.subtitle && (
                                          <p className="text-sm text-muted-foreground">{event.subtitle}</p>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {formatEventDate(event.date)}
                                    </span>
                                  </div>

                                  {event.description && (
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                      {event.description}
                                    </p>
                                  )}

                                  {event.professional_name && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                      <User className="h-3 w-3" />
                                      {event.professional_name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default LinhaDoTempoPediatriaBlock;
