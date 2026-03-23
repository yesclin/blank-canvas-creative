/**
 * NUTRIÇÃO - Linha do Tempo / Histórico
 * 
 * Bloco de leitura que consolida todo o histórico nutricional do paciente:
 * - Anamneses
 * - Avaliações
 * - Diagnósticos nutricionais
 * - Planos alimentares
 * - Evoluções
 * - Documentos
 */

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Clock,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  History,
  FileText,
  ClipboardList,
  Target,
  AlertTriangle,
  Scale,
  Utensils,
  Stethoscope,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  type EventoTimelineNutricao,
  type TipoEventoNutricao,
  TIPO_EVENTO_NUTRICAO_CONFIG,
} from '@/hooks/prontuario/nutricao/useLinhaTempoNutricaoData';

const tipoEventoIcons: Record<TipoEventoNutricao, React.ReactNode> = {
  anamnese: <ClipboardList className="h-4 w-4" />,
  avaliacao: <Scale className="h-4 w-4" />,
  diagnostico: <Stethoscope className="h-4 w-4" />,
  plano_alimentar: <Utensils className="h-4 w-4" />,
  evolucao: <FileText className="h-4 w-4" />,
  documento: <FileText className="h-4 w-4" />,
  meta: <Target className="h-4 w-4" />,
  alerta: <AlertTriangle className="h-4 w-4" />,
};

interface LinhaTempoNutricaoBlockProps {
  eventos: EventoTimelineNutricao[];
  loading: boolean;
}

export function LinhaTempoNutricaoBlock({
  eventos,
  loading,
}: LinhaTempoNutricaoBlockProps) {
  const [filtroTipo, setFiltroTipo] = useState<TipoEventoNutricao | 'all'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Filtrar e ordenar eventos
  const eventosFiltrados = useMemo(() => {
    let filtered = eventos;
    if (filtroTipo !== 'all') {
      filtered = eventos.filter(e => e.tipo === filtroTipo);
    }
    return [...filtered].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [eventos, filtroTipo]);

  // Agrupar por data
  const eventosAgrupados = useMemo(() => {
    const grupos: Record<string, EventoTimelineNutricao[]> = {};
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

  // Contar por tipo
  const contagens = useMemo(() => {
    const counts: Record<string, number> = { all: eventos.length };
    eventos.forEach(e => {
      counts[e.tipo] = (counts[e.tipo] || 0) + 1;
    });
    return counts;
  }, [eventos]);

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
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Histórico / Linha do Tempo</h2>
          <Badge variant="secondary">{eventos.length}</Badge>
        </div>
        
        {/* Filtro */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filtroTipo}
            onValueChange={(v) => setFiltroTipo(v as TipoEventoNutricao | 'all')}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Todos ({contagens.all || 0})
              </SelectItem>
              {Object.entries(TIPO_EVENTO_NUTRICAO_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span>{config.emoji}</span>
                    {config.label} ({contagens[key] || 0})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estado vazio */}
      {eventosFiltrados.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              {filtroTipo === 'all' 
                ? 'Nenhum registro no histórico'
                : `Nenhum registro de ${TIPO_EVENTO_NUTRICAO_CONFIG[filtroTipo].label}`
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {Object.keys(eventosAgrupados).length > 0 && (
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {Object.entries(eventosAgrupados).map(([data, eventosData]) => (
              <div key={data}>
                {/* Data */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {format(parseISO(data), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>

                {/* Eventos do dia */}
                <div className="relative ml-4 border-l-2 border-muted pl-4 space-y-3">
                  {eventosData.map((evento) => {
                    const config = TIPO_EVENTO_NUTRICAO_CONFIG[evento.tipo];
                    const isExpanded = expandedIds.has(evento.id);
                    const hasDetails = evento.detalhes && Object.keys(evento.detalhes).length > 0;

                    return (
                      <div key={evento.id} className="relative">
                        {/* Dot na linha */}
                        <div className="absolute -left-[21px] top-2 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                        
                        <Card className="hover:shadow-sm transition-shadow">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                {/* Header */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="gap-1">
                                    {tipoEventoIcons[evento.tipo]}
                                    <span className="text-xs">{config.label}</span>
                                  </Badge>
                                  {evento.status && (
                                    <Badge 
                                      variant={evento.status === 'signed' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {evento.status === 'signed' ? 'Assinado' : 
                                       evento.status === 'draft' ? 'Rascunho' :
                                       evento.status === 'ativo' ? 'Ativo' :
                                       evento.status === 'resolvido' ? 'Resolvido' : evento.status}
                                    </Badge>
                                  )}
                                </div>

                                {/* Título */}
                                <h4 className="font-medium mt-1">{evento.titulo}</h4>

                                {/* Resumo */}
                                {evento.resumo && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {evento.resumo}
                                  </p>
                                )}

                                {/* Metadados */}
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(parseISO(evento.created_at), "HH:mm", { locale: ptBR })}
                                  </div>
                                  {evento.profissional_nome && (
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {evento.profissional_nome}
                                    </div>
                                  )}
                                </div>

                                {/* Detalhes expandidos */}
                                {isExpanded && hasDetails && (
                                  <div className="mt-3 p-2 bg-muted/50 rounded text-sm space-y-1">
                                    {Object.entries(evento.detalhes || {}).slice(0, 6).map(([key, value]) => {
                                      if (!value || key === 'tipo_registro') return null;
                                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                      const displayValue = typeof value === 'object' 
                                        ? JSON.stringify(value).substring(0, 100) 
                                        : String(value).substring(0, 150);
                                      return (
                                        <p key={key} className="text-muted-foreground">
                                          <span className="font-medium">{label}:</span> {displayValue}
                                          {String(value).length > 150 && '...'}
                                        </p>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Botão expandir */}
                              {hasDetails && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpand(evento.id)}
                                  className="shrink-0"
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
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
