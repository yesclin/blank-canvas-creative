/**
 * ESTÉTICA - Anamnese Estética
 * 
 * Bloco para registro de anamnese estética com versionamento.
 * Campos: queixa principal, procedimentos anteriores, medicamentos,
 * alergias, intercorrências, expectativas.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Save, 
  History, 
  FileText,
  AlertTriangle,
  Pill,
  Syringe,
  Target,
  Clock,
  ChevronDown,
  ChevronRight,
  Lock,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useAnamneseEsteticaData, 
  getEmptyAnamneseEstetica,
  type AnamneseEsteticaContent,
} from '@/hooks/aesthetics/useAnamneseEsteticaData';

import { useResolvedAnamnesisTemplate } from '@/hooks/prontuario/useResolvedAnamnesisTemplate';
import { AnamneseModelSelector } from '@/components/prontuario/AnamneseModelSelector';

interface AnamneseEsteticaBlockProps {
  patientId: string | null;
  clinicId: string | null;
  appointmentId?: string | null;
  canEdit?: boolean;
  specialtyId?: string | null;
  procedureId?: string | null;
}

export function AnamneseEsteticaBlock({
  patientId,
  clinicId,
  appointmentId,
  canEdit = false,
  specialtyId,
  procedureId,
}: AnamneseEsteticaBlockProps) {
  const { 
    current, 
    history, 
    loading, 
    save, 
    isSaving,
    isCurrentSigned,
    currentVersion,
    totalVersions,
  } = useAnamneseEsteticaData({ patientId, clinicId, appointmentId });

  const [formData, setFormData] = useState<Omit<AnamneseEsteticaContent, 'versao' | 'versao_anterior_id'>>(
    getEmptyAnamneseEstetica()
  );
  const [showHistory, setShowHistory] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const {
    data: resolvedTemplate,
    allTemplates,
    isLoading: templateLoading,
  } = useResolvedAnamnesisTemplate(specialtyId, procedureId);

  // Carregar dados atuais no formulário
  useEffect(() => {
    if (current) {
      setFormData({
        queixa_principal: current.content.queixa_principal || '',
        procedimentos_anteriores: current.content.procedimentos_anteriores || '',
        tem_procedimentos_anteriores: current.content.tem_procedimentos_anteriores || false,
        medicamentos_em_uso: current.content.medicamentos_em_uso || '',
        usa_medicamentos: current.content.usa_medicamentos || false,
        alergias: current.content.alergias || '',
        tem_alergias: current.content.tem_alergias || false,
        intercorrencias_previas: current.content.intercorrencias_previas || '',
        teve_intercorrencias: current.content.teve_intercorrencias || false,
        expectativas_paciente: current.content.expectativas_paciente || '',
        observacoes_gerais: current.content.observacoes_gerais || '',
      });
      setHasChanges(false);
    }
  }, [current]);

  const handleFieldChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await save(formData);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
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

  return (
    <div className="space-y-4">
      {/* Header com versão e ações */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Anamnese Estética</h3>
            <p className="text-xs text-muted-foreground">
              {currentVersion > 0 
                ? `Versão ${currentVersion} de ${totalVersions}`
                : 'Nenhum registro'
              }
            </p>
          </div>
          {isCurrentSigned && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Assinada
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {totalVersions > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-muted-foreground"
            >
              <History className="h-4 w-4 mr-1.5" />
              Histórico ({totalVersions})
            </Button>
          )}
          
          {canEdit && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              <Save className="h-4 w-4 mr-1.5" />
              {isSaving ? 'Salvando...' : isCurrentSigned ? 'Nova Versão' : 'Salvar'}
            </Button>
          )}
        </div>
      </div>

      {/* Aviso de versão assinada */}
      {isCurrentSigned && canEdit && (
        <Card className="border-l-4 border-l-primary bg-primary/5">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-muted-foreground">
              Esta versão está assinada e não pode ser alterada. 
              Ao salvar alterações, uma nova versão será criada automaticamente.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Histórico de versões */}
      {showHistory && history.length > 1 && (
        <Card className="bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Histórico de Versões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.map((version, index) => (
                <Collapsible key={version.id}>
                  <CollapsibleTrigger className="w-full">
                    <div className={`flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors ${
                      index === 0 ? 'bg-primary/10' : ''
                    }`}>
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? 'default' : 'outline'} className="text-xs">
                          v{version.versao}
                        </Badge>
                        <span className="text-sm">
                          {format(new Date(version.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {version.signed_at && (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-3 bg-muted/30 rounded-b-md text-sm space-y-2">
                      <p><strong>Queixa:</strong> {version.content.queixa_principal || '-'}</p>
                      <p><strong>Expectativas:</strong> {version.content.expectativas_paciente || '-'}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário Principal */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Coluna 1 */}
        <div className="space-y-4">
          {/* Queixa Principal */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Queixa Principal Estética
              </CardTitle>
              <CardDescription className="text-xs">
                Descreva a principal preocupação estética do paciente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.queixa_principal}
                onChange={(e) => handleFieldChange('queixa_principal', e.target.value)}
                placeholder="Ex: Rugas na região da testa e olheiras marcadas..."
                rows={3}
                disabled={!canEdit}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Procedimentos Anteriores */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Syringe className="h-4 w-4 text-primary" />
                Procedimentos Estéticos Anteriores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="tem_procedimentos" className="text-sm">
                  Já realizou procedimentos estéticos?
                </Label>
                <Switch
                  id="tem_procedimentos"
                  checked={formData.tem_procedimentos_anteriores}
                  onCheckedChange={(checked) => handleFieldChange('tem_procedimentos_anteriores', checked)}
                  disabled={!canEdit}
                />
              </div>
              {formData.tem_procedimentos_anteriores && (
                <Textarea
                  value={formData.procedimentos_anteriores}
                  onChange={(e) => handleFieldChange('procedimentos_anteriores', e.target.value)}
                  placeholder="Descreva os procedimentos realizados, datas aproximadas e resultados..."
                  rows={3}
                  disabled={!canEdit}
                  className="resize-none"
                />
              )}
            </CardContent>
          </Card>

          {/* Medicamentos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Pill className="h-4 w-4 text-primary" />
                Medicamentos em Uso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="usa_medicamentos" className="text-sm">
                  Faz uso de medicamentos?
                </Label>
                <Switch
                  id="usa_medicamentos"
                  checked={formData.usa_medicamentos}
                  onCheckedChange={(checked) => handleFieldChange('usa_medicamentos', checked)}
                  disabled={!canEdit}
                />
              </div>
              {formData.usa_medicamentos && (
                <Textarea
                  value={formData.medicamentos_em_uso}
                  onChange={(e) => handleFieldChange('medicamentos_em_uso', e.target.value)}
                  placeholder="Liste medicamentos, dosagens e frequência..."
                  rows={2}
                  disabled={!canEdit}
                  className="resize-none"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2 */}
        <div className="space-y-4">
          {/* Alergias */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Alergias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="tem_alergias" className="text-sm">
                  Possui alergias conhecidas?
                </Label>
                <Switch
                  id="tem_alergias"
                  checked={formData.tem_alergias}
                  onCheckedChange={(checked) => handleFieldChange('tem_alergias', checked)}
                  disabled={!canEdit}
                />
              </div>
              {formData.tem_alergias && (
                <Textarea
                  value={formData.alergias}
                  onChange={(e) => handleFieldChange('alergias', e.target.value)}
                  placeholder="Liste alergias a medicamentos, produtos, substâncias..."
                  rows={2}
                  disabled={!canEdit}
                  className="resize-none"
                />
              )}
            </CardContent>
          </Card>

          {/* Intercorrências */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-accent-foreground" />
                Intercorrências Prévias
              </CardTitle>
              <CardDescription className="text-xs">
                Complicações em procedimentos anteriores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="teve_intercorrencias" className="text-sm">
                  Já teve intercorrências?
                </Label>
                <Switch
                  id="teve_intercorrencias"
                  checked={formData.teve_intercorrencias}
                  onCheckedChange={(checked) => handleFieldChange('teve_intercorrencias', checked)}
                  disabled={!canEdit}
                />
              </div>
              {formData.teve_intercorrencias && (
                <Textarea
                  value={formData.intercorrencias_previas}
                  onChange={(e) => handleFieldChange('intercorrencias_previas', e.target.value)}
                  placeholder="Descreva as intercorrências, quando ocorreram e como foram tratadas..."
                  rows={2}
                  disabled={!canEdit}
                  className="resize-none"
                />
              )}
            </CardContent>
          </Card>

          {/* Expectativas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Expectativas do Paciente
              </CardTitle>
              <CardDescription className="text-xs">
                O que o paciente espera alcançar com os procedimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.expectativas_paciente}
                onChange={(e) => handleFieldChange('expectativas_paciente', e.target.value)}
                placeholder="Descreva as expectativas e objetivos do paciente..."
                rows={3}
                disabled={!canEdit}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Observações Gerais */}
          <Card className="bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Observações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.observacoes_gerais || ''}
                onChange={(e) => handleFieldChange('observacoes_gerais', e.target.value)}
                placeholder="Outras informações relevantes..."
                rows={2}
                disabled={!canEdit}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
