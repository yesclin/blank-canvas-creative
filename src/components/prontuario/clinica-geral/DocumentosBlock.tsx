import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus,
  Clock,
  User,
  Save,
  X,
  ChevronRight,
  FileText,
  Upload,
  File,
  Image,
  Microscope,
  ClipboardCheck,
  FileSpreadsheet,
  Trash2,
  Download,
  Eye,
  Calendar
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Categorias de documentos
 */
export type CategoriaDocumento = 'exame' | 'laudo' | 'relatorio' | 'documento';

export const categoriaLabels: Record<CategoriaDocumento, string> = {
  exame: 'Exame Laboratorial',
  laudo: 'Laudo',
  relatorio: 'Relatório',
  documento: 'Documento',
};

export const categoriaIcons: Record<CategoriaDocumento, React.ReactNode> = {
  exame: <Microscope className="h-4 w-4" />,
  laudo: <ClipboardCheck className="h-4 w-4" />,
  relatorio: <FileSpreadsheet className="h-4 w-4" />,
  documento: <FileText className="h-4 w-4" />,
};

/**
 * Estrutura de um Documento
 */
export interface Documento {
  id: string;
  patient_id: string;
  clinic_id: string;
  profissional_id: string;
  profissional_nome: string;
  titulo: string;
  categoria: CategoriaDocumento;
  descricao?: string;
  data_documento?: string;
  observacoes?: string;
  file_path: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  file_url?: string;
  created_at: string;
}

interface DocumentosBlockProps {
  documentos: Documento[];
  loading?: boolean;
  uploading?: boolean;
  canEdit?: boolean;
  currentProfessionalId?: string;
  currentProfessionalName?: string;
  onUpload: (data: {
    file: File;
    titulo: string;
    categoria: CategoriaDocumento;
    descricao?: string;
    data_documento?: string;
    observacoes?: string;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDownload: (documento: Documento) => Promise<void>;
}

/**
 * EXAMES / DOCUMENTOS - Bloco exclusivo para Clínica Geral
 * 
 * Permite:
 * - Upload de exames laboratoriais
 * - Upload de laudos
 * - Upload de relatórios e documentos
 * - Observações do profissional
 * - Vinculação a datas
 * 
 * Arquivos não são sobrescritos.
 */
export function DocumentosBlock({
  documentos,
  loading = false,
  uploading = false,
  canEdit = false,
  currentProfessionalId,
  currentProfessionalName,
  onUpload,
  onDelete,
  onDownload,
}: DocumentosBlockProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDocumento, setSelectedDocumento] = useState<Documento | null>(null);
  const [deleteDocumento, setDeleteDocumento] = useState<Documento | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    categoria: 'exame' as CategoriaDocumento,
    descricao: '',
    data_documento: '',
    observacoes: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Sort by date descending
  const sortedDocumentos = [...documentos].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Group by category
  const groupedDocumentos = sortedDocumentos.reduce((acc, doc) => {
    if (!acc[doc.categoria]) {
      acc[doc.categoria] = [];
    }
    acc[doc.categoria].push(doc);
    return acc;
  }, {} as Record<CategoriaDocumento, Documento[]>);

  const handleOpenForm = () => {
    setFormData({
      titulo: '',
      categoria: 'exame',
      descricao: '',
      data_documento: '',
      observacoes: '',
    });
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title with filename if empty
      if (!formData.titulo) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setFormData(prev => ({ ...prev, titulo: nameWithoutExt }));
      }
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    
    await onUpload({
      file: selectedFile,
      titulo: formData.titulo,
      categoria: formData.categoria,
      descricao: formData.descricao || undefined,
      data_documento: formData.data_documento || undefined,
      observacoes: formData.observacoes || undefined,
    });
    handleCloseForm();
  };

  const handleViewDocumento = (documento: Documento) => {
    setSelectedDocumento(documento);
  };

