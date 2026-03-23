/**
 * NUTRIÇÃO - Metas Nutricionais
 * 
 * Bloco para acompanhamento de metas nutricionais do paciente.
 * Inclui metas de peso, composição corporal e hábitos alimentares.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  Plus, 
  TrendingUp,
  Trophy,
  Clock,
  Calendar,
  Save
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TIPO_META_LABELS, 
  STATUS_META_LABELS, 
  PRIORIDADE_META_LABELS,
  type MetaNutricional, 
  type MetaFormData,
  type TipoMeta,
  type PrioridadeMeta
} from '@/hooks/prontuario/nutricao';

interface MetasNutricionaisBlockProps {
  metas: MetaNutricional[];
  metasEmAndamento: MetaNutricional[];
  metasAlcancadas: MetaNutricional[];
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  onCreateMeta: (data: MetaFormData) => Promise<unknown>;
  onUpdateProgress: (metaId: string, novoValor: number, observacao?: string) => Promise<boolean>;
}

const initialFormData: MetaFormData = {
  tipo: 'peso',
  titulo: '',
  descricao: null,
  prioridade: 'media',
  valor_inicial: null,
  valor_meta: null,
  unidade: 'kg',
  data_prazo: null,
};

export function MetasNutricionaisBlock({
  metas,
  metasEmAndamento,
  metasAlcancadas,
  loading,
  saving,
  canEdit,
  onCreateMeta,
  onUpdateProgress,
}: MetasNutricionaisBlockProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<MetaFormData>(initialFormData);
  const [showAlcancadas, setShowAlcancadas] = useState(false);
  const [progressInputs, setProgressInputs] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onCreateMeta(formData);
    if (result) {
      setFormData(initialFormData);
      setShowForm(false);
    }
  };

  const updateField = <K extends keyof MetaFormData>(field: K, value: MetaFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateProgress = async (metaId: string) => {
    const value = progressInputs[metaId];
    if (value) {
      await onUpdateProgress(metaId, parseFloat(value));
      setProgressInputs(prev => ({ ...prev, [metaId]: '' }));
    }
  };

  // Definir unidade baseada no tipo
  const getUnitForType = (tipo: TipoMeta): string => {
    switch (tipo) {
      case 'peso': return 'kg';
      case 'gordura_corporal': return '%';
      case 'massa_muscular': return 'kg';
      case 'circunferencia': return 'cm';
      default: return '';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold">Metas Nutricionais</h2>
        </div>
        <div className="flex gap-2">
          {metasAlcancadas.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAlcancadas(!showAlcancadas)}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Alcançadas ({metasAlcancadas.length})
            </Button>
          )}
          {canEdit && !showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          )}
        </div>
      </div>

      {/* Formulário */}
      {showForm && canEdit && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Meta Nutricional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo de Meta</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: TipoMeta) => {
                      updateField('tipo', value);
                      updateField('unidade', getUnitForType(value));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPO_META_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="titulo">Título da Meta</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Reduzir peso para 70kg"
                    value={formData.titulo}
                    onChange={(e) => updateField('titulo', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="valor_inicial">Valor Inicial</Label>
                  <div className="flex gap-2">
                    <Input
                      id="valor_inicial"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 80"
                      value={formData.valor_inicial ?? ''}
                      onChange={(e) => updateField('valor_inicial', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                    <span className="flex items-center text-sm text-muted-foreground">
                      {formData.unidade}
                    </span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="valor_meta">Valor Meta</Label>
                  <div className="flex gap-2">
                    <Input
                      id="valor_meta"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 70"
                      value={formData.valor_meta ?? ''}
                      onChange={(e) => updateField('valor_meta', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                    <span className="flex items-center text-sm text-muted-foreground">
                      {formData.unidade}
                    </span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select
                    value={formData.prioridade}
                    onValueChange={(value: PrioridadeMeta) => updateField('prioridade', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORIDADE_META_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="data_prazo">Prazo</Label>
                  <Input
                    id="data_prazo"
                    type="date"
                    value={formData.data_prazo ?? ''}
                    onChange={(e) => updateField('data_prazo', e.target.value || null)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || !formData.titulo}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Criar Meta'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Metas em Andamento */}
      {metasEmAndamento.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Em Andamento
          </h3>
          {metasEmAndamento.map((meta) => (
            <Card key={meta.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{TIPO_META_LABELS[meta.tipo]}</Badge>
                      <Badge 
                        variant={meta.prioridade === 'alta' ? 'destructive' : meta.prioridade === 'media' ? 'default' : 'secondary'}
                      >
                        {PRIORIDADE_META_LABELS[meta.prioridade]}
                      </Badge>
                    </div>
                    <p className="font-medium">{meta.titulo}</p>
                  </div>
                  {meta.data_prazo && (
                    <div className="text-right text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {format(new Date(meta.data_prazo), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  )}
                </div>

                {/* Progresso */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Inicial: {meta.valor_inicial} {meta.unidade}
                    </span>
                    <span className="font-medium">
                      Atual: {meta.valor_atual} {meta.unidade}
                    </span>
                    <span className="text-green-600">
                      Meta: {meta.valor_meta} {meta.unidade}
                    </span>
                  </div>
                  <Progress value={meta.progresso_percent} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {meta.progresso_percent}% concluído
                    </span>
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Novo valor"
                          className="w-24 h-8 text-sm"
                          value={progressInputs[meta.id] ?? ''}
                          onChange={(e) => setProgressInputs(prev => ({ ...prev, [meta.id]: e.target.value }))}
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpdateProgress(meta.id)}
                          disabled={!progressInputs[meta.id]}
                        >
                          <TrendingUp className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Histórico de acompanhamento */}
                {meta.acompanhamentos.length > 1 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Últimos registros:</p>
                    <div className="flex gap-2 overflow-x-auto">
                      {meta.acompanhamentos.slice(-5).reverse().map((acomp, index) => (
                        <div 
                          key={index}
                          className="text-xs bg-muted px-2 py-1 rounded shrink-0"
                        >
                          <span className="font-medium">{acomp.valor} {meta.unidade}</span>
                          <span className="text-muted-foreground ml-1">
                            ({format(new Date(acomp.data), "dd/MM", { locale: ptBR })})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Metas Alcançadas */}
      {showAlcancadas && metasAlcancadas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-green-600 flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Metas Alcançadas
          </h3>
          {metasAlcancadas.map((meta) => (
            <Card key={meta.id} className="bg-green-50/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{meta.titulo}</p>
                      <p className="text-sm text-muted-foreground">
                        {meta.valor_inicial} → {meta.valor_meta} {meta.unidade}
                      </p>
                    </div>
                  </div>
                  {meta.data_alcancada && (
                    <Badge variant="outline" className="text-green-600">
                      Alcançada em {format(new Date(meta.data_alcancada), "dd/MM/yyyy", { locale: ptBR })}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {metas.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma meta nutricional definida.</p>
            {canEdit && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Definir Primeira Meta
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
