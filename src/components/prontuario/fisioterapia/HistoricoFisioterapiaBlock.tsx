/**
 * FISIOTERAPIA - Bloco de Histórico / Linha do Tempo
 * 
 * Consolida todos os registros clínicos do paciente em uma
 * visualização cronológica somente leitura.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  History,
  Search,
  Filter,
  User,
  Calendar,
  ChevronDown,
  FileText,
  Activity,
  ClipboardList,
  Dumbbell,
  AlertTriangle,
  Stethoscope,
  Target,
  File,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useHistoricoFisioterapiaData,
  getHistoricoTypeLabel,
  type HistoricoEntry,
  type HistoricoEntryType,
} from '@/hooks/prontuario/fisioterapia/useHistoricoFisioterapiaData';

interface HistoricoFisioterapiaBlockProps {
  patientId: string | null;
  clinicId: string | null;
}

const TYPE_ICONS: Record<HistoricoEntryType, React.ReactNode> = {
  anamnese: <FileText className="h-4 w-4" />,
  avaliacao_funcional: <Activity className="h-4 w-4" />,
  avaliacao_dor: <Stethoscope className="h-4 w-4" />,
  diagnostico_funcional: <ClipboardList className="h-4 w-4" />,
  plano_terapeutico: <Target className="h-4 w-4" />,
  sessao: <Activity className="h-4 w-4" />,
  exercicios_prescritos: <Dumbbell className="h-4 w-4" />,
  documento: <File className="h-4 w-4" />,
  alerta: <AlertTriangle className="h-4 w-4" />,
};

const TYPE_COLORS: Record<HistoricoEntryType, string> = {
  anamnese: 'bg-blue-100 text-blue-700 border-blue-200',
  avaliacao_funcional: 'bg-purple-100 text-purple-700 border-purple-200',
  avaliacao_dor: 'bg-red-100 text-red-700 border-red-200',
  diagnostico_funcional: 'bg-amber-100 text-amber-700 border-amber-200',
  plano_terapeutico: 'bg-green-100 text-green-700 border-green-200',
  sessao: 'bg-primary/10 text-primary border-primary/20',
  exercicios_prescritos: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  documento: 'bg-gray-100 text-gray-700 border-gray-200',
  alerta: 'bg-destructive/10 text-destructive border-destructive/20',
};

function TimelineEntry({ entry }: { entry: HistoricoEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex gap-3">
      {/* Linha da timeline */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${TYPE_COLORS[entry.type]}`}>
          {TYPE_ICONS[entry.type]}
        </div>
        <div className="w-0.5 flex-1 bg-border mt-2" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 pb-6">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium">{entry.title}</h4>
                <Badge variant="outline" className={`text-xs ${TYPE_COLORS[entry.type]}`}>
                  {getHistoricoTypeLabel(entry.type)}
                </Badge>
              </div>
              {entry.subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {entry.subtitle}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(parseISO(entry.date), "HH:mm", { locale: ptBR })}
                </span>
                {entry.professional_name && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {entry.professional_name}
                  </span>
                )}
              </div>
            </div>
            {entry.description && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            )}
          </div>
          {entry.description && (
            <CollapsibleContent>
              <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                {entry.description}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    </div>
  );
}

export function HistoricoFisioterapiaBlock({
  patientId,
  clinicId,
}: HistoricoFisioterapiaBlockProps) {
  const { entries, groupedByDate, stats, loading } = useHistoricoFisioterapiaData({
    patientId,
    clinicId,
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filtrar entradas
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = search === '' ||
        entry.title.toLowerCase().includes(search.toLowerCase()) ||
        entry.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
        entry.description?.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === 'all' || entry.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [entries, search, typeFilter]);

  // Re-agrupar após filtro
  const filteredGrouped = useMemo(() => {
    return filteredEntries.reduce((acc, entry) => {
      const dateKey = entry.date.split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(entry);
      return acc;
    }, {} as Record<string, HistoricoEntry[]>);
  }, [filteredEntries]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um paciente para visualizar o histórico.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Histórico / Linha do Tempo</h2>
            <p className="text-sm text-muted-foreground">
              {stats.total} registro(s) • {stats.sessoes} sessões
            </p>
          </div>
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

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="anamnese">Anamneses</SelectItem>
            <SelectItem value="avaliacao_funcional">Avaliações Funcionais</SelectItem>
            <SelectItem value="avaliacao_dor">Avaliações de Dor</SelectItem>
            <SelectItem value="diagnostico_funcional">Diagnósticos</SelectItem>
            <SelectItem value="plano_terapeutico">Planos Terapêuticos</SelectItem>
            <SelectItem value="sessao">Sessões</SelectItem>
            <SelectItem value="exercicios_prescritos">Exercícios</SelectItem>
            <SelectItem value="documento">Documentos</SelectItem>
            <SelectItem value="alerta">Alertas</SelectItem>
          </SelectContent>
        </Select>

        {/* Chips de estatísticas */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{stats.sessoes} sessões</Badge>
          <Badge variant="secondary">{stats.avaliacoes} avaliações</Badge>
          <Badge variant="secondary">{stats.documentos} documentos</Badge>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {Object.keys(filteredGrouped).length > 0 ? (
              Object.entries(filteredGrouped)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, dateEntries]) => (
                  <div key={date}>
                    <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-4 py-2 border-b z-10">
                      <h3 className="font-medium text-sm">
                        {format(parseISO(date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </h3>
                    </div>
                    <div className="p-4">
                      {dateEntries.map((entry) => (
                        <TimelineEntry key={entry.id} entry={entry} />
                      ))}
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum registro encontrado</p>
                {(search || typeFilter !== 'all') && (
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => {
                      setSearch('');
                      setTypeFilter('all');
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
