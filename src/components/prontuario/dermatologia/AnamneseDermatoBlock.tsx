import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  FileText,
  Edit3,
  Save,
  X,
  Clock,
  History,
  AlertTriangle,
  Pill,
  Users,
  Sun,
  Scan,
  Droplets,
  Sparkles,
  Activity,
  ChevronRight
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Sintomas associados à lesão dermatológica
 */
export interface DermatoSymptoms {
  prurido: boolean;
  dor: boolean;
  sangramento: boolean;
  secrecao: boolean;
  ardor: boolean;
  descamacao: boolean;
  outros: string;
}

/**
 * Estrutura de dados da Anamnese Dermatológica
 */
export interface AnamneseDermatoData {
  id: string;
  patient_id: string;
  version: number;
  queixa_principal: string;
  inicio_evolucao_lesao: string;
  sintomas_associados: DermatoSymptoms;
  fatores_desencadeantes: string;
  historico_familiar: string;
  doencas_previas: string;
  uso_medicamentos: string;
  alergias: string;
  habitos_exposicao_solar: string;
  habitos_cosmeticos: string;
  tratamentos_anteriores: string;
  created_at: string;
  created_by: string;
  created_by_name?: string;
  is_current: boolean;
}

interface AnamneseDermatoBlockProps {
  currentAnamnese: AnamneseDermatoData | null;
  anamneseHistory: AnamneseDermatoData[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onSave: (data: Omit<AnamneseDermatoData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
}

const defaultSymptoms: DermatoSymptoms = {
  prurido: false,
  dor: false,
  sangramento: false,
  secrecao: false,
  ardor: false,
  descamacao: false,
  outros: '',
};

/**
 * ANAMNESE DERMATOLÓGICA - Bloco exclusivo para Dermatologia
 * 
 * Contém campos específicos para avaliação dermatológica:
 * - Queixa principal
 * - Início e evolução da lesão
 * - Sintomas associados (prurido, dor, sangramento, etc.)
 * - Fatores desencadeantes
 * - Histórico familiar dermatológico
 * - Doenças prévias
 * - Uso de medicamentos
 * - Alergias
 * - Hábitos (exposição solar, cosméticos)
 * - Tratamentos anteriores
 * 
 * Regras:
 * - Não sobrescreve automaticamente anamneses anteriores
 * - Permite atualização manual (cria nova versão)
 * - Mantém histórico/versionamento completo
 */
export function AnamneseDermatoBlock({
  currentAnamnese,
  anamneseHistory,
  loading = false,
  saving = false,
  canEdit = false,
  onSave,
}: AnamneseDermatoBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<AnamneseDermatoData | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    queixa_principal: '',
    inicio_evolucao_lesao: '',
    sintomas_associados: { ...defaultSymptoms },
    fatores_desencadeantes: '',
    historico_familiar: '',
    doencas_previas: '',
    uso_medicamentos: '',
    alergias: '',
    habitos_exposicao_solar: '',
    habitos_cosmeticos: '',
    tratamentos_anteriores: '',
  });

