import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Edit3,
  Save,
  X,
  Clock,
  History,
  Plus,
  Trash2,
  Scan,
  MapPin,
  Palette,
  Circle,
  Square,
  Ruler,
  Layers,
  Grid3X3,
  Image,
  Upload,
  ChevronRight
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InteractiveImageCanvas } from "../InteractiveImageCanvas";

/**
 * Tipos de lesão dermatológica
 */
export const LESION_TYPES = [
  { value: 'macula', label: 'Mácula' },
  { value: 'papula', label: 'Pápula' },
  { value: 'nodulo', label: 'Nódulo' },
  { value: 'placa', label: 'Placa' },
  { value: 'vesicula', label: 'Vesícula' },
  { value: 'bolha', label: 'Bolha' },
  { value: 'pustula', label: 'Pústula' },
  { value: 'erosao', label: 'Erosão' },
  { value: 'ulcera', label: 'Úlcera' },
  { value: 'crosta', label: 'Crosta' },
  { value: 'escama', label: 'Escama' },
  { value: 'atrofia', label: 'Atrofia' },
  { value: 'cicatriz', label: 'Cicatriz' },
  { value: 'comedao', label: 'Comedão' },
  { value: 'cisto', label: 'Cisto' },
  { value: 'tumor', label: 'Tumor' },
  { value: 'outro', label: 'Outro' },
] as const;

/**
 * Localizações corporais
 */
export const BODY_LOCATIONS = [
  { value: 'face', label: 'Face' },
  { value: 'couro_cabeludo', label: 'Couro Cabeludo' },
  { value: 'pescoco', label: 'Pescoço' },
  { value: 'tronco_anterior', label: 'Tronco Anterior' },
  { value: 'tronco_posterior', label: 'Tronco Posterior' },
  { value: 'membro_superior_direito', label: 'Membro Superior Direito' },
  { value: 'membro_superior_esquerdo', label: 'Membro Superior Esquerdo' },
  { value: 'mao_direita', label: 'Mão Direita' },
  { value: 'mao_esquerda', label: 'Mão Esquerda' },
  { value: 'membro_inferior_direito', label: 'Membro Inferior Direito' },
  { value: 'membro_inferior_esquerdo', label: 'Membro Inferior Esquerdo' },
  { value: 'pe_direito', label: 'Pé Direito' },
  { value: 'pe_esquerdo', label: 'Pé Esquerdo' },
  { value: 'regiao_genital', label: 'Região Genital' },
  { value: 'gluteo', label: 'Glúteo' },
  { value: 'unhas', label: 'Unhas' },
  { value: 'mucosa_oral', label: 'Mucosa Oral' },
  { value: 'generalizado', label: 'Generalizado' },
  { value: 'outro', label: 'Outro' },
] as const;

/**
 * Colorações das lesões
 */
export const LESION_COLORS = [
  { value: 'eritematosa', label: 'Eritematosa (vermelha)' },
  { value: 'hipercromica', label: 'Hipercrômica (escura)' },
  { value: 'hipocromica', label: 'Hipocrômica (clara)' },
  { value: 'acromica', label: 'Acrômica (sem pigmento)' },
  { value: 'amarelada', label: 'Amarelada' },
  { value: 'violacea', label: 'Violácea' },
  { value: 'acastanhada', label: 'Acastanhada' },
  { value: 'enegrecida', label: 'Enegrecida' },
  { value: 'perolada', label: 'Perolada' },
  { value: 'normocorada', label: 'Normocorada' },
] as const;

/**
 * Formatos das lesões
 */
export const LESION_SHAPES = [
  { value: 'circular', label: 'Circular' },
  { value: 'oval', label: 'Oval' },
  { value: 'irregular', label: 'Irregular' },
  { value: 'linear', label: 'Linear' },
  { value: 'anular', label: 'Anular' },
  { value: 'arciforme', label: 'Arciforme' },
  { value: 'polimorfa', label: 'Polimorfa' },
  { value: 'serpiginosa', label: 'Serpiginosa' },
  { value: 'reticulada', label: 'Reticulada' },
] as const;

/**
 * Tipos de bordas
 */
