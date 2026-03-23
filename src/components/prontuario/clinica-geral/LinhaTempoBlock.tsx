import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Clock,
  FileText,
  Stethoscope,
  ClipboardList,
  FileUp,
  FlaskConical,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  History,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";

/**
 * Tipos de eventos na linha do tempo
 */
export type TipoEventoTimeline = 
  | 'anamnese' 
  | 'evolucao' 
  | 'exame_fisico'
  | 'conduta' 
  | 'documento'
  | 'receituario'
  | 'atestado'
  | 'declaracao'
  | 'relatorio';

export const tipoEventoConfig: Record<TipoEventoTimeline, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  anamnese: {
    label: 'Anamnese',
    icon: <ClipboardList className="h-4 w-4" />,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  evolucao: {
    label: 'Evolução',
    icon: <Stethoscope className="h-4 w-4" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  exame_fisico: {
    label: 'Exame Físico',
    icon: <FlaskConical className="h-4 w-4" />,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  conduta: {
    label: 'Plano / Conduta',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  documento: {
    label: 'Documento',
    icon: <FileUp className="h-4 w-4" />,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
  },
  receituario: {
    label: 'Receituário',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  atestado: {
    label: 'Atestado',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  declaracao: {
    label: 'Declaração',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
  },
  relatorio: {
    label: 'Relatório',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
};

/**
 * Estrutura de um evento na linha do tempo
 */
export interface EventoTimeline {
  id: string;
  tipo: TipoEventoTimeline;
  titulo: string;
  resumo?: string;
  detalhes?: Record<string, unknown>;
  profissional_nome?: string;
  created_at: string;
}

interface LinhaTempoBlockProps {
  eventos: EventoTimeline[];
  loading?: boolean;
}

/**
 * LINHA DO TEMPO - Bloco de histórico consolidado
 * 
 * Exibe em ordem cronológica:
 * - Anamneses
 * - Evoluções
 * - Exames físicos
 * - Planos / Condutas
 * - Documentos
 * 
 * Este bloco é apenas de leitura.
 */
export function LinhaTempoBlock({
  eventos,
  loading = false,
}: LinhaTempoBlockProps) {
  const [filtroTipo, setFiltroTipo] = useState<TipoEventoTimeline | 'all'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Filter and sort events
  const eventosFiltrados = useMemo(() => {
    let filtered = eventos;
    if (filtroTipo !== 'all') {
      filtered = eventos.filter(e => e.tipo === filtroTipo);
    }
    // Sort by date descending (most recent first)
    return [...filtered].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [eventos, filtroTipo]);

  // Group events by date
  const eventosAgrupados = useMemo(() => {
    const grupos: Record<string, EventoTimeline[]> = {};
    eventosFiltrados.forEach(evento => {
      const data = format(parseISO(evento.created_at), 'yyyy-MM-dd');
      if (!grupos[data]) {
        grupos[data] = [];
      }
      grupos[data].push(evento);
    });
    return grupos;
  }, [eventosFiltrados]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const renderEventCard = (evento: EventoTimeline) => {
    const config = tipoEventoConfig[evento.tipo];
    const isExpanded = expandedIds.has(evento.id);
    const hasDetails = evento.detalhes && Object.keys(evento.detalhes).length > 0;

    return (
      <div
        key={evento.id}
        className="relative pl-8 pb-6 last:pb-0"
      >
        {/* Timeline connector line */}
        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border last:hidden" />
        
        {/* Timeline dot */}
        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${config.bgColor}`}>
          <div className={config.color}>
            {config.icon}
          </div>
        </div>

        {/* Event card */}
        <Card className="ml-2">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className={`${config.color} border-current`}>
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(parseISO(evento.created_at), "HH:mm", { locale: ptBR })}
                  </span>
                </div>

                <h4 className="font-medium text-sm">{evento.titulo}</h4>

                {evento.resumo && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {evento.resumo}
                  </p>
                )}

                {evento.profissional_nome && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {evento.profissional_nome}
                  </p>
                )}

                {/* Expandable details */}
                {hasDetails && isExpanded && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    {Object.entries(evento.detalhes!).map(([key, value]) => {
                      if (!value) return null;
                      const label = key
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, c => c.toUpperCase());
                      return (
                        <div key={key} className="text-sm">
                          <span className="font-medium text-muted-foreground">{label}: </span>
                          <span>{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {hasDetails && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleExpand(evento.id)}
                  className="flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Histórico / Linha do Tempo</h2>
          <Badge variant="secondary">
            {eventosFiltrados.length} registro{eventosFiltrados.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={filtroTipo} 
            onValueChange={(v) => setFiltroTipo(v as TipoEventoTimeline | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="anamnese">Anamneses</SelectItem>
              <SelectItem value="evolucao">Evoluções</SelectItem>
              <SelectItem value="exame_fisico">Exames Físicos</SelectItem>
              <SelectItem value="conduta">Planos / Condutas</SelectItem>
              <SelectItem value="documento">Documentos</SelectItem>
              <SelectItem value="receituario">Receituários</SelectItem>
              <SelectItem value="atestado">Atestados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline content */}
      {eventosFiltrados.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <History className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum registro encontrado</h3>
            <p className="text-sm text-muted-foreground">
              {filtroTipo === 'all' 
                ? 'O histórico clínico do paciente aparecerá aqui.'
                : `Nenhum registro do tipo "${tipoEventoConfig[filtroTipo].label}" encontrado.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {Object.entries(eventosAgrupados).map(([data, eventosData]) => (
              <div key={data}>
                {/* Date header */}
                <div className="flex items-center gap-2 mb-4 sticky top-0 bg-background py-2 z-10">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {format(parseISO(data), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                  <Separator className="flex-1" />
                </div>

                {/* Events for this date */}
                <div className="ml-2">
                  {eventosData.map(evento => renderEventCard(evento))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