  const handleConfirmDelete = async () => {
    if (deleteDocumento) {
      await onDelete(deleteDocumento.id);
      setDeleteDocumento(null);
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file icon based on type
  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="h-5 w-5" />;
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Exames / Documentos</h2>
          <Badge variant="secondary">{documentos.length}</Badge>
        </div>
        {canEdit && (
          <Button onClick={handleOpenForm}>
            <Upload className="h-4 w-4 mr-2" />
            Novo Upload
          </Button>
        )}
      </div>

      {/* Documents List */}
      {sortedDocumentos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum documento anexado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Anexe exames laboratoriais, laudos e documentos.
            </p>
            {canEdit && (
              <Button onClick={handleOpenForm}>
                <Upload className="h-4 w-4 mr-2" />
                Novo Upload
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {(['exame', 'laudo', 'relatorio', 'documento'] as CategoriaDocumento[]).map((categoria) => {
            const docs = groupedDocumentos[categoria];
            if (!docs || docs.length === 0) return null;
            
            return (
              <div key={categoria}>
                <div className="flex items-center gap-2 mb-3">
                  {categoriaIcons[categoria]}
                  <h3 className="font-medium">{categoriaLabels[categoria]}s</h3>
                  <Badge variant="outline">{docs.length}</Badge>
                </div>
                
                <div className="grid gap-2">
                  {docs.map((documento) => (
                    <Card 
                      key={documento.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewDocumento(documento)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 p-2 bg-muted rounded-lg">
                            {getFileIcon(documento.file_type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{documento.titulo}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {documento.data_documento && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(parseISO(documento.data_documento), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              )}
                              <span>{formatFileSize(documento.file_size)}</span>
                            </div>
                          </div>
                          
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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

      {/* Upload Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Novo Upload
            </DialogTitle>
            <DialogDescription>
              Anexe exames, laudos ou documentos ao prontuário.
            </DialogDescription>
          </DialogHeader>

          {/* Current professional info */}
          {currentProfessionalName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <User className="h-4 w-4" />
              <span>Profissional: <strong>{currentProfessionalName}</strong></span>
            </div>
          )}

          <div className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Arquivo *</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={handleFileSelect}
              />
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                  {getFileIcon(selectedFile.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full h-24 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Clique para selecionar um arquivo
                    </span>
                  </div>
                </Button>
              )}
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Hemograma Completo"
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              />
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select 
                value={formData.categoria} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, categoria: v as CategoriaDocumento }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exame">
                    <div className="flex items-center gap-2">
                      <Microscope className="h-4 w-4" />
                      Exame Laboratorial
                    </div>
                  </SelectItem>
                  <SelectItem value="laudo">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4" />
                      Laudo
                    </div>
                  </SelectItem>
                  <SelectItem value="relatorio">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Relatório
                    </div>
                  </SelectItem>
                  <SelectItem value="documento">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documento
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data do Documento */}
            <div className="space-y-2">
              <Label>Data do Documento</Label>
              <Input
                type="date"
                value={formData.data_documento}
                onChange={(e) => setFormData(prev => ({ ...prev, data_documento: e.target.value }))}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                placeholder="Breve descrição do documento..."
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label>Observações do Profissional</Label>
              <Textarea
                placeholder="Observações clínicas sobre o documento..."
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <Separator />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseForm} disabled={uploading}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={uploading || !selectedFile || !formData.titulo}
            >
              <Save className="h-4 w-4 mr-1" />
              {uploading ? 'Enviando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={!!selectedDocumento} onOpenChange={() => setSelectedDocumento(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes do Documento
            </DialogTitle>
          </DialogHeader>

          {selectedDocumento && (
            <div className="space-y-4">
              {/* File info card */}
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                <div className="p-3 bg-background rounded-lg">
                  {getFileIcon(selectedDocumento.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{selectedDocumento.titulo}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {selectedDocumento.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedDocumento.file_size)}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Categoria</p>
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    {categoriaIcons[selectedDocumento.categoria]}
                    {categoriaLabels[selectedDocumento.categoria]}
                  </Badge>
                </div>
                {selectedDocumento.data_documento && (
                  <div>
                    <p className="text-muted-foreground mb-1">Data do Documento</p>
                    <p className="font-medium">
                      {format(parseISO(selectedDocumento.data_documento), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground mb-1">Adicionado por</p>
                  <p className="font-medium">{selectedDocumento.profissional_nome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Data de Upload</p>
                  <p className="font-medium">
                    {format(parseISO(selectedDocumento.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedDocumento.descricao && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">Descrição</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">
                    {selectedDocumento.descricao}
                  </p>
                </div>
              )}

              {/* Observações */}
              {selectedDocumento.observacoes && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">Observações do Profissional</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedDocumento.observacoes}
                  </p>
                </div>
              )}
            </div>
          )}

          <Separator />

          <DialogFooter className="gap-2">
            {canEdit && selectedDocumento && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  setDeleteDocumento(selectedDocumento);
                  setSelectedDocumento(null);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            )}
            {selectedDocumento && (
              <Button onClick={() => onDownload(selectedDocumento)}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedDocumento(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDocumento} onOpenChange={() => setDeleteDocumento(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento "{deleteDocumento?.titulo}" 
              será removido permanentemente do prontuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