export const LESION_BORDERS = [
  { value: 'regulares', label: 'Regulares' },
  { value: 'irregulares', label: 'Irregulares' },
  { value: 'bem_definidas', label: 'Bem definidas' },
  { value: 'mal_definidas', label: 'Mal definidas' },
  { value: 'elevadas', label: 'Elevadas' },
  { value: 'infiltradas', label: 'Infiltradas' },
  { value: 'descamativas', label: 'Descamativas' },
] as const;

/**
 * Tipos de superfície
 */
export const LESION_SURFACES = [
  { value: 'lisa', label: 'Lisa' },
  { value: 'rugosa', label: 'Rugosa' },
  { value: 'verrucosa', label: 'Verrucosa' },
  { value: 'escamosa', label: 'Escamosa' },
  { value: 'crostosa', label: 'Crostosa' },
  { value: 'ulcerada', label: 'Ulcerada' },
  { value: 'exsudativa', label: 'Exsudativa' },
  { value: 'queratosica', label: 'Queratósica' },
] as const;

/**
 * Padrões de distribuição
 */
export const DISTRIBUTION_PATTERNS = [
  { value: 'localizada', label: 'Localizada' },
  { value: 'disseminada', label: 'Disseminada' },
  { value: 'generalizada', label: 'Generalizada' },
  { value: 'simetrica', label: 'Simétrica' },
  { value: 'assimetrica', label: 'Assimétrica' },
  { value: 'fotoexposta', label: 'Áreas fotoexpostas' },
  { value: 'flexural', label: 'Flexural' },
  { value: 'extensora', label: 'Extensora' },
  { value: 'segmentar', label: 'Segmentar' },
  { value: 'dermatomal', label: 'Dermatomal' },
] as const;

/**
 * Descrição de uma lesão individual
 */
export interface LesionDescription {
  id: string;
  tipo: string;
  localizacao: string;
  localizacao_detalhe?: string;
  coloracao: string;
  formato: string;
  bordas: string;
  tamanho: string;
  superficie: string;
  distribuicao: string;
  observacoes?: string;
}

/**
 * Estrutura de dados do Exame Dermatológico
 */
export interface ExameDermatoData {
  id: string;
  patient_id: string;
  version: number;
  lesions: LesionDescription[];
  body_map_front_drawing?: string;
  body_map_back_drawing?: string;
  clinical_photo_url?: string;
  observacoes_gerais?: string;
  created_at: string;
  created_by: string;
  created_by_name?: string;
  is_current: boolean;
}

