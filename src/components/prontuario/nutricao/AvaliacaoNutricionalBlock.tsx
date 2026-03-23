/**
 * NUTRIÇÃO - Avaliação Antropométrica
 * 
 * Módulo para registro de dados objetivos e mensuráveis.
 * Inclui antropometria, circunferências, dobras cutâneas e composição corporal.
 * Mantém histórico completo e permite comparação automática entre avaliações.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Scale, 
  Ruler, 
  Plus, 
  ChevronDown,
  Calendar,
  Save,
  History,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Minus
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AvaliacaoNutricional, AvaliacaoNutricionalFormData } from '@/hooks/prontuario/nutricao';
import { AvaliacaoEvolutionChart } from './AvaliacaoEvolutionChart';

interface AvaliacaoNutricionalBlockProps {
  avaliacoes: AvaliacaoNutricional[];
  currentAvaliacao: AvaliacaoNutricional | null;
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  onSave: (data: AvaliacaoNutricionalFormData) => Promise<unknown>;
}

const initialFormData: AvaliacaoNutricionalFormData = {
  measurement_date: new Date().toISOString().split('T')[0],
  weight_kg: null,
  height_cm: null,
  waist_cm: null,
  hip_cm: null,
  abdomen_cm: null,
  chest_cm: null,
  arm_left_cm: null,
  arm_right_cm: null,
  thigh_left_cm: null,
  thigh_right_cm: null,
  calf_left_cm: null,
  calf_right_cm: null,
  body_fat_percent: null,
  lean_mass_percent: null,
  muscle_mass_kg: null,
  dobra_tricipital_mm: null,
  dobra_subescapular_mm: null,
  dobra_suprailiaca_mm: null,
  dobra_abdominal_mm: null,
  dobra_bicipital_mm: null,
  dobra_coxa_mm: null,
  dobra_peitoral_mm: null,
  agua_corporal_percent: null,
  massa_ossea_kg: null,
  taxa_metabolica_basal: null,
  idade_metabolica: null,
  gordura_visceral: null,
  notes: null,
};

// Componente para exibir variação entre valores
function VariacaoIndicator({ atual, anterior, unidade = '', invertido = false }: {
  atual: number | null;
  anterior: number | null;
  unidade?: string;
  invertido?: boolean; // true para quando redução é positiva (ex: gordura)
}) {
  if (!atual || !anterior) return null;
  
  const diff = Number((atual - anterior).toFixed(1));
  if (diff === 0) return (
    <span className="text-muted-foreground text-xs flex items-center gap-1">
      <Minus className="h-3 w-3" /> 0{unidade}
    </span>
  );
  
  const isPositive = invertido ? diff < 0 : diff > 0;
  const isNegative = invertido ? diff > 0 : diff < 0;
  
  return (
    <span className={`text-xs flex items-center gap-1 ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'}`}>
      {diff > 0 ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {diff > 0 ? '+' : ''}{diff}{unidade}
    </span>
  );
}

export function AvaliacaoNutricionalBlock({
  avaliacoes,
  currentAvaliacao,
  loading,
  saving,
  canEdit,
  onSave,
}: AvaliacaoNutricionalBlockProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AvaliacaoNutricionalFormData>(initialFormData);
  const [showHistory, setShowHistory] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    circunferencias: true,
    dobras: false,
    composicao: true,
    bioimpedancia: false,
  });

  // Avaliação anterior para comparação
  const previousAvaliacao = avaliacoes.length > 1 ? avaliacoes[1] : null;

  // Extrair dados custom da avaliação atual
  const currentCustom = useMemo(() => {
    if (!currentAvaliacao?.custom_measurements) return {};
    return currentAvaliacao.custom_measurements as Record<string, number | null>;
  }, [currentAvaliacao]);

  const previousCustom = useMemo(() => {
    if (!previousAvaliacao?.custom_measurements) return {};
    return previousAvaliacao.custom_measurements as Record<string, number | null>;
  }, [previousAvaliacao]);

  // Dias desde última avaliação
  const diasDesdeUltimaAvaliacao = useMemo(() => {
    if (!currentAvaliacao) return null;
    return differenceInDays(new Date(), new Date(currentAvaliacao.measurement_date));
  }, [currentAvaliacao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onSave(formData);
    if (result) {
      setFormData(initialFormData);
      setShowForm(false);
    }
  };

  const updateField = (field: keyof AvaliacaoNutricionalFormData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Cálculos automáticos
  const calculatedBMI = formData.weight_kg && formData.height_cm 
    ? Number((formData.weight_kg / Math.pow(formData.height_cm / 100, 2)).toFixed(1))
    : null;

  // Cálculo automático de massa magra % se tiver gordura corporal
  const calculatedLeanMass = formData.body_fat_percent !== null 
    ? Number((100 - formData.body_fat_percent).toFixed(1))
    : null;

  // Relação Cintura/Quadril
  const rcq = formData.waist_cm && formData.hip_cm
    ? Number((formData.waist_cm / formData.hip_cm).toFixed(2))
    : null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
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
          <Scale className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Avaliação Antropométrica</h2>
          {diasDesdeUltimaAvaliacao !== null && diasDesdeUltimaAvaliacao > 0 && (
            <Badge variant="secondary" className="text-xs">
              há {diasDesdeUltimaAvaliacao} dias
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {avaliacoes.length >= 2 && (
            <Button 
              variant={showEvolution ? "default" : "outline"}
              size="sm"
              onClick={() => setShowEvolution(!showEvolution)}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Evolução
            </Button>
          )}
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

      {/* Gráficos de Evolução */}
      {showEvolution && avaliacoes.length >= 2 && (
        <AvaliacaoEvolutionChart avaliacoes={avaliacoes} />
      )}

      {/* Formulário de Nova Avaliação */}
      {showForm && canEdit && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Avaliação Antropométrica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Data e Dados Básicos */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Dados Básicos</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="measurement_date">Data da Avaliação</Label>
                    <Input
                      id="measurement_date"
                      type="date"
                      value={formData.measurement_date}
                      onChange={(e) => updateField('measurement_date', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight_kg">Peso (kg)</Label>
                    <Input
                      id="weight_kg"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 75.5"
                      value={formData.weight_kg ?? ''}
                      onChange={(e) => updateField('weight_kg', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height_cm">Altura (cm)</Label>
                    <Input
                      id="height_cm"
                      type="number"
                      placeholder="Ex: 175"
                      value={formData.height_cm ?? ''}
                      onChange={(e) => updateField('height_cm', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <Label>IMC</Label>
                    <div className="h-10 flex items-center px-3 bg-muted rounded-md">
                      <span className="font-medium">
                        {calculatedBMI ? `${calculatedBMI} kg/m²` : '--'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label>RCQ</Label>
                    <div className="h-10 flex items-center px-3 bg-muted rounded-md">
                      <span className="font-medium">
                        {rcq ?? '--'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Circunferências */}
              <Collapsible open={expandedSections.circunferencias} onOpenChange={() => toggleSection('circunferencias')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Ruler className="h-4 w-4" />
                      Circunferências Corporais (cm)
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.circunferencias ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor="waist_cm">Cintura</Label>
                      <Input
                        id="waist_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.waist_cm ?? ''}
                        onChange={(e) => updateField('waist_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hip_cm">Quadril</Label>
                      <Input
                        id="hip_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.hip_cm ?? ''}
                        onChange={(e) => updateField('hip_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="abdomen_cm">Abdômen</Label>
                      <Input
                        id="abdomen_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.abdomen_cm ?? ''}
                        onChange={(e) => updateField('abdomen_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="chest_cm">Tórax</Label>
                      <Input
                        id="chest_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.chest_cm ?? ''}
                        onChange={(e) => updateField('chest_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="arm_right_cm">Braço D</Label>
                      <Input
                        id="arm_right_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.arm_right_cm ?? ''}
                        onChange={(e) => updateField('arm_right_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="arm_left_cm">Braço E</Label>
                      <Input
                        id="arm_left_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.arm_left_cm ?? ''}
                        onChange={(e) => updateField('arm_left_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="thigh_right_cm">Coxa D</Label>
                      <Input
                        id="thigh_right_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.thigh_right_cm ?? ''}
                        onChange={(e) => updateField('thigh_right_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="thigh_left_cm">Coxa E</Label>
                      <Input
                        id="thigh_left_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.thigh_left_cm ?? ''}
                        onChange={(e) => updateField('thigh_left_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="calf_right_cm">Panturrilha D</Label>
                      <Input
                        id="calf_right_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.calf_right_cm ?? ''}
                        onChange={(e) => updateField('calf_right_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="calf_left_cm">Panturrilha E</Label>
                      <Input
                        id="calf_left_cm"
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={formData.calf_left_cm ?? ''}
                        onChange={(e) => updateField('calf_left_cm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Composição Corporal */}
              <Collapsible open={expandedSections.composicao} onOpenChange={() => toggleSection('composicao')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Activity className="h-4 w-4" />
                      Composição Corporal
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.composicao ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="body_fat_percent">Gordura Corporal (%)</Label>
                      <Input
                        id="body_fat_percent"
                        type="number"
                        step="0.1"
                        placeholder="%"
                        value={formData.body_fat_percent ?? ''}
                        onChange={(e) => updateField('body_fat_percent', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label>Massa Magra (%)</Label>
                      <div className="h-10 flex items-center px-3 bg-muted rounded-md">
                        <span className="font-medium">
                          {formData.lean_mass_percent ?? calculatedLeanMass ?? '--'}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="muscle_mass_kg">Massa Muscular (kg)</Label>
                      <Input
                        id="muscle_mass_kg"
                        type="number"
                        step="0.1"
                        placeholder="kg"
                        value={formData.muscle_mass_kg ?? ''}
                        onChange={(e) => updateField('muscle_mass_kg', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lean_mass_percent">Massa Magra (% manual)</Label>
                      <Input
                        id="lean_mass_percent"
                        type="number"
                        step="0.1"
                        placeholder="Opcional"
                        value={formData.lean_mass_percent ?? ''}
                        onChange={(e) => updateField('lean_mass_percent', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Dobras Cutâneas */}
              <Collapsible open={expandedSections.dobras} onOpenChange={() => toggleSection('dobras')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Ruler className="h-4 w-4" />
                      Dobras Cutâneas (mm)
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.dobras ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4">Dobras principais para cálculo de composição corporal</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <Label htmlFor="dobra_tricipital_mm">Tríceps</Label>
                      <Input
                        id="dobra_tricipital_mm"
                        type="number"
                        step="0.1"
                        placeholder="mm"
                        value={formData.dobra_tricipital_mm ?? ''}
                        onChange={(e) => updateField('dobra_tricipital_mm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dobra_subescapular_mm">Subescapular</Label>
                      <Input
                        id="dobra_subescapular_mm"
                        type="number"
                        step="0.1"
                        placeholder="mm"
                        value={formData.dobra_subescapular_mm ?? ''}
                        onChange={(e) => updateField('dobra_subescapular_mm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dobra_suprailiaca_mm">Supra-ilíaca</Label>
                      <Input
                        id="dobra_suprailiaca_mm"
                        type="number"
                        step="0.1"
                        placeholder="mm"
                        value={formData.dobra_suprailiaca_mm ?? ''}
                        onChange={(e) => updateField('dobra_suprailiaca_mm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dobra_abdominal_mm">Abdominal</Label>
                      <Input
                        id="dobra_abdominal_mm"
                        type="number"
                        step="0.1"
                        placeholder="mm"
                        value={formData.dobra_abdominal_mm ?? ''}
                        onChange={(e) => updateField('dobra_abdominal_mm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Dobras adicionais (opcional)</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="dobra_bicipital_mm">Bicipital</Label>
                      <Input
                        id="dobra_bicipital_mm"
                        type="number"
                        step="0.1"
                        placeholder="mm"
                        value={formData.dobra_bicipital_mm ?? ''}
                        onChange={(e) => updateField('dobra_bicipital_mm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dobra_coxa_mm">Coxa</Label>
                      <Input
                        id="dobra_coxa_mm"
                        type="number"
                        step="0.1"
                        placeholder="mm"
                        value={formData.dobra_coxa_mm ?? ''}
                        onChange={(e) => updateField('dobra_coxa_mm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dobra_peitoral_mm">Peitoral</Label>
                      <Input
                        id="dobra_peitoral_mm"
                        type="number"
                        step="0.1"
                        placeholder="mm"
                        value={formData.dobra_peitoral_mm ?? ''}
                        onChange={(e) => updateField('dobra_peitoral_mm', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Bioimpedância */}
              <Collapsible open={expandedSections.bioimpedancia} onOpenChange={() => toggleSection('bioimpedancia')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="flex items-center gap-2 font-medium">
                      <Activity className="h-4 w-4" />
                      Bioimpedância (opcional)
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.bioimpedancia ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor="agua_corporal_percent">Água Corporal (%)</Label>
                      <Input
                        id="agua_corporal_percent"
                        type="number"
                        step="0.1"
                        placeholder="%"
                        value={formData.agua_corporal_percent ?? ''}
                        onChange={(e) => updateField('agua_corporal_percent', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="massa_ossea_kg">Massa Óssea (kg)</Label>
                      <Input
                        id="massa_ossea_kg"
                        type="number"
                        step="0.1"
                        placeholder="kg"
                        value={formData.massa_ossea_kg ?? ''}
                        onChange={(e) => updateField('massa_ossea_kg', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxa_metabolica_basal">TMB (kcal)</Label>
                      <Input
                        id="taxa_metabolica_basal"
                        type="number"
                        placeholder="kcal"
                        value={formData.taxa_metabolica_basal ?? ''}
                        onChange={(e) => updateField('taxa_metabolica_basal', e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="idade_metabolica">Idade Metabólica</Label>
                      <Input
                        id="idade_metabolica"
                        type="number"
                        placeholder="anos"
                        value={formData.idade_metabolica ?? ''}
                        onChange={(e) => updateField('idade_metabolica', e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gordura_visceral">Gordura Visceral</Label>
                      <Input
                        id="gordura_visceral"
                        type="number"
                        placeholder="nível"
                        value={formData.gordura_visceral ?? ''}
                        onChange={(e) => updateField('gordura_visceral', e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Observações */}
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Observações sobre a avaliação..."
                  value={formData.notes ?? ''}
                  onChange={(e) => updateField('notes', e.target.value || null)}
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
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Avaliação'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Última Avaliação com Comparação */}
      {currentAvaliacao && !showForm && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Última Avaliação</CardTitle>
              <div className="flex items-center gap-2">
                {previousAvaliacao && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    Comparado com {format(new Date(previousAvaliacao.measurement_date), "dd/MM/yyyy", { locale: ptBR })}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                )}
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(currentAvaliacao.measurement_date), "dd/MM/yyyy", { locale: ptBR })}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Dados Principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
              {currentAvaliacao.weight_kg && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">Peso</p>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-lg">{currentAvaliacao.weight_kg} kg</p>
                    <VariacaoIndicator 
                      atual={currentAvaliacao.weight_kg} 
                      anterior={previousAvaliacao?.weight_kg ?? null}
                      unidade=" kg"
                    />
                  </div>
                </div>
              )}
              {currentAvaliacao.height_cm && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">Altura</p>
                  <p className="font-semibold text-lg">{(currentAvaliacao.height_cm / 100).toFixed(2)} m</p>
                </div>
              )}
              {currentAvaliacao.bmi && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">IMC</p>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-lg">{currentAvaliacao.bmi.toFixed(1)}</p>
                    <VariacaoIndicator 
                      atual={currentAvaliacao.bmi} 
                      anterior={previousAvaliacao?.bmi ?? null}
                      invertido
                    />
                  </div>
                </div>
              )}
              {currentAvaliacao.body_fat_percent && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">Gordura</p>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-lg">{currentAvaliacao.body_fat_percent}%</p>
                    <VariacaoIndicator 
                      atual={currentAvaliacao.body_fat_percent} 
                      anterior={previousAvaliacao?.body_fat_percent ?? null}
                      unidade="%"
                      invertido
                    />
                  </div>
                </div>
              )}
              {currentCustom.lean_mass_percent && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">Massa Magra</p>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-lg">{currentCustom.lean_mass_percent}%</p>
                    <VariacaoIndicator 
                      atual={currentCustom.lean_mass_percent} 
                      anterior={previousCustom.lean_mass_percent ?? null}
                      unidade="%"
                    />
                  </div>
                </div>
              )}
              {currentAvaliacao.muscle_mass_kg && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">M. Muscular</p>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-lg">{currentAvaliacao.muscle_mass_kg} kg</p>
                    <VariacaoIndicator 
                      atual={currentAvaliacao.muscle_mass_kg} 
                      anterior={previousAvaliacao?.muscle_mass_kg ?? null}
                      unidade=" kg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Circunferências */}
            {(currentAvaliacao.waist_cm || currentAvaliacao.hip_cm || currentCustom.abdomen_cm) && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Circunferências</p>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-sm">
                  {currentAvaliacao.waist_cm && (
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground text-xs">Cintura</p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{currentAvaliacao.waist_cm} cm</span>
                        <VariacaoIndicator 
                          atual={currentAvaliacao.waist_cm} 
                          anterior={previousAvaliacao?.waist_cm ?? null}
                          invertido
                        />
                      </div>
                    </div>
                  )}
                  {currentAvaliacao.hip_cm && (
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground text-xs">Quadril</p>
                      <span className="font-medium">{currentAvaliacao.hip_cm} cm</span>
                    </div>
                  )}
                  {currentCustom.abdomen_cm && (
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground text-xs">Abdômen</p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{currentCustom.abdomen_cm} cm</span>
                        <VariacaoIndicator 
                          atual={currentCustom.abdomen_cm} 
                          anterior={previousCustom.abdomen_cm ?? null}
                          invertido
                        />
                      </div>
                    </div>
                  )}
                  {currentAvaliacao.arm_right_cm && (
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground text-xs">Braço D</p>
                      <span className="font-medium">{currentAvaliacao.arm_right_cm} cm</span>
                    </div>
                  )}
                  {currentAvaliacao.thigh_right_cm && (
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground text-xs">Coxa D</p>
                      <span className="font-medium">{currentAvaliacao.thigh_right_cm} cm</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dobras Cutâneas */}
            {(currentCustom.dobra_tricipital_mm || currentCustom.dobra_subescapular_mm) && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Dobras Cutâneas</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {currentCustom.dobra_tricipital_mm && (
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground text-xs">Tríceps</p>
                      <span className="font-medium">{currentCustom.dobra_tricipital_mm} mm</span>
                    </div>
                  )}
                  {currentCustom.dobra_subescapular_mm && (
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground text-xs">Subescapular</p>
                      <span className="font-medium">{currentCustom.dobra_subescapular_mm} mm</span>
                    </div>
                  )}
                  {currentCustom.dobra_suprailiaca_mm && (
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground text-xs">Supra-ilíaca</p>
                      <span className="font-medium">{currentCustom.dobra_suprailiaca_mm} mm</span>
                    </div>
                  )}
                  {currentCustom.dobra_abdominal_mm && (
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground text-xs">Abdominal</p>
                      <span className="font-medium">{currentCustom.dobra_abdominal_mm} mm</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentAvaliacao.notes && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{currentAvaliacao.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Histórico Detalhado */}
      {showHistory && avaliacoes.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {avaliacoes.slice(1).map((avaliacao) => {
                const custom = (avaliacao.custom_measurements || {}) as Record<string, number | null>;
                return (
                  <div 
                    key={avaliacao.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-muted-foreground min-w-[85px]">
                        {format(new Date(avaliacao.measurement_date), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      {avaliacao.weight_kg && (
                        <span className="font-medium">{avaliacao.weight_kg} kg</span>
                      )}
                      {avaliacao.bmi && (
                        <Badge variant="outline">IMC: {avaliacao.bmi.toFixed(1)}</Badge>
                      )}
                      {avaliacao.body_fat_percent && (
                        <Badge variant="secondary">Gord: {avaliacao.body_fat_percent}%</Badge>
                      )}
                      {avaliacao.waist_cm && (
                        <span className="text-muted-foreground">Cintura: {avaliacao.waist_cm}cm</span>
                      )}
                      {custom.abdomen_cm && (
                        <span className="text-muted-foreground">Abdômen: {custom.abdomen_cm}cm</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {avaliacoes.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma avaliação antropométrica registrada.</p>
            {canEdit && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeira Avaliação
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