  const handleStartEdit = () => {
    if (currentAnamnese) {
      setFormData({
        queixa_principal: currentAnamnese.queixa_principal || '',
        inicio_evolucao_lesao: currentAnamnese.inicio_evolucao_lesao || '',
        sintomas_associados: currentAnamnese.sintomas_associados || { ...defaultSymptoms },
        fatores_desencadeantes: currentAnamnese.fatores_desencadeantes || '',
        historico_familiar: currentAnamnese.historico_familiar || '',
        doencas_previas: currentAnamnese.doencas_previas || '',
        uso_medicamentos: currentAnamnese.uso_medicamentos || '',
        alergias: currentAnamnese.alergias || '',
        habitos_exposicao_solar: currentAnamnese.habitos_exposicao_solar || '',
        habitos_cosmeticos: currentAnamnese.habitos_cosmeticos || '',
        tratamentos_anteriores: currentAnamnese.tratamentos_anteriores || '',
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      queixa_principal: '',
      inicio_evolucao_lesao: '',
      sintomas_associados: { ...defaultSymptoms },
      fatores_desencadeantes: '',
      historico_familiar: '',
      doencas_previas: '',
      uso_medicamentos: '',
      alergias: '',
      habitos_exposicao_solar: '',
      habitos_cosmeticos: '',
      tratamentos_anteriores: '',
    });
  };

  const handleSave = async () => {
    await onSave(formData);
    setIsEditing(false);
  };

  const handleSymptomChange = (symptom: keyof Omit<DermatoSymptoms, 'outros'>, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sintomas_associados: {
        ...prev.sintomas_associados,
        [symptom]: checked,
      },
    }));
  };

  const formatSymptoms = (symptoms: DermatoSymptoms): string => {
    const activeSymptoms: string[] = [];
    if (symptoms.prurido) activeSymptoms.push('Prurido');
    if (symptoms.dor) activeSymptoms.push('Dor');
    if (symptoms.sangramento) activeSymptoms.push('Sangramento');
    if (symptoms.secrecao) activeSymptoms.push('Secreção');
    if (symptoms.ardor) activeSymptoms.push('Ardor');
    if (symptoms.descamacao) activeSymptoms.push('Descamação');
    if (symptoms.outros) activeSymptoms.push(symptoms.outros);
    
    return activeSymptoms.length > 0 ? activeSymptoms.join(', ') : 'Nenhum sintoma registrado';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Empty state - no anamnese yet
  if (!currentAnamnese && !isEditing) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Scan className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Nenhuma anamnese dermatológica registrada</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Registre a anamnese dermatológica inicial do paciente para começar o acompanhamento.
          </p>
          {canEdit && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Registrar Anamnese
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              {currentAnamnese ? 'Atualizar Anamnese Dermatológica' : 'Nova Anamnese Dermatológica'}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
          {currentAnamnese && (
            <p className="text-sm text-muted-foreground">
              Uma nova versão será criada. O histórico anterior será preservado.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6">
              {/* Queixa Principal */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Scan className="h-4 w-4 text-primary" />
                  Queixa Principal
                </Label>
                <Textarea
                  placeholder="Descreva a queixa dermatológica principal do paciente..."
                  value={formData.queixa_principal}
                  onChange={(e) => setFormData(prev => ({ ...prev, queixa_principal: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Início e Evolução da Lesão */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Início e Evolução da Lesão
                </Label>
                <Textarea
                  placeholder="Quando começou? Como evoluiu? Mudou de tamanho, cor ou forma?"
                  value={formData.inicio_evolucao_lesao}
                  onChange={(e) => setFormData(prev => ({ ...prev, inicio_evolucao_lesao: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Sintomas Associados */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  Sintomas Associados
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="prurido"
                      checked={formData.sintomas_associados.prurido}
                      onCheckedChange={(checked) => handleSymptomChange('prurido', checked as boolean)}
                    />
                    <label htmlFor="prurido" className="text-sm cursor-pointer">Prurido (coceira)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dor"
                      checked={formData.sintomas_associados.dor}
                      onCheckedChange={(checked) => handleSymptomChange('dor', checked as boolean)}
                    />
                    <label htmlFor="dor" className="text-sm cursor-pointer">Dor</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sangramento"
                      checked={formData.sintomas_associados.sangramento}
                      onCheckedChange={(checked) => handleSymptomChange('sangramento', checked as boolean)}
                    />
                    <label htmlFor="sangramento" className="text-sm cursor-pointer">Sangramento</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="secrecao"
                      checked={formData.sintomas_associados.secrecao}
                      onCheckedChange={(checked) => handleSymptomChange('secrecao', checked as boolean)}
                    />
                    <label htmlFor="secrecao" className="text-sm cursor-pointer">Secreção</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ardor"
                      checked={formData.sintomas_associados.ardor}
                      onCheckedChange={(checked) => handleSymptomChange('ardor', checked as boolean)}
                    />
                    <label htmlFor="ardor" className="text-sm cursor-pointer">Ardor</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="descamacao"
                      checked={formData.sintomas_associados.descamacao}
                      onCheckedChange={(checked) => handleSymptomChange('descamacao', checked as boolean)}
                    />
                    <label htmlFor="descamacao" className="text-sm cursor-pointer">Descamação</label>
                  </div>
                </div>
                <Textarea
                  placeholder="Outros sintomas..."
                  value={formData.sintomas_associados.outros}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    sintomas_associados: { ...prev.sintomas_associados, outros: e.target.value }
                  }))}
                  rows={2}
                />
              </div>

              {/* Fatores Desencadeantes */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-cyan-500" />
                  Fatores Desencadeantes
                </Label>
                <Textarea
                  placeholder="O que piora ou melhora a lesão? Exposição solar, estresse, alimentos, medicamentos?"
                  value={formData.fatores_desencadeantes}
                  onChange={(e) => setFormData(prev => ({ ...prev, fatores_desencadeantes: e.target.value }))}
                  rows={2}
                />
              </div>

              <Separator />

              {/* Histórico Familiar */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  Histórico Familiar Dermatológico
                </Label>
                <Textarea
                  placeholder="Doenças de pele na família (psoríase, vitiligo, melanoma, atopia...)"
                  value={formData.historico_familiar}
                  onChange={(e) => setFormData(prev => ({ ...prev, historico_familiar: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Doenças Prévias */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  Doenças Prévias
                </Label>
                <Textarea
                  placeholder="Doenças dermatológicas anteriores, condições sistêmicas relevantes..."
                  value={formData.doencas_previas}
                  onChange={(e) => setFormData(prev => ({ ...prev, doencas_previas: e.target.value }))}
                  rows={2}
                />
              </div>

              <Separator />

              {/* Uso de Medicamentos */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-blue-500" />
                  Uso de Medicamentos
                </Label>
                <Textarea
                  placeholder="Medicamentos em uso (tópicos e sistêmicos), incluindo dosagem..."
                  value={formData.uso_medicamentos}
                  onChange={(e) => setFormData(prev => ({ ...prev, uso_medicamentos: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Alergias */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Alergias
                </Label>
                <Textarea
                  placeholder="Alergias medicamentosas, alimentares, de contato, cosméticos..."
                  value={formData.alergias}
                  onChange={(e) => setFormData(prev => ({ ...prev, alergias: e.target.value }))}
                  rows={2}
                />
              </div>

              <Separator />

              {/* Hábitos - Exposição Solar */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-500" />
                  Hábitos de Exposição Solar
                </Label>
                <Textarea
                  placeholder="Exposição solar diária, uso de protetor solar, histórico de queimaduras, bronzeamento artificial..."
                  value={formData.habitos_exposicao_solar}
                  onChange={(e) => setFormData(prev => ({ ...prev, habitos_exposicao_solar: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Hábitos - Cosméticos */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-pink-500" />
                  Uso de Cosméticos
                </Label>
                <Textarea
                  placeholder="Produtos de uso diário, maquiagem, cremes, sabonetes, procedimentos estéticos..."
                  value={formData.habitos_cosmeticos}
                  onChange={(e) => setFormData(prev => ({ ...prev, habitos_cosmeticos: e.target.value }))}
                  rows={2}
                />
              </div>

              <Separator />

              {/* Tratamentos Anteriores */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <History className="h-4 w-4 text-gray-500" />
                  Tratamentos Anteriores
                </Label>
                <Textarea
                  placeholder="Tratamentos já realizados para esta condição, resultados obtidos..."
                  value={formData.tratamentos_anteriores}
                  onChange={(e) => setFormData(prev => ({ ...prev, tratamentos_anteriores: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // View mode
  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Anamnese Dermatológica</h2>
          <Badge variant="outline" className="text-xs">
            Versão {currentAnamnese?.version || 1}
          </Badge>
        </div>
        <div className="flex gap-2">
          {anamneseHistory.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-1" />
              Histórico ({anamneseHistory.length})
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={handleStartEdit}>
              <Edit3 className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          )}
        </div>
      </div>

      {/* Last update info */}
      {currentAnamnese && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Clock className="h-4 w-4" />
          <span>
            Última atualização em{' '}
            {format(parseISO(currentAnamnese.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {currentAnamnese.created_by_name && ` por ${currentAnamnese.created_by_name}`}
          </span>
        </div>
      )}

      {/* Anamnese Content */}
      <Card>
        <CardContent className="p-0">
          <Accordion type="multiple" defaultValue={['queixa', 'evolucao', 'sintomas']} className="w-full">
            {/* Queixa Principal */}
            <AccordionItem value="queixa" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Scan className="h-4 w-4 text-primary" />
                  <span>Queixa Principal</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.queixa_principal || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Início e Evolução */}
            <AccordionItem value="evolucao" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Início e Evolução da Lesão</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.inicio_evolucao_lesao || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Sintomas Associados */}
            <AccordionItem value="sintomas" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  <span>Sintomas Associados</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm">
                  {currentAnamnese?.sintomas_associados 
                    ? formatSymptoms(currentAnamnese.sintomas_associados)
                    : <span className="italic text-muted-foreground">Não informado</span>
                  }
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Fatores Desencadeantes */}
            <AccordionItem value="fatores" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-cyan-500" />
                  <span>Fatores Desencadeantes</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.fatores_desencadeantes || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Histórico Familiar */}
            <AccordionItem value="historico_familiar" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span>Histórico Familiar</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.historico_familiar || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Doenças Prévias */}
            <AccordionItem value="doencas_previas" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  <span>Doenças Prévias</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.doencas_previas || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Medicamentos */}
            <AccordionItem value="medicamentos" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-blue-500" />
                  <span>Uso de Medicamentos</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.uso_medicamentos || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Alergias */}
            <AccordionItem value="alergias" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span>Alergias</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.alergias || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Exposição Solar */}
            <AccordionItem value="exposicao_solar" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>Exposição Solar</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.habitos_exposicao_solar || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Cosméticos */}
            <AccordionItem value="cosmeticos" className="border-b">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-pink-500" />
                  <span>Uso de Cosméticos</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.habitos_cosmeticos || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Tratamentos Anteriores */}
            <AccordionItem value="tratamentos">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-gray-500" />
                  <span>Tratamentos Anteriores</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm whitespace-pre-wrap">
                  {currentAnamnese?.tratamentos_anteriores || <span className="italic text-muted-foreground">Não informado</span>}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Anamneses
            </DialogTitle>
            <DialogDescription>
              Versões anteriores da anamnese dermatológica deste paciente.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {anamneseHistory.map((version) => (
                <Card 
                  key={version.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    version.is_current ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    setSelectedVersion(version);
                    setShowHistory(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={version.is_current ? 'default' : 'outline'}>
                          v{version.version}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">
                            {format(parseISO(version.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          {version.created_by_name && (
                            <p className="text-xs text-muted-foreground">
                              por {version.created_by_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {version.is_current && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        Versão Atual
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Version Detail Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Anamnese - Versão {selectedVersion?.version}
            </DialogTitle>
            <DialogDescription>
              {selectedVersion && format(parseISO(selectedVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {selectedVersion?.created_by_name && ` por ${selectedVersion.created_by_name}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedVersion && (
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-1">Queixa Principal</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedVersion.queixa_principal || 'Não informado'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-1">Início e Evolução da Lesão</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedVersion.inicio_evolucao_lesao || 'Não informado'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-1">Sintomas Associados</h4>
                  <p className="text-muted-foreground">
                    {selectedVersion.sintomas_associados 
                      ? formatSymptoms(selectedVersion.sintomas_associados)
                      : 'Não informado'
                    }
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-1">Fatores Desencadeantes</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedVersion.fatores_desencadeantes || 'Não informado'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-1">Histórico Familiar</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedVersion.historico_familiar || 'Não informado'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-1">Doenças Prévias</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedVersion.doencas_previas || 'Não informado'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-1">Uso de Medicamentos</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedVersion.uso_medicamentos || 'Não informado'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-1">Alergias</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedVersion.alergias || 'Não informado'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-1">Exposição Solar</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedVersion.habitos_exposicao_solar || 'Não informado'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-1">Uso de Cosméticos</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedVersion.habitos_cosmeticos || 'Não informado'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-1">Tratamentos Anteriores</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedVersion.tratamentos_anteriores || 'Não informado'}
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AnamneseDermatoBlock;
