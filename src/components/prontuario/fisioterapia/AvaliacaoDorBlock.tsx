/**
 * FISIOTERAPIA - Bloco de Avaliação de Dor
 * 
 * Permite registro de avaliações de dor com histórico comparativo.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
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
  Gauge, 
  Plus, 
  User,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Clock,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useAvaliacaoDorData, 
  getEmptyDorForm,
  TIPO_DOR_OPTIONS,
  FREQUENCIA_DOR_OPTIONS,
  REGIOES_CORPORAIS,
  type AvaliacaoDorFormData,
  type AvaliacaoDorData
} from '@/hooks/prontuario/fisioterapia/useAvaliacaoDorData';

interface AvaliacaoDorBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
}

/**
 * Retorna a cor do indicador de dor baseado no nível (0-10)
 */
function getPainLevelColor(level: number): string {
  if (level <= 3) return 'text-green-600';
  if (level <= 6) return 'text-yellow-600';
  return 'text-destructive';
}

function getPainLevelBg(level: number): string {
  if (level <= 3) return 'bg-green-500';
  if (level <= 6) return 'bg-yellow-500';
  return 'bg-destructive';
}

function getPainLevelLabel(level: number): string {
  if (level === 0) return 'Sem dor';
  if (level <= 3) return 'Dor leve';
  if (level <= 6) return 'Dor moderada';
  if (level <= 9) return 'Dor intensa';
  return 'Dor insuportável';
}

/**
 * Indicador de variação EVA
 */
function EvaVariacaoIndicador({ variacao }: { variacao: number | null }) {
  if (variacao === null || variacao === 0) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground text-sm">
        <Minus className="h-3 w-3" />
        Sem variação
      </span>
    );
  }
  
  // Diminuição da dor é positivo (verde)
  const isMelhora = variacao < 0;
  
  return (
    <span className={`flex items-center gap-1 text-sm font-medium ${isMelhora ? 'text-green-600' : 'text-destructive'}`}>
      {isMelhora ? (
        <TrendingDown className="h-3 w-3" />
      ) : (
        <TrendingUp className="h-3 w-3" />
      )}
      {variacao > 0 ? '+' : ''}{variacao} pontos
    </span>
  );
}

/**
 * Componente visual da escala EVA
 */
