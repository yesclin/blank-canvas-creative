import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Clock,
  Calendar,
  Filter,
  X,
  ChevronRight,
  RefreshCw,
  UserPlus,
  Activity,
  Upload,
  Download,
  FileCheck,
  FileX,
  PenTool,
  FileText,
  ShieldAlert,
  Eye,
  ClipboardList,
  Stethoscope,
  Syringe,
  Pill,
  Loader2,
  ShoppingCart,
  XCircle,
  Package,
  DollarSign,
  Boxes,
  type LucideIcon,
} from 'lucide-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useClinicalTimeline } from '@/hooks/prontuario/useClinicalTimeline';
import {
  TimelineEvent,
  TimelineEventType,
  TimelineEventCategory,
  TIMELINE_EVENT_CONFIG,
  CATEGORY_LABELS,
  TimelineFilters,
} from '@/types/timeline';
import { SaleDetailsDialog } from '@/components/gestao/SaleDetailsDialog';

// Icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
  UserPlus,
  Calendar,
  RefreshCw,
  ClipboardList,
  Activity,
  Stethoscope,
  Syringe,
  Pill,
  Upload,
  Download,
  FileCheck,
  FileX,
  PenTool,
  FileText,
  ShieldAlert,
  Eye,
  ShoppingCart,
  XCircle,
  Package,
  DollarSign,
  Boxes,
};

interface ClinicalTimelineProps {
  patientId: string | null;
  onNavigateToTab?: (tabKey: string, entityId?: string) => void;
  restrictedTabs?: string[]; // Tabs the user cannot view
  className?: string;
}

export function ClinicalTimeline({
  patientId,
  onNavigateToTab,
  restrictedTabs = [],
  className,
}: ClinicalTimelineProps) {
  const {
    events,
    groupedEvents,
    loading,
    hasMore,
    filters,
    applyFilters,
    clearFilters,
    loadMore,
    refetch,
  } = useClinicalTimeline(patientId);

  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<TimelineFilters>({});
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Filter events based on restricted tabs
  const visibleEvents = events.filter(event => {
    if (!event.target_tab) return true;
    return !restrictedTabs.includes(event.target_tab);
  });

  const visibleGroupedEvents = groupedEvents.map(group => ({
    ...group,
    events: group.events.filter(event => {
      if (!event.target_tab) return true;
      return !restrictedTabs.includes(event.target_tab);
    }),
  })).filter(group => group.events.length > 0);

  // Lazy loading with intersection observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadMore]);

  // Handle filter apply
  const handleApplyFilters = useCallback(() => {
    applyFilters(localFilters);
    setShowFilters(false);
  }, [localFilters, applyFilters]);

  // Handle filter clear
  const handleClearFilters = useCallback(() => {
    setLocalFilters({});
    clearFilters();
    setShowFilters(false);
  }, [clearFilters]);

  // Format date header
  const formatDateHeader = (dateStr: string): string => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // Get icon for event type
  const getEventIcon = (eventType: TimelineEventType): LucideIcon => {
    const config = TIMELINE_EVENT_CONFIG[eventType];
    return ICON_MAP[config?.icon || 'Activity'] || Activity;
  };

  // Handle event click
  const handleEventClick = (event: TimelineEvent) => {
    // Handle sale events - open sale details dialog
    if (event.event_type === 'SALE_CREATED' && event.entity === 'sales') {
      setSelectedSaleId(event.entity_id);
      return;
    }
    
    if (event.can_navigate && event.target_tab && onNavigateToTab) {
      onNavigateToTab(event.target_tab, event.entity_id);
    }
  };

  if (!patientId) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um paciente para ver a linha do tempo</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Linha do Tempo Clínica
            <Badge variant="secondary">{visibleEvents.length} eventos</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button
                  variant={Object.keys(filters).length > 0 ? 'default' : 'outline'}
                  size="sm"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filtros
                  {Object.keys(filters).length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5">
                      {Object.keys(filters).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="font-medium">Filtrar Eventos</div>
                  
                  {/* Date range */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">De</Label>
                      <Input
                        type="date"
                        value={localFilters.dateFrom || ''}
                        onChange={e => setLocalFilters(prev => ({
                          ...prev,
                          dateFrom: e.target.value || undefined,
                        }))}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Até</Label>
                      <Input
                        type="date"
                        value={localFilters.dateTo || ''}
                        onChange={e => setLocalFilters(prev => ({
                          ...prev,
                          dateTo: e.target.value || undefined,
                        }))}
                        className="h-8"
                      />
                    </div>
                  </div>

                  {/* Category filter */}
                  <div className="space-y-1">
                    <Label className="text-xs">Categoria</Label>
                    <Select
                      value={localFilters.categories?.[0] || 'all'}
                      onValueChange={val => setLocalFilters(prev => ({
                        ...prev,
                        categories: val === 'all' ? undefined : [val as TimelineEventCategory],
                      }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {Object.entries(CATEGORY_LABELS).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleClearFilters}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleApplyFilters}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[600px]">
          {loading && events.length === 0 ? (
            <div className="space-y-4 p-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : visibleGroupedEvents.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {Object.keys(filters).length > 0
                  ? 'Nenhum evento encontrado com os filtros aplicados'
                  : 'Nenhum evento registrado ainda'}
              </p>
              {Object.keys(filters).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={handleClearFilters}
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="px-4 pb-4">
              {visibleGroupedEvents.map((group, groupIndex) => (
                <div key={group.date} className="mb-6">
                  {/* Date header */}
                  <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {formatDateHeader(group.date)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {group.events.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="relative pl-6">
                    {/* Timeline line */}
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />

                    {group.events.map((event, eventIndex) => {
                      const config = TIMELINE_EVENT_CONFIG[event.event_type];
                      const Icon = getEventIcon(event.event_type);
                      const isClickable = event.can_navigate && event.target_tab && onNavigateToTab;

                      return (
                        <div
                          key={event.id}
                          className={cn(
                            'relative mb-3 last:mb-0',
                            isClickable && 'cursor-pointer'
                          )}
                          onClick={() => isClickable && handleEventClick(event)}
                        >
                          {/* Timeline dot */}
                          <div
                            className={cn(
                              'absolute -left-4 top-3 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center',
                              config?.bgColor || 'bg-muted'
                            )}
                          >
                            <Icon className={cn('h-2.5 w-2.5', config?.color || 'text-muted-foreground')} />
                          </div>

                          {/* Event card */}
                          <div
                            className={cn(
                              'ml-4 p-3 rounded-lg border transition-all',
                              isClickable && 'hover:shadow-md hover:border-primary/50'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    variant="secondary"
                                    className={cn('text-xs', config?.bgColor, config?.color)}
                                  >
                                    {config?.label || event.event_type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {format(parseISO(event.timestamp), 'HH:mm', { locale: ptBR })}
                                  </span>
                                </div>
                                <p className="text-sm mt-1 line-clamp-2">{event.summary}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Por: {event.author_name}
                                </p>
                              </div>
                              {isClickable && (
                                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Load more trigger */}
              <div ref={loadMoreRef} className="py-4 text-center">
                {loading && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Carregando mais...</span>
                  </div>
                )}
                {!loading && hasMore && (
                  <Button variant="ghost" size="sm" onClick={loadMore}>
                    Carregar mais
                  </Button>
                )}
                {!loading && !hasMore && events.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Fim da linha do tempo
                  </p>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Sale Details Dialog */}
      <SaleDetailsDialog
        saleId={selectedSaleId}
        open={!!selectedSaleId}
        onOpenChange={(open) => !open && setSelectedSaleId(null)}
      />
    </Card>
  );
}
