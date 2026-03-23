/**
 * NUTRIÇÃO - Anamnese Nutricional Premium
 * 
 * 7 blocos clínicos em tela única. Layout limpo, auto-IMC, autosave-ready.
 * Exclusivo para especialidade Nutrição.
 */

import { useState, useEffect, useRef } from 'react';
import { useAnamnesisModels } from '@/hooks/prontuario/useAnamnesisModels';
import { AnamnesisModelEditorDialog } from '@/components/config/prontuario/AnamnesisModelEditorDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ClipboardList, Plus, Save, History, Calendar, User,
  Apple, Stethoscope, Ruler, Brain, FileText, Utensils, Target, AlertTriangle, Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { 
  type AnamneseNutricional, 
  type AnamneseNutricionalFormData,
  INITIAL_NUTRICAO_FORM,
  calcularIMC,
  classificarIMC,
} from '@/hooks/prontuario/nutricao/useAnamneseNutricionalData';
import { useResolvedAnamnesisTemplate } from '@/hooks/prontuario/useResolvedAnamnesisTemplate';
import { AnamnesisTemplatePicker } from '@/components/prontuario/AnamnesisTemplatePicker';
import { AnamneseModelSelector } from '@/components/prontuario/AnamneseModelSelector';

interface AnamneseNutricionalBlockProps {
  currentAnamnese: AnamneseNutricional | null;
  anamneseHistory: AnamneseNutricional[];
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  onSave: (data: AnamneseNutricionalFormData, professionalId: string) => Promise<unknown>;
  professionalId?: string;
  specialtyId?: string | null;
  procedureId?: string | null;
}

// ─── Section Header ──────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, badge }: { icon: React.ElementType; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">{title}</h3>
      {badge && <Badge variant="outline" className="ml-auto text-xs">{badge}</Badge>}
    </div>
  );
}

