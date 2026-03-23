/**
 * PILATES - Bloco de Sessões
 * 
 * Registro de sessões realizadas com exercícios, resposta do aluno e ajustes.
 * Exibição em ordem cronológica.
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
  ClipboardList, 
  Plus, 
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  Dumbbell,
  Trash2,
  ThumbsUp,
  Settings2,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useSessoesPilatesData, 
  getEmptySessaoForm,
  createEmptyExercicioRealizado,
  RESPOSTA_ALUNO_OPTIONS,
  AJUSTES_COMUNS,
  type SessaoPilatesFormData,
  type SessaoPilatesData,
  type ExercicioRealizado,
} from '@/hooks/prontuario/pilates/useSessoesPilatesData';
import { APARELHOS_PILATES, EXERCICIOS_PILATES } from '@/hooks/prontuario/pilates/usePlanoExerciciosPilatesData';

interface SessoesPilatesBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
}

/**
 * Componente de exercício realizado no formulário
 */
function ExercicioRealizadoFormItem({
  exercicio,
  index,
  onChange,
  onRemove,
}: {
  exercicio: ExercicioRealizado;
  index: number;
  onChange: (updated: ExercicioRealizado) => void;
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
            value={exercicio.series_realizadas}
            onChange={(e) => onChange({ ...exercicio, series_realizadas: parseInt(e.target.value) || 1 })}
            className="h-9"
          />
        </div>

        {/* Repetições */}
        <div className="space-y-1">
          <Label className="text-xs">Repetições</Label>
          <Input
            value={exercicio.repeticoes_realizadas}
            onChange={(e) => onChange({ ...exercicio, repeticoes_realizadas: e.target.value })}
            placeholder="10"
            className="h-9"
          />
        </div>

        {/* Resposta */}
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Resposta do Aluno</Label>
          <Select
            value={exercicio.resposta}
            onValueChange={(value) => onChange({ ...exercicio, resposta: value })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESPOSTA_ALUNO_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ajustes e observações do exercício */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Ajustes</Label>
          <Input
            value={exercicio.ajustes || ''}
            onChange={(e) => onChange({ ...exercicio, ajustes: e.target.value })}
            placeholder="Ajustes feitos neste exercício..."
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Observação</Label>
          <Input
            value={exercicio.observacao || ''}
            onChange={(e) => onChange({ ...exercicio, observacao: e.target.value })}
            placeholder="Observação específica..."
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Formulário da Sessão
 */
function SessaoForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialData: SessaoPilatesFormData;
  onSubmit: (data: SessaoPilatesFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<SessaoPilatesFormData>(initialData);

  const handleChange = (field: keyof SessaoPilatesFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAjusteToggle = (ajuste: string) => {
    const current = formData.ajustes_sessao;
    if (current.includes(ajuste)) {
      handleChange('ajustes_sessao', current.filter(a => a !== ajuste));
    } else {
      handleChange('ajustes_sessao', [...current, ajuste]);
    }
  };

  const handleExercicioChange = (index: number, updated: ExercicioRealizado) => {
    const newExercicios = [...formData.exercicios_realizados];
    newExercicios[index] = updated;
    handleChange('exercicios_realizados', newExercicios);
  };

  const handleAddExercicio = () => {
    handleChange('exercicios_realizados', [...formData.exercicios_realizados, createEmptyExercicioRealizado()]);
  };

  const handleRemoveExercicio = (index: number) => {
    handleChange('exercicios_realizados', formData.exercicios_realizados.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Data da Sessão */}
      <div className="space-y-2">
        <Label htmlFor="data_sessao" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Data da Sessão
        </Label>
        <Input
          id="data_sessao"
          type="date"
          value={formData.data_sessao}
          onChange={(e) => handleChange('data_sessao', e.target.value)}
        />
      </div>

      {/* Lista de Exercícios Realizados */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Exercícios Realizados ({formData.exercicios_realizados.length})
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddExercicio}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>

        {formData.exercicios_realizados.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Nenhum exercício registrado</p>
            <Button type="button" variant="ghost" size="sm" onClick={handleAddExercicio} className="mt-2">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Exercício
            </Button>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-3 pr-2">
              {formData.exercicios_realizados.map((ex, index) => (
                <ExercicioRealizadoFormItem
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

      {/* Resposta Geral */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <ThumbsUp className="h-4 w-4" />
          Resposta Geral do Aluno
        </Label>
        <Select
          value={formData.resposta_geral}
          onValueChange={(value) => handleChange('resposta_geral', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {RESPOSTA_ALUNO_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ajustes da Sessão */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Ajustes Realizados na Sessão
        </Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {AJUSTES_COMUNS.map((ajuste) => (
            <div key={ajuste.value} className="flex items-center space-x-2">
              <Checkbox
                id={`ajuste-${ajuste.value}`}
                checked={formData.ajustes_sessao.includes(ajuste.value)}
                onCheckedChange={() => handleAjusteToggle(ajuste.value)}
              />
              <label
                htmlFor={`ajuste-${ajuste.value}`}
                className="text-sm leading-none cursor-pointer"
              >
                {ajuste.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações da Sessão</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => handleChange('observacoes', e.target.value)}
          placeholder="Observações gerais sobre a sessão..."
          rows={3}
        />
      </div>

      {/* Foco próxima sessão */}
      <div className="space-y-2">
        <Label htmlFor="proxima_sessao_foco" className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4" />
          Foco para Próxima Sessão
        </Label>
        <Input
          id="proxima_sessao_foco"
          value={formData.proxima_sessao_foco}
          onChange={(e) => handleChange('proxima_sessao_foco', e.target.value)}
          placeholder="Ex: Aumentar carga no Reformer, focar em alongamento..."
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Registrar Sessão'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Card de visualização de uma sessão
 */
function SessaoCard({
  sessao,
  defaultOpen = false,
}: {
  sessao: SessaoPilatesData;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getRespostaLabel = (value: string) => {
    return RESPOSTA_ALUNO_OPTIONS.find(r => r.value === value)?.label || value;
  };

  const getRespostaColor = (value: string) => {
    const opt = RESPOSTA_ALUNO_OPTIONS.find(r => r.value === value);
    if (!opt) return 'bg-muted';
    return opt.color;
  };

  const getExercicioLabel = (value: string) => {
    return EXERCICIOS_PILATES.find(e => e.value === value)?.label || value;
  };

  const getAparelhoLabel = (value: string) => {
    return APARELHOS_PILATES.find(a => a.value === value)?.label || value;
  };

  const getAjusteLabel = (value: string) => {
    return AJUSTES_COMUNS.find(a => a.value === value)?.label || value;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
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
                    {format(new Date(sessao.data_sessao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    {sessao.resposta_geral && (
                      <Badge className={`text-xs text-white ${getRespostaColor(sessao.resposta_geral)}`}>
                        {getRespostaLabel(sessao.resposta_geral)}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-3 mt-1">
                    {sessao.professional_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {sessao.professional_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Dumbbell className="h-3 w-3" />
                      {sessao.exercicios_realizados.length} exercícios
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
            {sessao.exercicios_realizados.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Exercícios Realizados</p>
                <div className="space-y-2">
                  {sessao.exercicios_realizados.map((ex, i) => (
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {ex.series_realizadas}x{ex.repeticoes_realizadas}
                          </span>
                          <Badge className={`text-xs text-white ${getRespostaColor(ex.resposta)}`}>
                            {getRespostaLabel(ex.resposta)}
                          </Badge>
                        </div>
                      </div>
                      {(ex.ajustes || ex.observacao) && (
                        <div className="text-xs text-muted-foreground mt-1 flex gap-4">
                          {ex.ajustes && <span>Ajustes: {ex.ajustes}</span>}
                          {ex.observacao && <span>Obs: {ex.observacao}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ajustes da Sessão */}
            {sessao.ajustes_sessao && sessao.ajustes_sessao.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Ajustes da Sessão</p>
                <div className="flex flex-wrap gap-1">
                  {sessao.ajustes_sessao.map((ajuste, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {getAjusteLabel(ajuste)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            {sessao.observacoes && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Observações</p>
                <p className="text-sm whitespace-pre-wrap">{sessao.observacoes}</p>
              </div>
            )}

            {/* Foco próxima sessão */}
            {sessao.proxima_sessao_foco && (
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Foco para Próxima Sessão
                </p>
                <p className="text-sm">{sessao.proxima_sessao_foco}</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function SessoesPilatesBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
}: SessoesPilatesBlockProps) {
  const {
    sessoes,
    loading,
    isFormOpen,
    setIsFormOpen,
    saveSessao,
    isSaving,
  } = useSessoesPilatesData({ patientId, clinicId, professionalId });

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
          <p className="text-muted-foreground">Selecione um aluno para visualizar as sessões.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Sessões de Pilates</h2>
            <p className="text-sm text-muted-foreground">
              {sessoes.length > 0 
                ? `${sessoes.length} sessão(ões) registrada(s)` 
                : 'Nenhuma sessão registrada'}
            </p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Sessão
          </Button>
        )}
      </div>

      {/* Conteúdo */}
      {sessoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma sessão registrada para este aluno.</p>
            {canEdit && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Sessão
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3">
            {sessoes.map((sessao, index) => (
              <SessaoCard
                key={sessao.id}
                sessao={sessao}
                defaultOpen={index === 0}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Dialog do Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Sessão de Pilates</DialogTitle>
            <DialogDescription>
              Registre os exercícios realizados e a resposta do aluno.
            </DialogDescription>
          </DialogHeader>
          <SessaoForm
            initialData={getEmptySessaoForm()}
            onSubmit={saveSessao}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSaving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
