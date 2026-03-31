/**
 * PILATES - Bloco de Avaliação de Dor
 * 
 * Módulo para registro e acompanhamento de dor no contexto de Pilates.
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
  Flame,
  Plus,
  User,
  Calendar,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useAvaliacaoDorPilatesData,
  getEmptyAvaliacaoDorPilatesForm,
  INTENSIDADE_DOR_OPTIONS,
  FREQUENCIA_DOR_OPTIONS,
  LOCAIS_DOR_PILATES,
  type AvaliacaoDorPilatesFormData,
  type AvaliacaoDorPilatesData,
} from '@/hooks/prontuario/pilates/useAvaliacaoDorPilatesData';

interface AvaliacaoDorPilatesBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
}

/**
 * Indicador visual de intensidade da dor (EVA)
 */
function EvaIndicator({ value }: { value: string | null }) {
  if (!value) return null;
  const num = parseInt(value, 10);
  if (isNaN(num)) return null;

  let color = 'bg-green-500';
  let label = 'Sem dor';
  if (num >= 1 && num <= 3) { color = 'bg-yellow-400'; label = 'Leve'; }
  else if (num >= 4 && num <= 6) { color = 'bg-orange-500'; label = 'Moderada'; }
  else if (num >= 7 && num <= 9) { color = 'bg-red-500'; label = 'Intensa'; }
  else if (num >= 10) { color = 'bg-red-700'; label = 'Insuportável'; }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{num}</span>
        <span className="text-sm text-muted-foreground">/ 10</span>
        <Badge className={`${color} text-white`}>{label}</Badge>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${num * 10}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Formulário de Avaliação de Dor
 */
function AvaliacaoDorForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialData: AvaliacaoDorPilatesFormData;
  onSubmit: (data: AvaliacaoDorPilatesFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<AvaliacaoDorPilatesFormData>(initialData);

  const handleChange = (field: keyof AvaliacaoDorPilatesFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocalToggle = (local: string) => {
    const current = formData.local_da_dor;
    if (current.includes(local)) {
      handleChange('local_da_dor', current.filter(l => l !== local));
    } else {
      handleChange('local_da_dor', [...current, local]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ScrollArea className="h-[60vh] pr-4">
        <div className="space-y-6">
          {/* Local da Dor */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 font-semibold">
              <MapPin className="h-4 w-4 text-primary" />
              Local da Dor
            </Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {LOCAIS_DOR_PILATES.map((local) => (
                <div key={local.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`local-${local.value}`}
                    checked={formData.local_da_dor.includes(local.value)}
                    onCheckedChange={() => handleLocalToggle(local.value)}
                  />
                  <label
                    htmlFor={`local-${local.value}`}
                    className="text-sm leading-none cursor-pointer"
                  >
                    {local.label}
                  </label>
                </div>
              ))}
            </div>
            {formData.local_da_dor.includes('outro') && (
              <div className="space-y-1">
                <Label className="text-xs">Especificar outro local</Label>
                <Input
                  value={formData.local_da_dor_outro}
                  onChange={(e) => handleChange('local_da_dor_outro', e.target.value)}
                  placeholder="Descreva o local da dor..."
                />
              </div>
            )}
          </div>

          {/* Intensidade e Frequência */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-semibold">
                <Flame className="h-4 w-4 text-primary" />
                Intensidade da Dor (EVA)
              </Label>
              <Select
                value={formData.intensidade_dor}
                onValueChange={(v) => handleChange('intensidade_dor', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione 0-10..." />
                </SelectTrigger>
                <SelectContent>
                  {INTENSIDADE_DOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.intensidade_dor && <EvaIndicator value={formData.intensidade_dor} />}
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Frequência da Dor</Label>
              <Select
                value={formData.frequencia_dor}
                onValueChange={(v) => handleChange('frequencia_dor', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIA_DOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Início da Dor */}
          <div className="space-y-2">
            <Label htmlFor="inicio_da_dor" className="font-semibold">Início da Dor</Label>
            <Input
              id="inicio_da_dor"
              value={formData.inicio_da_dor}
              onChange={(e) => handleChange('inicio_da_dor', e.target.value)}
              placeholder="Ex: Há 3 meses, após esforço..."
            />
          </div>

          {/* Fatores de Piora e Melhora */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fatores_de_piora" className="flex items-center gap-2 font-semibold">
                <TrendingUp className="h-4 w-4 text-destructive" />
                Fatores de Piora
              </Label>
              <Textarea
                id="fatores_de_piora"
                value={formData.fatores_de_piora}
                onChange={(e) => handleChange('fatores_de_piora', e.target.value)}
                placeholder="Movimentos, posturas, atividades que agravam..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatores_de_melhora" className="flex items-center gap-2 font-semibold">
                <TrendingDown className="h-4 w-4 text-primary" />
                Fatores de Melhora
              </Label>
              <Textarea
                id="fatores_de_melhora"
                value={formData.fatores_de_melhora}
                onChange={(e) => handleChange('fatores_de_melhora', e.target.value)}
                placeholder="Repouso, alongamento, calor, gelo..."
                rows={3}
              />
            </div>
          </div>

          {/* Impacto Funcional */}
          <div className="space-y-2">
            <Label htmlFor="impacto_funcional_da_dor" className="font-semibold">
              Impacto Funcional da Dor
            </Label>
            <Textarea
              id="impacto_funcional_da_dor"
              value={formData.impacto_funcional_da_dor}
              onChange={(e) => handleChange('impacto_funcional_da_dor', e.target.value)}
              placeholder="Como a dor afeta a prática de Pilates, atividades diárias, sono..."
              rows={3}
            />
          </div>

          {/* Observações Clínicas */}
          <div className="space-y-2">
            <Label htmlFor="observacoes_clinicas_dor" className="font-semibold">
              Observações Clínicas
            </Label>
            <Textarea
              id="observacoes_clinicas_dor"
              value={formData.observacoes_clinicas_dor}
              onChange={(e) => handleChange('observacoes_clinicas_dor', e.target.value)}
              placeholder="Exames relevantes, diagnóstico médico, medicações para dor..."
              rows={3}
            />
          </div>
        </div>
      </ScrollArea>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Avaliação'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Card de visualização de uma avaliação de dor
 */
function AvaliacaoDorCard({
  avaliacao,
  isLatest,
  defaultOpen = false,
}: {
  avaliacao: AvaliacaoDorPilatesData;
  isLatest: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getLocalLabel = (value: string) =>
    LOCAIS_DOR_PILATES.find(l => l.value === value)?.label || value;

  const getFrequenciaLabel = (value: string) =>
    FREQUENCIA_DOR_OPTIONS.find(f => f.value === value)?.label || value;

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
                    {format(new Date(avaliacao.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    {isLatest && <Badge variant="default" className="text-xs">Atual</Badge>}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-3 mt-1">
                    {avaliacao.professional_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {avaliacao.professional_name}
                      </span>
                    )}
                    {avaliacao.intensidade_dor && (
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3" />
                        EVA: {avaliacao.intensidade_dor}/10
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* EVA Indicator */}
            {avaliacao.intensidade_dor && (
              <EvaIndicator value={avaliacao.intensidade_dor} />
            )}

            {/* Locais */}
            {avaliacao.local_da_dor.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Local da Dor</p>
                <div className="flex flex-wrap gap-1">
                  {avaliacao.local_da_dor.map((local) => (
                    <Badge key={local} variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {getLocalLabel(local)}
                    </Badge>
                  ))}
                </div>
                {avaliacao.local_da_dor_outro && (
                  <p className="text-sm mt-1">{avaliacao.local_da_dor_outro}</p>
                )}
              </div>
            )}

            {/* Frequência */}
            {avaliacao.frequencia_dor && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Frequência</p>
                <p className="text-sm">{getFrequenciaLabel(avaliacao.frequencia_dor)}</p>
              </div>
            )}

            {/* Início */}
            {avaliacao.inicio_da_dor && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Início</p>
                <p className="text-sm">{avaliacao.inicio_da_dor}</p>
              </div>
            )}

            {/* Fatores */}
            <div className="grid gap-3 sm:grid-cols-2">
              {avaliacao.fatores_de_piora && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-destructive" /> Fatores de Piora
                  </p>
                  <p className="text-sm">{avaliacao.fatores_de_piora}</p>
                </div>
              )}
              {avaliacao.fatores_de_melhora && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-primary" /> Fatores de Melhora
                  </p>
                  <p className="text-sm">{avaliacao.fatores_de_melhora}</p>
                </div>
              )}
            </div>

            {avaliacao.impacto_funcional_da_dor && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Impacto Funcional</p>
                <p className="text-sm">{avaliacao.impacto_funcional_da_dor}</p>
              </div>
            )}

            {avaliacao.observacoes_clinicas_dor && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Observações Clínicas</p>
                <p className="text-sm">{avaliacao.observacoes_clinicas_dor}</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function AvaliacaoDorPilatesBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
}: AvaliacaoDorPilatesBlockProps) {
  const {
    currentAvaliacao,
    history,
    loading,
    isFormOpen,
    setIsFormOpen,
    saveAvaliacao,
    isSaving,
  } = useAvaliacaoDorPilatesData({ patientId, clinicId, professionalId });

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
          <p className="text-muted-foreground">Selecione um aluno para visualizar a avaliação de dor.</p>
        </CardContent>
      </Card>
    );
  }

  const getInitialFormData = (): AvaliacaoDorPilatesFormData => {
    if (currentAvaliacao) {
      return {
        local_da_dor: currentAvaliacao.local_da_dor || [],
        local_da_dor_outro: currentAvaliacao.local_da_dor_outro || '',
        intensidade_dor: currentAvaliacao.intensidade_dor || '',
        frequencia_dor: currentAvaliacao.frequencia_dor || '',
        inicio_da_dor: currentAvaliacao.inicio_da_dor || '',
        fatores_de_piora: currentAvaliacao.fatores_de_piora || '',
        fatores_de_melhora: currentAvaliacao.fatores_de_melhora || '',
        impacto_funcional_da_dor: currentAvaliacao.impacto_funcional_da_dor || '',
        observacoes_clinicas_dor: currentAvaliacao.observacoes_clinicas_dor || '',
      };
    }
    return getEmptyAvaliacaoDorPilatesForm();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/20 rounded-full">
            <Flame className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Avaliação de Dor</h2>
            <p className="text-sm text-muted-foreground">
              {history.length > 0
                ? `${history.length} avaliação(ões) registrada(s)`
                : 'Nenhuma avaliação registrada'}
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
              {showHistory ? 'Ocultar Histórico' : `Histórico (${history.length})`}
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => setIsFormOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nova Avaliação
            </Button>
          )}
        </div>
      </div>

      {/* Current or empty state */}
      {history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma avaliação de dor registrada.</p>
            {canEdit && (
              <Button variant="outline" className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Registrar Primeira Avaliação
              </Button>
            )}
          </CardContent>
        </Card>
      ) : showHistory ? (
        <div className="space-y-3">
          {history.map((av, index) => (
            <AvaliacaoDorCard
              key={av.id}
              avaliacao={av}
              isLatest={index === 0}
              defaultOpen={index === 0}
            />
          ))}
        </div>
      ) : (
        currentAvaliacao && (
          <AvaliacaoDorCard
            avaliacao={currentAvaliacao}
            isLatest
            defaultOpen
          />
        )
      )}

      {/* Dialog Form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-destructive" />
              Nova Avaliação de Dor
            </DialogTitle>
            <DialogDescription>
              Registre a avaliação de dor do aluno para acompanhamento clínico.
            </DialogDescription>
          </DialogHeader>
          <AvaliacaoDorForm
            initialData={getInitialFormData()}
            onSubmit={saveAvaliacao}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSaving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
