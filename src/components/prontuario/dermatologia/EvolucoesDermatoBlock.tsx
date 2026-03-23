import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Edit3,
  Save,
  X,
  Clock,
  Plus,
  FileText,
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Wrench,
  ChevronRight,
  Activity
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

/**
 * Status de evolução do tratamento
 */
export const EVOLUTION_STATUS = [
  { value: 'melhora_significativa', label: 'Melhora Significativa', icon: TrendingUp, color: 'text-emerald-600' },
  { value: 'melhora_parcial', label: 'Melhora Parcial', icon: TrendingUp, color: 'text-emerald-500' },
  { value: 'estavel', label: 'Estável', icon: Minus, color: 'text-amber-500' },
  { value: 'piora_parcial', label: 'Piora Parcial', icon: TrendingDown, color: 'text-orange-500' },
  { value: 'piora_significativa', label: 'Piora Significativa', icon: TrendingDown, color: 'text-destructive' },
] as const;

/**
 * Tipos de efeitos adversos comuns
 */
export const COMMON_ADVERSE_EFFECTS = [
  'Irritação local',
  'Ressecamento',
  'Ardência/Queimação',
  'Eritema',
  'Descamação',
  'Prurido',
  'Fotossensibilidade',
  'Hiperpigmentação',
  'Hipopigmentação',
  'Edema',
  'Dor',
  'Náusea',
  'Cefaleia',
  'Outro',
] as const;

/**
 * Registro de uma evolução clínica
 */
export interface EvolucaoDermatoItem {
  id: string;
  patient_id: string;
  appointment_id?: string;
  data_evolucao: string;
  status_evolucao: string;
  resposta_tratamento: string;
  efeitos_adversos?: string[];
  efeitos_adversos_detalhes?: string;
  ajustes_realizados?: string;
  observacoes?: string;
  proximos_passos?: string;
  created_at: string;
  created_by: string;
  created_by_name?: string;
}

interface EvolucoesDermatoBlockProps {
  evolucoes: EvolucaoDermatoItem[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onAdd: (data: Omit<EvolucaoDermatoItem, 'id' | 'patient_id' | 'created_at' | 'created_by' | 'created_by_name'>) => Promise<void>;
}

const getStatusConfig = (value: string) => {
  return EVOLUTION_STATUS.find(s => s.value === value) || null;
};

/**
 * EVOLUÇÕES CLÍNICAS - Bloco para Dermatologia
 * 
 * Registra a evolução do tratamento:
 * - Data da avaliação
 * - Status: melhora, estabilidade ou piora
 * - Resposta ao tratamento
 * - Efeitos adversos
 * - Ajustes realizados
 * - Próximos passos
 */
export function EvolucoesDermatoBlock({
  evolucoes,
  loading = false,
  saving = false,
  canEdit = false,
  onAdd,
}: EvolucoesDermatoBlockProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedEvolucao, setSelectedEvolucao] = useState<EvolucaoDermatoItem | null>(null);
  
  // Form state
  const [dataEvolucao, setDataEvolucao] = useState<Date>(new Date());
  const [statusEvolucao, setStatusEvolucao] = useState('');
  const [respostaTratamento, setRespostaTratamento] = useState('');
  const [efeitosAdversos, setEfeitosAdversos] = useState<string[]>([]);
  const [efeitosAdversosDetalhes, setEfeitosAdversosDetalhes] = useState('');
  const [ajustesRealizados, setAjustesRealizados] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [proximosPassos, setProximosPassos] = useState('');

  const handleStartAdd = () => {
    setDataEvolucao(new Date());
    setStatusEvolucao('');
    setRespostaTratamento('');
    setEfeitosAdversos([]);
    setEfeitosAdversosDetalhes('');
    setAjustesRealizados('');
    setObservacoes('');
    setProximosPassos('');
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!statusEvolucao || !respostaTratamento.trim()) return;
    
