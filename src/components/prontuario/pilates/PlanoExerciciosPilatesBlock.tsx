/**
 * PILATES - Bloco de Plano de Exercícios
 * 
 * Permite registro de planos de exercícios com versionamento.
 * Cada atualização cria nova versão, mantendo histórico completo.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dumbbell, 
  Plus, 
  Edit, 
  History, 
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  Target,
  Trash2,
  Clock,
  CalendarDays
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  usePlanoExerciciosPilatesData, 
  getEmptyPlanoExerciciosForm,
  createEmptyExercicio,
  APARELHOS_PILATES,
  FOCOS_TREINO,
  EXERCICIOS_PILATES,
  type PlanoExerciciosPilatesFormData,
  type PlanoExerciciosPilatesData,
  type ExercicioPrescrito,
} from '@/hooks/prontuario/pilates/usePlanoExerciciosPilatesData';

interface PlanoExerciciosPilatesBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
}

/**
 * Componente de exercício individual no formulário
 */
function ExercicioFormItem({
  exercicio,
  index,
  onChange,
  onRemove,
}: {
  exercicio: ExercicioPrescrito;
  index: number;
  onChange: (updated: ExercicioPrescrito) => void;
  onRemove: () => void;
}) {
  const exerciciosDoAparelho = EXERCICIOS_PILATES.filter(
    e => e.aparelho === exercicio.aparelho || exercicio.aparelho === 'acessorios'
  );

  return (
    <div className="p-4 border rounded-lg space-y-3 bg-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Exercício {index + 1}</span>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Aparelho */}
        <div className="space-y-1">
          <Label className="text-xs">Aparelho</Label>
          <Select
            value={exercicio.aparelho}
            onValueChange={(value) => onChange({ ...exercicio, aparelho: value, exercicio: '' })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APARELHOS_PILATES.map((ap) => (
                <SelectItem key={ap.value} value={ap.value}>
                  {ap.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Exercício */}
        <div className="space-y-1">
          <Label className="text-xs">Exercício</Label>
          <Select
            value={exercicio.exercicio}
            onValueChange={(value) => onChange({ ...exercicio, exercicio: value })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">-- Outro (digitar) --</SelectItem>
              {exerciciosDoAparelho.map((ex) => (
                <SelectItem key={ex.value} value={ex.value}>
                  {ex.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Nome customizado */}
      {exercicio.exercicio === 'custom' && (
        <div className="space-y-1">
          <Label className="text-xs">Nome do Exercício</Label>
          <Input
            value={exercicio.exercicio_custom || ''}
            onChange={(e) => onChange({ ...exercicio, exercicio_custom: e.target.value })}
            placeholder="Digite o nome do exercício..."
          />
        </div>
      )}

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {/* Séries */}
        <div className="space-y-1">
          <Label className="text-xs">Séries</Label>
          <Input
            type="number"
            min={1}
            value={exercicio.series}
            onChange={(e) => onChange({ ...exercicio, series: parseInt(e.target.value) || 1 })}
            className="h-9"
          />
        </div>

        {/* Repetições */}
        <div className="space-y-1">
          <Label className="text-xs">Repetições</Label>
          <Input
            value={exercicio.repeticoes}
            onChange={(e) => onChange({ ...exercicio, repeticoes: e.target.value })}
            placeholder="10 ou 8-12"
            className="h-9"
          />
        </div>

        {/* Carga/Mola */}
        <div className="space-y-1">
          <Label className="text-xs">Mola/Carga</Label>
          <Input
            value={exercicio.mola || ''}
            onChange={(e) => onChange({ ...exercicio, mola: e.target.value })}
            placeholder="Ex: 2 vermelhas"
            className="h-9"
          />
        </div>

        {/* Carga adicional */}
        <div className="space-y-1">
          <Label className="text-xs">Carga Extra</Label>
          <Input
            value={exercicio.carga || ''}
            onChange={(e) => onChange({ ...exercicio, carga: e.target.value })}
            placeholder="Ex: 2kg"
            className="h-9"
          />
        </div>
      </div>

      {/* Observações do exercício */}
      <div className="space-y-1">
        <Label className="text-xs">Observações</Label>
        <Input
          value={exercicio.observacoes || ''}
          onChange={(e) => onChange({ ...exercicio, observacoes: e.target.value })}
          placeholder="Observações específicas deste exercício..."
        />
      </div>
    </div>
  );
}

/**
 * Formulário do Plano de Exercícios
 */
function PlanoForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialData: PlanoExerciciosPilatesFormData;
  onSubmit: (data: PlanoExerciciosPilatesFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<PlanoExerciciosPilatesFormData>(initialData);

  const handleChange = (field: keyof PlanoExerciciosPilatesFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFocoToggle = (foco: string) => {
    const current = formData.focos_treino;
    if (current.includes(foco)) {
      handleChange('focos_treino', current.filter(f => f !== foco));
    } else {
      handleChange('focos_treino', [...current, foco]);
    }
  };

  const handleExercicioChange = (index: number, updated: ExercicioPrescrito) => {
    const newExercicios = [...formData.exercicios];
    newExercicios[index] = updated;
    handleChange('exercicios', newExercicios);
  };

  const handleAddExercicio = () => {
    handleChange('exercicios', [...formData.exercicios, createEmptyExercicio()]);
  };

  const handleRemoveExercicio = (index: number) => {
    handleChange('exercicios', formData.exercicios.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título do Plano */}
      <div className="space-y-2">
        <Label htmlFor="titulo">Título do Plano</Label>
        <Input
          id="titulo"
          value={formData.titulo}
          onChange={(e) => handleChange('titulo', e.target.value)}
          placeholder="Ex: Plano Inicial, Fase 2 - Fortalecimento..."
        />
      </div>

      {/* Focos do Treino */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Focos do Treino
        </Label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {FOCOS_TREINO.map((foco) => (
            <div key={foco.value} className="flex items-center space-x-2">
              <Checkbox
                id={`foco-${foco.value}`}
                checked={formData.focos_treino.includes(foco.value)}
                onCheckedChange={() => handleFocoToggle(foco.value)}
              />
              <label
                htmlFor={`foco-${foco.value}`}
                className="text-sm leading-none cursor-pointer"
              >
                {foco.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Duração Estimada */}
        <div className="space-y-2">
          <Label htmlFor="duracao_estimada" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Duração Estimada
          </Label>
          <Input
            id="duracao_estimada"
            value={formData.duracao_estimada}
            onChange={(e) => handleChange('duracao_estimada', e.target.value)}
            placeholder="Ex: 50 minutos"
          />
        </div>

        {/* Frequência Semanal */}
        <div className="space-y-2">
          <Label htmlFor="frequencia_semanal" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Frequência Semanal
          </Label>
          <Input
            id="frequencia_semanal"
            value={formData.frequencia_semanal}
            onChange={(e) => handleChange('frequencia_semanal', e.target.value)}
            placeholder="Ex: 2x por semana"
          />
        </div>
      </div>

      {/* Lista de Exercícios */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Exercícios Prescritos ({formData.exercicios.length})
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddExercicio}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>

        {formData.exercicios.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Nenhum exercício adicionado</p>
            <Button type="button" variant="ghost" size="sm" onClick={handleAddExercicio} className="mt-2">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Exercício
            </Button>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3 pr-2">
              {formData.exercicios.map((ex, index) => (
                <ExercicioFormItem
                  key={ex.id}
                  exercicio={ex}
                  index={index}
                  onChange={(updated) => handleExercicioChange(index, updated)}
                  onRemove={() => handleRemoveExercicio(index)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Observações Gerais */}
      <div className="space-y-2">
        <Label htmlFor="observacoes_gerais">Observações do Instrutor</Label>
        <Textarea
          id="observacoes_gerais"
          value={formData.observacoes_gerais}
          onChange={(e) => handleChange('observacoes_gerais', e.target.value)}
          placeholder="Observações gerais sobre o plano, progressões, cuidados..."
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Plano'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Card de visualização de uma versão do plano
 */
function PlanoVersionCard({
  plano,
  isLatest,
  defaultOpen = false,
}: {
  plano: PlanoExerciciosPilatesData;
  isLatest: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getFocoLabel = (value: string) => {
    return FOCOS_TREINO.find(f => f.value === value)?.label || value;
  };

  const getExercicioLabel = (value: string) => {
    return EXERCICIOS_PILATES.find(e => e.value === value)?.label || value;
  };

  const getAparelhoLabel = (value: string) => {
    return APARELHOS_PILATES.find(a => a.value === value)?.label || value;
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
                    {isLatest && <Badge variant="default" className="text-xs">Atual</Badge>}
                    {plano.titulo || `Versão ${plano.version}`}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(plano.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {plano.professional_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {plano.professional_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Dumbbell className="h-3 w-3" />
                      {plano.exercicios.length} exercícios
                    </span>
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Focos e Informações */}
            <div className="grid gap-4 sm:grid-cols-2">
              {plano.focos_treino && plano.focos_treino.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Focos do Treino</p>
                  <div className="flex flex-wrap gap-1">
                    {plano.focos_treino.map((foco, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {getFocoLabel(foco)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {plano.duracao_estimada && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Duração:</span> {plano.duracao_estimada}
                  </p>
                )}
                {plano.frequencia_semanal && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Frequência:</span> {plano.frequencia_semanal}
                  </p>
                )}
              </div>
            </div>

            {/* Lista de Exercícios */}
            {plano.exercicios.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Exercícios</p>
                <div className="space-y-2">
                  {plano.exercicios.map((ex, i) => (
                    <div key={ex.id || i} className="p-3 border rounded-lg text-sm">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {getAparelhoLabel(ex.aparelho)}
                          </Badge>
                          <span className="font-medium">
                            {ex.exercicio === 'custom' ? ex.exercicio_custom : getExercicioLabel(ex.exercicio)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{ex.series}x{ex.repeticoes}</span>
                          {ex.mola && <span>| {ex.mola}</span>}
                          {ex.carga && <span>| {ex.carga}</span>}
                        </div>
                      </div>
                      {ex.observacoes && (
                        <p className="text-xs text-muted-foreground mt-1">{ex.observacoes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            {plano.observacoes_gerais && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Observações do Instrutor</p>
                <p className="text-sm whitespace-pre-wrap">{plano.observacoes_gerais}</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function PlanoExerciciosPilatesBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
}: PlanoExerciciosPilatesBlockProps) {
  const {
    currentPlano,
    history,
    loading,
    isFormOpen,
    setIsFormOpen,
    savePlano,
    isSaving,
  } = usePlanoExerciciosPilatesData({ patientId, clinicId, professionalId });

  const [showHistory, setShowHistory] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um aluno para visualizar o plano de exercícios.</p>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados iniciais para o formulário
  const getInitialFormData = (): PlanoExerciciosPilatesFormData => {
    if (currentPlano) {
      return {
        titulo: currentPlano.titulo || '',
        focos_treino: currentPlano.focos_treino || [],
        exercicios: currentPlano.exercicios || [],
        duracao_estimada: currentPlano.duracao_estimada || '',
        frequencia_semanal: currentPlano.frequencia_semanal || '',
        observacoes_gerais: currentPlano.observacoes_gerais || '',
      };
    }
    return getEmptyPlanoExerciciosForm();
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
            <h2 className="text-lg font-semibold">Plano de Exercícios</h2>
            <p className="text-sm text-muted-foreground">
              {history.length > 0 
                ? `${history.length} versão(ões) registrada(s)` 
                : 'Nenhum plano registrado'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 1 && (
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
              {currentPlano ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Atualizar
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Plano
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      {history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum plano de exercícios registrado para este aluno.</p>
            {canEdit && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Plano
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3">
            {showHistory ? (
              history.map((plano, index) => (
                <PlanoVersionCard
                  key={plano.id}
                  plano={plano}
                  isLatest={index === 0}
                  defaultOpen={index === 0}
                />
              ))
            ) : (
              currentPlano && (
                <PlanoVersionCard
                  plano={currentPlano}
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
              {currentPlano ? 'Atualizar Plano de Exercícios' : 'Novo Plano de Exercícios'}
            </DialogTitle>
            <DialogDescription>
              {currentPlano 
                ? 'Uma nova versão será criada, mantendo o histórico anterior.' 
                : 'Crie um plano de exercícios personalizado para o aluno.'}
            </DialogDescription>
          </DialogHeader>
          <PlanoForm
            initialData={getInitialFormData()}
            onSubmit={savePlano}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSaving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
