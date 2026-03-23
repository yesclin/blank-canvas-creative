/**
 * FISIOTERAPIA - Bloco de Avaliação Funcional
 * 
 * Permite registro de avaliações funcionais com comparação evolutiva.
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
  TrendingUp,
  TrendingDown,
  Minus,
  Ruler,
  Dumbbell,
  Footprints,
  Scale,
  ClipboardCheck,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useAvaliacaoFuncionalData, 
  getEmptyAvaliacaoForm,
  EQUILIBRIO_OPTIONS,
  MARCHA_OPTIONS,
  type AvaliacaoFuncionalFormData,
  type AvaliacaoFuncionalData
} from '@/hooks/prontuario/fisioterapia/useAvaliacaoFuncionalData';

interface AvaliacaoFuncionalBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
}

/**
 * Indicador de evolução entre avaliações
 */
function EvolucaoIndicador({ 
  label,
  atual, 
  anterior,
  melhorSeMaior = true 
}: { 
  label: string;
  atual: string | null; 
  anterior: string | null;
  melhorSeMaior?: boolean;
}) {
  if (!atual || !anterior || atual === anterior) {
    return null;
  }

  // Para campos textuais, apenas mostrar que houve mudança
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <Badge variant="outline" className="text-xs">
        Alterado
      </Badge>
    </div>
  );
}

/**
 * Formulário de Avaliação Funcional
 */
function AvaliacaoForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialData: AvaliacaoFuncionalFormData;
  onSubmit: (data: AvaliacaoFuncionalFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<AvaliacaoFuncionalFormData>(initialData);

  const handleChange = (field: keyof AvaliacaoFuncionalFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="postura" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="postura">Postura</TabsTrigger>
          <TabsTrigger value="adm">ADM / Força</TabsTrigger>
          <TabsTrigger value="funcional">Funcional</TabsTrigger>
          <TabsTrigger value="marcha">Marcha</TabsTrigger>
        </TabsList>

        <TabsContent value="postura" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="postura" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Avaliação Postural
            </Label>
            <Textarea
              id="postura"
              placeholder="Descreva a postura do paciente (vista anterior, posterior, lateral)..."
              value={formData.postura}
              onChange={(e) => handleChange('postura', e.target.value)}
              rows={6}
            />
          </div>
        </TabsContent>

        <TabsContent value="adm" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="adm_descricao" className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Amplitude de Movimento (ADM)
            </Label>
            <Textarea
              id="adm_descricao"
              placeholder="Descreva as limitações de ADM encontradas (articulação, movimento, graus)..."
              value={formData.adm_descricao}
              onChange={(e) => handleChange('adm_descricao', e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="forca_muscular" className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Força Muscular
            </Label>
            <Textarea
              id="forca_muscular"
              placeholder="Descreva a avaliação de força muscular (grupos musculares, grau Oxford)..."
              value={formData.forca_muscular}
              onChange={(e) => handleChange('forca_muscular', e.target.value)}
              rows={4}
            />
          </div>
        </TabsContent>

        <TabsContent value="funcional" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="testes_funcionais" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Testes Funcionais
            </Label>
            <Textarea
              id="testes_funcionais"
              placeholder="Testes aplicados e resultados (ex: Teste de Thomas, Ober, Phalen, etc.)..."
              value={formData.testes_funcionais}
              onChange={(e) => handleChange('testes_funcionais', e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="equilibrio" className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Equilíbrio
              </Label>
              <Select
                value={formData.equilibrio}
                onValueChange={(value) => handleChange('equilibrio', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {EQUILIBRIO_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Observações sobre equilíbrio..."
                value={formData.equilibrio_obs}
                onChange={(e) => handleChange('equilibrio_obs', e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coordenacao">Coordenação</Label>
              <Textarea
                id="coordenacao"
                placeholder="Avaliação da coordenação motora..."
                value={formData.coordenacao}
                onChange={(e) => handleChange('coordenacao', e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="marcha" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="marcha" className="flex items-center gap-2">
              <Footprints className="h-4 w-4" />
              Padrão de Marcha
            </Label>
            <Select
              value={formData.marcha}
              onValueChange={(value) => handleChange('marcha', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o padrão de marcha..." />
              </SelectTrigger>
              <SelectContent>
                {MARCHA_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Descreva detalhes da marcha (fases alteradas, uso de auxiliares, etc.)..."
              value={formData.marcha_obs}
              onChange={(e) => handleChange('marcha_obs', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações Gerais</Label>
            <Textarea
              id="observacoes"
              placeholder="Outras observações clínicas relevantes..."
              value={formData.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              rows={3}
            />
          </div>
        </TabsContent>
      </Tabs>

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
  avaliacao: AvaliacaoFuncionalData;
  avaliacaoAnterior: AvaliacaoFuncionalData | null;
  isLatest: boolean;
}) {
  const getEquilibrioLabel = (value: string | null) => {
    return EQUILIBRIO_OPTIONS.find(o => o.value === value)?.label || value;
  };

  const getMarchaLabel = (value: string | null) => {
    return MARCHA_OPTIONS.find(o => o.value === value)?.label || value;
  };

  const renderField = (label: string, value: string | null, icon?: React.ReactNode) => {
    if (!value) return null;
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon}
          {label}
        </p>
        <p className="text-sm whitespace-pre-wrap">{value}</p>
      </div>
    );
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
              <EvolucaoIndicador 
                label="Equilíbrio"
                atual={avaliacao.equilibrio} 
                anterior={avaliacaoAnterior.equilibrio}
              />
              <EvolucaoIndicador 
                label="Marcha"
                atual={avaliacao.marcha} 
                anterior={avaliacaoAnterior.marcha}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {renderField('Postura', avaliacao.postura, <Eye className="h-3 w-3" />)}
          {renderField('Amplitude de Movimento', avaliacao.adm_descricao, <Ruler className="h-3 w-3" />)}
          {renderField('Força Muscular', avaliacao.forca_muscular, <Dumbbell className="h-3 w-3" />)}
          {renderField('Testes Funcionais', avaliacao.testes_funcionais, <ClipboardCheck className="h-3 w-3" />)}
          
          {avaliacao.equilibrio && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Scale className="h-3 w-3" />
                Equilíbrio
              </p>
              <Badge variant="outline">{getEquilibrioLabel(avaliacao.equilibrio)}</Badge>
              {avaliacao.equilibrio_obs && (
                <p className="text-sm text-muted-foreground mt-1">{avaliacao.equilibrio_obs}</p>
              )}
            </div>
          )}

          {renderField('Coordenação', avaliacao.coordenacao)}

          {avaliacao.marcha && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Footprints className="h-3 w-3" />
                Marcha
              </p>
              <Badge variant="outline">{getMarchaLabel(avaliacao.marcha)}</Badge>
              {avaliacao.marcha_obs && (
                <p className="text-sm text-muted-foreground mt-1">{avaliacao.marcha_obs}</p>
              )}
            </div>
          )}

          {renderField('Observações', avaliacao.observacoes)}
        </div>
      </CardContent>
    </Card>
  );
}

export function AvaliacaoFuncionalBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
}: AvaliacaoFuncionalBlockProps) {
  const {
    currentAvaliacao,
    previousAvaliacao,
    history,
    loading,
    isFormOpen,
    setIsFormOpen,
    saveAvaliacao,
    isSaving,
  } = useAvaliacaoFuncionalData({ patientId, clinicId, professionalId });

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

  const getInitialFormData = (): AvaliacaoFuncionalFormData => {
    if (currentAvaliacao) {
      return {
        postura: currentAvaliacao.postura || '',
        adm_descricao: currentAvaliacao.adm_descricao || '',
        adm_medidas: currentAvaliacao.adm_medidas || {},
        forca_muscular: currentAvaliacao.forca_muscular || '',
        forca_detalhes: currentAvaliacao.forca_detalhes || {},
        testes_funcionais: currentAvaliacao.testes_funcionais || '',
        equilibrio: currentAvaliacao.equilibrio || '',
        equilibrio_obs: currentAvaliacao.equilibrio_obs || '',
        coordenacao: currentAvaliacao.coordenacao || '',
        marcha: currentAvaliacao.marcha || '',
        marcha_obs: currentAvaliacao.marcha_obs || '',
        observacoes: currentAvaliacao.observacoes || '',
      };
    }
    return getEmptyAvaliacaoForm();
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
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3">
            {viewMode === 'current' && currentAvaliacao ? (
              <AvaliacaoCard
                avaliacao={currentAvaliacao}
                avaliacaoAnterior={previousAvaliacao}
                isLatest={true}
              />
            ) : (
              history.map((avaliacao, index) => (
                <AvaliacaoCard
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Avaliação Funcional</DialogTitle>
            <DialogDescription>
              Registre os achados da avaliação física e funcional do paciente.
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