    await onAdd({
      data_evolucao: format(dataEvolucao, 'yyyy-MM-dd'),
      status_evolucao: statusEvolucao,
      resposta_tratamento: respostaTratamento.trim(),
      efeitos_adversos: efeitosAdversos.length > 0 ? efeitosAdversos : undefined,
      efeitos_adversos_detalhes: efeitosAdversosDetalhes.trim() || undefined,
      ajustes_realizados: ajustesRealizados.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
      proximos_passos: proximosPassos.trim() || undefined,
    });
    setIsAdding(false);
  };

  const toggleEfeitoAdverso = (efeito: string) => {
    setEfeitosAdversos(prev => 
      prev.includes(efeito) 
        ? prev.filter(e => e !== efeito)
        : [...prev, efeito]
    );
  };

  // Sort by date descending
  const sortedEvolucoes = [...evolucoes].sort((a, b) => 
    new Date(b.data_evolucao).getTime() - new Date(a.data_evolucao).getTime()
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Evoluções Clínicas</h2>
          {evolucoes.length > 0 && (
            <Badge variant="secondary">{evolucoes.length}</Badge>
          )}
        </div>
        {canEdit && !isAdding && (
          <Button size="sm" onClick={handleStartAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Evolução
          </Button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Registrar Evolução
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={saving || !statusEvolucao || !respostaTratamento.trim()}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-5">
                {/* Data */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-3 w-3" />
                    Data da Avaliação
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full md:w-[280px] justify-start text-left font-normal",
                          !dataEvolucao && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataEvolucao 
                          ? format(dataEvolucao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          : "Selecione"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataEvolucao}
                        onSelect={(d) => d && setDataEvolucao(d)}
                        locale={ptBR}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Status de Evolução */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Status da Evolução *</Label>
                  <RadioGroup
                    value={statusEvolucao}
                    onValueChange={setStatusEvolucao}
                    className="grid grid-cols-1 md:grid-cols-2 gap-2"
                  >
                    {EVOLUTION_STATUS.map((status) => {
                      const Icon = status.icon;
                      return (
                        <div key={status.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={status.value} id={status.value} />
                          <Label 
                            htmlFor={status.value} 
                            className={cn("flex items-center gap-2 cursor-pointer", status.color)}
                          >
                            <Icon className="h-4 w-4" />
                            {status.label}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>

                {/* Resposta ao Tratamento */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <FileText className="h-3 w-3" />
                    Resposta ao Tratamento *
                  </Label>
                  <Textarea
                    placeholder="Descreva a resposta clínica às medidas terapêuticas implementadas..."
                    value={respostaTratamento}
                    onChange={(e) => setRespostaTratamento(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Efeitos Adversos */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-3 w-3" />
                    Efeitos Adversos
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ADVERSE_EFFECTS.map(efeito => (
                      <Badge
                        key={efeito}
                        variant={efeitosAdversos.includes(efeito) ? 'destructive' : 'outline'}
                        className="cursor-pointer transition-colors"
                        onClick={() => toggleEfeitoAdverso(efeito)}
                      >
                        {efeito}
                      </Badge>
                    ))}
                  </div>
                  {efeitosAdversos.length > 0 && (
                    <Textarea
                      placeholder="Detalhe os efeitos adversos observados..."
                      value={efeitosAdversosDetalhes}
                      onChange={(e) => setEfeitosAdversosDetalhes(e.target.value)}
                      rows={2}
                    />
                  )}
                </div>

                {/* Ajustes Realizados */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Wrench className="h-3 w-3" />
                    Ajustes Realizados
                  </Label>
                  <Textarea
                    placeholder="Alterações no tratamento: mudanças de medicação, doses, frequência..."
                    value={ajustesRealizados}
                    onChange={(e) => setAjustesRealizados(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <Label className="text-sm">Observações Adicionais</Label>
                  <Textarea
                    placeholder="Outras observações relevantes..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Próximos Passos */}
                <div className="space-y-2">
                  <Label className="text-sm">Próximos Passos / Conduta</Label>
                  <Textarea
                    placeholder="Plano para as próximas consultas, exames solicitados, retorno..."
                    value={proximosPassos}
                    onChange={(e) => setProximosPassos(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {evolucoes.length === 0 && !isAdding && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhuma evolução registrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Registre a evolução clínica e resposta ao tratamento.
            </p>
            {canEdit && (
              <Button onClick={handleStartAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Evolução
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de evoluções */}
      {sortedEvolucoes.length > 0 && (
        <div className="space-y-3">
          {sortedEvolucoes.map((evo) => {
            const statusConfig = getStatusConfig(evo.status_evolucao);
            const StatusIcon = statusConfig?.icon || Minus;
            
            return (
              <Card 
                key={evo.id} 
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setSelectedEvolucao(evo)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="font-normal">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {format(parseISO(evo.data_evolucao), "dd/MM/yyyy", { locale: ptBR })}
                        </Badge>
                        {statusConfig && (
                          <Badge 
                            variant={evo.status_evolucao.includes('piora') ? 'destructive' : 'secondary'}
                            className="flex items-center gap-1"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm line-clamp-2">
                        {evo.resposta_tratamento}
                      </p>

                      {evo.efeitos_adversos && evo.efeitos_adversos.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{evo.efeitos_adversos.length} efeito(s) adverso(s)</span>
                        </div>
                      )}

                      {evo.ajustes_realizados && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Wrench className="h-3 w-3" />
                          <span>Ajustes no tratamento</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(parseISO(evo.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {evo.created_by_name && ` por ${evo.created_by_name}`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedEvolucao} onOpenChange={() => setSelectedEvolucao(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Evolução Clínica
            </DialogTitle>
            <DialogDescription>
              {selectedEvolucao && format(parseISO(selectedEvolucao.data_evolucao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedEvolucao && (
              <div className="space-y-4">
                {/* Status */}
                {getStatusConfig(selectedEvolucao.status_evolucao) && (
                  <div className="flex items-center gap-2">
                    {(() => {
                      const config = getStatusConfig(selectedEvolucao.status_evolucao)!;
                      const Icon = config.icon;
                      return (
                        <Badge 
                          variant={selectedEvolucao.status_evolucao.includes('piora') ? 'destructive' : 'default'}
                          className="text-sm"
                        >
                          <Icon className="h-4 w-4 mr-1" />
                          {config.label}
                        </Badge>
                      );
                    })()}
                  </div>
                )}

                {/* Resposta ao Tratamento */}
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Resposta ao Tratamento</span>
                  <p className="mt-1 whitespace-pre-wrap">{selectedEvolucao.resposta_tratamento}</p>
                </div>

                {/* Efeitos Adversos */}
                {selectedEvolucao.efeitos_adversos && selectedEvolucao.efeitos_adversos.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Efeitos Adversos
                    </span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedEvolucao.efeitos_adversos.map((ef, i) => (
                        <Badge key={i} variant="destructive" className="text-xs">
                          {ef}
                        </Badge>
                      ))}
                    </div>
                    {selectedEvolucao.efeitos_adversos_detalhes && (
                      <p className="text-sm mt-2 text-muted-foreground">
                        {selectedEvolucao.efeitos_adversos_detalhes}
                      </p>
                    )}
                  </div>
                )}

                {/* Ajustes */}
                {selectedEvolucao.ajustes_realizados && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Wrench className="h-3 w-3" />
                      Ajustes Realizados
                    </span>
                    <p className="mt-1 whitespace-pre-wrap">{selectedEvolucao.ajustes_realizados}</p>
                  </div>
                )}

                {/* Observações */}
                {selectedEvolucao.observacoes && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Observações</span>
                    <p className="mt-1 whitespace-pre-wrap">{selectedEvolucao.observacoes}</p>
                  </div>
                )}

                {/* Próximos Passos */}
                {selectedEvolucao.proximos_passos && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Próximos Passos</span>
                    <p className="mt-1 whitespace-pre-wrap">{selectedEvolucao.proximos_passos}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t text-xs text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Registrado em {format(parseISO(selectedEvolucao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {selectedEvolucao.created_by_name && ` por ${selectedEvolucao.created_by_name}`}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EvolucoesDermatoBlock;
