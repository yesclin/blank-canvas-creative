import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Clock,
  FileText,
  Stethoscope,
  Activity,
  Pill,
  Scissors,
  Camera,
  TrendingUp,
  User,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Filter,
  Eye
} from "lucide-react";
import { format, parseISO, isThisYear, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

/**
 * Tipos de registro na linha do tempo
 */
export const TIMELINE_RECORD_TYPES = {
  anamnese: { label: 'Anamnese', icon: FileText, color: 'text-primary' },
  exame: { label: 'Exame Dermatológico', icon: Stethoscope, color: 'text-primary' },
  diagnostico: { label: 'Diagnóstico', icon: Activity, color: 'text-primary' },
  prescricao: { label: 'Prescrição', icon: Pill, color: 'text-primary' },
  procedimento: { label: 'Procedimento', icon: Scissors, color: 'text-primary' },
  imagem: { label: 'Imagem', icon: Camera, color: 'text-primary' },
  evolucao: { label: 'Evolução Clínica', icon: TrendingUp, color: 'text-primary' },
} as const;

export type TimelineRecordType = keyof typeof TIMELINE_RECORD_TYPES;

/**
 * Item da linha do tempo
 */
export interface TimelineItem {
  id: string;
  type: TimelineRecordType;
  date: string;
  title: string;
  summary?: string;
  professional_name?: string;
  details?: Record<string, unknown>;
  image_url?: string;
}

interface LinhaDoTempoDermatoBlockProps {
  items: TimelineItem[];
  loading?: boolean;
  onViewDetails?: (item: TimelineItem) => void;
}

/**
 * LINHA DO TEMPO - DERMATOLOGIA
 * 
 * Exibe todos os registros clínicos em ordem cronológica:
 * - Anamneses
 * - Exames dermatológicos
 * - Diagnósticos
 * - Prescrições
 * - Procedimentos
 * - Imagens
 * - Evoluções
 * 
 * Modo somente leitura com navegação e filtros.
 */
export function LinhaDoTempoDermatoBlock({
  items,
  loading = false,
  onViewDetails,
}: LinhaDoTempoDermatoBlockProps) {
  const [filterType, setFilterType] = useState<TimelineRecordType | 'all'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);

  // Filter items
  const filteredItems = useMemo(() => {
    if (filterType === 'all') return items;
    return items.filter(item => item.type === filterType);
  }, [items, filterType]);

  // Sort by date descending
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredItems]);

  // Group by month/year
  const groupedItems = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};
    
    sortedItems.forEach(item => {
      const date = parseISO(item.date);
      const key = format(date, "MMMM 'de' yyyy", { locale: ptBR });
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    
    return groups;
  }, [sortedItems]);

  const groupKeys = Object.keys(groupedItems);

  // Auto-expand first group
  useMemo(() => {
    if (groupKeys.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set([groupKeys[0]]));
    }
  }, [groupKeys]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const formatRelativeDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    if (isThisYear(date)) {
      return format(date, "dd 'de' MMMM", { locale: ptBR });
    }
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const getTypeConfig = (type: TimelineRecordType) => {
    return TIMELINE_RECORD_TYPES[type] || TIMELINE_RECORD_TYPES.evolucao;
  };

  // Count by type
  const typeCounts = useMemo(() => {
    const counts: Partial<Record<TimelineRecordType, number>> = {};
    items.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    return counts;
  }, [items]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Linha do Tempo
          </h2>
          <Badge variant="secondary">{items.length} registro(s)</Badge>
        </div>
        
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={(v) => setFilterType(v as TimelineRecordType | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {(Object.keys(TIMELINE_RECORD_TYPES) as TimelineRecordType[]).map(type => {
                const config = TIMELINE_RECORD_TYPES[type];
                const count = typeCounts[type] || 0;
                if (count === 0) return null;
                return (
                  <SelectItem key={type} value={type}>
                    {config.label} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Type summary badges */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TIMELINE_RECORD_TYPES) as TimelineRecordType[]).map(type => {
          const config = TIMELINE_RECORD_TYPES[type];
          const count = typeCounts[type] || 0;
          if (count === 0) return null;
          const IconComponent = config.icon;
          return (
            <Badge 
              key={type} 
              variant={filterType === type ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterType(filterType === type ? 'all' : type)}
            >
              <IconComponent className="h-3 w-3 mr-1" />
              {config.label}: {count}
            </Badge>
          );
        })}
      </div>

      {/* Timeline */}
      {sortedItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum registro encontrado</h3>
            <p className="text-sm text-muted-foreground">
              {filterType !== 'all' 
                ? `Não há registros do tipo "${TIMELINE_RECORD_TYPES[filterType].label}".`
                : 'A linha do tempo será preenchida conforme os atendimentos.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupKeys.map((groupKey) => {
            const groupItems = groupedItems[groupKey];
            const isExpanded = expandedGroups.has(groupKey);
            
            return (
              <Card key={groupKey}>
                <CardHeader 
                  className="py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleGroup(groupKey)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      {groupKey}
                      <Badge variant="outline" className="ml-2">
                        {groupItems.length}
                      </Badge>
                    </CardTitle>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
                      
                      <div className="space-y-4">
                        {groupItems.map((item, index) => {
                          const config = getTypeConfig(item.type);
                          const IconComponent = config.icon;
                          
                          return (
                            <div 
                              key={item.id}
                              className="relative flex gap-4 group"
                            >
                              {/* Timeline dot */}
                              <div className={cn(
                                "relative z-10 flex-shrink-0 w-10 h-10 rounded-full border-2 bg-background flex items-center justify-center",
                                "border-border group-hover:border-primary transition-colors"
                              )}>
                                <IconComponent className={cn("h-4 w-4", config.color)} />
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 pb-4">
                                <div className="bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="secondary" className="text-xs">
                                          {config.label}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {formatRelativeDate(item.date)}
                                          {item.date.includes('T') && (
                                            <> às {format(parseISO(item.date), "HH:mm", { locale: ptBR })}</>
                                          )}
                                        </span>
                                      </div>
                                      
                                      <h4 className="font-medium mt-1 text-sm">
                                        {item.title}
                                      </h4>
                                      
                                      {item.summary && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                          {item.summary}
                                        </p>
                                      )}
                                      
                                      {item.professional_name && (
                                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          {item.professional_name}
                                        </p>
                                      )}
                                    </div>
                                    
                                    {/* Image thumbnail */}
                                    {item.image_url && (
                                      <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-muted">
                                        <img 
                                          src={item.image_url} 
                                          alt="" 
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    
                                    {/* View details button */}
                                    {onViewDetails && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => {
                                          onViewDetails(item);
                                          setSelectedItem(item);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const config = getTypeConfig(selectedItem.type);
                    const IconComponent = config.icon;
                    return <IconComponent className={cn("h-5 w-5", config.color)} />;
                  })()}
                  {selectedItem.title}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="secondary">
                    {getTypeConfig(selectedItem.type).label}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {format(parseISO(selectedItem.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  {selectedItem.professional_name && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {selectedItem.professional_name}
                    </span>
                  )}
                </div>

                {selectedItem.image_url && (
                  <div className="rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={selectedItem.image_url} 
                      alt="" 
                      className="w-full max-h-[400px] object-contain"
                    />
                  </div>
                )}

                {selectedItem.summary && (
                  <div className="prose prose-sm max-w-none">
                    <p>{selectedItem.summary}</p>
                  </div>
                )}

                {selectedItem.details && Object.keys(selectedItem.details).length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    {Object.entries(selectedItem.details).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="font-medium text-sm capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LinhaDoTempoDermatoBlock;