// ─── View-only field ─────────────────────────────────────────────
function ViewField({ label, value, className }: { label: string; value: string | number | null | undefined; className?: string }) {
  if (!value && value !== 0) return null;
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export function AnamneseNutricionalBlock({
  currentAnamnese,
  anamneseHistory,
  loading,
  saving,
  canEdit,
  onSave,
  professionalId,
  specialtyId,
  procedureId,
}: AnamneseNutricionalBlockProps) {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState<AnamneseNutricionalFormData>({ ...INITIAL_NUTRICAO_FORM });
  const [status, setStatus] = useState<'rascunho' | 'finalizado'>('rascunho');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    models: anamnesisModels,
    updateModel,
    saving: savingModel,
  } = useAnamnesisModels(specialtyId);

  // Template resolution for specialty validation
  const {
    data: resolvedTemplate,
    allTemplates,
    hasMultipleTemplates,
    isLoading: templateLoading,
  } = useResolvedAnamnesisTemplate(specialtyId, procedureId);

  const hasTemplate = !!resolvedTemplate;
  const hasStartedFilling = showForm && Object.values(formData).some(v => v !== '' && v !== null && v !== 0);

  // Find the current model for the editor
  const currentEditorModel = anamnesisModels.find(
    m => m.id === (selectedTemplateId || resolvedTemplate?.id)
  ) || anamnesisModels[0] || null;

  // Auto-calculate IMC when peso or altura changes
  useEffect(() => {
    const imc = calcularIMC(formData.peso_kg, formData.altura_cm);
    if (imc !== formData.imc) {
      setFormData(prev => ({ ...prev, imc }));
    }
  }, [formData.peso_kg, formData.altura_cm]);

  const handleEdit = () => {
    if (currentAnamnese) {
      setFormData({
        queixa_principal: currentAnamnese.queixa_principal,
        rotina_alimentar: currentAnamnese.rotina_alimentar,
        refeicoes_por_dia: currentAnamnese.refeicoes_por_dia,
        consumo_agua_litros: currentAnamnese.consumo_agua_litros,
        consumo_acucar: currentAnamnese.consumo_acucar,
        consumo_ultraprocessados: currentAnamnese.consumo_ultraprocessados,
        consumo_alcool: currentAnamnese.consumo_alcool,
        doencas_associadas: currentAnamnese.doencas_associadas,
        uso_medicamentos: currentAnamnese.uso_medicamentos,
        suplementacao: currentAnamnese.suplementacao,
        peso_kg: currentAnamnese.peso_kg,
        altura_cm: currentAnamnese.altura_cm,
        imc: currentAnamnese.imc,
        circunferencia_abdominal_cm: currentAnamnese.circunferencia_abdominal_cm,
        percentual_gordura: currentAnamnese.percentual_gordura,
        massa_magra_kg: currentAnamnese.massa_magra_kg,
        qualidade_sono: currentAnamnese.qualidade_sono,
        nivel_estresse: currentAnamnese.nivel_estresse,
        atividade_fisica: currentAnamnese.atividade_fisica,
        compulsao_alimentar: currentAnamnese.compulsao_alimentar,
        relacao_emocional_comida: currentAnamnese.relacao_emocional_comida,
        diagnostico_nutricional: currentAnamnese.diagnostico_nutricional,
        estrategia_nutricional: currentAnamnese.estrategia_nutricional,
        meta_calorica: currentAnamnese.meta_calorica,
        distribuicao_macronutrientes: currentAnamnese.distribuicao_macronutrientes,
        orientacoes_gerais: currentAnamnese.orientacoes_gerais,
        proxima_reavaliacao: currentAnamnese.proxima_reavaliacao,
        observacoes: currentAnamnese.observacoes,
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (asDraft: boolean) => {
    if (!professionalId) return;
    setStatus(asDraft ? 'rascunho' : 'finalizado');
    const result = await onSave(formData, professionalId);
    if (result) {
      setFormData({ ...INITIAL_NUTRICAO_FORM });
      setShowForm(false);
    }
  };

  const updateField = <K extends keyof AnamneseNutricionalFormData>(field: K, value: AnamneseNutricionalFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNumericField = (field: keyof AnamneseNutricionalFormData, value: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateField(field, value ? parseFloat(value) : null as any);
  };

  const updateIntField = (field: keyof AnamneseNutricionalFormData, value: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateField(field, value ? parseInt(value) : null as any);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Apple className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Anamnese Nutricional</h2>
          {currentAnamnese && (
            <Badge variant="outline" className="ml-2">v{currentAnamnese.version}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Template picker in header */}
          {specialtyId && hasTemplate && (
            <AnamnesisTemplatePicker
              resolvedTemplate={resolvedTemplate}
              allTemplates={allTemplates}
              hasMultipleTemplates={hasMultipleTemplates}
              isLoading={templateLoading}
              hasStartedFilling={hasStartedFilling}
              onTemplateChange={setSelectedTemplateId}
              selectedTemplateId={selectedTemplateId}
              versionNumber={resolvedTemplate?.version_number}
            />
          )}
          {anamneseHistory.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History className="h-4 w-4 mr-2" />
              Histórico ({anamneseHistory.length})
            </Button>
          )}
          {canEdit && !showForm && hasTemplate && (
            <Button onClick={currentAnamnese ? handleEdit : () => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {currentAnamnese ? 'Atualizar' : 'Registrar'}
            </Button>
          )}
        </div>
      </div>

      {/* ─── FORM ─────────────────────────────────────────── */}
      {showForm && canEdit && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              {currentAnamnese ? 'Atualizar Anamnese (Nova Versão)' : 'Nova Anamnese Nutricional'}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={status === 'rascunho' ? 'secondary' : 'default'} className="text-xs">
                {status === 'rascunho' ? 'Rascunho' : 'Finalizado'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">

            {/* BLOCO 1 – Objetivo / Queixa Principal */}
            <section>
              <SectionHeader icon={Target} title="Objetivo / Queixa Principal" badge="Bloco 1" />
              <div>
                <Label htmlFor="queixa_principal">Queixa Principal / Objetivo *</Label>
                <Textarea
                  id="queixa_principal"
                  placeholder="Descreva o objetivo principal da consulta nutricional..."
                  value={formData.queixa_principal}
                  onChange={(e) => updateField('queixa_principal', e.target.value)}
                  rows={4}
                  required
                  className="mt-1"
                />
              </div>
            </section>

            {/* BLOCO 2 – História Alimentar */}
            <section>
              <SectionHeader icon={Utensils} title="História Alimentar" badge="Bloco 2" />
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rotina_alimentar">Rotina Alimentar</Label>
                  <Textarea
                    id="rotina_alimentar"
                    placeholder="Descreva a rotina alimentar detalhada do paciente (café da manhã, almoço, jantar, lanches)..."
                    value={formData.rotina_alimentar}
                    onChange={(e) => updateField('rotina_alimentar', e.target.value)}
                    rows={5}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="refeicoes_por_dia">Refeições/dia</Label>
                    <Input
                      id="refeicoes_por_dia"
                      type="number"
                      min={1} max={10}
                      placeholder="5"
                      value={formData.refeicoes_por_dia ?? ''}
                      onChange={(e) => updateIntField('refeicoes_por_dia', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="consumo_agua_litros">Água (L/dia)</Label>
                    <Input
                      id="consumo_agua_litros"
                      type="number"
                      step="0.1" min={0} max={10}
                      placeholder="2.0"
                      value={formData.consumo_agua_litros ?? ''}
                      onChange={(e) => updateNumericField('consumo_agua_litros', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="consumo_acucar">Açúcar</Label>
                    <Select value={formData.consumo_acucar} onValueChange={(v) => updateField('consumo_acucar', v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhum">Nenhum</SelectItem>
                        <SelectItem value="baixo">Baixo</SelectItem>
                        <SelectItem value="moderado">Moderado</SelectItem>
                        <SelectItem value="alto">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="consumo_ultraprocessados">Ultraprocessados</Label>
                    <Select value={formData.consumo_ultraprocessados} onValueChange={(v) => updateField('consumo_ultraprocessados', v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhum">Nenhum</SelectItem>
                        <SelectItem value="baixo">Baixo</SelectItem>
                        <SelectItem value="moderado">Moderado</SelectItem>
                        <SelectItem value="alto">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="consumo_alcool">Álcool</Label>
                    <Select value={formData.consumo_alcool} onValueChange={(v) => updateField('consumo_alcool', v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhum">Nenhum</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="moderado">Moderado</SelectItem>
                        <SelectItem value="frequente">Frequente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </section>

            {/* BLOCO 3 – Histórico Clínico Nutricional */}
            <section>
              <SectionHeader icon={Stethoscope} title="Histórico Clínico Nutricional" badge="Bloco 3" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="doencas_associadas">Doenças Associadas</Label>
                  <Textarea
                    id="doencas_associadas"
                    placeholder="Diabetes, hipertensão, dislipidemia..."
                    value={formData.doencas_associadas}
                    onChange={(e) => updateField('doencas_associadas', e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="uso_medicamentos">Uso de Medicamentos</Label>
                  <Textarea
                    id="uso_medicamentos"
                    placeholder="Medicamentos em uso contínuo..."
                    value={formData.uso_medicamentos}
                    onChange={(e) => updateField('uso_medicamentos', e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="suplementacao">Suplementação</Label>
                  <Textarea
                    id="suplementacao"
                    placeholder="Suplementos em uso, dosagem..."
                    value={formData.suplementacao}
                    onChange={(e) => updateField('suplementacao', e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </section>

            {/* BLOCO 4 – Avaliação Antropométrica */}
            <section>
              <SectionHeader icon={Ruler} title="Avaliação Antropométrica" badge="Bloco 4" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="peso_kg">Peso (kg)</Label>
                  <Input
                    id="peso_kg"
                    type="number"
                    step="0.1"
                    placeholder="70.5"
                    value={formData.peso_kg ?? ''}
                    onChange={(e) => updateNumericField('peso_kg', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="altura_cm">Altura (cm)</Label>
                  <Input
                    id="altura_cm"
                    type="number"
                    step="0.1"
                    placeholder="170"
                    value={formData.altura_cm ?? ''}
                    onChange={(e) => updateNumericField('altura_cm', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>IMC (auto)</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      value={formData.imc !== null ? formData.imc : ''}
                      readOnly
                      className="bg-muted font-semibold"
                    />
                    {formData.imc !== null && (
                      <Badge variant={formData.imc < 18.5 || formData.imc >= 30 ? 'destructive' : formData.imc >= 25 ? 'secondary' : 'default'} className="text-xs whitespace-nowrap">
                        {classificarIMC(formData.imc)}
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="circunferencia_abdominal_cm">Circ. Abdominal (cm)</Label>
                  <Input
                    id="circunferencia_abdominal_cm"
                    type="number"
                    step="0.1"
                    placeholder="85"
                    value={formData.circunferencia_abdominal_cm ?? ''}
                    onChange={(e) => updateNumericField('circunferencia_abdominal_cm', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="percentual_gordura">% Gordura</Label>
                  <Input
                    id="percentual_gordura"
                    type="number"
                    step="0.1"
                    placeholder="25"
                    value={formData.percentual_gordura ?? ''}
                    onChange={(e) => updateNumericField('percentual_gordura', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="massa_magra_kg">Massa Magra (kg)</Label>
                  <Input
                    id="massa_magra_kg"
                    type="number"
                    step="0.1"
                    placeholder="52"
                    value={formData.massa_magra_kg ?? ''}
                    onChange={(e) => updateNumericField('massa_magra_kg', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </section>

            {/* BLOCO 5 – Comportamento e Estilo de Vida */}
            <section>
              <SectionHeader icon={Brain} title="Comportamento e Estilo de Vida" badge="Bloco 5" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="qualidade_sono">Qualidade do Sono</Label>
                  <Select value={formData.qualidade_sono} onValueChange={(v) => updateField('qualidade_sono', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="otima">Ótima</SelectItem>
                      <SelectItem value="boa">Boa</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="ruim">Ruim</SelectItem>
                      <SelectItem value="insonia">Insônia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nivel_estresse">Nível de Estresse</Label>
                  <Select value={formData.nivel_estresse} onValueChange={(v) => updateField('nivel_estresse', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixo">Baixo</SelectItem>
                      <SelectItem value="moderado">Moderado</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                      <SelectItem value="muito_alto">Muito Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="atividade_fisica">Atividade Física</Label>
                  <Select value={formData.atividade_fisica} onValueChange={(v) => updateField('atividade_fisica', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentario">Sedentário</SelectItem>
                      <SelectItem value="leve">Leve (1-2x/sem)</SelectItem>
                      <SelectItem value="moderado">Moderado (3-4x/sem)</SelectItem>
                      <SelectItem value="intenso">Intenso (5+x/sem)</SelectItem>
                      <SelectItem value="atleta">Atleta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="compulsao_alimentar">Compulsão Alimentar</Label>
                  <Textarea
                    id="compulsao_alimentar"
                    placeholder="Relatos de episódios compulsivos, gatilhos..."
                    value={formData.compulsao_alimentar}
                    onChange={(e) => updateField('compulsao_alimentar', e.target.value)}
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="relacao_emocional_comida">Relação Emocional com a Comida</Label>
                  <Textarea
                    id="relacao_emocional_comida"
                    placeholder="Como o paciente se relaciona emocionalmente com a alimentação..."
                    value={formData.relacao_emocional_comida}
                    onChange={(e) => updateField('relacao_emocional_comida', e.target.value)}
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </div>
            </section>

            {/* BLOCO 6 – Diagnóstico Nutricional */}
            <section>
              <SectionHeader icon={FileText} title="Diagnóstico Nutricional" badge="Bloco 6" />
              <div>
                <Label htmlFor="diagnostico_nutricional">Diagnóstico Nutricional</Label>
                <Textarea
                  id="diagnostico_nutricional"
                  placeholder="Diagnóstico nutricional estruturado..."
                  value={formData.diagnostico_nutricional}
                  onChange={(e) => updateField('diagnostico_nutricional', e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
            </section>

            {/* BLOCO 7 – Plano Alimentar / Conduta */}
            <section>
              <SectionHeader icon={ClipboardList} title="Plano Alimentar / Conduta" badge="Bloco 7" />
              <div className="space-y-4">
                <div>
                  <Label htmlFor="estrategia_nutricional">Estratégia Nutricional</Label>
                  <Textarea
                    id="estrategia_nutricional"
                    placeholder="Estratégia nutricional adotada..."
                    value={formData.estrategia_nutricional}
                    onChange={(e) => updateField('estrategia_nutricional', e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="meta_calorica">Meta Calórica</Label>
                    <Input
                      id="meta_calorica"
                      placeholder="Ex: 1800 kcal/dia"
                      value={formData.meta_calorica}
                      onChange={(e) => updateField('meta_calorica', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="distribuicao_macronutrientes">Distribuição de Macronutrientes</Label>
                    <Input
                      id="distribuicao_macronutrientes"
                      placeholder="Ex: 50% CHO, 25% PTN, 25% LIP"
                      value={formData.distribuicao_macronutrientes}
                      onChange={(e) => updateField('distribuicao_macronutrientes', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="orientacoes_gerais">Orientações Gerais</Label>
                  <Textarea
                    id="orientacoes_gerais"
                    placeholder="Orientações gerais ao paciente..."
                    value={formData.orientacoes_gerais}
                    onChange={(e) => updateField('orientacoes_gerais', e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="proxima_reavaliacao">Próxima Reavaliação</Label>
                  <Input
                    id="proxima_reavaliacao"
                    type="date"
                    value={formData.proxima_reavaliacao ?? ''}
                    onChange={(e) => updateField('proxima_reavaliacao', e.target.value || null)}
                    className="mt-1 w-48"
                  />
                </div>
              </div>
            </section>

            {/* Observações */}
            <section>
              <div>
                <Label htmlFor="observacoes">Observações Gerais</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Outras observações relevantes..."
                  value={formData.observacoes ?? ''}
                  onChange={(e) => updateField('observacoes', e.target.value || null)}
                  rows={2}
                  className="mt-1"
                />
              </div>
            </section>

            {/* ─── Sticky Footer ──────────────────────────── */}
            <div className="sticky bottom-0 bg-background border-t border-border pt-4 pb-2 flex justify-end gap-2 -mx-6 px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setFormData({ ...INITIAL_NUTRICAO_FORM }); setShowForm(false); }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={() => handleSubmit(true)}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Rascunho
              </Button>
              <Button
                type="button"
                disabled={saving || !formData.queixa_principal}
                onClick={() => handleSubmit(false)}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Finalizar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── VIEW MODE ────────────────────────────────────── */}
      {currentAnamnese && !showForm && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Anamnese Atual</CardTitle>
                <Badge variant="outline">v{currentAnamnese.version}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(currentAnamnese.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </div>
            {currentAnamnese.created_by_name && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Registrada por {currentAnamnese.created_by_name}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bloco 1 */}
            <ViewField label="Queixa Principal / Objetivo" value={currentAnamnese.queixa_principal} className="p-3 bg-muted rounded-lg" />

            {/* Bloco 2 */}
            <div>
              <SectionHeader icon={Utensils} title="História Alimentar" />
              <ViewField label="Rotina Alimentar" value={currentAnamnese.rotina_alimentar} className="mb-3" />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <ViewField label="Refeições/dia" value={currentAnamnese.refeicoes_por_dia} className="p-2 bg-muted rounded" />
                <ViewField label="Água (L/dia)" value={currentAnamnese.consumo_agua_litros} className="p-2 bg-muted rounded" />
                <ViewField label="Açúcar" value={currentAnamnese.consumo_acucar} className="p-2 bg-muted rounded" />
                <ViewField label="Ultraprocessados" value={currentAnamnese.consumo_ultraprocessados} className="p-2 bg-muted rounded" />
                <ViewField label="Álcool" value={currentAnamnese.consumo_alcool} className="p-2 bg-muted rounded" />
              </div>
            </div>

            {/* Bloco 3 */}
            <div>
              <SectionHeader icon={Stethoscope} title="Histórico Clínico" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <ViewField label="Doenças Associadas" value={currentAnamnese.doencas_associadas} className="p-2 bg-muted rounded" />
                <ViewField label="Medicamentos" value={currentAnamnese.uso_medicamentos} className="p-2 bg-muted rounded" />
                <ViewField label="Suplementação" value={currentAnamnese.suplementacao} className="p-2 bg-muted rounded" />
              </div>
            </div>

            {/* Bloco 4 */}
            <div>
              <SectionHeader icon={Ruler} title="Avaliação Antropométrica" />
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <ViewField label="Peso" value={currentAnamnese.peso_kg ? `${currentAnamnese.peso_kg} kg` : null} className="p-2 bg-muted rounded" />
                <ViewField label="Altura" value={currentAnamnese.altura_cm ? `${currentAnamnese.altura_cm} cm` : null} className="p-2 bg-muted rounded" />
                <div className="p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground mb-0.5">IMC</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{currentAnamnese.imc ?? '—'}</p>
                    {currentAnamnese.imc && (
                      <Badge variant={currentAnamnese.imc < 18.5 || currentAnamnese.imc >= 30 ? 'destructive' : currentAnamnese.imc >= 25 ? 'secondary' : 'default'} className="text-xs">
                        {classificarIMC(currentAnamnese.imc)}
                      </Badge>
                    )}
                  </div>
                </div>
                <ViewField label="Circ. Abdominal" value={currentAnamnese.circunferencia_abdominal_cm ? `${currentAnamnese.circunferencia_abdominal_cm} cm` : null} className="p-2 bg-muted rounded" />
                <ViewField label="% Gordura" value={currentAnamnese.percentual_gordura ? `${currentAnamnese.percentual_gordura}%` : null} className="p-2 bg-muted rounded" />
                <ViewField label="Massa Magra" value={currentAnamnese.massa_magra_kg ? `${currentAnamnese.massa_magra_kg} kg` : null} className="p-2 bg-muted rounded" />
              </div>
            </div>

            {/* Bloco 5 */}
            <div>
              <SectionHeader icon={Brain} title="Comportamento e Estilo de Vida" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <ViewField label="Sono" value={currentAnamnese.qualidade_sono} className="p-2 bg-muted rounded" />
                <ViewField label="Estresse" value={currentAnamnese.nivel_estresse} className="p-2 bg-muted rounded" />
                <ViewField label="Atividade Física" value={currentAnamnese.atividade_fisica} className="p-2 bg-muted rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <ViewField label="Compulsão Alimentar" value={currentAnamnese.compulsao_alimentar} className="p-2 bg-muted rounded" />
                <ViewField label="Relação Emocional" value={currentAnamnese.relacao_emocional_comida} className="p-2 bg-muted rounded" />
              </div>
            </div>

            {/* Bloco 6 */}
            <ViewField label="Diagnóstico Nutricional" value={currentAnamnese.diagnostico_nutricional} className="p-3 bg-muted rounded-lg" />

            {/* Bloco 7 */}
            <div>
              <SectionHeader icon={ClipboardList} title="Plano Alimentar / Conduta" />
              <ViewField label="Estratégia Nutricional" value={currentAnamnese.estrategia_nutricional} className="mb-3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ViewField label="Meta Calórica" value={currentAnamnese.meta_calorica} className="p-2 bg-muted rounded" />
                <ViewField label="Macronutrientes" value={currentAnamnese.distribuicao_macronutrientes} className="p-2 bg-muted rounded" />
              </div>
              <ViewField label="Orientações Gerais" value={currentAnamnese.orientacoes_gerais} className="mt-3 p-2 bg-muted rounded" />
              <ViewField label="Próxima Reavaliação" value={currentAnamnese.proxima_reavaliacao ? format(new Date(currentAnamnese.proxima_reavaliacao), 'dd/MM/yyyy') : null} className="mt-3 p-2 bg-muted rounded" />
            </div>

            {/* Observações */}
            <ViewField label="Observações" value={currentAnamnese.observacoes} className="p-3 bg-muted/50 rounded-lg" />
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!currentAnamnese && !showForm && (
        <AnamneseModelSelector
          icon={<Apple className="h-10 w-10 text-muted-foreground opacity-50" />}
          emptyTitle="Nenhuma anamnese nutricional registrada"
          registerLabel="Registrar Anamnese Nutricional"
          resolvedTemplate={resolvedTemplate}
          allTemplates={allTemplates}
          isLoading={templateLoading}
          selectedTemplateId={selectedTemplateId}
          onTemplateChange={setSelectedTemplateId}
          canEdit={canEdit}
          canManageTemplates={canEdit}
          onRegister={() => setShowForm(true)}
          onOpenTemplateEditor={() => setShowTemplateEditor(true)}
          onConfigureTemplate={() => navigate('/configuracoes/modelos-anamnese')}
          specialtyLabel="Nutrição"
        />
      )}

      {/* Template Editor Modal */}
      <AnamnesisModelEditorDialog
        open={showTemplateEditor}
        onOpenChange={setShowTemplateEditor}
        model={currentEditorModel}
        onSave={async (id, data) => {
          const result = await updateModel(id, data);
          return !!result;
        }}
        saving={savingModel}
        specialtySlug="nutricao"
      />

      {/* Histórico */}
      {showHistory && anamneseHistory.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Anamneses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {anamneseHistory.map((anamnese) => (
                <div key={anamnese.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={anamnese.is_current ? 'default' : 'outline'}>v{anamnese.version}</Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {anamnese.queixa_principal ? anamnese.queixa_principal.substring(0, 80) + (anamnese.queixa_principal.length > 80 ? '...' : '') : 'Sem queixa registrada'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(anamnese.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        {anamnese.created_by_name && ` • ${anamnese.created_by_name}`}
                      </p>
                    </div>
                  </div>
                  {anamnese.is_current && <Badge>Atual</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
