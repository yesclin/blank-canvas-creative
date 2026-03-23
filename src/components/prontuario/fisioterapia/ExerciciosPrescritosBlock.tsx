/**
 * FISIOTERAPIA - Bloco de Exercícios Prescritos
 * 
 * Permite prescrição de exercícios com séries, repetições,
 * frequência e orientações domiciliares.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Dumbbell, 
  Plus, 
  User,
  Calendar,
  ChevronDown,
  ChevronRight,
  X,
  Repeat,
  Clock,
  AlertTriangle,
  Home,
  History,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useExerciciosPrescritosData, 
  getEmptyPrescricaoForm,
  getEmptyExercicio,
  FREQUENCIA_EXERCICIO_OPTIONS,
  STATUS_EXERCICIO_OPTIONS,
  type PrescricaoFormData,
  type ExercicioFormItem,
  type PrescricaoExerciciosData
} from '@/hooks/prontuario/fisioterapia/useExerciciosPrescritosData';

interface ExerciciosPrescritosBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
}

/**
 * Card de um exercício no formulário
 */
function ExercicioFormCard({
  exercicio,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  exercicio: ExercicioFormItem;
  index: number;
  onChange: (updated: ExercicioFormItem) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const handleChange = (field: keyof ExercicioFormItem, value: string) => {
    onChange({ ...exercicio, [field]: value });
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Exercício {index + 1}
          </CardTitle>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nome do exercício */}
        <div className="space-y-2">
          <Label htmlFor={`nome-${index}`}>Nome do Exercício *</Label>
          <Input
            id={`nome-${index}`}
            placeholder="Ex: Alongamento de isquiotibiais"
            value={exercicio.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {/* Séries */}
          <div className="space-y-2">
            <Label htmlFor={`series-${index}`}>Séries</Label>
            <Input
              id={`series-${index}`}
              type="number"
              min={1}
              placeholder="3"
              value={exercicio.series}
              onChange={(e) => handleChange('series', e.target.value)}
            />
          </div>

          {/* Repetições */}
          <div className="space-y-2">
            <Label htmlFor={`repeticoes-${index}`}>Repetições</Label>
            <Input
              id={`repeticoes-${index}`}
              placeholder="10-12"
              value={exercicio.repeticoes}
              onChange={(e) => handleChange('repeticoes', e.target.value)}
            />
          </div>

          {/* Carga */}
          <div className="space-y-2">
            <Label htmlFor={`carga-${index}`}>Carga</Label>
            <Input
              id={`carga-${index}`}
              placeholder="2kg ou leve"
              value={exercicio.carga}
              onChange={(e) => handleChange('carga', e.target.value)}
            />
          </div>

          {/* Frequência */}
          <div className="space-y-2">
            <Label htmlFor={`frequencia-${index}`}>Frequência</Label>
            <Select
              value={exercicio.frequencia}
              onValueChange={(value) => handleChange('frequencia', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIA_EXERCICIO_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orientações */}
        <div className="space-y-2">
          <Label htmlFor={`orientacoes-${index}`}>Orientações</Label>
          <Textarea
            id={`orientacoes-${index}`}
            placeholder="Como executar o exercício..."
            value={exercicio.orientacoes}
            onChange={(e) => handleChange('orientacoes', e.target.value)}
            rows={2}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor={`status-${index}`}>Status</Label>
            <Select
              value={exercicio.status}
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {STATUS_EXERCICIO_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor={`observacoes-${index}`}>Observações</Label>
            <Input
              id={`observacoes-${index}`}
              placeholder="Notas adicionais..."
              value={exercicio.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Formulário de Prescrição
 */
function PrescricaoForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialData: PrescricaoFormData;
  onSubmit: (data: PrescricaoFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<PrescricaoFormData>(initialData);

  const handleExercicioChange = (index: number, updated: ExercicioFormItem) => {
    const newExercicios = [...formData.exercicios];
    newExercicios[index] = updated;
    setFormData(prev => ({ ...prev, exercicios: newExercicios }));
  };

  const handleAddExercicio = () => {
    setFormData(prev => ({
      ...prev,
      exercicios: [...prev.exercicios, getEmptyExercicio()],
    }));
  };

  const handleRemoveExercicio = (index: number) => {
    if (formData.exercicios.length > 1) {
      setFormData(prev => ({
        ...prev,
        exercicios: prev.exercicios.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasValidExercicio = formData.exercicios.some(e => e.nome.trim());
    if (!hasValidExercicio) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ScrollArea className="max-h-[50vh]">
        <div className="space-y-4 pr-4">
          {formData.exercicios.map((exercicio, index) => (
            <ExercicioFormCard
              key={exercicio.id}
              exercicio={exercicio}
              index={index}
              onChange={(updated) => handleExercicioChange(index, updated)}
              onRemove={() => handleRemoveExercicio(index)}
              canRemove={formData.exercicios.length > 1}
            />
          ))}
        </div>
      </ScrollArea>

      <Button type="button" variant="outline" onClick={handleAddExercicio}>
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Exercício
      </Button>

      <Separator />

      {/* Orientações Gerais */}
      <div className="space-y-2">
        <Label htmlFor="orientacoes_gerais" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Orientações Gerais para Casa
        </Label>
        <Textarea
          id="orientacoes_gerais"
          placeholder="Orientações gerais sobre a prática dos exercícios em casa..."
          value={formData.orientacoes_gerais}
          onChange={(e) => setFormData(prev => ({ ...prev, orientacoes_gerais: e.target.value }))}
          rows={3}
        />
      </div>

      {/* Precauções */}
      <div className="space-y-2">
        <Label htmlFor="precaucoes" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Precauções e Contraindicações
        </Label>
        <Textarea
          id="precaucoes"
          placeholder="Movimentos a evitar, sinais de alerta..."
          value={formData.precaucoes}
          onChange={(e) => setFormData(prev => ({ ...prev, precaucoes: e.target.value }))}
          rows={2}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Prescrição'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Retorna configuração do status
 */
function getStatusConfig(status: string) {
  switch (status) {
    case 'ativo':
      return { variant: 'default' as const, label: 'Ativo' };
    case 'pausado':
      return { variant: 'secondary' as const, label: 'Pausado' };
    case 'concluido':
      return { variant: 'outline' as const, label: 'Concluído' };
    case 'cancelado':
      return { variant: 'destructive' as const, label: 'Cancelado' };
    default:
      return { variant: 'outline' as const, label: status };
  }
}

/**
 * Card de visualização de uma prescrição
 */
function PrescricaoCard({
  prescricao,
  isLatest,
  defaultOpen = false,
}: {
  prescricao: PrescricaoExerciciosData;
  isLatest: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const exerciciosAtivos = prescricao.exercicios.filter(e => e.status === 'ativo');

  const getFrequenciaLabel = (value: string) => {
    return FREQUENCIA_EXERCICIO_OPTIONS.find(o => o.value === value)?.label || value;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={isLatest ? 'border-primary/50' : ''}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(prescricao.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    {isLatest && (
                      <Badge variant="default" className="text-xs">Atual</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-3 mt-1">
                    {prescricao.professional_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {prescricao.professional_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Dumbbell className="h-3 w-3" />
                      {exerciciosAtivos.length} exercício(s) ativo(s)
                    </span>
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Lista de Exercícios */}
            <Accordion type="multiple" className="w-full">
              {prescricao.exercicios.map((exercicio, index) => {
                const statusConfig = getStatusConfig(exercicio.status);
                return (
                  <AccordionItem key={exercicio.id} value={exercicio.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <span className="font-medium">{exercicio.nome}</span>
                        <Badge variant={statusConfig.variant} className="text-xs">
                          {statusConfig.label}
                        </Badge>
                        {exercicio.series && exercicio.repeticoes && (
                          <span className="text-sm text-muted-foreground">
                            {exercicio.series}x{exercicio.repeticoes}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-3 md:grid-cols-2 pl-4">
                        {exercicio.series && (
                          <div className="flex items-center gap-2 text-sm">
                            <Repeat className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Séries:</span>
                            <span>{exercicio.series}</span>
                          </div>
                        )}
                        {exercicio.repeticoes && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Repetições:</span>
                            <span>{exercicio.repeticoes}</span>
                          </div>
                        )}
                        {exercicio.carga && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Carga:</span>
                            <span>{exercicio.carga}</span>
                          </div>
                        )}
                        {exercicio.frequencia && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Frequência:</span>
                            <span>{getFrequenciaLabel(exercicio.frequencia)}</span>
                          </div>
                        )}
                        {exercicio.orientacoes && (
                          <div className="md:col-span-2 text-sm">
                            <span className="text-muted-foreground">Orientações: </span>
                            <span>{exercicio.orientacoes}</span>
                          </div>
                        )}
                        {exercicio.observacoes && (
                          <div className="md:col-span-2 text-sm text-muted-foreground">
                            <span>Obs: {exercicio.observacoes}</span>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {/* Orientações Gerais */}
            {prescricao.orientacoes_gerais && (
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Orientações para Casa
                </p>
                <p className="text-sm whitespace-pre-wrap">{prescricao.orientacoes_gerais}</p>
              </div>
            )}

            {/* Precauções */}
            {prescricao.precaucoes && (
              <div className="space-y-1 p-3 bg-destructive/10 rounded-lg">
                <p className="text-sm font-medium flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Precauções
                </p>
                <p className="text-sm">{prescricao.precaucoes}</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function ExerciciosPrescritosBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
}: ExerciciosPrescritosBlockProps) {
  const {
    prescricoes,
    prescricaoAtual,
    exerciciosAtivos,
    loading,
    isFormOpen,
    setIsFormOpen,
    savePrescricao,
    isSaving,
  } = useExerciciosPrescritosData({ patientId, clinicId, professionalId });

  const [showHistory, setShowHistory] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um paciente para visualizar os exercícios.</p>
        </CardContent>
      </Card>
    );
  }

  const getInitialFormData = (): PrescricaoFormData => {
    if (prescricaoAtual) {
      return {
        exercicios: prescricaoAtual.exercicios.map(e => ({
          id: crypto.randomUUID(),
          nome: e.nome,
          series: e.series?.toString() || '',
          repeticoes: e.repeticoes || '',
          carga: e.carga || '',
          frequencia: e.frequencia,
          orientacoes: e.orientacoes || '',
          observacoes: e.observacoes || '',
          status: e.status,
        })),
        orientacoes_gerais: prescricaoAtual.orientacoes_gerais || '',
        precaucoes: prescricaoAtual.precaucoes || '',
      };
    }
    return getEmptyPrescricaoForm();
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Exercícios Prescritos</h2>
            <p className="text-sm text-muted-foreground">
              {exerciciosAtivos.length > 0 
                ? `${exerciciosAtivos.length} exercício(s) ativo(s)` 
                : 'Nenhum exercício prescrito'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {prescricoes.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              {showHistory ? 'Ocultar Histórico' : 'Ver Histórico'}
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {prescricaoAtual ? 'Atualizar' : 'Prescrever'}
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      {prescricoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum exercício prescrito.</p>
            {canEdit && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Prescrever Exercícios
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3">
            {showHistory ? (
              prescricoes.map((prescricao, index) => (
                <PrescricaoCard
                  key={prescricao.id}
                  prescricao={prescricao}
                  isLatest={index === 0}
                  defaultOpen={index === 0}
                />
              ))
            ) : (
              prescricaoAtual && (
                <PrescricaoCard
                  prescricao={prescricaoAtual}
                  isLatest={true}
                  defaultOpen={true}
                />
              )
            )}
          </div>
        </ScrollArea>
      )}

      {/* Dialog do Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {prescricaoAtual ? 'Atualizar Exercícios' : 'Prescrever Exercícios'}
            </DialogTitle>
            <DialogDescription>
              Defina os exercícios, séries, repetições e orientações para o paciente.
            </DialogDescription>
          </DialogHeader>
          <PrescricaoForm
            initialData={getInitialFormData()}
            onSubmit={savePrescricao}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSaving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
