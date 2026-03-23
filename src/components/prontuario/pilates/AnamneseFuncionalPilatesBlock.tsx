/**
 * PILATES - Bloco de Anamnese Funcional
 * 
 * Permite registro de anamnese funcional para Pilates com versionamento.
 * Cada atualização cria nova versão, mantendo histórico completo.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
  ClipboardList, 
  Plus, 
  Edit, 
  History, 
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  Target,
  Activity,
  Scissors,
  Armchair,
  Dumbbell
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useAnamneseFuncionalPilatesData, 
  getEmptyAnamneseFuncionalPilatesForm,
  NIVEL_ATIVIDADE_OPTIONS,
  OBJETIVOS_PILATES_OPTIONS,
  type AnamneseFuncionalPilatesFormData,
  type AnamneseFuncionalPilatesData
} from '@/hooks/prontuario/pilates/useAnamneseFuncionalPilatesData';

import { useResolvedAnamnesisTemplate } from '@/hooks/prontuario/useResolvedAnamnesisTemplate';
import { AnamneseModelSelector } from '@/components/prontuario/AnamneseModelSelector';

interface AnamneseFuncionalPilatesBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
  specialtyId?: string | null;
  procedureId?: string | null;
}

/**
 * Formulário de Anamnese Funcional
 */
function AnamneseForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialData: AnamneseFuncionalPilatesFormData;
  onSubmit: (data: AnamneseFuncionalPilatesFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<AnamneseFuncionalPilatesFormData>(initialData);

  const handleChange = (field: keyof AnamneseFuncionalPilatesFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleObjetivoToggle = (objetivo: string) => {
    const current = formData.objetivos_pilates;
    if (current.includes(objetivo)) {
      handleChange('objetivos_pilates', current.filter(o => o !== objetivo));
    } else {
      handleChange('objetivos_pilates', [...current, objetivo]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.queixa_principal.trim()) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Queixa Principal - Obrigatório */}
        <div className="space-y-2">
          <Label htmlFor="queixa_principal" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Queixa Principal *
          </Label>
          <Textarea
            id="queixa_principal"
            placeholder="Descreva a queixa principal do aluno..."
            value={formData.queixa_principal}
            onChange={(e) => handleChange('queixa_principal', e.target.value)}
            rows={3}
            required
          />
        </div>

        {/* Histórico de Dores */}
        <div className="space-y-2">
          <Label htmlFor="historico_dores" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de Dores
          </Label>
          <Textarea
            id="historico_dores"
            placeholder="Descreva histórico de dores: localização, frequência, intensidade, quando iniciou..."
            value={formData.historico_dores}
            onChange={(e) => handleChange('historico_dores', e.target.value)}
            rows={3}
          />
        </div>

        {/* Limitações de Movimento */}
        <div className="space-y-2">
          <Label htmlFor="limitacoes_movimento" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Limitações de Movimento
          </Label>
          <Textarea
            id="limitacoes_movimento"
            placeholder="Descreva limitações funcionais ou de movimento..."
            value={formData.limitacoes_movimento}
            onChange={(e) => handleChange('limitacoes_movimento', e.target.value)}
            rows={3}
          />
        </div>

        {/* Nível de Atividade Física */}
        <div className="space-y-2">
          <Label htmlFor="nivel_atividade_fisica" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Nível de Atividade Física
          </Label>
          <Select
            value={formData.nivel_atividade_fisica}
            onValueChange={(value) => handleChange('nivel_atividade_fisica', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o nível de atividade..." />
            </SelectTrigger>
            <SelectContent>
              {NIVEL_ATIVIDADE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cirurgias Prévias */}
        <div className="space-y-2">
          <Label htmlFor="cirurgias_previas" className="flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            Cirurgias Prévias (informativo)
          </Label>
          <Textarea
            id="cirurgias_previas"
            placeholder="Liste cirurgias realizadas, ano e observações relevantes..."
            value={formData.cirurgias_previas}
            onChange={(e) => handleChange('cirurgias_previas', e.target.value)}
            rows={2}
          />
        </div>

        {/* Hábitos Posturais */}
        <div className="space-y-2">
          <Label htmlFor="habitos_posturais" className="flex items-center gap-2">
            <Armchair className="h-4 w-4" />
            Hábitos Posturais
          </Label>
          <Textarea
            id="habitos_posturais"
            placeholder="Descreva rotina postural: trabalho (sentado/em pé), posição ao dormir, uso de celular..."
            value={formData.habitos_posturais}
            onChange={(e) => handleChange('habitos_posturais', e.target.value)}
            rows={3}
          />
        </div>

        {/* Objetivos com Pilates */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Objetivos com o Pilates
          </Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {OBJETIVOS_PILATES_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`objetivo-${option.value}`}
                  checked={formData.objetivos_pilates.includes(option.value)}
                  onCheckedChange={() => handleObjetivoToggle(option.value)}
                />
                <label
                  htmlFor={`objetivo-${option.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
          <Textarea
            id="objetivos_outros"
            placeholder="Outros objetivos específicos..."
            value={formData.objetivos_outros}
            onChange={(e) => handleChange('objetivos_outros', e.target.value)}
            rows={2}
          />
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações Adicionais</Label>
          <Textarea
            id="observacoes"
            placeholder="Outras informações relevantes..."
            value={formData.observacoes}
            onChange={(e) => handleChange('observacoes', e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.queixa_principal.trim()}>
          {isSubmitting ? 'Salvando...' : 'Salvar Anamnese'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Card de visualização de uma versão da anamnese
 */
function AnamneseVersionCard({
  anamnese,
  isLatest,
  defaultOpen = false,
}: {
  anamnese: AnamneseFuncionalPilatesData;
  isLatest: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const renderField = (label: string, value: string | null) => {
    if (!value) return null;
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm whitespace-pre-wrap">{value}</p>
      </div>
    );
  };

  const getNivelAtividadeLabel = (value: string | null) => {
    if (!value) return null;
    return NIVEL_ATIVIDADE_OPTIONS.find(o => o.value === value)?.label || value;
  };

  const getObjetivosLabels = (valores: string[] | null) => {
    if (!valores || valores.length === 0) return null;
    return valores.map(v => {
      const option = OBJETIVOS_PILATES_OPTIONS.find(o => o.value === v);
      return option?.label || v;
    });
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
                    Versão {anamnese.version}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(anamnese.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {anamnese.professional_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {anamnese.professional_name}
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
            {/* Queixa Principal - sempre visível */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-1">Queixa Principal</p>
              <p className="font-medium">{anamnese.queixa_principal}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {renderField('Histórico de Dores', anamnese.historico_dores)}
              {renderField('Limitações de Movimento', anamnese.limitacoes_movimento)}
              {anamnese.nivel_atividade_fisica && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nível de Atividade Física</p>
                  <Badge variant="secondary">{getNivelAtividadeLabel(anamnese.nivel_atividade_fisica)}</Badge>
                </div>
              )}
              {renderField('Cirurgias Prévias', anamnese.cirurgias_previas)}
              {renderField('Hábitos Posturais', anamnese.habitos_posturais)}
            </div>

            {/* Objetivos do Pilates */}
            {(anamnese.objetivos_pilates || anamnese.objetivos_outros) && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Objetivos com o Pilates</p>
                <div className="flex flex-wrap gap-2">
                  {getObjetivosLabels(anamnese.objetivos_pilates)?.map((label, i) => (
                    <Badge key={i} variant="outline">{label}</Badge>
                  ))}
                </div>
                {anamnese.objetivos_outros && (
                  <p className="text-sm text-muted-foreground">{anamnese.objetivos_outros}</p>
                )}
              </div>
            )}

            {renderField('Observações', anamnese.observacoes)}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function AnamneseFuncionalPilatesBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
  specialtyId,
  procedureId,
}: AnamneseFuncionalPilatesBlockProps) {
  const navigate = useNavigate();
  const {
    currentAnamnese,
    history,
    loading,
    isFormOpen,
    setIsFormOpen,
    saveAnamnese,
    isSaving,
  } = useAnamneseFuncionalPilatesData({ patientId, clinicId, professionalId });

  const [showHistory, setShowHistory] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const {
    data: resolvedTemplate,
    allTemplates,
    isLoading: templateLoading,
  } = useResolvedAnamnesisTemplate(specialtyId, procedureId);

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
          <p className="text-muted-foreground">Selecione um aluno para visualizar a anamnese.</p>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados iniciais para o formulário (baseado na versão atual ou vazio)
  const getInitialFormData = (): AnamneseFuncionalPilatesFormData => {
    if (currentAnamnese) {
      return {
        queixa_principal: currentAnamnese.queixa_principal,
        historico_dores: currentAnamnese.historico_dores || '',
        limitacoes_movimento: currentAnamnese.limitacoes_movimento || '',
        nivel_atividade_fisica: currentAnamnese.nivel_atividade_fisica || '',
        cirurgias_previas: currentAnamnese.cirurgias_previas || '',
        habitos_posturais: currentAnamnese.habitos_posturais || '',
        objetivos_pilates: currentAnamnese.objetivos_pilates || [],
        objetivos_outros: currentAnamnese.objetivos_outros || '',
        observacoes: currentAnamnese.observacoes || '',
      };
    }
    return getEmptyAnamneseFuncionalPilatesForm();
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Anamnese Funcional</h2>
            <p className="text-sm text-muted-foreground">
              {history.length > 0 
                ? `${history.length} versão(ões) registrada(s)` 
                : 'Nenhuma anamnese registrada'}
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
              {currentAnamnese ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Atualizar
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Anamnese
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      {history.length === 0 ? (
        <AnamneseModelSelector
          icon={<ClipboardList className="h-10 w-10 text-muted-foreground opacity-50" />}
          emptyTitle="Nenhuma anamnese registrada"
          emptyDescription="Registre a anamnese funcional para este aluno."
          registerLabel="Registrar Anamnese"
          resolvedTemplate={resolvedTemplate}
          allTemplates={allTemplates}
          isLoading={templateLoading}
          selectedTemplateId={selectedTemplateId}
          onTemplateChange={setSelectedTemplateId}
          canEdit={canEdit}
          canManageTemplates={canEdit}
          onRegister={() => setIsFormOpen(true)}
          onOpenTemplateEditor={() => navigate(`/app/config/prontuario?especialidade_id=${specialtyId}&tipo=anamnese`)}
          onConfigureTemplate={() => navigate('/configuracoes/modelos-anamnese')}
          specialtyLabel="Pilates"
        />
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3">
            {showHistory ? (
              // Mostrar todo o histórico
              history.map((anamnese, index) => (
                <AnamneseVersionCard
                  key={anamnese.id}
                  anamnese={anamnese}
                  isLatest={index === 0}
                  defaultOpen={index === 0}
                />
              ))
            ) : (
              // Mostrar apenas a versão atual
              currentAnamnese && (
                <AnamneseVersionCard
                  anamnese={currentAnamnese}
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
              {currentAnamnese ? 'Atualizar Anamnese' : 'Nova Anamnese Funcional'}
            </DialogTitle>
            <DialogDescription>
              {currentAnamnese 
                ? 'Uma nova versão será criada, mantendo o histórico anterior.' 
                : 'Registre os dados da anamnese inicial do aluno.'}
            </DialogDescription>
          </DialogHeader>
          <AnamneseForm
            initialData={getInitialFormData()}
            onSubmit={saveAnamnese}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSaving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
