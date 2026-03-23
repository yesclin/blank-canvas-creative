/**
 * NUTRIÇÃO - Evolução / Retorno
 * 
 * Módulo principal de uso diário do nutricionista.
 * Permite registrar evoluções recorrentes com comparativo automático.
 * 
 * Campos obrigatórios:
 * - Data do atendimento
 * - Peso atual
 * - Medidas atuais (cintura, quadril, outras)
 * - Comparativo automático com consulta anterior
 * - Nível de adesão ao plano alimentar
 * - Dificuldades relatadas pelo paciente
 * - Ajustes realizados no plano alimentar
 * - Nova conduta nutricional
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Plus, 
  Save,
  Calendar,
  User,
  Scale,
  Ruler,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertCircle,
  Target,
  FileText,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useEvolucaoRetornoData,
  type EvolucaoRetorno,
  type EvolucaoRetornoFormData,
  type MedidasEvolucao,
  type NivelAdesao,
  type ComparativoEvolucao,
  NIVEL_ADESAO_LABELS,
  NIVEL_ADESAO_COLORS,
} from '@/hooks/prontuario/nutricao/useEvolucaoRetornoData';
import { cn } from '@/lib/utils';

interface EvolucaoRetornoBlockProps {
  patientId: string;
  appointmentId?: string;
  canEdit: boolean;
  professionalId?: string;
}

const initialMedidas: MedidasEvolucao = {
  cintura_cm: null,
  quadril_cm: null,
  braco_cm: null,
  coxa_cm: null,
  outras_medidas: null,
};

const initialFormData: EvolucaoRetornoFormData = {
  data_atendimento: new Date().toISOString().split('T')[0],
  peso_atual_kg: null,
  medidas: initialMedidas,
  nivel_adesao: null,
  adesao_detalhes: null,
  dificuldades_relatadas: '',
  ajustes_realizados: '',
  nova_conduta: '',
  observacoes: null,
};

// Componente de variação
function VariacaoIndicator({ valor, unidade = 'kg', invertido = false }: { 
  valor: number | null; 
  unidade?: string;
  invertido?: boolean;
}) {
  if (valor === null) return <span className="text-muted-foreground">--</span>;
  
  const positivo = valor > 0;
  const negativo = valor < 0;
  const neutro = valor === 0;
  
  // Para medidas como cintura, perder é bom (invertido)
  const corPositiva = invertido ? 'text-destructive' : 'text-green-600';
  const corNegativa = invertido ? 'text-green-600' : 'text-destructive';
  
  return (
    <span className={cn(
      'flex items-center gap-1 font-medium',
      positivo && corPositiva,
      negativo && corNegativa,
      neutro && 'text-muted-foreground'
    )}>
      {positivo && <ArrowUpRight className="h-3 w-3" />}
      {negativo && <ArrowDownRight className="h-3 w-3" />}
      {neutro && <Minus className="h-3 w-3" />}
      {positivo ? '+' : ''}{valor} {unidade}
    </span>
  );
}

// Card de comparativo
function ComparativoCard({ comparativo, pesoAtual, medidasAtuais }: {
  comparativo: ComparativoEvolucao;
  pesoAtual: number | null;
  medidasAtuais: MedidasEvolucao;
}) {
  const pesoVariacao = useMemo(() => {
    if (!pesoAtual || !comparativo.peso_anterior) return null;
    return Number((pesoAtual - comparativo.peso_anterior).toFixed(1));
  }, [pesoAtual, comparativo.peso_anterior]);

  const cinturaVariacao = useMemo(() => {
    if (!medidasAtuais.cintura_cm || !comparativo.cintura_anterior) return null;
    return Number((medidasAtuais.cintura_cm - comparativo.cintura_anterior).toFixed(1));
  }, [medidasAtuais.cintura_cm, comparativo.cintura_anterior]);

  const quadrilVariacao = useMemo(() => {
    if (!medidasAtuais.quadril_cm || !comparativo.quadril_anterior) return null;
    return Number((medidasAtuais.quadril_cm - comparativo.quadril_anterior).toFixed(1));
  }, [medidasAtuais.quadril_cm, comparativo.quadril_anterior]);

  if (!comparativo.data_anterior) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            Primeira evolução do paciente - sem dados anteriores para comparação
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Comparativo com Última Consulta
          <Badge variant="outline" className="ml-auto">
            {comparativo.dias_desde_ultima} dias atrás
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-2 bg-background rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Peso Anterior</p>
            <p className="font-semibold">{comparativo.peso_anterior} kg</p>
            {pesoVariacao !== null && (
              <VariacaoIndicator valor={pesoVariacao} unidade="kg" invertido />
            )}
          </div>
          {comparativo.cintura_anterior && (
            <div className="p-2 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Cintura Anterior</p>
              <p className="font-semibold">{comparativo.cintura_anterior} cm</p>
              {cinturaVariacao !== null && (
                <VariacaoIndicator valor={cinturaVariacao} unidade="cm" invertido />
              )}
            </div>
          )}
          {comparativo.quadril_anterior && (
            <div className="p-2 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Quadril Anterior</p>
              <p className="font-semibold">{comparativo.quadril_anterior} cm</p>
              {quadrilVariacao !== null && (
                <VariacaoIndicator valor={quadrilVariacao} unidade="cm" invertido />
              )}
            </div>
          )}
          <div className="p-2 bg-background rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Data Anterior</p>
            <p className="font-semibold">
              {format(new Date(comparativo.data_anterior), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EvolucaoRetornoBlock({
  patientId,
  appointmentId,
  canEdit,
  professionalId,
}: EvolucaoRetornoBlockProps) {
  const {
    evolucoes,
    lastEvolucao,
    comparativoAtual,
    loading,
    saving,
    saveEvolucao,
    calcularComparativo,
  } = useEvolucaoRetornoData(patientId, professionalId);

  const [showForm, setShowForm] = useState(false);
  const [selectedEvolucao, setSelectedEvolucao] = useState<EvolucaoRetorno | null>(null);
  const [formData, setFormData] = useState<EvolucaoRetornoFormData>(initialFormData);

  // Comparativo em tempo real
  const comparativoTempoReal = useMemo(() => {
    return calcularComparativo(formData.peso_atual_kg, formData.medidas);
  }, [formData.peso_atual_kg, formData.medidas, calcularComparativo]);

  // Reset form quando fecha
  useEffect(() => {
    if (!showForm) {
      setFormData(initialFormData);
    }
  }, [showForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalId) return;

    const result = await saveEvolucao(formData, appointmentId);
    if (result) {
      setShowForm(false);
    }
  };

  const updateField = <K extends keyof EvolucaoRetornoFormData>(
    field: K, 
    value: EvolucaoRetornoFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateMedida = (campo: keyof MedidasEvolucao, valor: number | null) => {
    setFormData(prev => ({
      ...prev,
      medidas: { ...prev.medidas, [campo]: valor },
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Visualização de evolução específica
  if (selectedEvolucao) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedEvolucao(null)}>
            <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
            Voltar
          </Button>
          <Badge variant="outline">
            <Calendar className="h-3 w-3 mr-1" />
            {format(new Date(selectedEvolucao.data_atendimento), "dd/MM/yyyy", { locale: ptBR })}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Evolução / Retorno
            </CardTitle>
            {selectedEvolucao.professional_name && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {selectedEvolucao.professional_name}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dados antropométricos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Peso</p>
                <p className="font-semibold text-lg">{selectedEvolucao.peso_atual_kg} kg</p>
              </div>
              {selectedEvolucao.medidas.cintura_cm && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Cintura</p>
                  <p className="font-semibold text-lg">{selectedEvolucao.medidas.cintura_cm} cm</p>
                </div>
              )}
              {selectedEvolucao.medidas.quadril_cm && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Quadril</p>
                  <p className="font-semibold text-lg">{selectedEvolucao.medidas.quadril_cm} cm</p>
                </div>
              )}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Adesão</p>
                <Badge className={cn('mt-1', NIVEL_ADESAO_COLORS[selectedEvolucao.nivel_adesao])}>
                  {NIVEL_ADESAO_LABELS[selectedEvolucao.nivel_adesao]}
                </Badge>
              </div>
            </div>

            {/* Dificuldades */}
            {selectedEvolucao.dificuldades_relatadas && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Dificuldades Relatadas
                </h4>
                <p className="text-sm bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border-l-2 border-amber-500">
                  {selectedEvolucao.dificuldades_relatadas}
                </p>
              </div>
            )}

            {/* Ajustes realizados */}
            {selectedEvolucao.ajustes_realizados && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Ajustes Realizados no Plano
                </h4>
                <p className="text-sm bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border-l-2 border-blue-500">
                  {selectedEvolucao.ajustes_realizados}
                </p>
              </div>
            )}

            {/* Nova conduta */}
            {selectedEvolucao.nova_conduta && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Nova Conduta Nutricional
                </h4>
                <p className="text-sm bg-primary/5 p-3 rounded-lg border-l-2 border-primary">
                  {selectedEvolucao.nova_conduta}
                </p>
              </div>
            )}

            {/* Observações */}
            {selectedEvolucao.observacoes && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Observações</h4>
                <p className="text-sm">{selectedEvolucao.observacoes}</p>
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
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Evolução / Retorno</h2>
          {evolucoes.length > 0 && (
            <Badge variant="secondary">{evolucoes.length} registro(s)</Badge>
          )}
        </div>
        {canEdit && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Evolução
          </Button>
        )}
      </div>

      {/* Formulário de Nova Evolução */}
      {showForm && canEdit && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Evolução / Retorno
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Data do Atendimento */}
              <div className="max-w-xs">
                <Label htmlFor="data_atendimento">Data do Atendimento *</Label>
                <Input
                  id="data_atendimento"
                  type="date"
                  value={formData.data_atendimento}
                  onChange={(e) => updateField('data_atendimento', e.target.value)}
                  required
                />
              </div>

              {/* Comparativo (se houver evolução anterior) */}
              <ComparativoCard 
                comparativo={comparativoTempoReal} 
                pesoAtual={formData.peso_atual_kg}
                medidasAtuais={formData.medidas}
              />

              {/* Peso e Medidas */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="peso_atual_kg" className="flex items-center gap-1">
                    <Scale className="h-3 w-3" />
                    Peso Atual (kg) *
                  </Label>
                  <Input
                    id="peso_atual_kg"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 75.5"
                    value={formData.peso_atual_kg ?? ''}
                    onChange={(e) => updateField('peso_atual_kg', e.target.value ? parseFloat(e.target.value) : null)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cintura_cm" className="flex items-center gap-1">
                    <Ruler className="h-3 w-3" />
                    Cintura (cm)
                  </Label>
                  <Input
                    id="cintura_cm"
                    type="number"
                    step="0.1"
                    placeholder="cm"
                    value={formData.medidas.cintura_cm ?? ''}
                    onChange={(e) => updateMedida('cintura_cm', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="quadril_cm">Quadril (cm)</Label>
                  <Input
                    id="quadril_cm"
                    type="number"
                    step="0.1"
                    placeholder="cm"
                    value={formData.medidas.quadril_cm ?? ''}
                    onChange={(e) => updateMedida('quadril_cm', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="braco_cm">Braço (cm)</Label>
                  <Input
                    id="braco_cm"
                    type="number"
                    step="0.1"
                    placeholder="cm"
                    value={formData.medidas.braco_cm ?? ''}
                    onChange={(e) => updateMedida('braco_cm', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="coxa_cm">Coxa (cm)</Label>
                  <Input
                    id="coxa_cm"
                    type="number"
                    step="0.1"
                    placeholder="cm"
                    value={formData.medidas.coxa_cm ?? ''}
                    onChange={(e) => updateMedida('coxa_cm', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
              </div>

              <Separator />

              {/* Nível de Adesão */}
              <div>
                <Label className="mb-3 block">Nível de Adesão ao Plano Alimentar *</Label>
                <RadioGroup
                  value={formData.nivel_adesao || ''}
                  onValueChange={(value) => updateField('nivel_adesao', value as NivelAdesao)}
                  className="flex flex-wrap gap-3"
                >
                  {(Object.keys(NIVEL_ADESAO_LABELS) as NivelAdesao[]).map((nivel) => (
                    <div key={nivel} className="flex items-center space-x-2">
                      <RadioGroupItem value={nivel} id={`adesao-${nivel}`} />
                      <Label 
                        htmlFor={`adesao-${nivel}`} 
                        className={cn(
                          'cursor-pointer px-3 py-1 rounded-full border text-sm',
                          formData.nivel_adesao === nivel && NIVEL_ADESAO_COLORS[nivel]
                        )}
                      >
                        {NIVEL_ADESAO_LABELS[nivel]}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <Textarea
                  className="mt-3"
                  placeholder="Detalhes sobre a adesão (opcional)..."
                  value={formData.adesao_detalhes || ''}
                  onChange={(e) => updateField('adesao_detalhes', e.target.value || null)}
                  rows={2}
                />
              </div>

              <Separator />

              {/* Dificuldades Relatadas */}
              <div>
                <Label htmlFor="dificuldades_relatadas" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Dificuldades Relatadas pelo Paciente
                </Label>
                <Textarea
                  id="dificuldades_relatadas"
                  placeholder="Descreva as dificuldades que o paciente relatou em seguir o plano alimentar..."
                  value={formData.dificuldades_relatadas}
                  onChange={(e) => updateField('dificuldades_relatadas', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Ajustes Realizados */}
              <div>
                <Label htmlFor="ajustes_realizados" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Ajustes Realizados no Plano Alimentar
                </Label>
                <Textarea
                  id="ajustes_realizados"
                  placeholder="Descreva os ajustes feitos no plano alimentar durante esta consulta..."
                  value={formData.ajustes_realizados}
                  onChange={(e) => updateField('ajustes_realizados', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Nova Conduta */}
              <div>
                <Label htmlFor="nova_conduta" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Nova Conduta Nutricional
                </Label>
                <Textarea
                  id="nova_conduta"
                  placeholder="Defina a nova conduta nutricional a ser seguida até a próxima consulta..."
                  value={formData.nova_conduta}
                  onChange={(e) => updateField('nova_conduta', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="observacoes">Observações Adicionais</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Outras observações relevantes..."
                  value={formData.observacoes || ''}
                  onChange={(e) => updateField('observacoes', e.target.value || null)}
                  rows={2}
                />
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || !professionalId}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Registrar Evolução'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Evoluções (Histórico) */}
      {evolucoes.length > 0 && !showForm && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Histórico de Evoluções</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {evolucoes.map((evolucao, index) => (
                  <button
                    key={evolucao.id}
                    onClick={() => setSelectedEvolucao(evolucao)}
                    className="w-full p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? "default" : "outline"}>
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(evolucao.data_atendimento), "dd/MM/yyyy", { locale: ptBR })}
                        </Badge>
                        {index === 0 && <Badge variant="secondary">Mais recente</Badge>}
                        <Badge className={cn(NIVEL_ADESAO_COLORS[evolucao.nivel_adesao])}>
                          {NIVEL_ADESAO_LABELS[evolucao.nivel_adesao]}
                        </Badge>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Scale className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{evolucao.peso_atual_kg} kg</span>
                      </span>
                      {evolucao.medidas.cintura_cm && (
                        <span className="flex items-center gap-1">
                          <Ruler className="h-3 w-3 text-muted-foreground" />
                          Cintura: {evolucao.medidas.cintura_cm} cm
                        </span>
                      )}
                    </div>

                    {evolucao.professional_name && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {evolucao.professional_name}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {evolucoes.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhuma evolução registrada
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Registre a primeira evolução/retorno deste paciente
            </p>
            {canEdit && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeira Evolução
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
