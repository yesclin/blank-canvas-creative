/**
 * NUTRIÇÃO - Bloco de Avaliação Clínica / Bioquímica
 * 
 * Permite registrar sinais/sintomas, exames laboratoriais e observações clínicas.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Stethoscope, 
  FlaskConical, 
  Plus, 
  ChevronDown,
  Save,
  History,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useAvaliacaoClinicaData, 
  SINAIS_SINTOMAS_NUTRICAO, 
  EXAMES_COMUNS_NUTRICAO,
  type AvaliacaoClinicaFormData,
  type ExameLaboratorial,
  type AvaliacaoClinica
} from '@/hooks/prontuario/nutricao/useAvaliacaoClinicaData';

interface AvaliacaoClinicaBlockProps {
  patientId: string;
  canEdit?: boolean;
}

const initialFormData: AvaliacaoClinicaFormData = {
  sinais_sintomas: [],
  sinais_sintomas_obs: '',
  exames: [],
  observacoes_clinicas: '',
};

function ExameStatusIcon({ status }: { status?: 'normal' | 'baixo' | 'alto' }) {
  if (status === 'baixo') return <ArrowDown className="h-4 w-4 text-primary" />;
  if (status === 'alto') return <ArrowUp className="h-4 w-4 text-destructive" />;
  if (status === 'normal') return <CheckCircle2 className="h-4 w-4 text-accent-foreground" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function ExameStatusBadge({ status }: { status?: 'normal' | 'baixo' | 'alto' }) {
  if (status === 'baixo') return <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">Baixo</Badge>;
  if (status === 'alto') return <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10">Alto</Badge>;
  if (status === 'normal') return <Badge variant="outline" className="text-accent-foreground border-accent bg-accent">Normal</Badge>;
  return null;
}

export function AvaliacaoClinicaBlock({ patientId, canEdit = true }: AvaliacaoClinicaBlockProps) {
  const { avaliacoes, isLoading, saveAvaliacao, isSaving } = useAvaliacaoClinicaData(patientId);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AvaliacaoClinicaFormData>(initialFormData);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    sinais: true,
    exames: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleSintoma = (sintoma: string) => {
    setFormData(prev => ({
      ...prev,
      sinais_sintomas: prev.sinais_sintomas.includes(sintoma)
        ? prev.sinais_sintomas.filter(s => s !== sintoma)
        : [...prev.sinais_sintomas, sintoma]
    }));
  };

  const addExame = (exameTemplate?: typeof EXAMES_COMUNS_NUTRICAO[0]) => {
    const novoExame: ExameLaboratorial = exameTemplate 
      ? { ...exameTemplate, valor: '', status: undefined }
      : { nome: '', valor: '', unidade: '', referencia: '', status: undefined };
    
    setFormData(prev => ({
      ...prev,
      exames: [...prev.exames, novoExame]
    }));
  };

  const updateExame = (index: number, field: keyof ExameLaboratorial, value: string) => {
    setFormData(prev => ({
      ...prev,
      exames: prev.exames.map((ex, i) => i === index ? { ...ex, [field]: value } : ex)
    }));
  };

  const removeExame = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exames: prev.exames.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    await saveAvaliacao(formData);
    setFormData(initialFormData);
    setShowForm(false);
  };

  const ultimaAvaliacao = avaliacoes[0];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Avaliação Clínica / Bioquímica</h2>
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
          {canEdit && (
            <Button 
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          )}
        </div>
      </div>

      {/* Formulário de Nova Avaliação */}
      {showForm && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Registrar Avaliação Clínica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sinais e Sintomas */}
            <Collapsible open={expandedSections.sinais} onOpenChange={() => toggleSection('sinais')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                  <span className="font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    Sinais e Sintomas Relatados
                    {formData.sinais_sintomas.length > 0 && (
                      <Badge variant="secondary">{formData.sinais_sintomas.length}</Badge>
                    )}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.sinais ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {SINAIS_SINTOMAS_NUTRICAO.map(sintoma => (
                    <div key={sintoma} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`sintoma-${sintoma}`}
                        checked={formData.sinais_sintomas.includes(sintoma)}
                        onCheckedChange={() => toggleSintoma(sintoma)}
                      />
                      <Label 
                        htmlFor={`sintoma-${sintoma}`}
                        className="text-sm cursor-pointer"
                      >
                        {sintoma}
                      </Label>
                    </div>
                  ))}
                </div>
                <div>
                  <Label htmlFor="sinais-obs">Observações sobre sinais/sintomas</Label>
                  <Textarea
                    id="sinais-obs"
                    value={formData.sinais_sintomas_obs}
                    onChange={(e) => setFormData(prev => ({ ...prev, sinais_sintomas_obs: e.target.value }))}
                    placeholder="Detalhes adicionais sobre os sinais e sintomas relatados..."
                    rows={2}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Exames Laboratoriais */}
            <Collapsible open={expandedSections.exames} onOpenChange={() => toggleSection('exames')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                  <span className="font-medium flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-primary" />
                    Exames Laboratoriais
                    {formData.exames.length > 0 && (
                      <Badge variant="secondary">{formData.exames.length}</Badge>
                    )}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.exames ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3">
                {/* Adicionar exame comum */}
                <div className="flex gap-2">
                  <Select onValueChange={(value) => {
                    const exame = EXAMES_COMUNS_NUTRICAO.find(e => e.nome === value);
                    if (exame) addExame(exame);
                  }}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Adicionar exame comum..." />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[300px]">
                        {EXAMES_COMUNS_NUTRICAO.map(exame => (
                          <SelectItem key={exame.nome} value={exame.nome}>
                            {exame.nome}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => addExame()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Outro
                  </Button>
                </div>

                {/* Lista de exames */}
                {formData.exames.length > 0 && (
                  <div className="space-y-2">
                    {formData.exames.map((exame, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 bg-muted/50 rounded-lg">
                        <div className="col-span-3">
                          <Input
                            value={exame.nome}
                            onChange={(e) => updateExame(index, 'nome', e.target.value)}
                            placeholder="Nome do exame"
                            className="text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={exame.valor}
                            onChange={(e) => updateExame(index, 'valor', e.target.value)}
                            placeholder="Valor"
                            className="text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={exame.unidade}
                            onChange={(e) => updateExame(index, 'unidade', e.target.value)}
                            placeholder="Unidade"
                            className="text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={exame.referencia || ''}
                            onChange={(e) => updateExame(index, 'referencia', e.target.value)}
                            placeholder="Referência"
                            className="text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Select 
                            value={exame.status || ''} 
                            onValueChange={(value) => updateExame(index, 'status', value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="baixo">Baixo</SelectItem>
                              <SelectItem value="alto">Alto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeExame(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Observações Clínicas */}
            <div>
              <Label htmlFor="obs-clinicas">Observações Clínicas</Label>
              <Textarea
                id="obs-clinicas"
                value={formData.observacoes_clinicas}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes_clinicas: e.target.value }))}
                placeholder="Observações gerais relacionadas à avaliação clínica nutricional..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este registro não substitui laudos médicos. Valores são informados pelo paciente ou transcritos de exames.
              </p>
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Avaliação'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Última Avaliação */}
      {!showForm && ultimaAvaliacao && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Última Avaliação
              </CardTitle>
              <Badge variant="outline">
                {format(parseISO(ultimaAvaliacao.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sinais/Sintomas */}
            {ultimaAvaliacao.sinais_sintomas.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sinais e Sintomas</p>
                <div className="flex flex-wrap gap-1">
                  {ultimaAvaliacao.sinais_sintomas.map(s => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Exames */}
            {ultimaAvaliacao.exames.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Exames Laboratoriais</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {ultimaAvaliacao.exames.map((exame, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <ExameStatusIcon status={exame.status} />
                        <span className="font-medium">{exame.nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{exame.valor} {exame.unidade}</span>
                        <ExameStatusBadge status={exame.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            {ultimaAvaliacao.observacoes_clinicas && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Observações</p>
                <p className="text-sm">{ultimaAvaliacao.observacoes_clinicas}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      {showHistory && avaliacoes.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Histórico de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {avaliacoes.slice(1).map(av => (
                  <div key={av.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">
                        {format(parseISO(av.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </Badge>
                    </div>
                    {av.sinais_sintomas.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {av.sinais_sintomas.map(s => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    )}
                    {av.exames.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {av.exames.length} exame(s) registrado(s)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {!showForm && avaliacoes.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Stethoscope className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhuma avaliação clínica registrada</p>
            <Button variant="outline" className="mt-3" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primeira Avaliação
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
