/**
 * FISIOTERAPIA - Bloco de Exames / Documentos
 * 
 * Permite upload e visualização de exames de imagem,
 * laudos e documentos complementares.
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Plus, 
  User,
  Calendar,
  Upload,
  Download,
  Trash2,
  Eye,
  FileImage,
  File,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useExamesDocumentosData,
  CATEGORIA_DOCUMENTO_OPTIONS,
  type DocumentoFisioterapia,
  type UploadDocumentoData
} from '@/hooks/prontuario/fisioterapia/useExamesDocumentosData';

interface ExamesDocumentosBlockProps {
  patientId: string | null;
  clinicId: string | null;
  canEdit?: boolean;
}

/**
 * Retorna ícone baseado no tipo do arquivo
 */
function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) {
    return <FileImage className="h-5 w-5" />;
  }
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
    return <FileSpreadsheet className="h-5 w-5" />;
  }
  if (fileType.includes('pdf')) {
    return <FileText className="h-5 w-5" />;
  }
  return <File className="h-5 w-5" />;
}

/**
 * Formata tamanho do arquivo
 */
function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Retorna configuração da categoria
 */
function getCategoriaConfig(categoria: string) {
  const option = CATEGORIA_DOCUMENTO_OPTIONS.find(o => o.value === categoria);
  return {
    label: option?.label || categoria,
    variant: categoria === 'laudo' ? 'default' as const : 
             categoria === 'exame_imagem' ? 'secondary' as const : 
             'outline' as const,
  };
}

/**
 * Formulário de Upload
 */
function UploadForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (data: UploadDocumentoData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categoria, setCategoria] = useState('exame_imagem');
  const [descricao, setDescricao] = useState('');
  const [dataDocumento, setDataDocumento] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limite de 20MB
      if (file.size > 20 * 1024 * 1024) {
        alert('Arquivo muito grande. Limite: 20MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    onSubmit({
      file: selectedFile,
      categoria,
      descricao,
      data_documento: dataDocumento,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Seleção de arquivo */}
      <div className="space-y-2">
        <Label>Arquivo *</Label>
        <div 
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
          />
          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              {getFileIcon(selectedFile.type)}
              <div className="text-left">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Clique para selecionar ou arraste o arquivo
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, imagens, Word, Excel (máx. 20MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Categoria */}
      <div className="space-y-2">
        <Label htmlFor="categoria">Categoria *</Label>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIA_DOCUMENTO_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data do documento */}
      <div className="space-y-2">
        <Label htmlFor="data_documento">Data do Documento</Label>
        <Input
          id="data_documento"
          type="date"
          value={dataDocumento}
          onChange={(e) => setDataDocumento(e.target.value)}
        />
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          placeholder="Descrição ou observações sobre o documento..."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={2}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !selectedFile}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Enviar
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Card de documento
 */
function DocumentoCard({
  documento,
  onView,
  onDelete,
  canDelete,
}: {
  documento: DocumentoFisioterapia;
  onView: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const categoriaConfig = getCategoriaConfig(documento.categoria);

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-muted rounded-lg">
            {getFileIcon(documento.file_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">{documento.file_name}</h4>
              <Badge variant={categoriaConfig.variant} className="text-xs shrink-0">
                {categoriaConfig.label}
              </Badge>
            </div>
            {documento.descricao && (
              <p className="text-sm text-muted-foreground mb-1 line-clamp-1">
                {documento.descricao}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {documento.data_documento && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(documento.data_documento), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
              {documento.uploader_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {documento.uploader_name}
                </span>
              )}
              {documento.file_size && (
                <span>{formatFileSize(documento.file_size)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onView} title="Visualizar">
              <Eye className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete} title="Excluir">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExamesDocumentosBlock({
  patientId,
  clinicId,
  canEdit = false,
}: ExamesDocumentosBlockProps) {
  const {
    documentos,
    totalDocumentos,
    loading,
    isUploadOpen,
    setIsUploadOpen,
    uploadDocumento,
    isUploading,
    deleteDocumento,
    isDeleting,
    getSignedUrl,
  } = useExamesDocumentosData({ patientId, clinicId });

  const [deleteTarget, setDeleteTarget] = useState<DocumentoFisioterapia | null>(null);
  const [isViewing, setIsViewing] = useState(false);

  const handleView = async (documento: DocumentoFisioterapia) => {
    setIsViewing(true);
    try {
      const url = await getSignedUrl(documento.file_path);
      if (url) {
        window.open(url, '_blank');
      } else {
        alert('Erro ao gerar link de visualização');
      }
    } finally {
      setIsViewing(false);
    }
  };

  const handleDelete = (documento: DocumentoFisioterapia) => {
    setDeleteTarget(documento);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteDocumento(deleteTarget);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um paciente para visualizar os documentos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Exames / Documentos</h2>
            <p className="text-sm text-muted-foreground">
              {totalDocumentos > 0 
                ? `${totalDocumentos} documento(s) anexado(s)` 
                : 'Nenhum documento anexado'}
            </p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => setIsUploadOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Anexar
          </Button>
        )}
      </div>

      {/* Lista de documentos */}
      {documentos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum documento anexado.</p>
            {canEdit && (
              <Button onClick={() => setIsUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Anexar Documento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-2">
            {documentos.map((documento) => (
              <DocumentoCard
                key={documento.id}
                documento={documento}
                onView={() => handleView(documento)}
                onDelete={() => handleDelete(documento)}
                canDelete={canEdit}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Dialog de Upload */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Anexar Documento</DialogTitle>
            <DialogDescription>
              Envie exames de imagem, laudos ou documentos complementares.
            </DialogDescription>
          </DialogHeader>
          <UploadForm
            onSubmit={uploadDocumento}
            onCancel={() => setIsUploadOpen(false)}
            isSubmitting={isUploading}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.file_name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
