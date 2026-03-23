import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ClipboardList,
  Edit3,
  Save,
  X,
  Clock,
  History,
  Plus,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Circle,
  Timer,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Estrutura de um procedimento no plano
 */
export interface ProcedimentoPlanejado {
  id: string;
  procedimento: string;
  dentes_envolvidos: string;
  prioridade: 'alta' | 'media' | 'baixa';
  sessoes_estimadas: number;
  sessoes_realizadas: number;
  status: 'planejado' | 'em_andamento' | 'concluido' | 'cancelado';
  observacoes?: string;
  ordem: number;
}

/**
 * Estrutura de dados do Plano de Tratamento
 */
export interface PlanoTratamentoOdontologicoData {
  id: string;
  patient_id: string;
  version: number;
  // Procedimentos
  procedimentos: ProcedimentoPlanejado[];
  // Observações gerais
  observacoes_gerais: string;
  // Metadata
  created_at: string;
  created_by: string;
  created_by_name?: string;
  is_current: boolean;
}

interface PlanoTratamentoOdontologicoBlockProps {
  currentPlano: PlanoTratamentoOdontologicoData | null;
  planoHistory: PlanoTratamentoOdontologicoData[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onSave: (data: Omit<PlanoTratamentoOdontologicoData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
  onUpdateProcedimentoStatus?: (procedimentoId: string, status: ProcedimentoPlanejado['status'], sessoesRealizadas?: number) => Promise<void>;
}

type FormProcedimento = Omit<ProcedimentoPlanejado, 'id'> & { tempId: string };

type FormDataType = {
  procedimentos: FormProcedimento[];
  observacoes_gerais: string;
};

const PRIORIDADE_CONFIG = {
  alta: { label: 'Alta', icon: ArrowUp, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  media: { label: 'Média', icon: ArrowRight, color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
  baixa: { label: 'Baixa', icon: ArrowDown, color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

const STATUS_CONFIG = {
  planejado: { label: 'Planejado', icon: Circle, variant: 'outline' as const },
  em_andamento: { label: 'Em Andamento', icon: Timer, variant: 'secondary' as const },
  concluido: { label: 'Concluído', icon: CheckCircle2, variant: 'default' as const },
  cancelado: { label: 'Cancelado', icon: X, variant: 'destructive' as const },
};

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getEmptyProcedimento = (): FormProcedimento => ({
  tempId: generateTempId(),
  procedimento: '',
  dentes_envolvidos: '',
  prioridade: 'media',
  sessoes_estimadas: 1,
  sessoes_realizadas: 0,
  status: 'planejado',
  observacoes: '',
  ordem: 0,
});

const getEmptyFormData = (): FormDataType => ({
  procedimentos: [],
  observacoes_gerais: '',
});

/**
 * PLANO DE TRATAMENTO ODONTOLÓGICO
 * 
 * Registra:
 * - Procedimentos planejados
 * - Dentes envolvidos
 * - Prioridade (alta, média, baixa)
 * - Sessões estimadas vs realizadas
 * - Status (planejado, em andamento, concluído)
 * 
 * Este plano guia os atendimentos futuros
 */
export function PlanoTratamentoOdontologicoBlock({
  currentPlano,
  planoHistory,
  loading = false,
  saving = false,
  canEdit = false,
  onSave,
  onUpdateProcedimentoStatus,
}: PlanoTratamentoOdontologicoBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PlanoTratamentoOdontologicoData | null>(null);
  
  const [formData, setFormData] = useState<FormDataType>(getEmptyFormData());

  // Calculate progress
  const calcularProgresso = (procedimentos: ProcedimentoPlanejado[]) => {
    if (!procedimentos || procedimentos.length === 0) return { total: 0, concluidos: 0, percent: 0 };
    const total = procedimentos.length;
    const concluidos = procedimentos.filter(p => p.status === 'concluido').length;
    return { total, concluidos, percent: Math.round((concluidos / total) * 100) };
  };

  const handleStartEdit = () => {
    if (currentPlano) {
      setFormData({
        procedimentos: currentPlano.procedimentos.map((p, idx) => ({
          ...p,
          tempId: p.id || generateTempId(),
          ordem: p.ordem ?? idx,
        })),
        observacoes_gerais: currentPlano.observacoes_gerais || '',
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(getEmptyFormData());
  };

  const handleSave = async () => {
    const procedimentosValidos = formData.procedimentos
      .filter(p => p.procedimento.trim())
      .map((p, idx) => ({
        id: p.tempId.startsWith('temp_') ? '' : p.tempId,
        procedimento: p.procedimento,
        dentes_envolvidos: p.dentes_envolvidos,
        prioridade: p.prioridade,
        sessoes_estimadas: p.sessoes_estimadas,
        sessoes_realizadas: p.sessoes_realizadas,
        status: p.status,
        observacoes: p.observacoes,
        ordem: idx,
      }));

    await onSave({
      procedimentos: procedimentosValidos,
      observacoes_gerais: formData.observacoes_gerais,
    });
    setIsEditing(false);
  };

  const addProcedimento = () => {
    setFormData(prev => ({
      ...prev,
      procedimentos: [...prev.procedimentos, { ...getEmptyProcedimento(), ordem: prev.procedimentos.length }],
    }));
  };

  const removeProcedimento = (tempId: string) => {
    setFormData(prev => ({
      ...prev,
      procedimentos: prev.procedimentos.filter(p => p.tempId !== tempId),
    }));
  };

  const updateProcedimento = <K extends keyof FormProcedimento>(
    tempId: string, 
    field: K, 
    value: FormProcedimento[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      procedimentos: prev.procedimentos.map(p => 
        p.tempId === tempId ? { ...p, [field]: value } : p
      ),
    }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Empty state
  if (!currentPlano && !isEditing) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Nenhum plano de tratamento</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crie um plano de tratamento para guiar os atendimentos.
          </p>
          {canEdit && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Criar Plano
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              {currentPlano ? 'Atualizar Plano' : 'Novo Plano de Tratamento'}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
          {currentPlano && (
            <p className="text-sm text-muted-foreground">
              Uma nova versão será criada. O histórico anterior será preservado.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[550px] pr-4">
            <div className="space-y-6">
              {/* Procedimentos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Procedimentos Planejados
                  </Label>
                  <Button variant="outline" size="sm" onClick={addProcedimento}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                {formData.procedimentos.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <ClipboardList className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Adicione procedimentos ao plano de tratamento
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.procedimentos.map((proc, index) => (
                      <div key={proc.tempId} className="p-4 rounded-lg border space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => removeProcedimento(proc.tempId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Procedimento *</Label>
                          <Input
                            placeholder="Ex: Restauração em resina, Extração, Tratamento de canal..."
                            value={proc.procedimento}
                            onChange={(e) => updateProcedimento(proc.tempId, 'procedimento', e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Dentes Envolvidos</Label>
                            <Input
                              placeholder="Ex: 16, 17, 26"
                              value={proc.dentes_envolvidos}
                              onChange={(e) => updateProcedimento(proc.tempId, 'dentes_envolvidos', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Prioridade</Label>
                            <Select
                              value={proc.prioridade}
                              onValueChange={(v) => updateProcedimento(proc.tempId, 'prioridade', v as FormProcedimento['prioridade'])}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="alta">
                                  <div className="flex items-center gap-2">
                                    <ArrowUp className="h-3 w-3 text-destructive" />
                                    Alta
                                  </div>
                                </SelectItem>
                                <SelectItem value="media">
                                  <div className="flex items-center gap-2">
                                    <ArrowRight className="h-3 w-3 text-amber-600" />
                                    Média
                                  </div>
                                </SelectItem>
                                <SelectItem value="baixa">
                                  <div className="flex items-center gap-2">
                                    <ArrowDown className="h-3 w-3 text-muted-foreground" />
                                    Baixa
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Sessões Estimadas</Label>
                            <Input
                              type="number"
                              min={1}
                              value={proc.sessoes_estimadas}
                              onChange={(e) => updateProcedimento(proc.tempId, 'sessoes_estimadas', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Sessões Realizadas</Label>
                            <Input
                              type="number"
                              min={0}
                              value={proc.sessoes_realizadas}
                              onChange={(e) => updateProcedimento(proc.tempId, 'sessoes_realizadas', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Status</Label>
                            <Select
                              value={proc.status}
                              onValueChange={(v) => updateProcedimento(proc.tempId, 'status', v as FormProcedimento['status'])}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      <config.icon className="h-3 w-3" />
                                      {config.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Observações</Label>
                          <Textarea
                            placeholder="Observações sobre o procedimento..."
                            value={proc.observacoes || ''}
                            onChange={(e) => updateProcedimento(proc.tempId, 'observacoes', e.target.value)}
                            rows={2}
                            className="resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Observações Gerais */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-medium">
                  Observações Gerais do Plano
                </Label>
                <Textarea
                  placeholder="Observações gerais sobre o plano de tratamento, orientações ao paciente..."
                  value={formData.observacoes_gerais}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes_gerais: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // View mode
  const progresso = calcularProgresso(currentPlano?.procedimentos || []);
  const procedimentosPorPrioridade = {
    alta: currentPlano?.procedimentos.filter(p => p.prioridade === 'alta' && p.status !== 'concluido' && p.status !== 'cancelado') || [],
    media: currentPlano?.procedimentos.filter(p => p.prioridade === 'media' && p.status !== 'concluido' && p.status !== 'cancelado') || [],
    baixa: currentPlano?.procedimentos.filter(p => p.prioridade === 'baixa' && p.status !== 'concluido' && p.status !== 'cancelado') || [],
  };

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Plano de Tratamento</h2>
          <Badge variant="outline" className="text-xs">
            Versão {currentPlano?.version || 1}
          </Badge>
        </div>
        <div className="flex gap-2">
          {planoHistory.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-1" />
              Histórico ({planoHistory.length})
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={handleStartEdit}>
              <Edit3 className="h-4 w-4 mr-1" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Last update info */}
      {currentPlano && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Clock className="h-4 w-4" />
          <span>
            Última atualização em{' '}
            {format(parseISO(currentPlano.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {currentPlano.created_by_name && ` por ${currentPlano.created_by_name}`}
          </span>
        </div>
      )}

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso do Tratamento</span>
            <span className="text-sm text-muted-foreground">
              {progresso.concluidos} de {progresso.total} procedimentos
            </span>
          </div>
          <Progress value={progresso.percent} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{progresso.percent}% concluído</span>
            {progresso.percent === 100 && (
              <Badge variant="default" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Tratamento Completo
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Priority alerts */}
      {procedimentosPorPrioridade.alta.length > 0 && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
            <AlertTriangle className="h-4 w-4" />
            Procedimentos de Alta Prioridade Pendentes
          </div>
          <div className="flex flex-wrap gap-2">
            {procedimentosPorPrioridade.alta.map(p => (
              <Badge key={p.id} variant="destructive" className="text-xs">
                {p.procedimento} {p.dentes_envolvidos && `(${p.dentes_envolvidos})`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Procedimentos List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Procedimentos ({currentPlano?.procedimentos.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentPlano?.procedimentos.map((proc) => {
            const prioridadeConfig = PRIORIDADE_CONFIG[proc.prioridade];
            const statusConfig = STATUS_CONFIG[proc.status];
            const StatusIcon = statusConfig.icon;
            const PrioridadeIcon = prioridadeConfig.icon;
            const sessaoProgress = proc.sessoes_estimadas > 0 
              ? Math.round((proc.sessoes_realizadas / proc.sessoes_estimadas) * 100)
              : 0;

            return (
              <div 
                key={proc.id} 
                className={`p-4 rounded-lg border ${proc.status === 'concluido' ? 'bg-muted/30 opacity-75' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{proc.procedimento}</span>
                      <Badge variant={statusConfig.variant} className="text-xs">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-sm">
                      {proc.dentes_envolvidos && (
                        <Badge variant="outline" className="text-xs">
                          Dentes: {proc.dentes_envolvidos}
                        </Badge>
                      )}
                      <Badge variant="outline" className={`text-xs ${prioridadeConfig.color}`}>
                        <PrioridadeIcon className="h-3 w-3 mr-1" />
                        {prioridadeConfig.label}
                      </Badge>
                    </div>

                    {/* Sessions progress */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Sessões: {proc.sessoes_realizadas}/{proc.sessoes_estimadas}</span>
                      <div className="flex-1 max-w-[100px]">
                        <Progress value={sessaoProgress} className="h-1.5" />
                      </div>
                    </div>

                    {proc.observacoes && (
                      <p className="text-sm text-muted-foreground italic">
                        {proc.observacoes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Observações Gerais */}
      {currentPlano?.observacoes_gerais && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Observações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {currentPlano.observacoes_gerais}
            </p>
          </CardContent>
        </Card>
      )}

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico do Plano
            </DialogTitle>
            <DialogDescription>
              Todas as versões do plano de tratamento
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {planoHistory.map((item) => {
                const prog = calcularProgresso(item.procedimentos);
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                      item.is_current ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedVersion(item)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={item.is_current ? "default" : "outline"}>
                          Versão {item.version}
                        </Badge>
                        {item.is_current && (
                          <Badge variant="secondary" className="text-xs">Atual</Badge>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.procedimentos.length} procedimentos • {prog.percent}% concluído
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(parseISO(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Version Detail Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Versão {selectedVersion?.version}
              {selectedVersion?.is_current && (
                <Badge variant="default" className="text-xs">Atual</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Registrada em{' '}
              {selectedVersion && format(parseISO(selectedVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {selectedVersion?.procedimentos.map((proc, idx) => (
                <div key={idx} className="p-3 rounded border bg-muted/20">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{proc.procedimento}</span>
                    <Badge variant={STATUS_CONFIG[proc.status].variant} className="text-xs">
                      {STATUS_CONFIG[proc.status].label}
                    </Badge>
                  </div>
                  {proc.dentes_envolvidos && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Dentes: {proc.dentes_envolvidos}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Sessões: {proc.sessoes_realizadas}/{proc.sessoes_estimadas}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
