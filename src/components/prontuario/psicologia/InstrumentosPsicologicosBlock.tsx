import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  FileText,
  Calendar,
  User,
  Save,
  X,
  ClipboardList,
  Target,
  MessageSquare,
  Upload,
  File,
  Trash2,
  ExternalLink,
  FlaskConical
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { 
  InstrumentoPsicologico, 
  InstrumentoFormData 
} from "@/hooks/prontuario/psicologia/useInstrumentosPsicologicosData";

interface InstrumentosPsicologicosBlockProps {
  instrumentos: InstrumentoPsicologico[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  currentProfessionalName?: string;
  onSave: (data: InstrumentoFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const EMPTY_FORM: InstrumentoFormData = {
  nome_instrumento: '',
  data_aplicacao: new Date().toISOString().split('T')[0],
  finalidade: '',
  observacoes: '',
  documento: null,
};

/**
 * INSTRUMENTOS / TESTES PSICOLÓGICOS - Bloco exclusivo para Psicologia
 * 
 * Permite:
 * - Registro de aplicação de testes psicológicos
 * - Data da aplicação
 * - Finalidade do instrumento
 * - Observações do profissional
 * - Upload de documentos relacionados
 * 
 * Não realiza correção automática de testes.
 */
export function InstrumentosPsicologicosBlock({
  instrumentos,
  loading = false,
  saving = false,
  canEdit = false,
  currentProfessionalName,
  onSave,
  onDelete,
}: InstrumentosPsicologicosBlockProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInstrumento, setSelectedInstrumento] = useState<InstrumentoPsicologico | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<InstrumentoFormData>(EMPTY_FORM);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenForm = () => {
    setFormData({
      ...EMPTY_FORM,
      data_aplicacao: new Date().toISOString().split('T')[0],
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!formData.nome_instrumento.trim()) {
      return;
    }
    await onSave(formData);
    handleCloseForm();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, documento: file }));
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, documento: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (deleteId && onDelete) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Instrumentos / Testes</h2>
          <Badge variant="secondary">{instrumentos.length}</Badge>
        </div>
        {canEdit && (
          <Button onClick={handleOpenForm}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Registro
          </Button>
        )}
      </div>

      {/* Info banner */}
      <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground flex items-start gap-2">
        <FlaskConical className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>
          Registre a aplicação de testes e instrumentos psicológicos. 
          A correção e interpretação devem ser realizadas manualmente pelo profissional.
        </span>
      </div>

      {/* Instrumentos List */}
      {instrumentos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum instrumento registrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Registre a aplicação de testes psicológicos para este paciente.
            </p>
            {canEdit && (
              <Button onClick={handleOpenForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Registro
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {instrumentos.map((instrumento) => (
            <Card 
              key={instrumento.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedInstrumento(instrumento)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{instrumento.nome_instrumento}</h4>
                      {instrumento.documento_url && (
                        <Badge variant="outline" className="text-xs">
                          <File className="h-3 w-3 mr-1" />
                          Documento
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(parseISO(instrumento.data_aplicacao), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{instrumento.profissional_nome}</span>
                      </div>
                    </div>
                    
                    {instrumento.finalidade && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        <span className="font-medium">Finalidade:</span> {instrumento.finalidade}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Instrumento Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Registrar Instrumento / Teste
            </DialogTitle>
            <DialogDescription>
              Registre a aplicação de um teste ou instrumento psicológico.
            </DialogDescription>
          </DialogHeader>

          {currentProfessionalName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <User className="h-4 w-4" />
              <span>Profissional: <strong>{currentProfessionalName}</strong></span>
            </div>
          )}

          <div className="space-y-4">
            {/* Nome do Instrumento */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Nome do Instrumento / Teste <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Ex: WISC-IV, BDI-II, HTP, Palográfico..."
                value={formData.nome_instrumento}
                onChange={(e) => setFormData(prev => ({ ...prev, nome_instrumento: e.target.value }))}
              />
            </div>

            {/* Data da Aplicação */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Data da Aplicação
              </Label>
              <Input
                type="date"
                value={formData.data_aplicacao}
                onChange={(e) => setFormData(prev => ({ ...prev, data_aplicacao: e.target.value }))}
              />
            </div>

            <Separator />

            {/* Finalidade */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                Finalidade
              </Label>
              <Textarea
                placeholder="Objetivo da aplicação do instrumento..."
                value={formData.finalidade}
                onChange={(e) => setFormData(prev => ({ ...prev, finalidade: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-500" />
                Observações do Profissional
              </Label>
              <Textarea
                placeholder="Observações sobre a aplicação, comportamento do paciente, condições da avaliação..."
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={3}
              />
            </div>

            <Separator />

            {/* Upload de Documento */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-orange-500" />
                Documento Relacionado
              </Label>
              <p className="text-xs text-muted-foreground">
                Protocolo de aplicação, folha de respostas ou laudo (PDF, imagem)
              </p>
              
              {formData.documento ? (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <File className="h-4 w-4 text-primary" />
                  <span className="text-sm flex-1 truncate">{formData.documento.name}</span>
                  <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Arquivo
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseForm} disabled={saving}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !formData.nome_instrumento.trim()}
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Instrumento Dialog */}
      <Dialog open={!!selectedInstrumento} onOpenChange={() => setSelectedInstrumento(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {selectedInstrumento?.nome_instrumento}
            </DialogTitle>
          </DialogHeader>

          {selectedInstrumento && (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(parseISO(selectedInstrumento.data_aplicacao), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{selectedInstrumento.profissional_nome}</span>
                </div>
              </div>

              {/* Finalidade */}
              {selectedInstrumento.finalidade && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Finalidade</Label>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                    {selectedInstrumento.finalidade}
                  </p>
                </div>
              )}

              {/* Observações */}
              {selectedInstrumento.observacoes && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Observações</Label>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                    {selectedInstrumento.observacoes}
                  </p>
                </div>
              )}

              {/* Documento */}
              {selectedInstrumento.documento_url && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Documento Anexo</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <File className="h-4 w-4 text-primary" />
                    <span className="text-sm flex-1">{selectedInstrumento.documento_nome || 'Documento'}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                    >
                      <a 
                        href={selectedInstrumento.documento_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Abrir
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2">
                {canEdit && onDelete && (
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      setDeleteId(selectedInstrumento.id);
                      setSelectedInstrumento(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedInstrumento(null)}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Instrumento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro do instrumento e o documento anexo serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
