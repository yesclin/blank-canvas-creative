/**
 * PILATES - Bloco de Avaliação Postural
 * 
 * Permite registro de avaliação postural com versionamento.
 * Suporta visualização de imagens posturais anexadas.
 */

import { useState } from 'react';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  User as UserIcon, 
  Plus, 
  Edit, 
  History, 
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  Activity,
  Eye,
  AlertTriangle,
  Move,
  Ruler
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useAvaliacaoPosturalPilatesData, 
  getEmptyAvaliacaoPosturalForm,
  ALINHAMENTO_OPTIONS,
  REGIOES_POSTURAIS,
  DESVIOS_POSTURAIS_OPTIONS,
  ENCURTAMENTOS_OPTIONS,
  type AvaliacaoPosturalPilatesFormData,
  type AvaliacaoPosturalPilatesData
} from '@/hooks/prontuario/pilates/useAvaliacaoPosturalPilatesData';

interface AvaliacaoPosturalPilatesBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
}

/**
 * Formulário de Avaliação Postural
 */
function AvaliacaoPosturalForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialData: AvaliacaoPosturalPilatesFormData;
  onSubmit: (data: AvaliacaoPosturalPilatesFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<AvaliacaoPosturalPilatesFormData>(initialData);

  const handleChange = (field: keyof AvaliacaoPosturalPilatesFormData, value: string | string[] | Record<string, unknown>) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegiaoChange = (regiao: string, status: string) => {
    setFormData(prev => ({
      ...prev,
      alinhamento_regioes: {
        ...prev.alinhamento_regioes,
        [regiao]: { ...prev.alinhamento_regioes[regiao], status },
      },
    }));
  };

  const handleRegiaoObservacao = (regiao: string, observacao: string) => {
    setFormData(prev => ({
      ...prev,
      alinhamento_regioes: {
        ...prev.alinhamento_regioes,
        [regiao]: { ...prev.alinhamento_regioes[regiao], observacao },
      },
    }));
  };

  const handleArrayToggle = (field: 'desvios_posturais' | 'encurtamentos', value: string) => {
    const current = formData[field];
    if (current.includes(value)) {
      handleChange(field, current.filter(v => v !== value));
    } else {
      handleChange(field, [...current, value]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Accordion type="multiple" defaultValue={['alinhamento', 'desvios', 'encurtamentos']} className="w-full">
        
        {/* Alinhamento Corporal */}
        <AccordionItem value="alinhamento">
          <AccordionTrigger className="text-base font-medium">
            <span className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Alinhamento Corporal
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            {/* Alinhamento Geral */}
            <div className="space-y-2">
              <Label htmlFor="alinhamento_geral">Avaliação Geral</Label>
              <Select
                value={formData.alinhamento_geral}
                onValueChange={(value) => handleChange('alinhamento_geral', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o alinhamento geral..." />
                </SelectTrigger>
                <SelectContent>
                  {ALINHAMENTO_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Alinhamento por Região */}
            <div className="space-y-3">
              <Label>Avaliação por Região</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {REGIOES_POSTURAIS.map((regiao) => (
                  <div key={regiao.key} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{regiao.label}</span>
                    </div>
                    <Select
                      value={formData.alinhamento_regioes[regiao.key]?.status || ''}
                      onValueChange={(value) => handleRegiaoChange(regiao.key, value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Status..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ALINHAMENTO_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Observações..."
                      value={formData.alinhamento_regioes[regiao.key]?.observacao || ''}
                      onChange={(e) => handleRegiaoObservacao(regiao.key, e.target.value)}
                      rows={1}
                      className="text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Desvios Posturais */}
        <AccordionItem value="desvios">
          <AccordionTrigger className="text-base font-medium">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Desvios Posturais
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {DESVIOS_POSTURAIS_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`desvio-${option.value}`}
                    checked={formData.desvios_posturais.includes(option.value)}
                    onCheckedChange={() => handleArrayToggle('desvios_posturais', option.value)}
                  />
                  <label
                    htmlFor={`desvio-${option.value}`}
                    className="text-sm leading-none cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
            <Textarea
              placeholder="Observações sobre os desvios..."
              value={formData.desvios_observacoes}
              onChange={(e) => handleChange('desvios_observacoes', e.target.value)}
              rows={2}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Encurtamentos Musculares */}
        <AccordionItem value="encurtamentos">
          <AccordionTrigger className="text-base font-medium">
            <span className="flex items-center gap-2">
              <Move className="h-4 w-4" />
              Encurtamentos Musculares
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ENCURTAMENTOS_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`encurt-${option.value}`}
                    checked={formData.encurtamentos.includes(option.value)}
                    onCheckedChange={() => handleArrayToggle('encurtamentos', option.value)}
                  />
                  <label
                    htmlFor={`encurt-${option.value}`}
                    className="text-sm leading-none cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
            <Textarea
              placeholder="Observações sobre os encurtamentos..."
              value={formData.encurtamentos_observacoes}
              onChange={(e) => handleChange('encurtamentos_observacoes', e.target.value)}
              rows={2}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Assimetrias */}
        <AccordionItem value="assimetrias">
          <AccordionTrigger className="text-base font-medium">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Assimetrias
            </span>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <Textarea
              placeholder="Descreva assimetrias observadas entre lado esquerdo e direito..."
              value={formData.assimetrias}
              onChange={(e) => handleChange('assimetrias', e.target.value)}
              rows={3}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Observações Gerais */}
      <div className="space-y-2">
        <Label htmlFor="observacoes_gerais" className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Observações do Profissional
        </Label>
        <Textarea
          id="observacoes_gerais"
          placeholder="Outras observações relevantes sobre a postura do aluno..."
          value={formData.observacoes_gerais}
          onChange={(e) => handleChange('observacoes_gerais', e.target.value)}
          rows={3}
        />
      </div>

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
 * Card de visualização de uma versão da avaliação
 */
function AvaliacaoVersionCard({
  avaliacao,
  isLatest,
  defaultOpen = false,
}: {
  avaliacao: AvaliacaoPosturalPilatesData;
  isLatest: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getAlinhamentoLabel = (value: string | null) => {
    if (!value) return null;
    return ALINHAMENTO_OPTIONS.find(o => o.value === value)?.label || value;
  };

  const getDesviosLabels = (valores: string[] | null) => {
    if (!valores || valores.length === 0) return null;
    return valores.map(v => DESVIOS_POSTURAIS_OPTIONS.find(o => o.value === v)?.label || v);
  };

  const getEncurtamentosLabels = (valores: string[] | null) => {
    if (!valores || valores.length === 0) return null;
    return valores.map(v => ENCURTAMENTOS_OPTIONS.find(o => o.value === v)?.label || v);
  };

  const getRegiaoLabel = (key: string) => {
    return REGIOES_POSTURAIS.find(r => r.key === key)?.label || key;
  };

  const hasRegioesData = avaliacao.alinhamento_regioes && Object.keys(avaliacao.alinhamento_regioes).length > 0;

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
                    Versão {avaliacao.version}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(avaliacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {avaliacao.professional_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {avaliacao.professional_name}
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
            {/* Alinhamento Geral */}
            {avaliacao.alinhamento_geral && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">Alinhamento Geral</p>
                <Badge variant="secondary">{getAlinhamentoLabel(avaliacao.alinhamento_geral)}</Badge>
              </div>
            )}

            {/* Alinhamento por Região */}
            {hasRegioesData && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Alinhamento por Região</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(avaliacao.alinhamento_regioes!).map(([key, data]) => (
                    <div key={key} className="p-2 border rounded text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{getRegiaoLabel(key)}</span>
                        <Badge variant="outline" className="text-xs">
                          {getAlinhamentoLabel(data.status)}
                        </Badge>
                      </div>
                      {data.observacao && (
                        <p className="text-xs text-muted-foreground mt-1">{data.observacao}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Desvios Posturais */}
            {avaliacao.desvios_posturais && avaliacao.desvios_posturais.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Desvios Posturais</p>
                <div className="flex flex-wrap gap-2">
                  {getDesviosLabels(avaliacao.desvios_posturais)?.map((label, i) => (
                    <Badge key={i} variant="outline">{label}</Badge>
                  ))}
                </div>
                {avaliacao.desvios_observacoes && (
                  <p className="text-sm text-muted-foreground">{avaliacao.desvios_observacoes}</p>
                )}
              </div>
            )}

            {/* Encurtamentos */}
            {avaliacao.encurtamentos && avaliacao.encurtamentos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Encurtamentos Musculares</p>
                <div className="flex flex-wrap gap-2">
                  {getEncurtamentosLabels(avaliacao.encurtamentos)?.map((label, i) => (
                    <Badge key={i} variant="outline">{label}</Badge>
                  ))}
                </div>
                {avaliacao.encurtamentos_observacoes && (
                  <p className="text-sm text-muted-foreground">{avaliacao.encurtamentos_observacoes}</p>
                )}
              </div>
            )}

            {/* Assimetrias */}
            {avaliacao.assimetrias && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Assimetrias</p>
                <p className="text-sm whitespace-pre-wrap">{avaliacao.assimetrias}</p>
              </div>
            )}

            {/* Observações */}
            {avaliacao.observacoes_gerais && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Observações do Profissional</p>
                <p className="text-sm whitespace-pre-wrap">{avaliacao.observacoes_gerais}</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function AvaliacaoPosturalPilatesBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
}: AvaliacaoPosturalPilatesBlockProps) {
  const {
    currentAvaliacao,
    history,
    loading,
    isFormOpen,
    setIsFormOpen,
    saveAvaliacao,
    isSaving,
  } = useAvaliacaoPosturalPilatesData({ patientId, clinicId, professionalId });

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
          <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um aluno para visualizar a avaliação postural.</p>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados iniciais para o formulário
  const getInitialFormData = (): AvaliacaoPosturalPilatesFormData => {
    if (currentAvaliacao) {
      return {
        alinhamento_geral: currentAvaliacao.alinhamento_geral || '',
        alinhamento_regioes: currentAvaliacao.alinhamento_regioes || {},
        desvios_posturais: currentAvaliacao.desvios_posturais || [],
        desvios_observacoes: currentAvaliacao.desvios_observacoes || '',
        encurtamentos: currentAvaliacao.encurtamentos || [],
        encurtamentos_observacoes: currentAvaliacao.encurtamentos_observacoes || '',
        assimetrias: currentAvaliacao.assimetrias || '',
        observacoes_gerais: currentAvaliacao.observacoes_gerais || '',
      };
    }
    return getEmptyAvaliacaoPosturalForm();
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <UserIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Avaliação Postural</h2>
            <p className="text-sm text-muted-foreground">
              {history.length > 0 
                ? `${history.length} versão(ões) registrada(s)` 
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
              <History className="h-4 w-4 mr-2" />
              {showHistory ? 'Ocultar Histórico' : 'Ver Histórico'}
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => setIsFormOpen(true)}>
              {currentAvaliacao ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Atualizar
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Avaliação
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
            <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma avaliação postural registrada para este aluno.</p>
            {canEdit && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Avaliação
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3">
            {showHistory ? (
              history.map((avaliacao, index) => (
                <AvaliacaoVersionCard
                  key={avaliacao.id}
                  avaliacao={avaliacao}
                  isLatest={index === 0}
                  defaultOpen={index === 0}
                />
              ))
            ) : (
              currentAvaliacao && (
                <AvaliacaoVersionCard
                  avaliacao={currentAvaliacao}
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
              {currentAvaliacao ? 'Atualizar Avaliação Postural' : 'Nova Avaliação Postural'}
            </DialogTitle>
            <DialogDescription>
              {currentAvaliacao 
                ? 'Uma nova versão será criada, mantendo o histórico anterior.' 
                : 'Registre a avaliação postural do aluno.'}
            </DialogDescription>
          </DialogHeader>
          <AvaliacaoPosturalForm
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
