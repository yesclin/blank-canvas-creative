import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Camera,
  Upload,
  Plus,
  X,
  CalendarIcon,
  Image,
  Trash2,
  ZoomIn,
  ArrowLeftRight,
  Link2,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { BODY_LOCATIONS } from "./ExameDermatoBlock";

/**
 * Tipos de imagem dermatológica
 */
export const IMAGE_TYPES = [
  { value: 'clinica', label: 'Foto Clínica' },
  { value: 'dermatoscopia', label: 'Dermatoscopia' },
  { value: 'antes', label: 'Antes (tratamento)' },
  { value: 'depois', label: 'Depois (tratamento)' },
  { value: 'evolucao', label: 'Evolução' },
  { value: 'procedimento', label: 'Procedimento' },
  { value: 'outro', label: 'Outro' },
] as const;

/**
 * Registro de uma imagem dermatológica
 */
export interface ImagemDermatoItem {
  id: string;
  patient_id: string;
  appointment_id?: string;
  evolution_id?: string;
  image_url: string;
  thumbnail_url?: string;
  tipo_imagem: string;
  data_captura: string;
  regiao_corporal?: string;
  regiao_detalhe?: string;
  descricao?: string;
  is_before_after?: boolean;
  before_after_pair_id?: string;
  created_at: string;
  created_by: string;
  created_by_name?: string;
}

/**
 * Grupo de imagens para comparação antes/depois
 */
export interface BeforeAfterPair {
  id: string;
  before: ImagemDermatoItem;
  after?: ImagemDermatoItem;
  titulo?: string;
}

interface ImagensDermatoBlockProps {
  imagens: ImagemDermatoItem[];
  beforeAfterPairs: BeforeAfterPair[];
  loading?: boolean;
  uploading?: boolean;
  canEdit?: boolean;
  onUpload: (files: File[], metadata: Partial<ImagemDermatoItem>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onCreateBeforeAfterPair?: (beforeId: string, afterId: string, titulo?: string) => Promise<void>;
  /** Lista de evoluções para vincular */
  evolucoes?: Array<{ id: string; data: string; descricao: string }>;
}

/**
 * IMAGENS DERMATOLÓGICAS
 * 
 * Permite:
 * - Upload de múltiplas fotos clínicas
 * - Classificação por tipo e região
 * - Comparação antes/depois com slider
 * - Vínculo com evolução clínica
 * - Galeria organizada por data
 */
export function ImagensDermatoBlock({
  imagens,
  beforeAfterPairs,
  loading = false,
  uploading = false,
  canEdit = false,
  onUpload,
  onDelete,
  onCreateBeforeAfterPair,
  evolucoes = [],
}: ImagensDermatoBlockProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImagemDermatoItem | null>(null);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [selectedPair, setSelectedPair] = useState<BeforeAfterPair | null>(null);
  const [compareSliderValue, setCompareSliderValue] = useState([50]);
  
  // Upload form state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [tipoImagem, setTipoImagem] = useState('clinica');
  const [dataCaptura, setDataCaptura] = useState<Date>(new Date());
  const [regiaoCorporal, setRegiaoCorporal] = useState('');
  const [regiaoDetalhe, setRegiaoDetalhe] = useState('');
  const [descricao, setDescricao] = useState('');
  const [evolutionId, setEvolutionId] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setSelectedFiles(prev => [...prev, ...files]);
    
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...urls]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    await onUpload(selectedFiles, {
      tipo_imagem: tipoImagem,
      data_captura: format(dataCaptura, 'yyyy-MM-dd'),
      regiao_corporal: regiaoCorporal || undefined,
      regiao_detalhe: regiaoDetalhe || undefined,
      descricao: descricao || undefined,
      evolution_id: evolutionId || undefined,
    });
    
    // Cleanup
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setShowUploadDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setTipoImagem('clinica');
    setDataCaptura(new Date());
    setRegiaoCorporal('');
    setRegiaoDetalhe('');
    setDescricao('');
    setEvolutionId('');
  };

  const openUploadDialog = () => {
    resetForm();
    setSelectedFiles([]);
    setPreviewUrls([]);
    setShowUploadDialog(true);
  };

  // Group images by date
  const imagesByDate = imagens.reduce((acc, img) => {
    const dateKey = img.data_captura;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(img);
    return acc;
  }, {} as Record<string, ImagemDermatoItem[]>);

  const sortedDates = Object.keys(imagesByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const getImageTypeLabel = (value: string) => {
    return IMAGE_TYPES.find(t => t.value === value)?.label || value;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="aspect-square" />
          <Skeleton className="aspect-square" />
          <Skeleton className="aspect-square" />
          <Skeleton className="aspect-square" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Imagens Dermatológicas</h2>
          {imagens.length > 0 && (
            <Badge variant="secondary">{imagens.length} foto(s)</Badge>
          )}
        </div>
        {canEdit && (
          <Button size="sm" onClick={openUploadDialog}>
            <Upload className="h-4 w-4 mr-1" />
            Enviar Fotos
          </Button>
        )}
      </div>

      {/* Comparações Antes/Depois */}
      {beforeAfterPairs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Comparações Antes/Depois
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {beforeAfterPairs.map((pair) => (
              <Card 
                key={pair.id}
                className="cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                onClick={() => {
                  setSelectedPair(pair);
                  setCompareSliderValue([50]);
                  setShowCompareDialog(true);
                }}
              >
                <div className="relative aspect-[16/9] bg-muted">
                  <div className="absolute inset-0 flex">
                    <div className="w-1/2 overflow-hidden">
                      <img 
                        src={pair.before.image_url} 
                        alt="Antes"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-1/2 overflow-hidden">
                      {pair.after ? (
                        <img 
                          src={pair.after.image_url} 
                          alt="Depois"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Camera className="h-8 w-8 opacity-30" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-px h-full bg-background" />
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="text-xs">Antes</Badge>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="text-xs">Depois</Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">
                    {pair.titulo || 'Comparação'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(pair.before.data_captura), "dd/MM/yyyy", { locale: ptBR })}
                    {pair.after && ` → ${format(parseISO(pair.after.data_captura), "dd/MM/yyyy", { locale: ptBR })}`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Galeria por Data */}
      {sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey} className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {format(parseISO(dateKey), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                <Badge variant="outline" className="text-xs">
                  {imagesByDate[dateKey].length} foto(s)
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {imagesByDate[dateKey].map((img) => (
                  <Card 
                    key={img.id}
                    className="cursor-pointer group overflow-hidden"
                    onClick={() => setSelectedImage(img)}
                  >
                    <div className="relative aspect-square bg-muted">
                      <img 
                        src={img.thumbnail_url || img.image_url}
                        alt={img.descricao || 'Imagem'}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {img.tipo_imagem && (
                        <Badge 
                          variant="secondary" 
                          className="absolute top-2 left-2 text-xs"
                        >
                          {getImageTypeLabel(img.tipo_imagem)}
                        </Badge>
                      )}
                      {img.evolution_id && (
                        <div className="absolute top-2 right-2">
                          <Link2 className="h-4 w-4 text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhuma imagem registrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Envie fotos clínicas para documentar o caso.
            </p>
            {canEdit && (
              <Button onClick={openUploadDialog}>
                <Upload className="h-4 w-4 mr-2" />
                Enviar Fotos
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Enviar Imagens
            </DialogTitle>
            <DialogDescription>
              Adicione fotos clínicas para documentação do caso.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {/* File selection */}
              <div className="space-y-3">
                <Label>Selecionar Imagens</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-24 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center">
                    <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Clique para selecionar ou arraste arquivos
                    </span>
                  </div>
                </Button>
                
                {/* Preview */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={url} 
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removeSelectedFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo */}
                <div className="space-y-2">
                  <Label>Tipo de Imagem</Label>
                  <Select value={tipoImagem} onValueChange={setTipoImagem}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Data */}
                <div className="space-y-2">
                  <Label>Data da Captura</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(dataCaptura, "dd/MM/yyyy", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataCaptura}
                        onSelect={(d) => d && setDataCaptura(d)}
                        locale={ptBR}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Região */}
                <div className="space-y-2">
                  <Label>Região Corporal</Label>
                  <Select value={regiaoCorporal} onValueChange={setRegiaoCorporal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
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

                {/* Detalhe da Região */}
                <div className="space-y-2">
                  <Label>Detalhe da Região</Label>
                  <Input
                    placeholder="Ex: Região periorbital esquerda"
                    value={regiaoDetalhe}
                    onChange={(e) => setRegiaoDetalhe(e.target.value)}
                  />
                </div>
              </div>

              {/* Vincular a Evolução */}
              {evolucoes.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Link2 className="h-3 w-3" />
                    Vincular a Evolução
                  </Label>
                  <Select value={evolutionId} onValueChange={setEvolutionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma evolução (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {evolucoes.map(evo => (
                        <SelectItem key={evo.id} value={evo.id}>
                          {format(parseISO(evo.data), "dd/MM/yyyy", { locale: ptBR })} - {evo.descricao.substring(0, 50)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Descrição */}
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Observações sobre a imagem..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploading || selectedFiles.length === 0}
            >
              {uploading ? 'Enviando...' : `Enviar ${selectedFiles.length} foto(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Detail Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {selectedImage && (
            <>
              <div className="relative bg-black">
                <img 
                  src={selectedImage.image_url}
                  alt={selectedImage.descricao || 'Imagem'}
                  className="w-full max-h-[70vh] object-contain"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-white hover:bg-white/20"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge>{getImageTypeLabel(selectedImage.tipo_imagem)}</Badge>
                  {selectedImage.regiao_corporal && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {BODY_LOCATIONS.find(l => l.value === selectedImage.regiao_corporal)?.label}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {format(parseISO(selectedImage.data_captura), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                {selectedImage.descricao && (
                  <p className="text-sm">{selectedImage.descricao}</p>
                )}
                <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Enviado em {format(parseISO(selectedImage.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {selectedImage.created_by_name && ` por ${selectedImage.created_by_name}`}
                  </span>
                  {canEdit && onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        onDelete(selectedImage.id);
                        setSelectedImage(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Before/After Compare Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {selectedPair && (
            <>
              <DialogHeader className="p-4 pb-0">
                <DialogTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5" />
                  {selectedPair.titulo || 'Comparação Antes/Depois'}
                </DialogTitle>
                <DialogDescription>
                  Arraste o controle para comparar as imagens.
                </DialogDescription>
              </DialogHeader>
              
              <div className="p-4">
                {/* Comparison viewer */}
                <div className="relative aspect-[16/10] bg-muted rounded-lg overflow-hidden">
                  {/* After image (full) */}
                  {selectedPair.after && (
                    <img 
                      src={selectedPair.after.image_url}
                      alt="Depois"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  )}
                  
                  {/* Before image (clipped) */}
                  <div 
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${compareSliderValue[0]}%` }}
                  >
                    <img 
                      src={selectedPair.before.image_url}
                      alt="Antes"
                      className="w-full h-full object-contain"
                      style={{ 
                        width: `${100 / (compareSliderValue[0] / 100)}%`,
                        maxWidth: 'none'
                      }}
                    />
                  </div>
                  
                  {/* Divider line */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                    style={{ left: `${compareSliderValue[0]}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <ChevronLeft className="h-4 w-4 absolute left-1" />
                      <ChevronRight className="h-4 w-4 absolute right-1" />
                    </div>
                  </div>
                  
                  {/* Labels */}
                  <div className="absolute bottom-4 left-4">
                    <Badge variant="secondary">Antes</Badge>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <Badge variant="secondary">Depois</Badge>
                  </div>
                </div>

                {/* Slider control */}
                <div className="mt-4 px-4">
                  <Slider
                    value={compareSliderValue}
                    onValueChange={setCompareSliderValue}
                    min={5}
                    max={95}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Dates */}
                <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                  <span>
                    {format(parseISO(selectedPair.before.data_captura), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  {selectedPair.after && (
                    <span>
                      {format(parseISO(selectedPair.after.data_captura), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ImagensDermatoBlock;