function EvaScale({ value, onChange, disabled = false }: { value: number; onChange?: (val: number) => void; disabled?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">0 - Sem dor</span>
        <span className="text-sm text-muted-foreground">10 - Dor máxima</span>
      </div>
      <div className="relative">
        <Slider
          value={[value]}
          onValueChange={(vals) => onChange?.(vals[0])}
          max={10}
          min={0}
          step={1}
          disabled={disabled}
          className="w-full"
        />
        {/* Escala visual de cores */}
        <div className="flex mt-2 h-2 rounded-full overflow-hidden">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div
              key={i}
              className={`flex-1 ${
                i <= 3 ? 'bg-green-500' : i <= 6 ? 'bg-yellow-500' : 'bg-red-500'
              } ${i === value ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              style={{ opacity: i <= value ? 1 : 0.3 }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <span className={`text-4xl font-bold ${getPainLevelColor(value)}`}>{value}</span>
        <Badge variant="outline" className={getPainLevelColor(value)}>
          {getPainLevelLabel(value)}
        </Badge>
      </div>
    </div>
  );
}

/**
 * Formulário de Avaliação de Dor
 */
function DorForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialData: AvaliacaoDorFormData;
  onSubmit: (data: AvaliacaoDorFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<AvaliacaoDorFormData>(initialData);

  const handleChange = (field: keyof AvaliacaoDorFormData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocalizacaoToggle = (regiao: string) => {
    const current = formData.localizacao;
    const updated = current.includes(regiao)
      ? current.filter(r => r !== regiao)
      : [...current, regiao];
    handleChange('localizacao', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Escala EVA */}
      <div className="p-4 border rounded-lg bg-muted/30">
        <Label className="flex items-center gap-2 mb-4">
          <Gauge className="h-4 w-4" />
          Escala Visual Analógica (EVA)
        </Label>
        <EvaScale
          value={formData.eva_score}
          onChange={(val) => handleChange('eva_score', val)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Tipo de Dor */}
        <div className="space-y-2">
          <Label htmlFor="tipo_dor" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Tipo de Dor
          </Label>
          <Select
            value={formData.tipo_dor}
            onValueChange={(value) => handleChange('tipo_dor', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo..." />
            </SelectTrigger>
            <SelectContent>
              {TIPO_DOR_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Frequência */}
        <div className="space-y-2">
          <Label htmlFor="frequencia" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Frequência
          </Label>
          <Select
            value={formData.frequencia}
            onValueChange={(value) => handleChange('frequencia', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a frequência..." />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIA_DOR_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Localização */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Localização da Dor
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-lg">
          {REGIOES_CORPORAIS.map(regiao => (
            <div key={regiao} className="flex items-center space-x-2">
              <Checkbox
                id={regiao}
                checked={formData.localizacao.includes(regiao)}
                onCheckedChange={() => handleLocalizacaoToggle(regiao)}
              />
              <label htmlFor={regiao} className="text-sm cursor-pointer">
                {regiao}
              </label>
            </div>
          ))}
        </div>
        <Textarea
          placeholder="Detalhes adicionais sobre a localização..."
          value={formData.localizacao_detalhe}
          onChange={(e) => handleChange('localizacao_detalhe', e.target.value)}
          rows={2}
        />
      </div>

      {/* Características */}
      <div className="space-y-2">
        <Label htmlFor="caracteristicas">Características da Dor</Label>
        <Textarea
          id="caracteristicas"
          placeholder="Descreva as características (queimação, pontada, latejante, em peso, etc.)..."
          value={formData.caracteristicas}
          onChange={(e) => handleChange('caracteristicas', e.target.value)}
          rows={2}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Fatores Agravantes */}
        <div className="space-y-2">
          <Label htmlFor="fatores_agravantes">Fatores Agravantes</Label>
          <Textarea
            id="fatores_agravantes"
            placeholder="O que piora a dor?"
            value={formData.fatores_agravantes}
            onChange={(e) => handleChange('fatores_agravantes', e.target.value)}
            rows={3}
          />
        </div>

        {/* Fatores Aliviadores */}
        <div className="space-y-2">
          <Label htmlFor="fatores_aliviadores">Fatores Aliviadores</Label>
          <Textarea
            id="fatores_aliviadores"
            placeholder="O que alivia a dor?"
            value={formData.fatores_aliviadores}
            onChange={(e) => handleChange('fatores_aliviadores', e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Impacto Funcional */}
      <div className="space-y-2">
        <Label htmlFor="impacto_funcional">Impacto Funcional</Label>
        <Textarea
          id="impacto_funcional"
          placeholder="Como a dor afeta as atividades diárias do paciente?"
          value={formData.impacto_funcional}
          onChange={(e) => handleChange('impacto_funcional', e.target.value)}
          rows={2}
        />
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
function DorCard({
  avaliacao,
  avaliacaoAnterior,
  isLatest,
}: {
  avaliacao: AvaliacaoDorData;
  avaliacaoAnterior: AvaliacaoDorData | null;
  isLatest: boolean;
}) {
  const evaVariacao = avaliacaoAnterior
    ? avaliacao.eva_score - avaliacaoAnterior.eva_score
    : null;

  const getTipoDorLabel = (value: string | null) => {
    return TIPO_DOR_OPTIONS.find(o => o.value === value)?.label || value;
  };

  const getFrequenciaLabel = (value: string | null) => {
    return FREQUENCIA_DOR_OPTIONS.find(o => o.value === value)?.label || value;
  };

  return (
    <Card className={isLatest ? 'border-primary/50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {isLatest && <Badge variant="default" className="text-xs">Atual</Badge>}
              Avaliação de Dor
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
          
          {/* Score EVA destacado */}
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-bold ${getPainLevelColor(avaliacao.eva_score)}`}>
                {avaliacao.eva_score}
              </span>
              <span className="text-muted-foreground">/10</span>
            </div>
            {isLatest && evaVariacao !== null && (
              <EvaVariacaoIndicador variacao={evaVariacao} />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra visual de intensidade */}
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div 
            className={`h-full transition-all ${getPainLevelBg(avaliacao.eva_score)}`}
            style={{ width: `${(avaliacao.eva_score / 10) * 100}%` }}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Tipo e Frequência */}
          <div className="flex flex-wrap gap-2">
            {avaliacao.tipo_dor && (
              <Badge variant="outline">
                <Zap className="h-3 w-3 mr-1" />
                {getTipoDorLabel(avaliacao.tipo_dor)}
              </Badge>
            )}
            {avaliacao.frequencia && (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {getFrequenciaLabel(avaliacao.frequencia)}
              </Badge>
            )}
          </div>

          {/* Localização */}
          {avaliacao.localizacao && avaliacao.localizacao.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Localização
              </p>
              <div className="flex flex-wrap gap-1">
                {avaliacao.localizacao.map(loc => (
                  <Badge key={loc} variant="secondary" className="text-xs">
                    {loc}
                  </Badge>
                ))}
              </div>
              {avaliacao.localizacao_detalhe && (
                <p className="text-sm text-muted-foreground">{avaliacao.localizacao_detalhe}</p>
              )}
            </div>
          )}

          {avaliacao.caracteristicas && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Características</p>
              <p className="text-sm">{avaliacao.caracteristicas}</p>
            </div>
          )}

          {avaliacao.fatores_agravantes && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Fatores Agravantes</p>
              <p className="text-sm">{avaliacao.fatores_agravantes}</p>
            </div>
          )}

          {avaliacao.fatores_aliviadores && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Fatores Aliviadores</p>
              <p className="text-sm">{avaliacao.fatores_aliviadores}</p>
            </div>
          )}

          {avaliacao.impacto_funcional && (
            <div className="space-y-1 md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Impacto Funcional</p>
              <p className="text-sm">{avaliacao.impacto_funcional}</p>
            </div>
          )}

          {avaliacao.observacoes && (
            <div className="space-y-1 md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Observações</p>
              <p className="text-sm">{avaliacao.observacoes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AvaliacaoDorBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
}: AvaliacaoDorBlockProps) {
  const {
    currentAvaliacao,
    previousAvaliacao,
    evaVariacao,
    history,
    loading,
    isFormOpen,
    setIsFormOpen,
    saveAvaliacao,
    isSaving,
  } = useAvaliacaoDorData({ patientId, clinicId, professionalId });

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
          <p className="text-muted-foreground">Selecione um paciente para visualizar a avaliação de dor.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <Gauge className="h-5 w-5 text-primary" />
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
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'current' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('current')}
              >
                Atual
              </Button>
              <Button
                variant={viewMode === 'history' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('history')}
              >
                Histórico ({history.length})
              </Button>
            </div>
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
            <Gauge className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma avaliação de dor registrada.</p>
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
            {viewMode === 'current' && currentAvaliacao ? (
              <DorCard
                avaliacao={currentAvaliacao}
                avaliacaoAnterior={previousAvaliacao}
                isLatest={true}
              />
            ) : (
              history.map((avaliacao, index) => (
                <DorCard
                  key={avaliacao.id}
                  avaliacao={avaliacao}
                  avaliacaoAnterior={history[index + 1] || null}
                  isLatest={index === 0}
                />
              ))
            )}
          </div>
        </ScrollArea>
      )}

      {/* Dialog do Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Avaliação de Dor</DialogTitle>
            <DialogDescription>
              Registre a avaliação da dor do paciente usando a escala EVA.
            </DialogDescription>
          </DialogHeader>
          <DorForm
            initialData={getEmptyDorForm()}
            onSubmit={saveAvaliacao}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSaving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
