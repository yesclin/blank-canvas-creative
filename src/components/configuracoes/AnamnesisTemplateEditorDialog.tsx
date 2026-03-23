/**
 * Dialog para edição/criação de modelos de anamnese
 */

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  GripVertical,
  ClipboardList,
  Syringe,
  Droplets,
  Sparkles,
  FileText,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { useAnamnesisTemplates, type AnamnesisTemplate, type CreateAnamnesisTemplateInput } from '@/hooks/useAnamnesisTemplates';
import type { CampoAnamnese } from '@/hooks/prontuario/estetica/anamneseTemplates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnamnesisTemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: AnamnesisTemplate | null;
}

const ICON_OPTIONS = [
  { value: 'ClipboardList', label: 'Lista', icon: ClipboardList },
  { value: 'Syringe', label: 'Seringa', icon: Syringe },
  { value: 'Droplets', label: 'Gotas', icon: Droplets },
  { value: 'Sparkles', label: 'Brilhos', icon: Sparkles },
  { value: 'FileText', label: 'Documento', icon: FileText },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'select', label: 'Seleção única' },
  { value: 'multiselect', label: 'Seleção múltipla' },
  { value: 'radio', label: 'Opções (radio)' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Data' },
  { value: 'number', label: 'Número' },
  { value: 'imagem_interativa', label: 'Imagem Interativa' },
];

const TEMPLATE_TYPES = [
  { value: 'anamnese_geral_estetica', label: 'Anamnese Geral Estética' },
  { value: 'anamnese_toxina', label: 'Anamnese Toxina Botulínica' },
  { value: 'anamnese_preenchimento', label: 'Anamnese Preenchimento' },
  { value: 'anamnese_bioestimulador', label: 'Anamnese Bioestimuladores' },
  { value: 'anamnese_personalizada', label: 'Anamnese Personalizada' },
];

const emptyField: CampoAnamnese = {
  id: '',
  label: '',
  type: 'text',
  section: 'Geral',
};

