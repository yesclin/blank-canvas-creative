/**
 * NUTRIÇÃO - Avaliação Nutricional Inicial
 * 
 * Bloco para registro de avaliação nutricional inicial do paciente.
 * Permite múltiplos registros com visualização cronológica.
 * 
 * Campos:
 * - Queixa principal
 * - Histórico alimentar detalhado
 * - Rotina diária
 * - Consumo hídrico
 * - Uso de suplementos
 * - Restrições alimentares
 * - Alergias/intolerâncias
 * - Objetivos nutricionais
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ClipboardList, 
  Plus, 
  Save,
  History,
  ChevronDown,
  Calendar,
  User,
  Clock,
  Droplets,
  Pill,
  AlertTriangle,
  Target,
  Apple,
  X,
  Eye,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useAvaliacaoNutricionalInicialData,
  type AvaliacaoNutricionalInicial,
  type AvaliacaoNutricionalInicialFormData,
  OBJETIVOS_NUTRICIONAIS_OPTIONS,
  RESTRICOES_OPTIONS,
  ALERGIAS_OPTIONS,
  INTOLERANCIAS_OPTIONS,
  SUPLEMENTOS_OPTIONS,
} from '@/hooks/prontuario/nutricao/useAvaliacaoNutricionalInicialData';

interface AvaliacaoNutricionalInicialBlockProps {
  patientId: string;
  appointmentId?: string;
  canEdit: boolean;
  professionalId?: string;
}

const initialFormData: AvaliacaoNutricionalInicialFormData = {
  data_avaliacao: new Date().toISOString().split('T')[0],
  queixa_principal: '',
  historico_alimentar: '',
  rotina_diaria: '',
  horario_acordar: null,
  horario_dormir: null,
  horario_trabalho: null,
  consumo_hidrico_litros: null,
  tipo_bebida_principal: null,
  usa_suplementos: false,
  suplementos_lista: [],
  suplementos_detalhes: null,
  restricoes_alimentares: [],
  restricoes_detalhes: null,
  alergias_alimentares: [],
  intolerancias: [],
  alergias_intolerancias_detalhes: null,
  objetivos_nutricionais: [],
  objetivo_principal: '',
  peso_desejado_kg: null,
  prazo_objetivo: null,
  motivacao: null,
  observacoes: null,
};

export function AvaliacaoNutricionalInicialBlock({
  patientId,
  appointmentId,
  canEdit,
  professionalId,
}: AvaliacaoNutricionalInicialBlockProps) {
  const {
    avaliacoes,
    currentAvaliacao,
    loading,
    saving,
    saveAvaliacao,
  } = useAvaliacaoNutricionalInicialData(patientId);

  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<AvaliacaoNutricionalInicial | null>(null);
  const [formData, setFormData] = useState<AvaliacaoNutricionalInicialFormData>(initialFormData);
  const [expandedSections, setExpandedSections] = useState({
    queixa: true,
    historico: true,
    rotina: false,
    hidrico: false,
    suplementos: false,
    restricoes: false,
    alergias: false,
    objetivos: true,
  });

  // Resetar formulário quando fecha
  useEffect(() => {
    if (!showForm) {
      setFormData(initialFormData);
    }
  }, [showForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalId) return;

    const result = await saveAvaliacao(formData, professionalId, appointmentId);
    if (result) {
      setShowForm(false);
    }
  };

  const updateField = <K extends keyof AvaliacaoNutricionalInicialFormData>(
    field: K, 
    value: AvaliacaoNutricionalInicialFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (
    field: 'restricoes_alimentares' | 'alergias_alimentares' | 'intolerancias' | 'objetivos_nutricionais' | 'suplementos_lista',
    item: string
  ) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(item)) {
        return { ...prev, [field]: current.filter(i => i !== item) };
      }
      return { ...prev, [field]: [...current, item] };
    });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Visualização de uma avaliação específica
  if (selectedAvaliacao) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedAvaliacao(null)}>
            <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
            Voltar
          </Button>
          <Badge variant="outline">
            <Calendar className="h-3 w-3 mr-1" />
            {format(new Date(selectedAvaliacao.data_avaliacao), "dd/MM/yyyy", { locale: ptBR })}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Apple className="h-4 w-4" />
              Avaliação Nutricional Inicial
            </CardTitle>
            {selectedAvaliacao.created_by_name && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {selectedAvaliacao.created_by_name}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Queixa Principal */}
            {selectedAvaliacao.queixa_principal && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Queixa Principal</h4>
                <p className="text-sm">{selectedAvaliacao.queixa_principal}</p>
              </div>
            )}

            {/* Histórico Alimentar */}
            {selectedAvaliacao.historico_alimentar && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Histórico Alimentar</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedAvaliacao.historico_alimentar}</p>
              </div>
            )}

            {/* Rotina */}
            {selectedAvaliacao.rotina_diaria && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Rotina Diária</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedAvaliacao.rotina_diaria}</p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  {selectedAvaliacao.horario_acordar && (
                    <span>Acorda: {selectedAvaliacao.horario_acordar}</span>
                  )}
                  {selectedAvaliacao.horario_dormir && (
                    <span>Dorme: {selectedAvaliacao.horario_dormir}</span>
                  )}
                </div>
              </div>
            )}

            {/* Consumo Hídrico */}
            {selectedAvaliacao.consumo_hidrico_litros && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Consumo Hídrico</h4>
                <p className="text-sm">
                  {selectedAvaliacao.consumo_hidrico_litros} litros/dia
                  {selectedAvaliacao.tipo_bebida_principal && (
                    <span className="text-muted-foreground"> (principal: {selectedAvaliacao.tipo_bebida_principal})</span>
                  )}
                </p>
              </div>
            )}

            {/* Suplementos */}
            {selectedAvaliacao.usa_suplementos && selectedAvaliacao.suplementos_lista.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Suplementos em Uso</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedAvaliacao.suplementos_lista.map(s => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
                {selectedAvaliacao.suplementos_detalhes && (
                  <p className="text-xs text-muted-foreground mt-1">{selectedAvaliacao.suplementos_detalhes}</p>
                )}
              </div>
            )}

            {/* Restrições */}
            {selectedAvaliacao.restricoes_alimentares.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Restrições Alimentares</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedAvaliacao.restricoes_alimentares.map(r => (
                    <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Alergias e Intolerâncias */}
            {(selectedAvaliacao.alergias_alimentares.length > 0 || selectedAvaliacao.intolerancias.length > 0) && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                  Alergias / Intolerâncias
                </h4>
                <div className="flex flex-wrap gap-1">
                  {selectedAvaliacao.alergias_alimentares.map(a => (
                    <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
                  ))}
                  {selectedAvaliacao.intolerancias.map(i => (
                    <Badge key={i} className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100">{i}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Objetivos */}
            {(selectedAvaliacao.objetivo_principal || selectedAvaliacao.objetivos_nutricionais.length > 0) && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Objetivos Nutricionais</h4>
                {selectedAvaliacao.objetivo_principal && (
                  <p className="text-sm font-medium mb-2">{selectedAvaliacao.objetivo_principal}</p>
                )}
                {selectedAvaliacao.objetivos_nutricionais.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedAvaliacao.objetivos_nutricionais.map(o => (
                      <Badge key={o} variant="secondary" className="text-xs">{o}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  {selectedAvaliacao.peso_desejado_kg && (
                    <span>Peso desejado: {selectedAvaliacao.peso_desejado_kg} kg</span>
                  )}
                  {selectedAvaliacao.prazo_objetivo && (
                    <span>Prazo: {selectedAvaliacao.prazo_objetivo}</span>
                  )}
                </div>
              </div>
            )}

            {/* Observações */}
            {selectedAvaliacao.observacoes && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Observações</h4>
                <p className="text-sm">{selectedAvaliacao.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Apple className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Avaliação Nutricional Inicial</h2>
        </div>
        <div className="flex gap-2">
          {avaliacoes.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              Histórico ({avaliacoes.length})
            </Button>
          )}
          {canEdit && !showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          )}
        </div>
      </div>

      {/* Formulário de Nova Avaliação */}
      {showForm && canEdit && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Avaliação Nutricional Inicial
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Data */}
              <div className="max-w-xs">
                <Label htmlFor="data_avaliacao">Data da Avaliação</Label>
                <Input
                  id="data_avaliacao"
                  type="date"
                  value={formData.data_avaliacao}
                  onChange={(e) => updateField('data_avaliacao', e.target.value)}
                  required
                />
              </div>

              {/* Queixa Principal */}
              <Collapsible open={expandedSections.queixa} onOpenChange={() => toggleSection('queixa')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <ClipboardList className="h-4 w-4" />
                      Queixa Principal
                      {formData.queixa_principal && <Badge variant="secondary" className="text-xs">Preenchido</Badge>}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.queixa ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <Textarea
                    placeholder="Descreva o motivo principal da consulta, expectativas e queixas do paciente..."
                    value={formData.queixa_principal}
                    onChange={(e) => updateField('queixa_principal', e.target.value)}
                    rows={4}
                  />
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Histórico Alimentar */}
              <Collapsible open={expandedSections.historico} onOpenChange={() => toggleSection('historico')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Apple className="h-4 w-4" />
                      Histórico Alimentar Detalhado
                      {formData.historico_alimentar && <Badge variant="secondary" className="text-xs">Preenchido</Badge>}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.historico ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <Textarea
                    placeholder="Descreva os hábitos alimentares atuais: café da manhã, lanches, almoço, jantar, preferências, aversões, frequência de refeições fora de casa, etc..."
                    value={formData.historico_alimentar}
                    onChange={(e) => updateField('historico_alimentar', e.target.value)}
                    rows={6}
                  />
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Rotina Diária */}
              <Collapsible open={expandedSections.rotina} onOpenChange={() => toggleSection('rotina')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Clock className="h-4 w-4" />
                      Rotina Diária
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.rotina ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <Textarea
                    placeholder="Descreva a rotina diária do paciente: trabalho, atividades, horários de refeição, tempo disponível para preparar refeições..."
                    value={formData.rotina_diaria}
                    onChange={(e) => updateField('rotina_diaria', e.target.value)}
                    rows={4}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="horario_acordar">Horário que acorda</Label>
                      <Input
                        id="horario_acordar"
                        type="time"
                        value={formData.horario_acordar || ''}
                        onChange={(e) => updateField('horario_acordar', e.target.value || null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="horario_dormir">Horário que dorme</Label>
                      <Input
                        id="horario_dormir"
                        type="time"
                        value={formData.horario_dormir || ''}
                        onChange={(e) => updateField('horario_dormir', e.target.value || null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="horario_trabalho">Horário de trabalho</Label>
                      <Input
                        id="horario_trabalho"
                        type="text"
                        placeholder="Ex: 8h às 17h"
                        value={formData.horario_trabalho || ''}
                        onChange={(e) => updateField('horario_trabalho', e.target.value || null)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Consumo Hídrico */}
              <Collapsible open={expandedSections.hidrico} onOpenChange={() => toggleSection('hidrico')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Droplets className="h-4 w-4" />
                      Consumo Hídrico
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.hidrico ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="consumo_hidrico_litros">Consumo diário de água (litros)</Label>
                      <Input
                        id="consumo_hidrico_litros"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 2.0"
                        value={formData.consumo_hidrico_litros ?? ''}
                        onChange={(e) => updateField('consumo_hidrico_litros', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipo_bebida_principal">Principal bebida consumida</Label>
                      <Input
                        id="tipo_bebida_principal"
                        type="text"
                        placeholder="Ex: água, café, chá, sucos..."
                        value={formData.tipo_bebida_principal || ''}
                        onChange={(e) => updateField('tipo_bebida_principal', e.target.value || null)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Suplementos */}
              <Collapsible open={expandedSections.suplementos} onOpenChange={() => toggleSection('suplementos')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Pill className="h-4 w-4" />
                      Uso de Suplementos
                      {formData.usa_suplementos && <Badge variant="secondary" className="text-xs">Sim</Badge>}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.suplementos ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="usa_suplementos"
                      checked={formData.usa_suplementos}
                      onCheckedChange={(checked) => updateField('usa_suplementos', checked)}
                    />
                    <Label htmlFor="usa_suplementos">Faz uso de suplementos alimentares</Label>
                  </div>

                  {formData.usa_suplementos && (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {SUPLEMENTOS_OPTIONS.map(suplemento => (
                          <div key={suplemento} className="flex items-center space-x-2">
                            <Checkbox
                              id={`sup-${suplemento}`}
                              checked={formData.suplementos_lista.includes(suplemento)}
                              onCheckedChange={() => toggleArrayItem('suplementos_lista', suplemento)}
                            />
                            <Label htmlFor={`sup-${suplemento}`} className="text-sm font-normal cursor-pointer">
                              {suplemento}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label htmlFor="suplementos_detalhes">Detalhes adicionais sobre suplementos</Label>
                        <Textarea
                          id="suplementos_detalhes"
                          placeholder="Dosagens, marcas, horários de uso, etc..."
                          value={formData.suplementos_detalhes || ''}
                          onChange={(e) => updateField('suplementos_detalhes', e.target.value || null)}
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Restrições Alimentares */}
              <Collapsible open={expandedSections.restricoes} onOpenChange={() => toggleSection('restricoes')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <X className="h-4 w-4" />
                      Restrições Alimentares
                      {formData.restricoes_alimentares.length > 0 && (
                        <Badge variant="secondary" className="text-xs">{formData.restricoes_alimentares.length}</Badge>
                      )}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.restricoes ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {RESTRICOES_OPTIONS.map(restricao => (
                      <div key={restricao} className="flex items-center space-x-2">
                        <Checkbox
                          id={`rest-${restricao}`}
                          checked={formData.restricoes_alimentares.includes(restricao)}
                          onCheckedChange={() => toggleArrayItem('restricoes_alimentares', restricao)}
                        />
                        <Label htmlFor={`rest-${restricao}`} className="text-sm font-normal cursor-pointer">
                          {restricao}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="restricoes_detalhes">Observações sobre restrições</Label>
                    <Textarea
                      id="restricoes_detalhes"
                      placeholder="Motivos das restrições, orientações específicas..."
                      value={formData.restricoes_detalhes || ''}
                      onChange={(e) => updateField('restricoes_detalhes', e.target.value || null)}
                      rows={2}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Alergias e Intolerâncias */}
              <Collapsible open={expandedSections.alergias} onOpenChange={() => toggleSection('alergias')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Alergias / Intolerâncias
                      {(formData.alergias_alimentares.length > 0 || formData.intolerancias.length > 0) && (
                        <Badge variant="destructive" className="text-xs">
                          {formData.alergias_alimentares.length + formData.intolerancias.length}
                        </Badge>
                      )}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.alergias ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Alergias Alimentares</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                      {ALERGIAS_OPTIONS.map(alergia => (
                        <div key={alergia} className="flex items-center space-x-2">
                          <Checkbox
                            id={`alerg-${alergia}`}
                            checked={formData.alergias_alimentares.includes(alergia)}
                            onCheckedChange={() => toggleArrayItem('alergias_alimentares', alergia)}
                          />
                          <Label htmlFor={`alerg-${alergia}`} className="text-sm font-normal cursor-pointer">
                            {alergia}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Intolerâncias</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                      {INTOLERANCIAS_OPTIONS.map(intolerancia => (
                        <div key={intolerancia} className="flex items-center space-x-2">
                          <Checkbox
                            id={`intol-${intolerancia}`}
                            checked={formData.intolerancias.includes(intolerancia)}
                            onCheckedChange={() => toggleArrayItem('intolerancias', intolerancia)}
                          />
                          <Label htmlFor={`intol-${intolerancia}`} className="text-sm font-normal cursor-pointer">
                            {intolerancia}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="alergias_intolerancias_detalhes">Detalhes e sintomas</Label>
                    <Textarea
                      id="alergias_intolerancias_detalhes"
                      placeholder="Descreva os sintomas, gravidade, tratamentos anteriores..."
                      value={formData.alergias_intolerancias_detalhes || ''}
                      onChange={(e) => updateField('alergias_intolerancias_detalhes', e.target.value || null)}
                      rows={2}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Objetivos Nutricionais */}
              <Collapsible open={expandedSections.objetivos} onOpenChange={() => toggleSection('objetivos')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Target className="h-4 w-4" />
                      Objetivos Nutricionais
                      {formData.objetivo_principal && <Badge variant="secondary" className="text-xs">Definido</Badge>}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.objetivos ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div>
                    <Label htmlFor="objetivo_principal">Objetivo Principal</Label>
                    <Textarea
                      id="objetivo_principal"
                      placeholder="Qual é o principal objetivo do paciente com o acompanhamento nutricional?"
                      value={formData.objetivo_principal}
                      onChange={(e) => updateField('objetivo_principal', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Objetivos Secundários</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {OBJETIVOS_NUTRICIONAIS_OPTIONS.map(objetivo => (
                        <div key={objetivo} className="flex items-center space-x-2">
                          <Checkbox
                            id={`obj-${objetivo}`}
                            checked={formData.objetivos_nutricionais.includes(objetivo)}
                            onCheckedChange={() => toggleArrayItem('objetivos_nutricionais', objetivo)}
                          />
                          <Label htmlFor={`obj-${objetivo}`} className="text-sm font-normal cursor-pointer">
                            {objetivo}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="peso_desejado_kg">Peso desejado (kg)</Label>
                      <Input
                        id="peso_desejado_kg"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 70.0"
                        value={formData.peso_desejado_kg ?? ''}
                        onChange={(e) => updateField('peso_desejado_kg', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="prazo_objetivo">Prazo estimado</Label>
                      <Input
                        id="prazo_objetivo"
                        type="text"
                        placeholder="Ex: 3 meses, 6 meses"
                        value={formData.prazo_objetivo || ''}
                        onChange={(e) => updateField('prazo_objetivo', e.target.value || null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="motivacao">Motivação</Label>
                      <Input
                        id="motivacao"
                        type="text"
                        placeholder="O que motiva o paciente?"
                        value={formData.motivacao || ''}
                        onChange={(e) => updateField('motivacao', e.target.value || null)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Observações Gerais */}
              <div>
                <Label htmlFor="observacoes">Observações Gerais</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Outras informações relevantes sobre o paciente..."
                  value={formData.observacoes || ''}
                  onChange={(e) => updateField('observacoes', e.target.value || null)}
                  rows={3}
                />
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || !professionalId}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Avaliação'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Última Avaliação */}
      {currentAvaliacao && !showForm && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Última Avaliação</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(currentAvaliacao.data_avaliacao), "dd/MM/yyyy", { locale: ptBR })}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedAvaliacao(currentAvaliacao)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver completa
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumo da avaliação */}
            {currentAvaliacao.queixa_principal && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Queixa Principal</h4>
                <p className="text-sm line-clamp-2">{currentAvaliacao.queixa_principal}</p>
              </div>
            )}

            {/* Tags resumo */}
            <div className="flex flex-wrap gap-2">
              {currentAvaliacao.objetivo_principal && (
                <Badge variant="secondary" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  {currentAvaliacao.objetivo_principal.substring(0, 30)}...
                </Badge>
              )}
              {currentAvaliacao.consumo_hidrico_litros && (
                <Badge variant="outline" className="text-xs">
                  <Droplets className="h-3 w-3 mr-1" />
                  {currentAvaliacao.consumo_hidrico_litros}L/dia
                </Badge>
              )}
              {currentAvaliacao.alergias_alimentares.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {currentAvaliacao.alergias_alimentares.length} alergia(s)
                </Badge>
              )}
              {currentAvaliacao.restricoes_alimentares.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {currentAvaliacao.restricoes_alimentares.length} restrição(ões)
                </Badge>
              )}
            </div>

            {currentAvaliacao.created_by_name && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Registrado por {currentAvaliacao.created_by_name}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {!currentAvaliacao && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <Apple className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhuma avaliação registrada
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Registre a primeira avaliação nutricional inicial do paciente
            </p>
            {canEdit && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Avaliação
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      {showHistory && avaliacoes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {avaliacoes.map((avaliacao, index) => (
                  <button
                    key={avaliacao.id}
                    onClick={() => setSelectedAvaliacao(avaliacao)}
                    className="w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                          {format(new Date(avaliacao.data_avaliacao), "dd/MM/yyyy", { locale: ptBR })}
                        </Badge>
                        {index === 0 && <Badge variant="secondary" className="text-xs">Atual</Badge>}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {avaliacao.queixa_principal && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {avaliacao.queixa_principal}
                      </p>
                    )}
                    {avaliacao.created_by_name && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {avaliacao.created_by_name}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
