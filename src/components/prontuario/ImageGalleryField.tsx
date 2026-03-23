import { useState, useEffect, useRef } from 'react';
import {
  ImagePlus, Trash2, Pencil, X, Camera, Tag,
  ChevronLeft, ChevronRight, ZoomIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppointmentImages, type ImageClassification, type AppointmentImage } from '@/hooks/prontuario/useAppointmentImages';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CLASSIFICATION_CONFIG: { value: ImageClassification; label: string; color: string }[] = [
  { value: 'antes', label: 'Antes', color: 'bg-blue-500/10 text-blue-700 border-blue-200' },
  { value: 'depois', label: 'Depois', color: 'bg-green-500/10 text-green-700 border-green-200' },
  { value: 'evolucao', label: 'Evolução', color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
];

interface ImageGalleryFieldProps {
  appointmentId: string | null;
  patientId: string | null;
  fieldId?: string;
  readOnly?: boolean;
  templateId?: string;
  templateVersionId?: string;
}

export function ImageGalleryField({ appointmentId, patientId, fieldId, readOnly, templateId, templateVersionId }: ImageGalleryFieldProps) {
  const {
    images, loading, uploading, fetchImages, uploadImages, updateImage, deleteImage,
  } = useAppointmentImages(appointmentId, patientId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadClassification, setUploadClassification] = useState<ImageClassification>('evolucao');
  const [editDialog, setEditDialog] = useState<AppointmentImage | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editClassification, setEditClassification] = useState<ImageClassification>('evolucao');
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<AppointmentImage | null>(null);

  useEffect(() => {
    if (appointmentId) {
      fetchImages(fieldId);
    }
  }, [appointmentId, fieldId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!appointmentId) {
      return; // Guard enforced by UI
    }

    await uploadImages(files, {
      fieldId,
      classification: uploadClassification,
      templateId,
      templateVersionId,
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openEdit = (img: AppointmentImage) => {
    setEditDialog(img);
    setEditCaption(img.caption || '');
    setEditClassification(img.classification);
  };

  const handleSaveEdit = async () => {
    if (!editDialog) return;
    await updateImage(editDialog.id, {
      caption: editCaption.trim() || undefined,
      classification: editClassification,
    });
    setEditDialog(null);
    await fetchImages(fieldId);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    await deleteImage(deleteDialog);
    setDeleteDialog(null);
  };

  if (!appointmentId) {
    return (
      <div className="p-6 border rounded-lg border-dashed text-center">
        <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-sm text-muted-foreground font-medium">Upload de imagens indisponível</p>
        <p className="text-xs text-muted-foreground mt-1">
          Imagens só podem ser adicionadas dentro de um atendimento ativo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Upload area */}
      {!readOnly && (
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 p-4 border rounded-lg bg-muted/30">
          <div className="flex-1 space-y-1.5">
            <Label className="text-sm">Classificação</Label>
            <Select value={uploadClassification} onValueChange={v => setUploadClassification(v as ImageClassification)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLASSIFICATION_CONFIG.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              {uploading ? 'Enviando...' : 'Adicionar Imagens'}
            </Button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square rounded-lg" />)}
        </div>
      )}

      {/* Gallery */}
      {!loading && images.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Camera className="h-6 w-6 mx-auto mb-1 opacity-50" />
          <p className="text-sm">Nenhuma imagem adicionada neste atendimento.</p>
        </div>
      )}

      {!loading && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map(img => {
            const classConfig = CLASSIFICATION_CONFIG.find(c => c.value === img.classification);
            return (
              <div
                key={img.id}
                className="group relative aspect-square rounded-lg overflow-hidden border bg-muted/20"
              >
                <img
                  src={img.file_url}
                  alt={img.caption || img.file_name}
                  className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                  onClick={() => setPreviewImage(img)}
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                
                {/* Classification badge */}
                <Badge
                  className={`absolute top-2 left-2 text-xs border ${classConfig?.color || ''}`}
                >
                  {classConfig?.label}
                </Badge>

                {/* Actions */}
                {!readOnly && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary" size="icon"
                      className="h-7 w-7 bg-background/80 backdrop-blur-sm"
                      onClick={(e) => { e.stopPropagation(); openEdit(img); }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="secondary" size="icon"
                      className="h-7 w-7 bg-background/80 backdrop-blur-sm text-destructive"
                      onClick={(e) => { e.stopPropagation(); setDeleteDialog(img.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.caption && (
                    <p className="text-xs text-white truncate">{img.caption}</p>
                  )}
                  <p className="text-xs text-white/70">
                    {format(new Date(img.taken_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {previewImage && (
            <>
              <div className="relative bg-black flex items-center justify-center min-h-[400px]">
                <img
                  src={previewImage.file_url}
                  alt={previewImage.caption || previewImage.file_name}
                  className="max-w-full max-h-[70vh] object-contain"
                />
                <Button
                  variant="ghost" size="icon"
                  className="absolute top-2 right-2 text-white hover:bg-white/20"
                  onClick={() => setPreviewImage(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs border ${CLASSIFICATION_CONFIG.find(c => c.value === previewImage.classification)?.color || ''}`}>
                    {CLASSIFICATION_CONFIG.find(c => c.value === previewImage.classification)?.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(previewImage.taken_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {previewImage.caption && (
                  <p className="text-sm">{previewImage.caption}</p>
                )}
                <p className="text-xs text-muted-foreground">{previewImage.file_name}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Legenda</Label>
              <Input
                value={editCaption}
                onChange={e => setEditCaption(e.target.value)}
                placeholder="Descreva a imagem..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Classificação</Label>
              <Select value={editClassification} onValueChange={v => setEditClassification(v as ImageClassification)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASSIFICATION_CONFIG.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover imagem?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. A imagem será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
