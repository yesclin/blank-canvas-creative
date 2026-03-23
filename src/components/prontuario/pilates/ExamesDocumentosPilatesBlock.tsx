/**
 * PILATES - Bloco de Exames e Documentos
 * 
 * Upload e visualização de laudos médicos, exames de imagem
 * e documentos complementares.
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Plus, 
  User,
  Calendar,
  Upload,
  Download,
  Trash2,
  Image,
  File,
  FileCheck,
  Forward,
  FlaskConical,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useExamesDocumentosPilatesData, 
  getEmptyUploadForm,
  formatFileSize,
  CATEGORIA_DOCUMENTO_OPTIONS,
  type UploadDocumentoFormData,
  type DocumentoPilates,
} from '@/hooks/prontuario/pilates/useExamesDocumentosPilatesData';

interface ExamesDocumentosPilatesBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  laudo_medico: <FileText className="h-4 w-4" />,
  exame_imagem: <Image className="h-4 w-4" />,
  exame_laboratorio: <FlaskConical className="h-4 w-4" />,
  atestado: <FileCheck className="h-4 w-4" />,
  encaminhamento: <Forward className="h-4 w-4" />,
  outros: <File className="h-4 w-4" />,
};

/**
 * Formulário de Upload
 */
function UploadForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (data: UploadDocumentoFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<UploadDocumentoFormData>(getEmptyUploadForm());
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof UploadDocumentoFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file: File | null) => {
    if (file) {
      handleChange('file', file);
      if (!formData.titulo) {
        handleChange('titulo', file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Área de Drop */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        />
        
        {formData.file ? (
          <div className="space-y-2">
            <File className="h-12 w-12 text-primary mx-auto" />
            <p className="font-medium">{formData.file.name}</p>
            <p className="text-sm text-muted-foreground">{formatFileSize(formData.file.size)}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleChange('file', null)}
            >
              Remover
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              Arraste um arquivo aqui ou{' '}
              <button
                type="button"
                className="text-primary underline"
                onClick={() => fileInputRef.current?.click()}
              >
                clique para selecionar
              </button>
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, JPG, PNG, WEBP, DOC ou DOCX (máx. 50MB)
            </p>
          </div>
        )}
      </div>

      {/* Categoria */}
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select
          value={formData.categoria}
          onValueChange={(value) => handleChange('categoria', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIA_DOCUMENTO_OPTIONS.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                <span className="flex items-center gap-2">
                  {categoryIcons[cat.value]}
                  {cat.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="titulo">Título</Label>
        <Input
          id="titulo"
          value={formData.titulo}
          onChange={(e) => handleChange('titulo', e.target.value)}
          placeholder="Nome do documento..."
        />
      </div>

      {/* Data do Documento */}
      <div className="space-y-2">
        <Label htmlFor="data_documento">Data do Documento</Label>
        <Input
          id="data_documento"
          type="date"
          value={formData.data_documento}
          onChange={(e) => handleChange('data_documento', e.target.value)}
        />
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => handleChange('descricao', e.target.value)}
          placeholder="Observações sobre o documento..."
          rows={2}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.file}>
          {isSubmitting ? 'Enviando...' : 'Enviar Documento'}
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
  onDownload,
  onDelete,
  canEdit,
}: {
  documento: DocumentoPilates;
  onDownload: () => void;
  onDelete: () => void;
  canEdit: boolean;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const getCategoriaLabel = (value: string) => {
    return CATEGORIA_DOCUMENTO_OPTIONS.find(c => c.value === value)?.label || value;
  };

  const isImage = documento.file_type.startsWith('image/');

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Ícone */}
            <div className="p-3 bg-muted rounded-lg">
              {isImage ? (
                <Image className="h-6 w-6 text-muted-foreground" />
              ) : (
                categoryIcons[documento.categoria] || <File className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium truncate">{documento.titulo}</h4>
                <Badge variant="secondary" className="text-xs">
                  {getCategoriaLabel(documento.categoria)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                {documento.data_documento && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(documento.data_documento), 'dd/MM/yyyy')}
                  </span>
                )}
                <span>{formatFileSize(documento.file_size)}</span>
                {documento.professional_name && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {documento.professional_name}
                  </span>
                )}
              </div>

              {documento.descricao && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {documento.descricao}
                </p>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={onDownload} title="Baixar">
                <Download className="h-4 w-4" />
              </Button>
              {canEdit && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento "{documento.titulo}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ExamesDocumentosPilatesBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
}: ExamesDocumentosPilatesBlockProps) {
  const {
    documentos,
    loading,
    isUploadOpen,
    setIsUploadOpen,
    uploadDocumento,
    isUploading,
    deleteDocumento,
    downloadDocument,
  } = useExamesDocumentosPilatesData({ patientId, clinicId, professionalId });

  const [filterCategoria, setFilterCategoria] = useState<string>('all');

  const filteredDocumentos = filterCategoria === 'all'
    ? documentos
    : documentos.filter(d => d.categoria === filterCategoria);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um aluno para visualizar os documentos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Exames e Documentos</h2>
            <p className="text-sm text-muted-foreground">
              {documentos.length > 0 
                ? `${documentos.length} documento(s)` 
                : 'Nenhum documento'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {documentos.length > 0 && (
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {CATEGORIA_DOCUMENTO_OPTIONS.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {canEdit && (
            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Documento
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      {documentos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum documento anexado.</p>
            {canEdit && (
              <Button onClick={() => setIsUploadOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Enviar Documento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : filteredDocumentos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Nenhum documento nesta categoria.</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-3">
            {filteredDocumentos.map((doc) => (
              <DocumentoCard
                key={doc.id}
                documento={doc}
                onDownload={() => downloadDocument(doc)}
                onDelete={() => deleteDocumento(doc)}
                canEdit={canEdit}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Dialog de Upload */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar Documento</DialogTitle>
            <DialogDescription>
              Anexe laudos médicos, exames ou documentos complementares.
            </DialogDescription>
          </DialogHeader>
          <UploadForm
            onSubmit={uploadDocumento}
            onCancel={() => setIsUploadOpen(false)}
            isSubmitting={isUploading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
