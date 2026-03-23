/**
 * FISIOTERAPIA - Bloco de Anamnese
 * 
 * Permite registro de anamnese fisioterapêutica com versionamento.
 * Cada atualização cria nova versão, mantendo histórico completo.
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  ClipboardList, 
  Plus, 
  Edit, 
  History, 
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  AlertCircle,
  FileText,
  Target,
  Activity,
  Stethoscope
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useAnamneseFisioterapiaData, 
  getEmptyAnamneseForm,
  type AnamneseFisioterapiaFormData,
  type AnamneseFisioterapiaData
} from '@/hooks/prontuario/fisioterapia/useAnamneseFisioterapiaData';

import { useResolvedAnamnesisTemplate } from '@/hooks/prontuario/useResolvedAnamnesisTemplate';
import { AnamneseModelSelector } from '@/components/prontuario/AnamneseModelSelector';
import { useAnamnesisModels } from '@/hooks/prontuario/useAnamnesisModels';
import { AnamnesisModelEditorDialog } from '@/components/config/prontuario/AnamnesisModelEditorDialog';

interface AnamneseFisioterapiaBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
  specialtyId?: string | null;
  procedureId?: string | null;
}

/**
 * Formulário de Anamnese
 */
function AnamneseForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialData: AnamneseFisioterapiaFormData;
  onSubmit: (data: AnamneseFisioterapiaFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<AnamneseFisioterapiaFormData>(initialData);

  const handleChange = (field: keyof AnamneseFisioterapiaFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
            <Stethoscope className="h-4 w-4" />
            Queixa Principal *
          </Label>
          <Textarea
            id="queixa_principal"
            placeholder="Descreva a queixa principal do paciente..."
            value={formData.queixa_principal}
            onChange={(e) => handleChange('queixa_principal', e.target.value)}
            rows={3}
            required
          />
        </div>

        {/* Histórico da Dor/Disfunção */}
        <div className="space-y-2">
          <Label htmlFor="historico_dor" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico da Dor / Disfunção
          </Label>
          <Textarea
            id="historico_dor"
            placeholder="Quando iniciou? Como evoluiu? Episódios anteriores?"
            value={formData.historico_dor}
            onChange={(e) => handleChange('historico_dor', e.target.value)}
            rows={3}
          />
        </div>

        {/* Mecanismo da Lesão */}
        <div className="space-y-2">
          <Label htmlFor="mecanismo_lesao" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Mecanismo da Lesão
          </Label>
          <Textarea
            id="mecanismo_lesao"
            placeholder="Como ocorreu a lesão? (se aplicável)"
            value={formData.mecanismo_lesao}
            onChange={(e) => handleChange('mecanismo_lesao', e.target.value)}
            rows={2}
          />
        </div>

        {/* Limitações Funcionais */}
        <div className="space-y-2">
          <Label htmlFor="limitacoes_funcionais" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Limitações Funcionais
          </Label>
          <Textarea
            id="limitacoes_funcionais"
            placeholder="Quais atividades estão comprometidas? AVDs, trabalho, esporte..."
            value={formData.limitacoes_funcionais}
            onChange={(e) => handleChange('limitacoes_funcionais', e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Atividades Agravantes */}
          <div className="space-y-2">
            <Label htmlFor="atividades_agravantes">Atividades Agravantes</Label>
            <Textarea
              id="atividades_agravantes"
              placeholder="O que piora os sintomas?"
              value={formData.atividades_agravantes}
              onChange={(e) => handleChange('atividades_agravantes', e.target.value)}
              rows={2}
            />
          </div>

          {/* Atividades Aliviadoras */}
          <div className="space-y-2">
            <Label htmlFor="atividades_aliviadoras">Atividades Aliviadoras</Label>
            <Textarea
              id="atividades_aliviadoras"
              placeholder="O que alivia os sintomas?"
              value={formData.atividades_aliviadoras}
              onChange={(e) => handleChange('atividades_aliviadoras', e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Tratamentos Anteriores */}
        <div className="space-y-2">
          <Label htmlFor="tratamentos_anteriores" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tratamentos Anteriores
          </Label>
          <Textarea
            id="tratamentos_anteriores"
            placeholder="Medicamentos, fisioterapia prévia, cirurgias, outros tratamentos..."
            value={formData.tratamentos_anteriores}
            onChange={(e) => handleChange('tratamentos_anteriores', e.target.value)}
            rows={2}
          />
        </div>

        {/* Objetivos do Paciente */}
        <div className="space-y-2">
          <Label htmlFor="objetivos_paciente" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Objetivos do Paciente
          </Label>
          <Textarea
            id="objetivos_paciente"
            placeholder="O que o paciente espera alcançar com o tratamento?"
            value={formData.objetivos_paciente}
            onChange={(e) => handleChange('objetivos_paciente', e.target.value)}
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
  anamnese: AnamneseFisioterapiaData & { professional_name: string | null };
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
              {renderField('Histórico da Dor / Disfunção', anamnese.historico_dor)}
              {renderField('Mecanismo da Lesão', anamnese.mecanismo_lesao)}
              {renderField('Limitações Funcionais', anamnese.limitacoes_funcionais)}
              {renderField('Atividades Agravantes', anamnese.atividades_agravantes)}
              {renderField('Atividades Aliviadoras', anamnese.atividades_aliviadoras)}
              {renderField('Tratamentos Anteriores', anamnese.tratamentos_anteriores)}
              {renderField('Objetivos do Paciente', anamnese.objetivos_paciente)}
              {renderField('Observações', anamnese.observacoes)}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function AnamneseFisioterapiaBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
  specialtyId,
  procedureId,
}: AnamneseFisioterapiaBlockProps) {
  const {
    currentAnamnese,
    history,
    loading,
    isFormOpen,
    setIsFormOpen,
    saveAnamnese,
    isSaving,
  } = useAnamneseFisioterapiaData({ patientId, clinicId, professionalId });

  const [showHistory, setShowHistory] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  const {
    data: resolvedTemplate,
    allTemplates,
    isLoading: templateLoading,
  } = useResolvedAnamnesisTemplate(specialtyId, procedureId);

  const {
    models: anamnesisModels,
    updateModel,
    saving: savingModel,
  } = useAnamnesisModels(specialtyId);

  const currentEditorModel = anamnesisModels.find(
    m => m.id === (selectedTemplateId || resolvedTemplate?.id)
  ) || anamnesisModels[0] || null;

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
          <p className="text-muted-foreground">Selecione um paciente para visualizar a anamnese.</p>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados iniciais para o formulário (baseado na versão atual ou vazio)
  const getInitialFormData = (): AnamneseFisioterapiaFormData => {
    if (currentAnamnese) {
      return {
        queixa_principal: currentAnamnese.queixa_principal,
        historico_dor: currentAnamnese.historico_dor || '',
        mecanismo_lesao: currentAnamnese.mecanismo_lesao || '',
        limitacoes_funcionais: currentAnamnese.limitacoes_funcionais || '',
        atividades_agravantes: currentAnamnese.atividades_agravantes || '',
        atividades_aliviadoras: currentAnamnese.atividades_aliviadoras || '',
        tratamentos_anteriores: currentAnamnese.tratamentos_anteriores || '',
        objetivos_paciente: currentAnamnese.objetivos_paciente || '',
        observacoes: currentAnamnese.observacoes || '',
      };
    }
    return getEmptyAnamneseForm();
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
            <h2 className="text-lg font-semibold">Anamnese Fisioterapêutica</h2>
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
          emptyDescription="Registre a anamnese fisioterapêutica para este paciente."
          registerLabel="Registrar Anamnese"
          resolvedTemplate={resolvedTemplate}
          allTemplates={allTemplates}
          isLoading={templateLoading}
          selectedTemplateId={selectedTemplateId}
          onTemplateChange={setSelectedTemplateId}
          canEdit={canEdit}
          canManageTemplates={canEdit}
          onRegister={() => setIsFormOpen(true)}
          onOpenTemplateEditor={() => {
            console.log("Abrindo editor modelo Fisioterapia", currentEditorModel?.id);
            setShowTemplateEditor(true);
          }}
          onConfigureTemplate={() => {
            console.log("Configurar modelo Fisioterapia", currentEditorModel?.id);
            setShowTemplateEditor(true);
          }}
          specialtyLabel="Fisioterapia"
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
              {currentAnamnese ? 'Atualizar Anamnese' : 'Nova Anamnese Fisioterapêutica'}
            </DialogTitle>
            <DialogDescription>
              {currentAnamnese 
                ? 'Uma nova versão será criada, mantendo o histórico anterior.' 
                : 'Registre os dados da anamnese inicial do paciente.'}
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

      {/* Template Editor Modal */}
      <AnamnesisModelEditorDialog
        open={showTemplateEditor}
        onOpenChange={setShowTemplateEditor}
        model={currentEditorModel}
        onSave={async (id, data) => {
          const result = await updateModel(id, data);
          return !!result;
        }}
        saving={savingModel}
        specialtySlug="fisioterapia"
      />
    </div>
  );
}
