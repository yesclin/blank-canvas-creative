/**
 * ESTÉTICA - Avaliação Estética Facial
 * 
 * Bloco para registro de avaliação facial detalhada.
 * Campos: avaliação geral, simetria, qualidade da pele, flacidez,
 * volume, linhas/rugas, observações técnicas.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Save, 
  Scan,
  User,
  Droplets,
  Move,
  Layers,
  Sparkles,
  FileText,
} from 'lucide-react';
import { 
  useAvaliacaoEsteticaData, 
  getEmptyAvaliacaoEstetica,
  ESCALA_INTENSIDADE,
  ESCALA_QUALIDADE_PELE,
  TIPOS_PELE,
  REGIOES_FACIAIS,
  type AvaliacaoEsteticaContent,
} from '@/hooks/aesthetics/useAvaliacaoEsteticaData';

interface AvaliacaoEsteticaBlockProps {
  patientId: string | null;
  clinicId: string | null;
  appointmentId?: string | null;
  canEdit?: boolean;
}

export function AvaliacaoEsteticaBlock({
  patientId,
  clinicId,
  appointmentId,
  canEdit = false,
}: AvaliacaoEsteticaBlockProps) {
  const { 
    current, 
    loading, 
    save, 
    isSaving,
  } = useAvaliacaoEsteticaData({ patientId, clinicId, appointmentId });

  const [formData, setFormData] = useState<AvaliacaoEsteticaContent>(
    getEmptyAvaliacaoEstetica()
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Carregar dados atuais no formulário
  useEffect(() => {
    if (current) {
      setFormData(current.content);
      setHasChanges(false);
    }
  }, [current]);

  const handleFieldChange = (field: keyof AvaliacaoEsteticaContent, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleRegionToggle = (field: 'flacidez_regioes' | 'volume_deficiente_regioes' | 'volume_excessivo_regioes' | 'rugas_regioes_afetadas', regionId: string) => {
    const currentRegions = formData[field] || [];
    const newRegions = currentRegions.includes(regionId)
      ? currentRegions.filter(r => r !== regionId)
      : [...currentRegions, regionId];
    handleFieldChange(field, newRegions);
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
          <p className="text-muted-foreground">Selecione um paciente para realizar a avaliação.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Scan className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Avaliação Estética Facial</h3>
            <p className="text-xs text-muted-foreground">
              {current ? 'Última avaliação registrada' : 'Nenhuma avaliação registrada'}
            </p>
          </div>
        </div>

        {canEdit && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        )}
      </div>

      {/* Formulário Principal */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Coluna 1 */}
        <div className="space-y-4">
          {/* Avaliação Geral */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Avaliação Facial Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de Pele</Label>
                  <Select
                    value={formData.tipo_pele}
                    onValueChange={(v) => handleFieldChange('tipo_pele', v)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_PELE.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Qualidade da Pele</Label>
                  <Select
                    value={formData.qualidade_pele}
                    onValueChange={(v) => handleFieldChange('qualidade_pele', v)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESCALA_QUALIDADE_PELE.map(q => (
                        <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Impressão Geral</Label>
                <Textarea
                  value={formData.impressao_geral}
                  onChange={(e) => handleFieldChange('impressao_geral', e.target.value)}
                  placeholder="Descreva a impressão geral da face do paciente..."
                  rows={2}
                  disabled={!canEdit}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Simetria */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Move className="h-4 w-4 text-primary" />
                Simetria Facial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Avaliação da Simetria</Label>
                <Select
                  value={formData.simetria_avaliacao}
                  onValueChange={(v) => handleFieldChange('simetria_avaliacao', v)}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simetrica">Simétrica</SelectItem>
                    <SelectItem value="leve_assimetria">Leve Assimetria</SelectItem>
                    <SelectItem value="assimetria_moderada">Assimetria Moderada</SelectItem>
                    <SelectItem value="assimetria_acentuada">Assimetria Acentuada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Assimetrias Identificadas</Label>
                <Textarea
                  value={formData.assimetrias_identificadas}
                  onChange={(e) => handleFieldChange('assimetrias_identificadas', e.target.value)}
                  placeholder="Descreva as assimetrias observadas..."
                  rows={2}
                  disabled={!canEdit}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Flacidez */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Droplets className="h-4 w-4 text-primary" />
                Flacidez
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Grau de Flacidez Facial</Label>
                <Select
                  value={formData.flacidez_facial}
                  onValueChange={(v) => handleFieldChange('flacidez_facial', v)}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESCALA_INTENSIDADE.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Regiões Afetadas</Label>
                <div className="flex flex-wrap gap-2">
                  {REGIOES_FACIAIS.map(r => (
                    <Badge
                      key={r.id}
                      variant={(formData.flacidez_regioes || []).includes(r.id) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-colors ${!canEdit ? 'pointer-events-none' : ''}`}
                      onClick={() => canEdit && handleRegionToggle('flacidez_regioes', r.id)}
                    >
                      {r.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <Textarea
                value={formData.flacidez_observacoes}
                onChange={(e) => handleFieldChange('flacidez_observacoes', e.target.value)}
                placeholder="Observações sobre flacidez..."
                rows={2}
                disabled={!canEdit}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2 */}
        <div className="space-y-4">
          {/* Volume */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Volume Facial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Avaliação Geral de Volume</Label>
                <Select
                  value={formData.volume_avaliacao}
                  onValueChange={(v) => handleFieldChange('volume_avaliacao', v)}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adequado">Adequado</SelectItem>
                    <SelectItem value="perda_leve">Perda Leve</SelectItem>
                    <SelectItem value="perda_moderada">Perda Moderada</SelectItem>
                    <SelectItem value="perda_acentuada">Perda Acentuada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Regiões com Déficit de Volume</Label>
                <div className="flex flex-wrap gap-2">
                  {REGIOES_FACIAIS.slice(0, 8).map(r => (
                    <Badge
                      key={r.id}
                      variant={(formData.volume_deficiente_regioes || []).includes(r.id) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-colors ${!canEdit ? 'pointer-events-none' : ''}`}
                      onClick={() => canEdit && handleRegionToggle('volume_deficiente_regioes', r.id)}
                    >
                      {r.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <Textarea
                value={formData.volume_observacoes}
                onChange={(e) => handleFieldChange('volume_observacoes', e.target.value)}
                placeholder="Observações sobre volume..."
                rows={2}
                disabled={!canEdit}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Linhas e Rugas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Linhas e Rugas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Rugas Estáticas</Label>
                  <Select
                    value={formData.rugas_estaticas}
                    onValueChange={(v) => handleFieldChange('rugas_estaticas', v)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESCALA_INTENSIDADE.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Rugas Dinâmicas</Label>
                  <Select
                    value={formData.rugas_dinamicas}
                    onValueChange={(v) => handleFieldChange('rugas_dinamicas', v)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESCALA_INTENSIDADE.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Regiões Afetadas</Label>
                <div className="flex flex-wrap gap-2">
                  {REGIOES_FACIAIS.slice(0, 8).map(r => (
                    <Badge
                      key={r.id}
                      variant={(formData.rugas_regioes_afetadas || []).includes(r.id) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-colors ${!canEdit ? 'pointer-events-none' : ''}`}
                      onClick={() => canEdit && handleRegionToggle('rugas_regioes_afetadas', r.id)}
                    >
                      {r.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <Textarea
                value={formData.rugas_observacoes}
                onChange={(e) => handleFieldChange('rugas_observacoes', e.target.value)}
                placeholder="Observações sobre linhas e rugas..."
                rows={2}
                disabled={!canEdit}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Outras características */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Outras Características</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Manchas/Pigmentação</Label>
                  <Select
                    value={formData.manchas_pigmentacao}
                    onValueChange={(v) => handleFieldChange('manchas_pigmentacao', v)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESCALA_INTENSIDADE.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Poros Dilatados</Label>
                  <Select
                    value={formData.poros_dilatados}
                    onValueChange={(v) => handleFieldChange('poros_dilatados', v)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESCALA_INTENSIDADE.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Cicatrizes de Acne</Label>
                  <Select
                    value={formData.cicatrizes_acne}
                    onValueChange={(v) => handleFieldChange('cicatrizes_acne', v)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESCALA_INTENSIDADE.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Vasos Visíveis</Label>
                  <Select
                    value={formData.vasos_visiveis}
                    onValueChange={(v) => handleFieldChange('vasos_visiveis', v)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESCALA_INTENSIDADE.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações Técnicas */}
          <Card className="bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Observações Técnicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={formData.observacoes_tecnicas}
                onChange={(e) => handleFieldChange('observacoes_tecnicas', e.target.value)}
                placeholder="Observações técnicas detalhadas do profissional..."
                rows={3}
                disabled={!canEdit}
                className="resize-none"
              />
              <div className="space-y-1.5">
                <Label className="text-xs">Sugestão de Tratamento</Label>
                <Textarea
                  value={formData.sugestao_tratamento}
                  onChange={(e) => handleFieldChange('sugestao_tratamento', e.target.value)}
                  placeholder="Sugestões de procedimentos e tratamentos..."
                  rows={2}
                  disabled={!canEdit}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
