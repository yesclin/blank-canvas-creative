import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ImageIcon, 
  Plus, 
  Upload,
  Download,
  Camera,
  ArrowRight,
  Calendar,
  Trash2,
  SlidersHorizontal,
  Grid,
  Lock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBeforeAfter } from "@/hooks/aesthetics";
import type { AestheticBeforeAfter, ViewAngle } from "./types";
import { VIEW_ANGLE_LABELS, PROCEDURE_TYPE_LABELS } from "./types";
import { BeforeAfterCompare } from "./BeforeAfterCompare";

interface BeforeAfterModuleProps {
  patientId: string;
  appointmentId?: string | null;
  canEdit?: boolean;
}

export function BeforeAfterModule({
  patientId,
  appointmentId,
  canEdit = false,
}: BeforeAfterModuleProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AestheticBeforeAfter | null>(null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'slider'>('side-by-side');
  const [viewFilter, setViewFilter] = useState<'all' | 'session'>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    procedure_type: 'toxin',
    view_angle: 'frontal' as ViewAngle,
    consent_for_marketing: false,
  });
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);

  // Signed URLs para imagens (bucket privado)
  const [signedUrls, setSignedUrls] = useState<Record<string, { before?: string; after?: string }>>({});

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const { 
    records, 
    isLoading, 
    createRecord, 
    updateRecord,
    deleteRecord,
    getSignedUrl,
    isCreating,
    isUpdating,
  } = useBeforeAfter(patientId);

  // Filtrar registros por sessão atual ou todos
  const filteredRecords = viewFilter === 'session' && appointmentId
    ? records.filter(r => r.appointment_id === appointmentId)
    : records;

  // Carregar URLs assinadas para os registros
  useEffect(() => {
    const loadSignedUrls = async () => {
      const urls: Record<string, { before?: string; after?: string }> = {};
      
      for (const record of records) {
        const beforeUrl = record.before_image_url ? await getSignedUrl(record.before_image_url) : undefined;
        const afterUrl = record.after_image_url ? await getSignedUrl(record.after_image_url) : undefined;
        urls[record.id] = { before: beforeUrl || undefined, after: afterUrl || undefined };
      }
      
      setSignedUrls(urls);
    };

    if (records.length > 0) {
      loadSignedUrls();
    }
  }, [records, getSignedUrl]);
 
   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     if (type === 'before') {
       setBeforeFile(file);
       setBeforePreview(URL.createObjectURL(file));
     } else {
       setAfterFile(file);
       setAfterPreview(URL.createObjectURL(file));
     }
   };
 
   const handleCreate = async () => {
     if (!formData.title || !beforeFile) return;
 
     await createRecord({
       ...formData,
       appointment_id: appointmentId,
       beforeFile,
       afterFile: afterFile || undefined,
     });
 
     setCreateDialogOpen(false);
     resetForm();
   };
 
   const handleAddAfter = async () => {
     if (!selectedRecord || !afterFile) return;
 
     await updateRecord({
       id: selectedRecord.id,
       data: {},
       afterFile,
     });
 
     setViewDialogOpen(false);
     setSelectedRecord(null);
     setAfterFile(null);
     setAfterPreview(null);
   };
 
   const handleDelete = async (id: string) => {
     await deleteRecord(id);
     setViewDialogOpen(false);
     setSelectedRecord(null);
   };
 
   const resetForm = () => {
     setFormData({
       title: '',
       description: '',
       procedure_type: 'toxin',
       view_angle: 'frontal',
       consent_for_marketing: false,
     });
     setBeforeFile(null);
     setAfterFile(null);
     setBeforePreview(null);
     setAfterPreview(null);
   };
 
   const openViewDialog = (record: AestheticBeforeAfter) => {
     setSelectedRecord(record);
     setViewDialogOpen(true);
   };
 
   if (isLoading) {
     return (
       <Card>
         <CardHeader>
           <Skeleton className="h-6 w-48" />
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-2 gap-4">
             <Skeleton className="h-48" />
             <Skeleton className="h-48" />
           </div>
         </CardContent>
       </Card>
     );
   }
 
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Fotos Antes e Depois
                <Badge variant="outline" className="ml-2 text-xs gap-1">
                  <Lock className="h-3 w-3" />
                  Privado
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                {appointmentId && (
                  <Select value={viewFilter} onValueChange={(v: 'all' | 'session') => setViewFilter(v)}>
                    <SelectTrigger className="w-36 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="session">Sessão Atual</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {canEdit && (
                  <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Novo Registro
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Camera className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Nenhum registro de antes/depois</p>
                {canEdit && (
                  <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Criar Primeiro Registro
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRecords.map((record) => {
                    const urls = signedUrls[record.id];
                    return (
                      <Card 
                        key={record.id} 
                        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => openViewDialog(record)}
                      >
                        <div className="p-3 border-b">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{record.title}</h4>
                            {record.procedure_type && (
                              <Badge variant="secondary" className="text-xs">
                                {PROCEDURE_TYPE_LABELS[record.procedure_type as keyof typeof PROCEDURE_TYPE_LABELS] || record.procedure_type}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(record.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            <span className="mx-1">•</span>
                            {VIEW_ANGLE_LABELS[record.view_angle]}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 h-40">
                          <div className="relative bg-muted flex items-center justify-center border-r">
                            {urls?.before ? (
                              <img 
                                src={urls.before} 
                                alt="Antes" 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-muted-foreground text-sm">Antes</span>
                            )}
                            <Badge className="absolute bottom-2 left-2 text-xs">Antes</Badge>
                          </div>
                          <div className="relative bg-muted flex items-center justify-center">
                            {urls?.after ? (
                              <img 
                                src={urls.after} 
                                alt="Depois" 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="text-center text-muted-foreground">
                                <Plus className="h-8 w-8 mx-auto mb-1 opacity-50" />
                                <span className="text-xs">Adicionar depois</span>
                              </div>
                            )}
                            {urls?.after && (
                              <Badge className="absolute bottom-2 right-2 text-xs">Depois</Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
 
       {/* Create Dialog */}
       <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle>Novo Registro Antes/Depois</DialogTitle>
           </DialogHeader>
 
           <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Título *</Label>
                 <Input
                   value={formData.title}
                   onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                   placeholder="Ex: Preenchimento labial"
                 />
               </div>
               <div className="space-y-2">
                 <Label>Tipo de Procedimento</Label>
                 <Select
                   value={formData.procedure_type}
                   onValueChange={(v) => setFormData({ ...formData, procedure_type: v })}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     {Object.entries(PROCEDURE_TYPE_LABELS).map(([key, label]) => (
                       <SelectItem key={key} value={key}>{label}</SelectItem>
                     ))}
                     <SelectItem value="combined">Combinado</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
 
             <div className="space-y-2">
               <Label>Ângulo da Foto</Label>
               <Select
                 value={formData.view_angle}
                 onValueChange={(v) => setFormData({ ...formData, view_angle: v as ViewAngle })}
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {Object.entries(VIEW_ANGLE_LABELS).map(([key, label]) => (
                     <SelectItem key={key} value={key}>{label}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             <div className="grid grid-cols-2 gap-4">
               {/* Before Image */}
               <div className="space-y-2">
                 <Label>Foto Antes *</Label>
                 <input
                   ref={beforeInputRef}
                   type="file"
                   accept="image/*"
                   className="hidden"
                   onChange={(e) => handleFileChange(e, 'before')}
                 />
                 <div 
                   className="border-2 border-dashed rounded-lg h-48 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                   onClick={() => beforeInputRef.current?.click()}
                 >
                   {beforePreview ? (
                     <img src={beforePreview} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                   ) : (
                     <div className="text-center text-muted-foreground">
                       <Upload className="h-8 w-8 mx-auto mb-2" />
                       <p className="text-sm">Clique para upload</p>
                     </div>
                   )}
                 </div>
               </div>
 
               {/* After Image */}
               <div className="space-y-2">
                 <Label>Foto Depois (opcional)</Label>
                 <input
                   ref={afterInputRef}
                   type="file"
                   accept="image/*"
                   className="hidden"
                   onChange={(e) => handleFileChange(e, 'after')}
                 />
                 <div 
                   className="border-2 border-dashed rounded-lg h-48 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                   onClick={() => afterInputRef.current?.click()}
                 >
                   {afterPreview ? (
                     <img src={afterPreview} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                   ) : (
                     <div className="text-center text-muted-foreground">
                       <Upload className="h-8 w-8 mx-auto mb-2" />
                       <p className="text-sm">Adicionar depois</p>
                     </div>
                   )}
                 </div>
               </div>
             </div>
 
             <div className="space-y-2">
               <Label>Descrição</Label>
               <Textarea
                 value={formData.description}
                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                 placeholder="Observações sobre o procedimento..."
                 rows={3}
               />
             </div>
 
             <div className="flex items-center space-x-2">
               <Checkbox
                 id="consent"
                 checked={formData.consent_for_marketing}
                 onCheckedChange={(checked) => 
                   setFormData({ ...formData, consent_for_marketing: !!checked })
                 }
               />
               <Label htmlFor="consent" className="text-sm">
                 Paciente autorizou uso para marketing
               </Label>
             </div>
           </div>
 
           <DialogFooter>
             <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
               Cancelar
             </Button>
             <Button 
               onClick={handleCreate} 
               disabled={!formData.title || !beforeFile || isCreating}
             >
               {isCreating ? 'Salvando...' : 'Salvar'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
        {/* View/Edit Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl">
            {selectedRecord && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle>{selectedRecord.title}</DialogTitle>
                    <div className="flex items-center gap-2">
                      {/* Modo de visualização */}
                      {signedUrls[selectedRecord.id]?.before && signedUrls[selectedRecord.id]?.after && (
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant={viewMode === 'side-by-side' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => setViewMode('side-by-side')}
                          >
                            <Grid className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={viewMode === 'slider' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => setViewMode('slider')}
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <Badge variant="secondary">
                        {VIEW_ANGLE_LABELS[selectedRecord.view_angle]}
                      </Badge>
                      {selectedRecord.procedure_type && (
                        <Badge variant="outline">
                          {PROCEDURE_TYPE_LABELS[selectedRecord.procedure_type as keyof typeof PROCEDURE_TYPE_LABELS] || selectedRecord.procedure_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </DialogHeader>

                {/* Modo Slider (comparação) */}
                {viewMode === 'slider' && signedUrls[selectedRecord.id]?.before && signedUrls[selectedRecord.id]?.after ? (
                  <div className="border rounded-lg overflow-hidden h-80">
                    <BeforeAfterCompare
                      beforeUrl={signedUrls[selectedRecord.id].before!}
                      afterUrl={signedUrls[selectedRecord.id].after!}
                    />
                  </div>
                ) : (
                  /* Modo lado a lado */
                  <div className="grid grid-cols-2 gap-4">
                    {/* Before */}
                    <div className="space-y-2">
                      <Label>Antes</Label>
                      {selectedRecord.before_image_date && (
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(selectedRecord.before_image_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      )}
                      <div className="border rounded-lg overflow-hidden h-64">
                        {signedUrls[selectedRecord.id]?.before ? (
                          <img 
                            src={signedUrls[selectedRecord.id].before} 
                            alt="Antes" 
                            className="h-full w-full object-contain bg-muted"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center bg-muted text-muted-foreground">
                            Carregando...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* After */}
                    <div className="space-y-2">
                      <Label>Depois</Label>
                      {selectedRecord.after_image_date && (
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(selectedRecord.after_image_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      )}
                      <div className="border rounded-lg overflow-hidden h-64">
                        {signedUrls[selectedRecord.id]?.after ? (
                          <img 
                            src={signedUrls[selectedRecord.id].after} 
                            alt="Depois" 
                            className="h-full w-full object-contain bg-muted"
                          />
                        ) : canEdit ? (
                          <>
                            <input
                              ref={afterInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileChange(e, 'after')}
                            />
                            <div 
                              className="h-full flex flex-col items-center justify-center bg-muted cursor-pointer hover:bg-muted/70 transition-colors"
                              onClick={() => afterInputRef.current?.click()}
                            >
                              {afterPreview ? (
                                <img src={afterPreview} alt="Preview" className="h-full w-full object-contain" />
                              ) : (
                                <>
                                  <Upload className="h-10 w-10 mb-2 text-muted-foreground" />
                                  <span className="text-muted-foreground">Adicionar foto depois</span>
                                </>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="h-full flex items-center justify-center bg-muted text-muted-foreground">
                            Aguardando foto depois
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedRecord.description && (
                  <div className="mt-4">
                    <Label>Descrição</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedRecord.description}</p>
                  </div>
                )}

                <DialogFooter className="flex justify-between">
                  {canEdit && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDelete(selectedRecord.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Exportar PDF
                    </Button>
                    {canEdit && afterFile && !signedUrls[selectedRecord.id]?.after && (
                      <Button onClick={handleAddAfter} disabled={isUpdating}>
                        {isUpdating ? 'Salvando...' : 'Salvar Depois'}
                      </Button>
                    )}
                  </div>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }