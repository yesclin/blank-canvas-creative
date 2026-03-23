import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  FileImage,
  FileText,
  Plus,
  Calendar,
  User,
  Search,
  Filter,
  X,
  Save,
  Upload,
  Download,
  Eye,
  Trash2,
  File,
  Image as ImageIcon,
  FileType,
  Clock
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Tipos de documento/exame
 */
export type TipoDocumentoOdonto = 
  | 'radiografia_periapical'
  | 'radiografia_panoramica'
  | 'radiografia_interproximal'
  | 'tomografia'
  | 'laudo'
  | 'atestado'
  | 'receita'
  | 'termo_consentimento'
  | 'foto_clinica'
  | 'outro';

/**
 * Estrutura de um documento/exame
 */
export interface DocumentoOdontologico {
  id: string;
  patient_id: string;
  appointment_id?: string;
  // Documento
  tipo: TipoDocumentoOdonto;
  titulo: string;
  descricao?: string;
  // Arquivo
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  // Localização (opcional)
  dente?: string;
  // Metadata
  data_documento: string;
  created_at: string;
  created_by: string;
  created_by_name?: string;
}

interface ExamesDocumentosBlockProps {
  documentos: DocumentoOdontologico[];
  loading?: boolean;
  uploading?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onUpload: (data: {
    tipo: TipoDocumentoOdonto;
    titulo: string;
    descricao?: string;
    dente?: string;
    data_documento: string;
    file: File;
  }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onView?: (documento: DocumentoOdontologico) => void;
  onDownload?: (documento: DocumentoOdontologico) => void;
}

// Configuração dos tipos de documento
const TIPO_DOCUMENTO_CONFIG: Record<TipoDocumentoOdonto, { label: string; icon: typeof FileText }> = {
  radiografia_periapical: { label: 'Radiografia Periapical', icon: FileImage },
  radiografia_panoramica: { label: 'Radiografia Panorâmica', icon: FileImage },
  radiografia_interproximal: { label: 'Radiografia Interproximal', icon: FileImage },
  tomografia: { label: 'Tomografia', icon: FileImage },
  laudo: { label: 'Laudo', icon: FileText },
  atestado: { label: 'Atestado', icon: FileText },
  receita: { label: 'Receita', icon: FileText },
  termo_consentimento: { label: 'Termo de Consentimento', icon: FileText },
  foto_clinica: { label: 'Foto Clínica', icon: ImageIcon },
  outro: { label: 'Outro', icon: File },
};

// Formatar tamanho do arquivo
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Verificar se é imagem
const isImageFile = (fileType: string): boolean => {
  return fileType.startsWith('image/');
};

type FormDataType = {
  tipo: TipoDocumentoOdonto;
  titulo: string;
  descricao: string;
  dente: string;
  data_documento: string;
  file: File | null;
};

const getEmptyFormData = (): FormDataType => ({
  tipo: 'radiografia_periapical',
  titulo: '',
  descricao: '',
  dente: '',
  data_documento: format(new Date(), 'yyyy-MM-dd'),
  file: null,
});

/**
 * EXAMES E DOCUMENTOS
 * 
 * Upload e gestão de:
 * - Radiografias (periapical, panorâmica, interproximal)
 * - Tomografias
 * - Laudos
 * - Documentos clínicos
 * 
 * Arquivos são armazenados com identificadores únicos (não sobrescritos)
 */
export function ExamesDocumentosBlock({
  documentos,
  loading = false,
  uploading = false,
  canEdit = false,
  canDelete = false,
  onUpload,
  onDelete,
  onView,
  onDownload,
}: ExamesDocumentosBlockProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<FormDataType>(getEmptyFormData());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [previewDoc, setPreviewDoc] = useState<DocumentoOdontologico | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartAdd = () => {
    setFormData(getEmptyFormData());
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setFormData(getEmptyFormData());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file,
        titulo: prev.titulo || file.name.replace(/\.[^/.]+$/, ''),
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.file || !formData.titulo.trim()) return;
    
    await onUpload({
      tipo: formData.tipo,
      titulo: formData.titulo,
      descricao: formData.descricao || undefined,
      dente: formData.dente || undefined,
      data_documento: formData.data_documento,
      file: formData.file,
    });
    handleCancel();
  };

  const handleDelete = async (id: string) => {
    if (onDelete) {
      await onDelete(id);
    }
    setDeleteConfirm(null);
  };

