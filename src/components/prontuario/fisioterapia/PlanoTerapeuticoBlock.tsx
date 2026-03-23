/**
 * FISIOTERAPIA - Bloco de Plano Terapêutico
 * 
 * Permite registro de planos terapêuticos com versionamento.
 * Cada atualização cria nova versão, mantendo histórico completo.
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
  Target, 
  Plus, 
  User,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  X,
  Dumbbell,
  RefreshCw,
  Home,
  FileText,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  usePlanoTerapeuticoData, 
  getEmptyPlanoForm,
  FREQUENCIA_SESSAO_OPTIONS,
  STATUS_PLANO_OPTIONS,
  type PlanoTerapeuticoFormData,
  type PlanoTerapeuticoData
} from '@/hooks/prontuario/fisioterapia/usePlanoTerapeuticoData';

interface PlanoTerapeuticoBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
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
    case 'finalizado':
      return { variant: 'outline' as const, label: 'Finalizado' };
    case 'rascunho':
      return { variant: 'secondary' as const, label: 'Rascunho' };
    default:
      return { variant: 'outline' as const, label: status };
  }
}

/**
 * Componente de lista dinâmica de itens
 */
function DynamicList({
  label,
  items,
  onChange,
  placeholder,
  icon: Icon,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  icon?: React.ElementType;
}) {
  const handleAdd = () => {
    onChange([...items, '']);
  };

  const handleRemove = (index: number) => {
    if (items.length > 1) {
      onChange(items.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </Label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={`${placeholder} ${index + 1}`}
              value={item}
              onChange={(e) => handleChange(index, e.target.value)}
            />
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Adicionar
      </Button>
    </div>
  );
}

/**
 * Formulário de Plano Terapêutico
 */
function PlanoForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  isNewVersion,
}: {
  initialData: PlanoTerapeuticoFormData;
  onSubmit: (data: PlanoTerapeuticoFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isNewVersion: boolean;
}) {
  const [formData, setFormData] = useState<PlanoTerapeuticoFormData>(initialData);

  const handleChange = (field: keyof PlanoTerapeuticoFormData, value: string | string[] | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) {
      return;
    }
    onSubmit(formData);
  };

  const getFrequenciaLabel = (value: string) => {
    return FREQUENCIA_SESSAO_OPTIONS.find(o => o.value === value)?.label || value;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isNewVersion && (
        <div className="p-3 bg-primary/10 rounded-lg text-sm">
          <p className="font-medium">Nova versão do plano</p>
          <p className="text-muted-foreground">O plano anterior será mantido no histórico.</p>
        </div>
      )}

      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="titulo">Título do Plano *</Label>
        <Input
          id="titulo"
          placeholder="Ex: Reabilitação de Ombro - Fase 1"
          value={formData.titulo}
          onChange={(e) => handleChange('titulo', e.target.value)}
          required
        />
      </div>

      {/* Objetivos */}
      <DynamicList
        label="Objetivos Terapêuticos *"
        items={formData.objetivos}
        onChange={(items) => handleChange('objetivos', items)}
        placeholder="Objetivo"
        icon={Target}
      />

      {/* Técnicas */}
      <DynamicList
        label="Técnicas Utilizadas"
        items={formData.tecnicas}
        onChange={(items) => handleChange('tecnicas', items)}
        placeholder="Técnica"
        icon={Dumbbell}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Frequência */}
        <div className="space-y-2">
          <Label htmlFor="frequencia" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Frequência das Sessões
          </Label>
          <Select
            value={formData.frequencia_sessoes}
            onValueChange={(value) => handleChange('frequencia_sessoes', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIA_SESSAO_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duração em semanas */}
        <div className="space-y-2">
          <Label htmlFor="duracao_semanas">Duração Prevista (semanas)</Label>
          <Input
            id="duracao_semanas"
            type="number"
            min={1}
            max={52}
            placeholder="Ex: 8"
            value={formData.duracao_semanas || ''}
            onChange={(e) => handleChange('duracao_semanas', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
      </div>

      {/* Duração descritiva */}
      <div className="space-y-2">
        <Label htmlFor="duracao_prevista">Descrição da Duração</Label>
        <Input
          id="duracao_prevista"
          placeholder="Ex: 8 semanas, com reavaliação na 4ª semana"
          value={formData.duracao_prevista}
          onChange={(e) => handleChange('duracao_prevista', e.target.value)}
        />
      </div>

      {/* Critérios de Reavaliação */}
      <div className="space-y-2">
        <Label htmlFor="criterios_reavaliacao" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Critérios de Reavaliação
        </Label>
        <Textarea
          id="criterios_reavaliacao"
          placeholder="Quando e como o plano será reavaliado..."
          value={formData.criterios_reavaliacao}
          onChange={(e) => handleChange('criterios_reavaliacao', e.target.value)}
          rows={2}
        />
      </div>

      {/* Recursos/Equipamentos */}
      <div className="space-y-2">
        <Label htmlFor="recursos_equipamentos">Recursos e Equipamentos</Label>
        <Textarea
          id="recursos_equipamentos"
          placeholder="Equipamentos, materiais e recursos necessários..."
          value={formData.recursos_equipamentos}
          onChange={(e) => handleChange('recursos_equipamentos', e.target.value)}
          rows={2}
        />
      </div>

      {/* Orientações Domiciliares */}
      <div className="space-y-2">
        <Label htmlFor="orientacoes_domiciliares" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Orientações Domiciliares
        </Label>
        <Textarea
          id="orientacoes_domiciliares"
          placeholder="Exercícios e orientações para o paciente realizar em casa..."
          value={formData.orientacoes_domiciliares}
          onChange={(e) => handleChange('orientacoes_domiciliares', e.target.value)}
          rows={3}
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">Status do Plano</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => handleChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {STATUS_PLANO_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          placeholder="Outras observações relevantes..."
          value={formData.observacoes}
          onChange={(e) => handleChange('observacoes', e.target.value)}
          rows={2}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.titulo.trim()}>
          {isSubmitting ? 'Salvando...' : 'Salvar Plano'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Card de visualização de um plano
 */
function PlanoCard({
  plano,
  isLatest,
  defaultOpen = false,
}: {
  plano: PlanoTerapeuticoData;
  isLatest: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const statusConfig = getStatusConfig(plano.status);

  const getFrequenciaLabel = (value: string) => {
    return FREQUENCIA_SESSAO_OPTIONS.find(o => o.value === value)?.label || value;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={isLatest && plano.status === 'ativo' ? 'border-primary/50' : ''}>
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
                    {isLatest && plano.status === 'ativo' && (
                      <Badge variant="default" className="text-xs">Ativo</Badge>
                    )}
                    {plano.titulo}
                    <Badge variant="outline" className="text-xs">v{plano.version}</Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(plano.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    {plano.professional_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {plano.professional_name}
                      </span>
                    )}
                    {plano.duracao_semanas && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {plano.duracao_semanas} semanas
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Objetivos */}
            {plano.objetivos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Objetivos Terapêuticos
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {plano.objetivos.map((obj, i) => (
                    <li key={i} className="text-sm">{obj}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Técnicas */}
            {plano.tecnicas.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Técnicas Utilizadas
                </p>
                <div className="flex flex-wrap gap-2">
                  {plano.tecnicas.map((tec, i) => (
                    <Badge key={i} variant="secondary">{tec}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {/* Frequência */}
              {plano.frequencia_sessoes && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Frequência</p>
                  <p className="text-sm">{getFrequenciaLabel(plano.frequencia_sessoes)}</p>
                </div>
              )}

              {/* Duração */}
              {(plano.duracao_prevista || plano.duracao_semanas) && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Duração Prevista</p>
                  <p className="text-sm">
                    {plano.duracao_prevista || `${plano.duracao_semanas} semanas`}
                  </p>
                </div>
              )}

              {/* Critérios de Reavaliação */}
              {plano.criterios_reavaliacao && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <RefreshCw className="h-3 w-3" />
                    Critérios de Reavaliação
                  </p>
                  <p className="text-sm">{plano.criterios_reavaliacao}</p>
                </div>
              )}

              {/* Recursos */}
              {plano.recursos_equipamentos && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Recursos e Equipamentos</p>
                  <p className="text-sm">{plano.recursos_equipamentos}</p>
                </div>
              )}

              {/* Orientações Domiciliares */}
              {plano.orientacoes_domiciliares && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Home className="h-3 w-3" />
                    Orientações Domiciliares
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{plano.orientacoes_domiciliares}</p>
                </div>
              )}

              {/* Observações */}
              {plano.observacoes && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Observações</p>
                  <p className="text-sm text-muted-foreground">{plano.observacoes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function PlanoTerapeuticoBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
}: PlanoTerapeuticoBlockProps) {
  const {
    planoAtivo,
    planoAtual,
    history,
    loading,
    isFormOpen,
    setIsFormOpen,
    savePlano,
    isSaving,
  } = usePlanoTerapeuticoData({ patientId, clinicId, professionalId });

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
          <p className="text-muted-foreground">Selecione um paciente para visualizar o plano terapêutico.</p>
        </CardContent>
      </Card>
    );
  }

  const getInitialFormData = (): PlanoTerapeuticoFormData => {
    if (planoAtual) {
      return {
        titulo: planoAtual.titulo,
        objetivos: planoAtual.objetivos.length > 0 ? planoAtual.objetivos : [''],
        tecnicas: planoAtual.tecnicas.length > 0 ? planoAtual.tecnicas : [''],
        frequencia_sessoes: planoAtual.frequencia_sessoes,
        duracao_prevista: planoAtual.duracao_prevista || '',
        duracao_semanas: planoAtual.duracao_semanas,
        criterios_reavaliacao: planoAtual.criterios_reavaliacao || '',
        recursos_equipamentos: planoAtual.recursos_equipamentos || '',
        orientacoes_domiciliares: planoAtual.orientacoes_domiciliares || '',
        observacoes: planoAtual.observacoes || '',
        status: 'ativo',
      };
    }
    return getEmptyPlanoForm();
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Plano Terapêutico</h2>
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
              {planoAtual ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Nova Versão
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
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum plano terapêutico registrado.</p>
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
                <PlanoCard
                  key={plano.id}
                  plano={plano}
                  isLatest={index === 0}
                  defaultOpen={index === 0}
                />
              ))
            ) : (
              planoAtual && (
                <PlanoCard
                  plano={planoAtual}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {planoAtual ? 'Nova Versão do Plano' : 'Novo Plano Terapêutico'}
            </DialogTitle>
            <DialogDescription>
              Defina os objetivos, técnicas e parâmetros do tratamento fisioterapêutico.
            </DialogDescription>
          </DialogHeader>
          <PlanoForm
            initialData={getInitialFormData()}
            onSubmit={savePlano}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSaving}
            isNewVersion={!!planoAtual}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
