import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Clock,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Stethoscope,
  FileText,
  Target,
  Wrench,
  Package,
  FileImage,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Activity
} from "lucide-react";
import { format, parseISO, isThisYear, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

// Types for consolidated timeline entries
export type TimelineEntryType = 
  | 'anamnese'
  | 'odontograma'
  | 'diagnostico'
  | 'plano_tratamento'
  | 'procedimento'
  | 'material'
  | 'exame'
  | 'evolucao';

export interface TimelineEntry {
  id: string;
  type: TimelineEntryType;
  date: string;
  title: string;
  summary: string;
  details?: Record<string, unknown>;
  professional_name?: string;
  status?: string;
  metadata?: {
    dente?: string;
    dentes?: string[];
    file_type?: string;
    quantidade?: number;
  };
}

interface HistoricoTimelineBlockProps {
  entries: TimelineEntry[];
  loading?: boolean;
  onNavigateToModule?: (type: TimelineEntryType, id: string) => void;
}

// Configuration for entry types
const ENTRY_TYPE_CONFIG: Record<TimelineEntryType, { 
  label: string; 
  icon: typeof ClipboardList; 
  color: string;
}> = {
  anamnese: { 
    label: 'Anamnese', 
    icon: ClipboardList, 
    color: 'bg-primary/10 text-primary border-primary/30' 
  },
  odontograma: { 
    label: 'Odontograma', 
    icon: Activity, 
    color: 'bg-accent/10 text-accent-foreground border-accent/30' 
  },
  diagnostico: { 
    label: 'Diagnóstico', 
    icon: Stethoscope, 
    color: 'bg-destructive/10 text-destructive border-destructive/30' 
  },
  plano_tratamento: { 
    label: 'Plano de Tratamento', 
    icon: Target, 
    color: 'bg-secondary/50 text-secondary-foreground border-secondary' 
  },
  procedimento: { 
    label: 'Procedimento', 
    icon: Wrench, 
    color: 'bg-primary/10 text-primary border-primary/30' 
  },
  material: { 
    label: 'Material Utilizado', 
    icon: Package, 
    color: 'bg-muted text-muted-foreground border-border' 
  },
  exame: { 
    label: 'Exame/Documento', 
    icon: FileImage, 
    color: 'bg-secondary/30 text-secondary-foreground border-secondary/50' 
  },
  evolucao: { 
    label: 'Evolução', 
    icon: FileText, 
    color: 'bg-primary/10 text-primary border-primary/30' 
  },
};

// Format date for timeline display
const formatTimelineDate = (dateStr: string): string => {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  if (isThisYear(date)) return format(date, "dd 'de' MMMM", { locale: ptBR });
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

// Group entries by date
const groupEntriesByDate = (entries: TimelineEntry[]): Map<string, TimelineEntry[]> => {
  const grouped = new Map<string, TimelineEntry[]>();
  
  entries.forEach(entry => {
    const dateKey = entry.date.split('T')[0];
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(entry);
  });
  
  return grouped;
};

/**
 * HISTÓRICO / LINHA DO TEMPO
 * 
 * Consolidação cronológica de todos os registros:
 * - Anamneses
 * - Odontogramas
 * - Diagnósticos
 * - Planos de tratamento
 * - Procedimentos realizados
 * - Materiais utilizados
 * - Exames/Documentos
 * - Evoluções
 * 
 * Exibição somente leitura com filtros e busca.
 */
export function HistoricoTimelineBlock({
  entries,
  loading = false,
  onNavigateToModule,
}: HistoricoTimelineBlockProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = searchTerm === '' || 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.metadata?.dente?.includes(searchTerm) ||
        entry.metadata?.dentes?.some(d => d.includes(searchTerm));
      const matchesType = filterType === '' || entry.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [entries, searchTerm, filterType]);

  // Sort by date descending and group
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredEntries]);

  const groupedEntries = useMemo(() => {
    return groupEntriesByDate(sortedEntries);
  }, [sortedEntries]);

  // Toggle date expansion
  const toggleDate = (dateKey: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  // Expand/collapse all
  const expandAll = () => {
    setExpandedDates(new Set(groupedEntries.keys()));
  };

  const collapseAll = () => {
    setExpandedDates(new Set());
  };

  // Count by type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });
    return counts;
  }, [entries]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Histórico / Linha do Tempo</h2>
          <Badge variant="secondary" className="text-xs">
            {entries.length} registros
          </Badge>
        </div>
        {groupedEntries.size > 0 && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expandir
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Recolher
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-3 p-3 rounded-lg border bg-muted/30">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descrição ou dente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo de registro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os tipos</SelectItem>
              {Object.entries(ENTRY_TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    {config.label}
                    {typeCounts[key] && (
                      <span className="text-xs text-muted-foreground">
                        ({typeCounts[key]})
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum registro encontrado</h3>
            <p className="text-sm text-muted-foreground">
              O histórico do paciente aparecerá aqui conforme os registros forem adicionados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* No results */}
      {entries.length > 0 && filteredEntries.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum registro encontrado com os filtros aplicados.</p>
        </div>
      )}

      {/* Timeline */}
      {groupedEntries.size > 0 && (
        <ScrollArea className="h-[600px] pr-4">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-4">
              {Array.from(groupedEntries.entries()).map(([dateKey, dayEntries]) => {
                const isExpanded = expandedDates.has(dateKey);
                const formattedDate = formatTimelineDate(dateKey);

                return (
                  <Collapsible
                    key={dateKey}
                    open={isExpanded}
                    onOpenChange={() => toggleDate(dateKey)}
                  >
                    {/* Date header */}
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-primary">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formattedDate}</span>
                            <Badge variant="outline" className="text-xs">
                              {dayEntries.length} {dayEntries.length === 1 ? 'registro' : 'registros'}
                            </Badge>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    {/* Day entries */}
                    <CollapsibleContent>
                      <div className="ml-4 pl-8 border-l-2 border-border space-y-3 py-3">
                        {dayEntries.map((entry) => {
                          const config = ENTRY_TYPE_CONFIG[entry.type];
                          const Icon = config.icon;

                          return (
                            <Card 
                              key={entry.id} 
                              className={`overflow-hidden transition-shadow hover:shadow-md ${
                                onNavigateToModule ? 'cursor-pointer' : ''
                              }`}
                              onClick={() => onNavigateToModule?.(entry.type, entry.id)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start gap-3">
                                  {/* Icon */}
                                  <div className={`p-2 rounded-lg ${config.color}`}>
                                    <Icon className="h-4 w-4" />
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <Badge variant="outline" className={`text-xs mb-1 ${config.color}`}>
                                          {config.label}
                                        </Badge>
                                        <h4 className="font-medium text-sm">{entry.title}</h4>
                                      </div>
                                      {entry.status && (
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs shrink-0 ${
                                            entry.status === 'assinado' 
                                              ? 'bg-primary/10 text-primary border-primary/30' 
                                              : 'bg-muted text-muted-foreground'
                                          }`}
                                        >
                                          {entry.status === 'assinado' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                          {entry.status}
                                        </Badge>
                                      )}
                                    </div>

                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {entry.summary}
                                    </p>

                                    {/* Metadata badges */}
                                    {(entry.metadata?.dente || entry.metadata?.dentes?.length) && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {entry.metadata.dente && (
                                          <Badge variant="secondary" className="text-xs">
                                            Dente {entry.metadata.dente}
                                          </Badge>
                                        )}
                                        {entry.metadata.dentes?.map(dente => (
                                          <Badge key={dente} variant="secondary" className="text-xs">
                                            Dente {dente}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}

                                    {/* Footer */}
                                    <div className="flex items-center gap-3 mt-2 pt-2 border-t text-xs text-muted-foreground">
                                      {entry.professional_name && (
                                        <div className="flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          {entry.professional_name}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(parseISO(entry.date), 'HH:mm')}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
