/**
 * PILATES - Bloco de Avaliação Funcional
 * 
 * Campos específicos: mobilidade articular, força funcional, equilíbrio,
 * controle do core, padrão respiratório, testes funcionais.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Activity, 
  Plus, 
  User,
  Calendar,
  Move,
  Dumbbell,
  Scale,
  Circle,
  Wind,
  ClipboardCheck,
  Target,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useAvaliacaoFuncionalPilatesData, 
  getEmptyAvaliacaoFormPilates,
  MOBILIDADE_OPTIONS,
  FORCA_FUNCIONAL_OPTIONS,
  EQUILIBRIO_PILATES_OPTIONS,
  CORE_CONTROL_OPTIONS,
  RESPIRACAO_OPTIONS,
  REGIOES_MOBILIDADE,
  TESTES_FUNCIONAIS_PILATES,
  type AvaliacaoFuncionalPilatesFormData,
  type AvaliacaoFuncionalPilatesData
} from '@/hooks/prontuario/pilates/useAvaliacaoFuncionalPilatesData';

interface AvaliacaoFuncionalPilatesBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
}

/**
 * Indicador visual de nível
 */
function NivelIndicador({ 
  valor, 
  options 
}: { 
  valor: string | null; 
  options: Array<{ value: string; label: string }>;
}) {
  if (!valor) return null;
  const option = options.find(o => o.value === valor);
  if (!option) return null;
  
  const colorMap: Record<string, string> = {
    excelente: 'bg-green-500/20 text-green-700 border-green-500/30',
    bom: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
    normal: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
    regular: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
    leve_restricao: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
    insuficiente: 'bg-red-500/20 text-red-700 border-red-500/30',
    deficiente: 'bg-red-500/20 text-red-700 border-red-500/30',
    moderada_restricao: 'bg-orange-500/20 text-orange-700 border-orange-500/30',
    grave_restricao: 'bg-red-500/20 text-red-700 border-red-500/30',
  };
  
  return (
    <Badge 
      variant="outline" 
      className={colorMap[valor] || 'bg-muted text-muted-foreground'}
    >
      {option.label}
    </Badge>
  );
}

/**
 * Indicador de comparação com avaliação anterior
 */
function ComparacaoIndicador({ 
  label,
  atual, 
  anterior,
  options 
}: { 
  label: string;
  atual: string | null; 
  anterior: string | null;
  options: Array<{ value: string; label: string }>;
}) {
  if (!atual || !anterior || atual === anterior) return null;
  
  const atualIdx = options.findIndex(o => o.value === atual);
  const anteriorIdx = options.findIndex(o => o.value === anterior);
  
  const melhorou = atualIdx < anteriorIdx;
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <Badge 
        variant="outline" 
        className={melhorou 
          ? 'bg-green-500/10 text-green-600 border-green-500/30' 
          : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
        }
      >
        {melhorou ? '↑ Melhorou' : '↓ Alterado'}
      </Badge>
    </div>
  );
}

/**
 * Formulário de Avaliação Funcional Pilates
 */
function AvaliacaoForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialData: AvaliacaoFuncionalPilatesFormData;
  onSubmit: (data: AvaliacaoFuncionalPilatesFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<AvaliacaoFuncionalPilatesFormData>(initialData);
  const [selectedTestes, setSelectedTestes] = useState<string[]>(
    Object.keys(initialData.testes_resultados)
  );

  const handleChange = (field: keyof AvaliacaoFuncionalPilatesFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegiaoChange = (regiao: string, valor: string) => {
    setFormData(prev => ({
      ...prev,
      mobilidade_regioes: {
        ...prev.mobilidade_regioes,
        [regiao]: valor,
      },
    }));
  };

  const handleTesteToggle = (testeKey: string) => {
    setSelectedTestes(prev => {
      if (prev.includes(testeKey)) {
        // Remove teste e resultado
        const newTestes = prev.filter(t => t !== testeKey);
        const newResultados = { ...formData.testes_resultados };
        delete newResultados[testeKey];
        setFormData(p => ({ ...p, testes_resultados: newResultados }));
        return newTestes;
      } else {
        return [...prev, testeKey];
      }
    });
  };

  const handleTesteResultado = (testeKey: string, resultado: string, observacao?: string) => {
    setFormData(prev => ({
      ...prev,
      testes_resultados: {
        ...prev.testes_resultados,
        [testeKey]: { resultado, observacao },
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ScrollArea className="h-[60vh] pr-4">
        <Tabs defaultValue="mobilidade" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="mobilidade" className="text-xs">Mobilidade / Força</TabsTrigger>
            <TabsTrigger value="core" className="text-xs">Core / Equilíbrio</TabsTrigger>
            <TabsTrigger value="testes" className="text-xs">Testes Funcionais</TabsTrigger>
          </TabsList>

          {/* Mobilidade Articular */}
          <TabsContent value="mobilidade" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Move className="h-4 w-4 text-primary" />
                <Label className="font-semibold">Mobilidade Articular</Label>
              </div>
              
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mobilidade_articular">Avaliação Geral</Label>
                  <Select
                    value={formData.mobilidade_articular}
                    onValueChange={(value) => handleChange('mobilidade_articular', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {MOBILIDADE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobilidade_obs">Observações</Label>
                  <Textarea
                    id="mobilidade_obs"
                    placeholder="Detalhes sobre a mobilidade..."
                    value={formData.mobilidade_obs}
                    onChange={(e) => handleChange('mobilidade_obs', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              
              {/* Mobilidade por região */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Mobilidade por Região</Label>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {REGIOES_MOBILIDADE.map(regiao => (
                    <div key={regiao.key} className="flex items-center gap-2">
                      <span className="text-sm min-w-[120px]">{regiao.label}</span>
                      <Select
                        value={formData.mobilidade_regioes[regiao.key] || ''}
                        onValueChange={(value) => handleRegiaoChange(regiao.key, value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {MOBILIDADE_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Força Funcional */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-primary" />
                <Label className="font-semibold">Força Funcional</Label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="forca_funcional">Avaliação Geral</Label>
                  <Select
                    value={formData.forca_funcional}
                    onValueChange={(value) => handleChange('forca_funcional', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FORCA_FUNCIONAL_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forca_obs">Observações</Label>
                  <Textarea
                    id="forca_obs"
                    placeholder="Grupos musculares, assimetrias..."
                    value={formData.forca_obs}
                    onChange={(e) => handleChange('forca_obs', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Postura */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <Label className="font-semibold">Observações Posturais</Label>
              </div>
              <Textarea
                placeholder="Descreva alterações posturais observadas (vista anterior, posterior, lateral)..."
                value={formData.postura_observacoes}
                onChange={(e) => handleChange('postura_observacoes', e.target.value)}
                rows={4}
              />
            </div>
          </TabsContent>

          {/* Core e Equilíbrio */}
          <TabsContent value="core" className="space-y-6 mt-4">
            {/* Controle do Core */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-primary" />
                <Label className="font-semibold">Controle do Core</Label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="core_control">Avaliação</Label>
                  <Select
                    value={formData.core_control}
                    onValueChange={(value) => handleChange('core_control', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CORE_CONTROL_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="core_obs">Observações</Label>
                  <Textarea
                    id="core_obs"
                    placeholder="Capacidade de ativar transverso, assoalho pélvico..."
                    value={formData.core_obs}
                    onChange={(e) => handleChange('core_obs', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Equilíbrio */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                <Label className="font-semibold">Equilíbrio</Label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="equilibrio">Avaliação</Label>
                  <Select
                    value={formData.equilibrio}
                    onValueChange={(value) => handleChange('equilibrio', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUILIBRIO_PILATES_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equilibrio_obs">Observações</Label>
                  <Textarea
                    id="equilibrio_obs"
                    placeholder="Descreva compensações, estratégias..."
                    value={formData.equilibrio_obs}
                    onChange={(e) => handleChange('equilibrio_obs', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Padrão Respiratório */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-primary" />
                <Label className="font-semibold">Padrão Respiratório</Label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="padrao_respiratorio">Tipo</Label>
                  <Select
                    value={formData.padrao_respiratorio}
                    onValueChange={(value) => handleChange('padrao_respiratorio', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {RESPIRACAO_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="respiracao_obs">Observações</Label>
                  <Textarea
                    id="respiracao_obs"
                    placeholder="Coordenação respiração/movimento..."
                    value={formData.respiracao_obs}
                    onChange={(e) => handleChange('respiracao_obs', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Testes Funcionais */}
          <TabsContent value="testes" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                <Label className="font-semibold">Testes Funcionais de Pilates</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Selecione os testes realizados e registre os resultados.
              </p>
              
              <div className="space-y-3">
                {TESTES_FUNCIONAIS_PILATES.map(teste => (
                  <div key={teste.key} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={teste.key}
                        checked={selectedTestes.includes(teste.key)}
                        onCheckedChange={() => handleTesteToggle(teste.key)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={teste.key}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {teste.label}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {teste.description}
                        </p>
                      </div>
                    </div>
                    
                    {selectedTestes.includes(teste.key) && (
                      <div className="ml-7 grid gap-2 md:grid-cols-2">
                        <Select
                          value={formData.testes_resultados[teste.key]?.resultado || ''}
                          onValueChange={(value) => handleTesteResultado(
                            teste.key, 
                            value, 
                            formData.testes_resultados[teste.key]?.observacao
                          )}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Resultado..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="executa_bem">Executa Bem</SelectItem>
                            <SelectItem value="executa_compensacoes">Executa com Compensações</SelectItem>
                            <SelectItem value="dificuldade">Dificuldade</SelectItem>
                            <SelectItem value="nao_executa">Não Executa</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea
                          placeholder="Observações do teste..."
                          value={formData.testes_resultados[teste.key]?.observacao || ''}
                          onChange={(e) => handleTesteResultado(
                            teste.key,
                            formData.testes_resultados[teste.key]?.resultado || '',
                            e.target.value
                          )}
                          rows={1}
                          className="h-8 min-h-8 resize-none"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Outros testes */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="testes_funcionais">Outros Testes / Observações</Label>
              <Textarea
                id="testes_funcionais"
                placeholder="Outros testes aplicados e resultados..."
                value={formData.testes_funcionais}
                onChange={(e) => handleChange('testes_funcionais', e.target.value)}
                rows={3}
              />
            </div>

            {/* Objetivos */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <Label htmlFor="objetivos_pilates">Objetivos do Pilates</Label>
              </div>
              <Textarea
                id="objetivos_pilates"
                placeholder="Objetivos definidos para o programa de Pilates..."
                value={formData.objetivos_pilates}
                onChange={(e) => handleChange('objetivos_pilates', e.target.value)}
                rows={3}
              />
            </div>

            {/* Observações gerais */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="observacoes_gerais">Observações Gerais</Label>
              <Textarea
                id="observacoes_gerais"
                placeholder="Outras observações relevantes..."
                value={formData.observacoes_gerais}
                onChange={(e) => handleChange('observacoes_gerais', e.target.value)}
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>
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
 * Card de visualização de uma avaliação
 */
function AvaliacaoCard({
  avaliacao,
  avaliacaoAnterior,
  isLatest,
}: {
  avaliacao: AvaliacaoFuncionalPilatesData;
  avaliacaoAnterior: AvaliacaoFuncionalPilatesData | null;
  isLatest: boolean;
}) {
  const renderSection = (
    icon: React.ReactNode,
    label: string,
    valor: string | null,
    observacao: string | null,
    options: Array<{ value: string; label: string }>
  ) => {
    if (!valor) return null;
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon}
          {label}
        </p>
        <div className="flex items-center gap-2">
          <NivelIndicador valor={valor} options={options} />
          {observacao && (
            <span className="text-sm text-muted-foreground">— {observacao}</span>
          )}
        </div>
      </div>
    );
  };

  const getTesteResultadoLabel = (resultado: string) => {
    const labels: Record<string, string> = {
      executa_bem: 'Executa Bem',
      executa_compensacoes: 'Compensações',
      dificuldade: 'Dificuldade',
      nao_executa: 'Não Executa',
    };
    return labels[resultado] || resultado;
  };

  return (
    <Card className={isLatest ? 'border-primary/50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {isLatest && <Badge variant="default" className="text-xs">Atual</Badge>}
              Avaliação Funcional
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
          
          {/* Indicadores de evolução */}
          {isLatest && avaliacaoAnterior && (
            <div className="flex flex-col gap-1">
              <ComparacaoIndicador 
                label="Core"
                atual={avaliacao.core_control} 
                anterior={avaliacaoAnterior.core_control}
                options={CORE_CONTROL_OPTIONS}
              />
              <ComparacaoIndicador 
                label="Equilíbrio"
                atual={avaliacao.equilibrio} 
                anterior={avaliacaoAnterior.equilibrio}
                options={EQUILIBRIO_PILATES_OPTIONS}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {renderSection(
            <Move className="h-3 w-3" />,
            'Mobilidade Articular',
            avaliacao.mobilidade_articular,
            avaliacao.mobilidade_obs,
            MOBILIDADE_OPTIONS
          )}
          {renderSection(
            <Dumbbell className="h-3 w-3" />,
            'Força Funcional',
            avaliacao.forca_funcional,
            avaliacao.forca_obs,
            FORCA_FUNCIONAL_OPTIONS
          )}
          {renderSection(
            <Circle className="h-3 w-3" />,
            'Controle do Core',
            avaliacao.core_control,
            avaliacao.core_obs,
            CORE_CONTROL_OPTIONS
          )}
          {renderSection(
            <Scale className="h-3 w-3" />,
            'Equilíbrio',
            avaliacao.equilibrio,
            avaliacao.equilibrio_obs,
            EQUILIBRIO_PILATES_OPTIONS
          )}
          {renderSection(
            <Wind className="h-3 w-3" />,
            'Padrão Respiratório',
            avaliacao.padrao_respiratorio,
            avaliacao.respiracao_obs,
            RESPIRACAO_OPTIONS
          )}
        </div>

        {/* Mobilidade por região */}
        {avaliacao.mobilidade_regioes && Object.keys(avaliacao.mobilidade_regioes).length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">Mobilidade por Região</p>
            <div className="flex flex-wrap gap-2">
              {REGIOES_MOBILIDADE.map(regiao => {
                const valor = avaliacao.mobilidade_regioes?.[regiao.key];
                if (!valor) return null;
                return (
                  <div key={regiao.key} className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">{regiao.label}:</span>
                    <NivelIndicador valor={valor} options={MOBILIDADE_OPTIONS} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Testes funcionais */}
        {avaliacao.testes_resultados && Object.keys(avaliacao.testes_resultados).length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ClipboardCheck className="h-3 w-3" />
              Testes Funcionais
            </p>
            <div className="space-y-1">
              {Object.entries(avaliacao.testes_resultados).map(([key, value]) => {
                const teste = TESTES_FUNCIONAIS_PILATES.find(t => t.key === key);
                if (!teste) return null;
                return (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{teste.label}:</span>
                    <Badge variant="outline" className="text-xs">
                      {getTesteResultadoLabel(value.resultado)}
                    </Badge>
                    {value.observacao && (
                      <span className="text-muted-foreground text-xs">— {value.observacao}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Observações posturais */}
        {avaliacao.postura_observacoes && (
          <div className="space-y-1 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">Observações Posturais</p>
            <p className="text-sm whitespace-pre-wrap">{avaliacao.postura_observacoes}</p>
          </div>
        )}

        {/* Objetivos */}
        {avaliacao.objetivos_pilates && (
          <div className="space-y-1 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-3 w-3" />
              Objetivos do Pilates
            </p>
            <p className="text-sm whitespace-pre-wrap">{avaliacao.objetivos_pilates}</p>
          </div>
        )}

        {/* Observações gerais */}
        {avaliacao.observacoes_gerais && (
          <div className="space-y-1 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">Observações Gerais</p>
            <p className="text-sm whitespace-pre-wrap">{avaliacao.observacoes_gerais}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AvaliacaoFuncionalPilatesBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
}: AvaliacaoFuncionalPilatesBlockProps) {
  const {
    currentAvaliacao,
    previousAvaliacao,
    history,
    loading,
    isFormOpen,
    setIsFormOpen,
    saveAvaliacao,
    isSaving,
  } = useAvaliacaoFuncionalPilatesData({ patientId, clinicId, professionalId });

  const [viewMode, setViewMode] = useState<'current' | 'history'>('current');

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
          <p className="text-muted-foreground">Selecione um paciente para visualizar a avaliação funcional.</p>
        </CardContent>
      </Card>
    );
  }

  const getInitialFormData = (): AvaliacaoFuncionalPilatesFormData => {
    if (currentAvaliacao) {
      return {
        mobilidade_articular: currentAvaliacao.mobilidade_articular || '',
        mobilidade_obs: currentAvaliacao.mobilidade_obs || '',
        mobilidade_regioes: currentAvaliacao.mobilidade_regioes || {},
        forca_funcional: currentAvaliacao.forca_funcional || '',
        forca_obs: currentAvaliacao.forca_obs || '',
        equilibrio: currentAvaliacao.equilibrio || '',
        equilibrio_obs: currentAvaliacao.equilibrio_obs || '',
        core_control: currentAvaliacao.core_control || '',
        core_obs: currentAvaliacao.core_obs || '',
        padrao_respiratorio: currentAvaliacao.padrao_respiratorio || '',
        respiracao_obs: currentAvaliacao.respiracao_obs || '',
        testes_funcionais: currentAvaliacao.testes_funcionais || '',
        testes_resultados: currentAvaliacao.testes_resultados || {},
        postura_observacoes: currentAvaliacao.postura_observacoes || '',
        objetivos_pilates: currentAvaliacao.objetivos_pilates || '',
        observacoes_gerais: currentAvaliacao.observacoes_gerais || '',
      };
    }
    return getEmptyAvaliacaoFormPilates();
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Avaliação Funcional</h2>
            <p className="text-sm text-muted-foreground">
              {history.length > 0 
                ? `${history.length} avaliação(ões) registrada(s)` 
                : 'Nenhuma avaliação registrada'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 1 && (
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'current' | 'history')}>
              <TabsList>
                <TabsTrigger value="current">Atual</TabsTrigger>
                <TabsTrigger value="history">Histórico ({history.length})</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          {canEdit && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      {history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma avaliação funcional registrada.</p>
            {canEdit && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Avaliação
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'current' ? (
        <AvaliacaoCard
          avaliacao={currentAvaliacao!}
          avaliacaoAnterior={previousAvaliacao}
          isLatest={true}
        />
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-4 pr-4">
            {history.map((avaliacao, index) => (
              <AvaliacaoCard
                key={avaliacao.id}
                avaliacao={avaliacao}
                avaliacaoAnterior={history[index + 1] || null}
                isLatest={index === 0}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Dialog de nova avaliação */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Nova Avaliação Funcional
            </DialogTitle>
            <DialogDescription>
              Registre a avaliação funcional do aluno para o programa de Pilates.
            </DialogDescription>
          </DialogHeader>
          <AvaliacaoForm
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