interface ExameDermatoBlockProps {
  currentExame: ExameDermatoData | null;
  exameHistory: ExameDermatoData[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onSave: (data: Omit<ExameDermatoData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
  /** URL da imagem do corpo (frente) para desenho */
  bodyMapFrontUrl?: string;
  /** URL da imagem do corpo (costas) para desenho */
  bodyMapBackUrl?: string;
}

const createEmptyLesion = (): LesionDescription => ({
  id: crypto.randomUUID(),
  tipo: '',
  localizacao: '',
  coloracao: '',
  formato: '',
  bordas: '',
  tamanho: '',
  superficie: '',
  distribuicao: '',
});

/**
 * EXAME DERMATOLÓGICO - Bloco exclusivo para Dermatologia
 * 
 * Permite registrar:
 * - Múltiplas lesões com descrição detalhada
 * - Tipo, localização, coloração, formato, bordas, tamanho, superfície, distribuição
 * - Desenho sobre imagem corporal (frente/costas)
 * - Upload de fotos clínicas
 * - Observações gerais
 * 
 * Com histórico e versionamento
 */
export function ExameDermatoBlock({
  currentExame,
  exameHistory,
  loading = false,
  saving = false,
  canEdit = false,
  onSave,
  bodyMapFrontUrl,
  bodyMapBackUrl,
}: ExameDermatoBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ExameDermatoData | null>(null);
  const [activeBodyView, setActiveBodyView] = useState<'front' | 'back'>('front');
  
  // Form state
  const [lesions, setLesions] = useState<LesionDescription[]>([]);
  const [bodyMapFrontDrawing, setBodyMapFrontDrawing] = useState<string>('');
  const [bodyMapBackDrawing, setBodyMapBackDrawing] = useState<string>('');
  const [observacoesGerais, setObservacoesGerais] = useState('');

  const handleStartEdit = () => {
    if (currentExame) {
      setLesions(currentExame.lesions || []);
      setBodyMapFrontDrawing(currentExame.body_map_front_drawing || '');
      setBodyMapBackDrawing(currentExame.body_map_back_drawing || '');
      setObservacoesGerais(currentExame.observacoes_gerais || '');
    } else {
      setLesions([createEmptyLesion()]);
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLesions([]);
    setBodyMapFrontDrawing('');
    setBodyMapBackDrawing('');
    setObservacoesGerais('');
  };

  const handleSave = async () => {
    await onSave({
      lesions,
      body_map_front_drawing: bodyMapFrontDrawing || undefined,
      body_map_back_drawing: bodyMapBackDrawing || undefined,
      observacoes_gerais: observacoesGerais || undefined,
    });
    setIsEditing(false);
  };

  const addLesion = () => {
    setLesions(prev => [...prev, createEmptyLesion()]);
  };

  const removeLesion = (id: string) => {
    setLesions(prev => prev.filter(l => l.id !== id));
  };

  const updateLesion = (id: string, field: keyof LesionDescription, value: string) => {
    setLesions(prev => prev.map(l => 
      l.id === id ? { ...l, [field]: value } : l
    ));
  };

  const getLesionLabel = (value: string, options: readonly { value: string; label: string }[]) => {
    return options.find(o => o.value === value)?.label || value || '—';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Empty state
  if (!currentExame && !isEditing) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Scan className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Nenhum exame dermatológico registrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Registre as características das lesões cutâneas do paciente.
          </p>
          {canEdit && (
            <Button onClick={handleStartEdit}>
              <Edit3 className="h-4 w-4 mr-2" />
              Registrar Exame
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
              {currentExame ? 'Atualizar Exame Dermatológico' : 'Novo Exame Dermatológico'}
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
          {currentExame && (
            <p className="text-sm text-muted-foreground">
              Uma nova versão será criada. O histórico anterior será preservado.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Lesões */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    Lesões Cutâneas
                  </Label>
                  <Button type="button" size="sm" variant="outline" onClick={addLesion}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Lesão
                  </Button>
                </div>

                {lesions.map((lesion, index) => (
                  <Card key={lesion.id} className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Lesão {index + 1}</span>
                        {lesions.length > 1 && (
                          <Button 
                            type="button" 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeLesion(lesion.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tipo */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-xs">
                            <Circle className="h-3 w-3" />
                            Tipo de Lesão
                          </Label>
                          <Select 
                            value={lesion.tipo}
                            onValueChange={(v) => updateLesion(lesion.id, 'tipo', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {LESION_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Localização */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-xs">
                            <MapPin className="h-3 w-3" />
                            Localização
                          </Label>
                          <Select 
                            value={lesion.localizacao}
                            onValueChange={(v) => updateLesion(lesion.id, 'localizacao', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a localização" />
                            </SelectTrigger>
                            <SelectContent>
                              {BODY_LOCATIONS.map(loc => (
                                <SelectItem key={loc.value} value={loc.value}>
                                  {loc.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Coloração */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-xs">
                            <Palette className="h-3 w-3" />
                            Coloração
                          </Label>
                          <Select 
                            value={lesion.coloracao}
                            onValueChange={(v) => updateLesion(lesion.id, 'coloracao', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coloração" />
                            </SelectTrigger>
                            <SelectContent>
                              {LESION_COLORS.map(color => (
                                <SelectItem key={color.value} value={color.value}>
                                  {color.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Formato */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-xs">
                            <Square className="h-3 w-3" />
                            Formato
                          </Label>
                          <Select 
                            value={lesion.formato}
                            onValueChange={(v) => updateLesion(lesion.id, 'formato', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o formato" />
                            </SelectTrigger>
                            <SelectContent>
                              {LESION_SHAPES.map(shape => (
                                <SelectItem key={shape.value} value={shape.value}>
                                  {shape.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Bordas */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-xs">
                            <Circle className="h-3 w-3" />
                            Bordas
                          </Label>
                          <Select 
                            value={lesion.bordas}
                            onValueChange={(v) => updateLesion(lesion.id, 'bordas', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de borda" />
                            </SelectTrigger>
                            <SelectContent>
                              {LESION_BORDERS.map(border => (
                                <SelectItem key={border.value} value={border.value}>
                                  {border.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Tamanho */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-xs">
                            <Ruler className="h-3 w-3" />
                            Tamanho
                          </Label>
                          <Input 
                            placeholder="Ex: 2x3 cm, 5mm"
                            value={lesion.tamanho}
                            onChange={(e) => updateLesion(lesion.id, 'tamanho', e.target.value)}
                          />
                        </div>

                        {/* Superfície */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-xs">
                            <Layers className="h-3 w-3" />
                            Superfície
                          </Label>
                          <Select 
                            value={lesion.superficie}
                            onValueChange={(v) => updateLesion(lesion.id, 'superficie', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de superfície" />
                            </SelectTrigger>
                            <SelectContent>
                              {LESION_SURFACES.map(surf => (
                                <SelectItem key={surf.value} value={surf.value}>
                                  {surf.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Distribuição */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-xs">
                            <Grid3X3 className="h-3 w-3" />
                            Distribuição
                          </Label>
                          <Select 
                            value={lesion.distribuicao}
                            onValueChange={(v) => updateLesion(lesion.id, 'distribuicao', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o padrão" />
                            </SelectTrigger>
                            <SelectContent>
                              {DISTRIBUTION_PATTERNS.map(dist => (
                                <SelectItem key={dist.value} value={dist.value}>
                                  {dist.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Observações da lesão */}
                      <div className="space-y-2">
                        <Label className="text-xs">Observações desta lesão</Label>
                        <Textarea
                          placeholder="Observações adicionais sobre esta lesão..."
                          value={lesion.observacoes || ''}
                          onChange={(e) => updateLesion(lesion.id, 'observacoes', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              {/* Mapa Corporal */}
              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Image className="h-4 w-4 text-primary" />
                  Mapa Corporal (opcional)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Desenhe sobre a imagem para marcar a localização das lesões.
                </p>

                <Tabs value={activeBodyView} onValueChange={(v) => setActiveBodyView(v as 'front' | 'back')}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="front">Frente</TabsTrigger>
                    <TabsTrigger value="back">Costas</TabsTrigger>
                  </TabsList>

                  <TabsContent value="front">
                    <InteractiveImageCanvas
                      baseImageUrl={bodyMapFrontUrl}
                      drawingData={bodyMapFrontDrawing}
                      onChange={setBodyMapFrontDrawing}
                      height={500}
                    />
                  </TabsContent>

                  <TabsContent value="back">
                    <InteractiveImageCanvas
                      baseImageUrl={bodyMapBackUrl}
                      drawingData={bodyMapBackDrawing}
                      onChange={setBodyMapBackDrawing}
                      height={500}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <Separator />

              {/* Observações Gerais */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-muted-foreground" />
                  Observações Gerais do Exame
                </Label>
                <Textarea
                  placeholder="Outras observações relevantes sobre o exame dermatológico..."
                  value={observacoesGerais}
                  onChange={(e) => setObservacoesGerais(e.target.value)}
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
          <h2 className="text-lg font-semibold">Exame Dermatológico</h2>
          <Badge variant="outline" className="text-xs">
            Versão {currentExame?.version || 1}
          </Badge>
        </div>
        <div className="flex gap-2">
          {exameHistory.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-1" />
              Histórico ({exameHistory.length})
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
      {currentExame && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Clock className="h-4 w-4" />
          <span>
            Última atualização em{' '}
            {format(parseISO(currentExame.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {currentExame.created_by_name && ` por ${currentExame.created_by_name}`}
          </span>
        </div>
      )}

      {/* Lesões registradas */}
      {currentExame?.lesions && currentExame.lesions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Lesões Identificadas ({currentExame.lesions.length})
          </h3>
          
          {currentExame.lesions.map((lesion, index) => (
            <Card key={lesion.id} className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="secondary">Lesão {index + 1}</Badge>
                  {lesion.tipo && (
                    <Badge variant="outline">
                      {getLesionLabel(lesion.tipo, LESION_TYPES)}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Localização</span>
                    <p className="font-medium">{getLesionLabel(lesion.localizacao, BODY_LOCATIONS)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Coloração</span>
                    <p className="font-medium">{getLesionLabel(lesion.coloracao, LESION_COLORS)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Formato</span>
                    <p className="font-medium">{getLesionLabel(lesion.formato, LESION_SHAPES)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Bordas</span>
                    <p className="font-medium">{getLesionLabel(lesion.bordas, LESION_BORDERS)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Tamanho</span>
                    <p className="font-medium">{lesion.tamanho || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Superfície</span>
                    <p className="font-medium">{getLesionLabel(lesion.superficie, LESION_SURFACES)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Distribuição</span>
                    <p className="font-medium">{getLesionLabel(lesion.distribuicao, DISTRIBUTION_PATTERNS)}</p>
                  </div>
                </div>
                {lesion.observacoes && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-muted-foreground text-xs">Observações</span>
                    <p className="text-sm">{lesion.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mapa Corporal (visualização) */}
      {(currentExame?.body_map_front_drawing || currentExame?.body_map_back_drawing) && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <Image className="h-4 w-4" />
            Mapa Corporal
          </h3>
          
          <Tabs defaultValue="front">
            <TabsList className="mb-3">
              <TabsTrigger value="front" disabled={!currentExame?.body_map_front_drawing}>
                Frente
              </TabsTrigger>
              <TabsTrigger value="back" disabled={!currentExame?.body_map_back_drawing}>
                Costas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="front">
              {currentExame?.body_map_front_drawing && (
                <InteractiveImageCanvas
                  baseImageUrl={bodyMapFrontUrl}
                  drawingData={currentExame.body_map_front_drawing}
                  readOnly
                  height={400}
                />
              )}
            </TabsContent>

            <TabsContent value="back">
              {currentExame?.body_map_back_drawing && (
                <InteractiveImageCanvas
                  baseImageUrl={bodyMapBackUrl}
                  drawingData={currentExame.body_map_back_drawing}
                  readOnly
                  height={400}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Observações gerais */}
      {currentExame?.observacoes_gerais && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium text-sm mb-2">Observações Gerais</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {currentExame.observacoes_gerais}
            </p>
          </CardContent>
        </Card>
      )}

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Exames
            </DialogTitle>
            <DialogDescription>
              Versões anteriores do exame dermatológico deste paciente.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {exameHistory.map((version) => (
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
                          <p className="text-xs text-muted-foreground">
                            {version.lesions?.length || 0} lesões registradas
                          </p>
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
              <Scan className="h-5 w-5" />
              Exame Dermatológico - Versão {selectedVersion?.version}
            </DialogTitle>
            <DialogDescription>
              {selectedVersion && format(parseISO(selectedVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {selectedVersion?.created_by_name && ` por ${selectedVersion.created_by_name}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedVersion && (
              <div className="space-y-4">
                {selectedVersion.lesions?.map((lesion, index) => (
                  <Card key={lesion.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <Badge variant="secondary" className="mb-2">Lesão {index + 1}</Badge>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Tipo:</span> {getLesionLabel(lesion.tipo, LESION_TYPES)}</div>
                        <div><span className="text-muted-foreground">Local:</span> {getLesionLabel(lesion.localizacao, BODY_LOCATIONS)}</div>
                        <div><span className="text-muted-foreground">Cor:</span> {getLesionLabel(lesion.coloracao, LESION_COLORS)}</div>
                        <div><span className="text-muted-foreground">Formato:</span> {getLesionLabel(lesion.formato, LESION_SHAPES)}</div>
                        <div><span className="text-muted-foreground">Bordas:</span> {getLesionLabel(lesion.bordas, LESION_BORDERS)}</div>
                        <div><span className="text-muted-foreground">Tamanho:</span> {lesion.tamanho || '—'}</div>
                        <div><span className="text-muted-foreground">Superfície:</span> {getLesionLabel(lesion.superficie, LESION_SURFACES)}</div>
                        <div><span className="text-muted-foreground">Distribuição:</span> {getLesionLabel(lesion.distribuicao, DISTRIBUTION_PATTERNS)}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {selectedVersion.observacoes_gerais && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Observações Gerais</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedVersion.observacoes_gerais}
                    </p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExameDermatoBlock;