export function AnamnesisTemplateEditorDialog({
  open,
  onOpenChange,
  template,
}: AnamnesisTemplateEditorDialogProps) {
  const { createTemplate, updateTemplate, isCreating, isUpdating } = useAnamnesisTemplates();
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [uploadingFieldIndex, setUploadingFieldIndex] = useState<number | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState('anamnese_personalizada');
  const [icon, setIcon] = useState('ClipboardList');
  const [isActive, setIsActive] = useState(true);
  const [campos, setCampos] = useState<CampoAnamnese[]>([]);

  const isEditing = template && template.id;

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setTemplateType(template.template_type);
      setIcon(template.icon);
      setIsActive(template.is_active);
      setCampos(template.campos || []);
    } else {
      setName('');
      setDescription('');
      setTemplateType('anamnese_personalizada');
      setIcon('ClipboardList');
      setIsActive(true);
      setCampos([]);
    }
  }, [template, open]);

  const handleAddField = () => {
    const newField: CampoAnamnese = {
      ...emptyField,
      id: `campo_${Date.now()}`,
    };
    setCampos([...campos, newField]);
  };

  const handleUpdateField = (index: number, updates: Partial<CampoAnamnese>) => {
    const updated = [...campos];
    updated[index] = { ...updated[index], ...updates };
    setCampos(updated);
  };

  const handleRemoveField = (index: number) => {
    setCampos(campos.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingFieldIndex(index);

    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `base-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('anamnesis-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('anamnesis-images')
        .getPublicUrl(filePath);

      handleUpdateField(index, { baseImageUrl: publicUrl });
      toast.success('Imagem carregada com sucesso');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploadingFieldIndex(null);
    }
  };

  const handleRemoveImage = (index: number) => {
    handleUpdateField(index, { baseImageUrl: undefined });
  };

  const handleSave = async () => {
    const data: CreateAnamnesisTemplateInput = {
      name,
      description,
      template_type: templateType,
      icon,
      campos,
      is_active: isActive,
    };

    if (isEditing) {
      await updateTemplate({ id: template.id, ...data });
    } else {
      await createTemplate(data);
    }
    
    onOpenChange(false);
  };

  const isValid = name.trim() && templateType;
  const isSaving = isCreating || isUpdating;

  // Get unique sections from campos
  const sections = [...new Set(campos.map(c => c.section || 'Geral'))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Modelo de Anamnese' : 'Novo Modelo de Anamnese'}
          </DialogTitle>
          <DialogDescription>
            Configure os campos e seções do modelo de anamnese
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="space-y-6 p-1">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Modelo *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Anamnese Toxina Botulínica"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={templateType} onValueChange={setTemplateType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do modelo"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="h-4 w-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="active">Ativo</Label>
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>

            <Separator />

            {/* Fields Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Campos do Formulário</h3>
                  <p className="text-sm text-muted-foreground">
                    Adicione e configure os campos da anamnese
                  </p>
                </div>
                <Button onClick={handleAddField} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Campo
                </Button>
              </div>

              {campos.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum campo adicionado</p>
                    <p className="text-sm">Clique em "Adicionar Campo" para começar</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {campos.map((campo, index) => (
                    <Card key={campo.id || index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
                          
                          <div className="flex-1 grid grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">ID do Campo</Label>
                              <Input
                                value={campo.id}
                                onChange={(e) => handleUpdateField(index, { id: e.target.value })}
                                placeholder="campo_id"
                                className="h-8 text-sm"
                              />
                            </div>

                            <div className="space-y-1 col-span-2">
                              <Label className="text-xs">Label</Label>
                              <Input
                                value={campo.label}
                                onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                                placeholder="Nome do campo"
                                className="h-8 text-sm"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Tipo</Label>
                              <Select
                                value={campo.type}
                                onValueChange={(v) => handleUpdateField(index, { type: v as CampoAnamnese['type'] })}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {FIELD_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                      {t.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Seção</Label>
                              <Input
                                value={campo.section || ''}
                                onChange={(e) => handleUpdateField(index, { section: e.target.value })}
                                placeholder="Seção"
                                className="h-8 text-sm"
                                list="sections-list"
                              />
                              <datalist id="sections-list">
                                {sections.map((s) => (
                                  <option key={s} value={s} />
                                ))}
                              </datalist>
                            </div>

                            <div className="space-y-1 col-span-2">
                              <Label className="text-xs">Placeholder</Label>
                              <Input
                                value={campo.placeholder || ''}
                                onChange={(e) => handleUpdateField(index, { placeholder: e.target.value })}
                                placeholder="Texto de ajuda"
                                className="h-8 text-sm"
                              />
                            </div>

                            <div className="flex items-end">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={campo.required || false}
                                  onCheckedChange={(v) => handleUpdateField(index, { required: v })}
                                />
                                <Label className="text-xs">Obrigatório</Label>
                              </div>
                            </div>

                            {['select', 'multiselect', 'radio'].includes(campo.type) && (
                              <div className="col-span-4 space-y-1">
                                <Label className="text-xs">Opções (separadas por vírgula)</Label>
                                <Input
                                  value={campo.options?.join(', ') || ''}
                                  onChange={(e) => handleUpdateField(index, { 
                                    options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                  })}
                                  placeholder="Opção 1, Opção 2, Opção 3"
                                  className="h-8 text-sm"
                                />
                              </div>
                            )}

                            {/* Image upload for imagem_interativa type */}
                            {campo.type === 'imagem_interativa' && (
                              <div className="col-span-4 space-y-2">
                                <Label className="text-xs">Imagem Base</Label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  ref={(el) => { fileInputRefs.current[index] = el; }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(index, file);
                                  }}
                                />
                                
                                {campo.baseImageUrl ? (
                                  <div className="relative inline-block">
                                    <img 
                                      src={campo.baseImageUrl} 
                                      alt="Imagem base" 
                                      className="h-24 rounded border object-cover"
                                    />
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="absolute -top-2 -right-2 h-6 w-6"
                                      onClick={() => handleRemoveImage(index)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => fileInputRefs.current[index]?.click()}
                                    disabled={uploadingFieldIndex === index}
                                  >
                                    {uploadingFieldIndex === index ? (
                                      <>Carregando...</>
                                    ) : (
                                      <>
                                        <Upload className="h-4 w-4" />
                                        Carregar imagem
                                      </>
                                    )}
                                  </Button>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Imagem para desenho interativo (ex: mapa facial, corpo). Máx: 5MB
                                </p>
                              </div>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveField(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving}>
            {isSaving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Modelo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