  // Filter documentos
  const filteredDocumentos = documentos.filter(d => {
    const matchesSearch = searchTerm === '' || 
      d.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.dente?.includes(searchTerm);
    const matchesTipo = filterTipo === '' || d.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  // Group by tipo
  const documentosPorTipo = filteredDocumentos.reduce((acc, doc) => {
    const tipo = doc.tipo;
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(doc);
    return acc;
  }, {} as Record<TipoDocumentoOdonto, DocumentoOdontologico[]>);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Exames e Documentos</h2>
          <Badge variant="secondary" className="text-xs">
            {documentos.length} arquivos
          </Badge>
        </div>
        {canEdit && (
          <Button size="sm" onClick={handleStartAdd}>
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        )}
      </div>

      {/* Filters */}
      {documentos.length > 0 && (
        <div className="flex flex-wrap gap-3 p-3 rounded-lg border bg-muted/30">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descrição ou dente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os tipos</SelectItem>
              {Object.entries(TIPO_DOCUMENTO_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Empty state */}
      {documentos.length === 0 && !isAdding && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <FileImage className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum documento anexado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Faça upload de radiografias, tomografias, laudos e outros documentos.
            </p>
            {canEdit && (
              <Button onClick={handleStartAdd}>
                <Upload className="h-4 w-4 mr-2" />
                Fazer Upload
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documents Grid */}
      {filteredDocumentos.length > 0 && (
        <div className="space-y-6">
          {Object.entries(documentosPorTipo).map(([tipo, docs]) => {
            const config = TIPO_DOCUMENTO_CONFIG[tipo as TipoDocumentoOdonto];
            const Icon = config.icon;
            
            return (
              <div key={tipo} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  {config.label} ({docs.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {docs.map((doc) => (
                    <Card key={doc.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        {/* Preview thumbnail for images */}
                        {isImageFile(doc.file_type) && (
                          <div 
                            className="h-32 mb-3 rounded-md overflow-hidden bg-muted cursor-pointer"
                            onClick={() => setPreviewDoc(doc)}
                          >
                            <img 
                              src={doc.file_url} 
                              alt={doc.titulo}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        
                        {/* File info for non-images */}
                        {!isImageFile(doc.file_type) && (
                          <div 
                            className="h-24 mb-3 rounded-md bg-muted flex items-center justify-center cursor-pointer"
                            onClick={() => onView?.(doc)}
                          >
                            <FileType className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}

                        {/* Title & info */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm line-clamp-1" title={doc.titulo}>
                            {doc.titulo}
                          </h4>
                          
                          <div className="flex flex-wrap gap-1">
                            {doc.dente && (
                              <Badge variant="secondary" className="text-xs">
                                Dente {doc.dente}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {formatFileSize(doc.file_size)}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(doc.data_documento), 'dd/MM/yyyy')}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 pt-2 border-t">
                            {isImageFile(doc.file_type) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setPreviewDoc(doc)}
                                title="Visualizar"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onDownload?.(doc)}
                              title="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            {canDelete && onDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setDeleteConfirm(doc.id)}
                                title="Excluir"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {documentos.length > 0 && filteredDocumentos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum documento encontrado com os filtros aplicados.</p>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload de Documento
            </DialogTitle>
            <DialogDescription>
              O arquivo será armazenado com identificador único (não será sobrescrito).
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-5 pr-2">
              {/* File Input */}
              <div className="space-y-2">
                <Label>Arquivo *</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.file ? (
                    <div className="space-y-2">
                      <File className="h-8 w-8 mx-auto text-primary" />
                      <p className="text-sm font-medium">{formData.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(formData.file.size)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Clique para selecionar ou arraste o arquivo
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <Label>Tipo de Documento *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, tipo: v as TipoDocumentoOdonto }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_DOCUMENTO_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Título */}
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  placeholder="Título do documento..."
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                />
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label>Data do Documento</Label>
                <Input
                  type="date"
                  value={formData.data_documento}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_documento: e.target.value }))}
                />
              </div>

              {/* Dente */}
              <div className="space-y-2">
                <Label>Dente Relacionado (opcional)</Label>
                <Input
                  placeholder="Ex: 16, 26..."
                  value={formData.dente}
                  onChange={(e) => setFormData(prev => ({ ...prev, dente: e.target.value }))}
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  placeholder="Observações sobre o documento..."
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancel} disabled={uploading}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={uploading || !formData.file || !formData.titulo.trim()}
            >
              <Save className="h-4 w-4 mr-1" />
              {uploading ? 'Enviando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-[800px] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{previewDoc?.titulo}</DialogTitle>
            {previewDoc?.descricao && (
              <DialogDescription>{previewDoc.descricao}</DialogDescription>
            )}
          </DialogHeader>
          {previewDoc && isImageFile(previewDoc.file_type) && (
            <div className="p-4">
              <img 
                src={previewDoc.file_url} 
                alt={previewDoc.titulo}
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
