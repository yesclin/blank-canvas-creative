/**
 * PILATES - Bloco de Histórico / Linha do Tempo
 * 
 * Consolidação de todos os registros em uma visualização
 * cronológica e somente leitura.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Clock, 
  User,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Activity,
  Dumbbell,
  FileText,
  ShieldAlert,
  Filter,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useHistoricoPilatesData, 
  TIMELINE_TYPES,
  type TimelineItem,
  type TimelineType,
} from '@/hooks/prontuario/pilates/useHistoricoPilatesData';

interface HistoricoPilatesBlockProps {
  patientId: string | null;
  clinicId: string | null;
}

const typeIcons: Record<TimelineType, React.ReactNode> = {
  anamnese_funcional_pilates: <ClipboardList className="h-4 w-4" />,
  avaliacao_funcional_pilates: <Activity className="h-4 w-4" />,
  avaliacao_postural_pilates: <User className="h-4 w-4" />,
  plano_exercicios_pilates: <Dumbbell className="h-4 w-4" />,
  sessao_pilates: <Calendar className="h-4 w-4" />,
  documento_pilates: <FileText className="h-4 w-4" />,
  alerta_funcional_pilates: <ShieldAlert className="h-4 w-4" />,
};

/**
 * Item individual da timeline
 */
function TimelineItemCard({ item }: { item: TimelineItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const typeConfig = TIMELINE_TYPES[item.type];

  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      {/* Linha vertical */}
      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border last:hidden" />
      
      {/* Marcador */}
      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center text-white ${typeConfig?.color || 'bg-muted'}`}>
        {typeIcons[item.type]}
      </div>

      {/* Conteúdo */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{item.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {typeConfig?.label || item.type}
                    </Badge>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    )}
                  </div>
                  {item.subtitle && (
                    <p className="text-sm text-muted-foreground mt-0.5">{item.subtitle}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {item.professional_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.professional_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-1 border-l-4 border-l-primary/30">
            <CardContent className="p-3 text-sm">
              {item.description && (
                <p className="mb-2">{item.description}</p>
              )}
              <TimelineItemDetails item={item} />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/**
 * Detalhes expandidos do item
 */
function TimelineItemDetails({ item }: { item: TimelineItem }) {
  const content = item.content;

  switch (item.type) {
    case 'anamnese_funcional_pilates':
      return (
        <div className="space-y-2">
          {content.queixa_principal && (
            <p><span className="text-muted-foreground">Queixa:</span> {content.queixa_principal as string}</p>
          )}
          {content.historico_dores && (
            <p><span className="text-muted-foreground">Histórico de dores:</span> {content.historico_dores as string}</p>
          )}
          {(content.objetivos_pilates as string[])?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-muted-foreground">Objetivos:</span>
              {(content.objetivos_pilates as string[]).map((obj, i) => (
                <Badge key={i} variant="outline" className="text-xs">{obj}</Badge>
              ))}
            </div>
          )}
        </div>
      );

    case 'avaliacao_funcional_pilates':
      return (
        <div className="space-y-2">
          {content.observacoes_gerais && (
            <p><span className="text-muted-foreground">Observações:</span> {content.observacoes_gerais as string}</p>
          )}
          {content.testes_funcionais && (
            <p className="text-muted-foreground text-xs">
              Testes registrados: {Object.keys(content.testes_funcionais as object).length}
            </p>
          )}
        </div>
      );

    case 'avaliacao_postural_pilates':
      return (
        <div className="space-y-2">
          {(content.desvios_posturais as string[])?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-muted-foreground">Desvios:</span>
              {(content.desvios_posturais as string[]).map((d, i) => (
                <Badge key={i} variant="destructive" className="text-xs">{d}</Badge>
              ))}
            </div>
          )}
          {content.observacoes_gerais && (
            <p><span className="text-muted-foreground">Observações:</span> {content.observacoes_gerais as string}</p>
          )}
        </div>
      );

    case 'plano_exercicios_pilates':
      return (
        <div className="space-y-2">
          {(content.focos_treino as string[])?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-muted-foreground">Focos:</span>
              {(content.focos_treino as string[]).map((f, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
              ))}
            </div>
          )}
          {content.duracao_estimada && (
            <p><span className="text-muted-foreground">Duração:</span> {content.duracao_estimada as string}</p>
          )}
          {content.frequencia_semanal && (
            <p><span className="text-muted-foreground">Frequência:</span> {content.frequencia_semanal as string}</p>
          )}
          {(content.exercicios as unknown[])?.length > 0 && (
            <p className="text-muted-foreground text-xs">
              {(content.exercicios as unknown[]).length} exercício(s) prescritos
            </p>
          )}
        </div>
      );

    case 'sessao_pilates':
      return (
        <div className="space-y-2">
          {content.resposta_geral && (
            <p><span className="text-muted-foreground">Resposta geral:</span> {content.resposta_geral as string}</p>
          )}
          {(content.exercicios_realizados as unknown[])?.length > 0 && (
            <p className="text-muted-foreground text-xs">
              {(content.exercicios_realizados as unknown[]).length} exercício(s) realizado(s)
            </p>
          )}
          {content.observacoes && (
            <p><span className="text-muted-foreground">Observações:</span> {content.observacoes as string}</p>
          )}
          {content.proxima_sessao_foco && (
            <p><span className="text-muted-foreground">Próxima sessão:</span> {content.proxima_sessao_foco as string}</p>
          )}
        </div>
      );

    case 'documento_pilates':
      return (
        <div className="space-y-2">
          <p><span className="text-muted-foreground">Arquivo:</span> {content.file_name as string}</p>
          {content.descricao && (
            <p><span className="text-muted-foreground">Descrição:</span> {content.descricao as string}</p>
          )}
        </div>
      );

    case 'alerta_funcional_pilates':
      return (
        <div className="space-y-2">
          {content.regiao_afetada && (
            <p><span className="text-muted-foreground">Região:</span> {content.regiao_afetada as string}</p>
          )}
          {(content.exercicios_evitar as string[])?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-muted-foreground">Evitar:</span>
              {(content.exercicios_evitar as string[]).map((e, i) => (
                <Badge key={i} variant="destructive" className="text-xs">{e}</Badge>
              ))}
            </div>
          )}
          {content.recomendacoes && (
            <p><span className="text-muted-foreground">Recomendações:</span> {content.recomendacoes as string}</p>
          )}
        </div>
      );

    default:
      return (
        <p className="text-muted-foreground text-xs">
          Dados disponíveis para visualização detalhada no bloco específico.
        </p>
      );
  }
}

/**
 * Card de estatísticas
 */
function StatsCard({ stats }: { stats: { total: number; byType: Record<TimelineType, number> } }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Resumo
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(TIMELINE_TYPES).map(([type, config]) => {
            const count = stats.byType[type as TimelineType] || 0;
            if (count === 0) return null;
            return (
              <div key={type} className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-semibold">{count}</p>
                <p className="text-xs text-muted-foreground">{config.label}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function HistoricoPilatesBlock({
  patientId,
  clinicId,
}: HistoricoPilatesBlockProps) {
  const {
    timeline,
    groupedByMonth,
    stats,
    loading,
  } = useHistoricoPilatesData({ patientId, clinicId });

  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'grouped'>('timeline');

  const filteredTimeline = filterType === 'all'
    ? timeline
    : timeline.filter(item => item.type === filterType);

  const filteredGrouped = filterType === 'all'
    ? groupedByMonth
    : Object.entries(groupedByMonth).reduce((acc, [month, items]) => {
        const filtered = items.filter(item => item.type === filterType);
        if (filtered.length > 0) {
          acc[month] = filtered;
        }
        return acc;
      }, {} as Record<string, TimelineItem[]>);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um aluno para visualizar o histórico.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Histórico / Linha do Tempo</h2>
            <p className="text-sm text-muted-foreground">
              {stats.total} registro(s) no total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os registros</SelectItem>
              {Object.entries(TIMELINE_TYPES).map(([type, config]) => (
                <SelectItem key={type} value={type}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('timeline')}
              className="rounded-r-none"
            >
              Lista
            </Button>
            <Button
              variant={viewMode === 'grouped' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grouped')}
              className="rounded-l-none"
            >
              Por mês
            </Button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {stats.total > 0 && <StatsCard stats={stats} />}

      {/* Conteúdo */}
      {timeline.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum registro encontrado.</p>
          </CardContent>
        </Card>
      ) : filteredTimeline.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Nenhum registro deste tipo.</p>
          </CardContent>
        </Card>
      ) : viewMode === 'timeline' ? (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-0">
            {filteredTimeline.map((item) => (
              <TimelineItemCard key={item.id} item={item} />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-6">
            {Object.entries(filteredGrouped)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([monthYear, items]) => {
                const [year, month] = monthYear.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1);
                const monthLabel = format(date, "MMMM 'de' yyyy", { locale: ptBR });

                return (
                  <div key={monthYear}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 capitalize">
                      {monthLabel} ({items.length})
                    </h3>
                    <div className="space-y-0">
                      {items.map((item) => (
                        <TimelineItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
