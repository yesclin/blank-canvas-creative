import { useState, useEffect } from 'react';
import {
  GripVertical, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Type, AlignLeft, Hash, Calendar, List, CheckSquare, ImageIcon, FileUp, PenTool, Clock,
  ListChecks, AlertTriangle, Eye, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useTabFields, type TabField, type TabFieldType, type TabFieldInput } from '@/hooks/prontuario/useTabFields';

const FIELD_TYPE_CONFIG: { value: TabFieldType; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { value: 'text', label: 'Texto curto', icon: Type, description: 'Campo de texto simples' },
  { value: 'textarea', label: 'Texto longo', icon: AlignLeft, description: 'Área para textos extensos' },
  { value: 'number', label: 'Número', icon: Hash, description: 'Valores numéricos' },
  { value: 'date', label: 'Data', icon: Calendar, description: 'Seletor de data' },
  { value: 'select', label: 'Seleção única', icon: List, description: 'Escolha uma opção' },
  { value: 'multiselect', label: 'Seleção múltipla', icon: ListChecks, description: 'Escolha várias opções' },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare, description: 'Sim ou Não' },
  { value: 'image_upload', label: 'Upload de imagem', icon: ImageIcon, description: 'Envio de imagem única' },
  { value: 'image_gallery', label: 'Galeria de imagens', icon: ImageIcon, description: 'Upload múltiplo com legenda e classificação (antes/depois/evolução)' },
  { value: 'document_upload', label: 'Upload de documento', icon: FileUp, description: 'Envio de arquivo' },
  { value: 'signature', label: 'Assinatura digital', icon: PenTool, description: 'Captura de assinatura' },
  { value: 'auto_date', label: 'Data do atendimento (auto)', icon: Clock, description: 'Preenchido automaticamente' },
];

const getFieldIcon = (type: TabFieldType) => {
  const config = FIELD_TYPE_CONFIG.find(c => c.value === type);
  return config?.icon || Type;
};

const getFieldLabel = (type: TabFieldType) => {
  const config = FIELD_TYPE_CONFIG.find(c => c.value === type);
  return config?.label || type;
};

interface TabFieldsBuilderProps {
  tabId: string;
  tabName: string;
  specialtyId: string;
}

export function TabFieldsBuilder({ tabId, tabName, specialtyId }: TabFieldsBuilderProps) {
  const { fields, loading, saving, createField, updateField, removeField, reorderFields } = useTabFields(tabId, specialtyId);

  const [localFields, setLocalFields] = useState<TabField[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<TabField | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<TabField | null>(null);

  // Form state
  const [formLabel, setFormLabel] = useState('');
  const [formType, setFormType] = useState<TabFieldType>('text');
  const [formPlaceholder, setFormPlaceholder] = useState('');
  const [formDefault, setFormDefault] = useState('');
  const [formRequired, setFormRequired] = useState(false);
  const [formOptions, setFormOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [formRoles, setFormRoles] = useState('');
  const [formCondFieldId, setFormCondFieldId] = useState('');
  const [formCondOp, setFormCondOp] = useState('');
  const [formCondValue, setFormCondValue] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setLocalFields(fields);
  }, [fields]);

  const openCreate = () => {
    setEditingField(null);
    setFormLabel('');
    setFormType('text');
    setFormPlaceholder('');
    setFormDefault('');
    setFormRequired(false);
    setFormOptions([]);
    setNewOption('');
    setFormRoles('');
    setFormCondFieldId('');
    setFormCondOp('');
    setFormCondValue('');
    setShowAdvanced(false);
    setDialogOpen(true);
  };

  const openEdit = (field: TabField) => {
    setEditingField(field);
    setFormLabel(field.label);
    setFormType(field.field_type);
    setFormPlaceholder(field.placeholder || '');
    setFormDefault(field.default_value || '');
    setFormRequired(field.is_required);
    setFormOptions(field.options || []);
    setNewOption('');
    setFormRoles((field.visible_to_roles || []).join(', '));
    setFormCondFieldId(field.condition_field_id || '');
    setFormCondOp(field.condition_operator || '');
    setFormCondValue(field.condition_value || '');
    setShowAdvanced(!!(field.visible_to_roles?.length || field.condition_field_id));
    setDialogOpen(true);
  };

  const handleAddOption = () => {
    const v = newOption.trim();
    if (v && !formOptions.includes(v)) {
      setFormOptions([...formOptions, v]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (i: number) => {
    setFormOptions(formOptions.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!formLabel.trim()) return;
    const roles = formRoles.split(',').map(r => r.trim()).filter(Boolean);
    const input: TabFieldInput = {
      label: formLabel.trim(),
      field_type: formType,
      placeholder: formPlaceholder.trim() || null,
      default_value: formDefault.trim() || null,
      options: needsOptions ? formOptions : null,
      is_required: formRequired,
      field_order: editingField ? editingField.field_order : (localFields.length + 1),
      visible_to_roles: roles,
      condition_field_id: formCondFieldId || null,
      condition_operator: formCondOp || null,
      condition_value: formCondValue || null,
    };

    if (editingField) {
      await updateField(editingField.id, input);
    } else {
      await createField(input);
    }
    setDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (toDelete) {
      await removeField(toDelete.id);
      setDeleteOpen(false);
      setToDelete(null);
    }
  };

  // Drag & drop
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const arr = [...localFields];
    const [dragged] = arr.splice(dragIdx, 1);
    arr.splice(idx, 0, dragged);
    setLocalFields(arr.map((f, i) => ({ ...f, field_order: i + 1 })));
    setDragIdx(idx);
  };
  const handleDragEnd = async () => {
    setDragIdx(null);
    const reordered = localFields.map((f, i) => ({ id: f.id, field_order: i + 1 }));
    await reorderFields(reordered);
  };

  const needsOptions = formType === 'select' || formType === 'multiselect';

  // Other fields for conditional logic
  const otherFields = fields.filter(f => f.id !== editingField?.id);

  if (loading) {
    return (
      <div className="space-y-2 mt-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <>
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-medium">Campos da aba "{tabName}"</h4>
            <p className="text-xs text-muted-foreground">{localFields.length} campo(s) configurado(s)</p>
          </div>
          <Button size="sm" variant="outline" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Novo Campo
          </Button>
        </div>

        {localFields.length === 0 ? (
          <div className="text-center py-8 border rounded-lg border-dashed">
            <Type className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum campo adicionado.</p>
            <p className="text-xs text-muted-foreground">Clique em "Novo Campo" para começar.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {localFields.map((field, idx) => {
              const Icon = getFieldIcon(field.field_type);
              return (
                <div
                  key={field.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-md border text-sm cursor-move transition-all ${
                    dragIdx === idx ? 'opacity-50 border-primary' : 'hover:bg-muted/50'
                  } ${!field.is_active ? 'opacity-50 bg-muted/20' : ''}`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{field.label}</span>
                    <span className="text-xs text-muted-foreground">{getFieldLabel(field.field_type)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {field.is_required && <Badge variant="secondary" className="text-xs">Obrigatório</Badge>}
                    {field.condition_field_id && <Badge variant="outline" className="text-xs">Condicional</Badge>}
                    {field.visible_to_roles?.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />RBAC
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(field)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => { setToDelete(field); setDeleteOpen(true); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Field Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingField ? 'Editar Campo' : 'Novo Campo'}</DialogTitle>
            <DialogDescription>Configure as propriedades do campo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Label */}
            <div className="space-y-1.5">
              <Label>Nome do campo *</Label>
              <Input value={formLabel} onChange={e => setFormLabel(e.target.value)} placeholder="Ex: Pressão Arterial" />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={formType} onValueChange={v => setFormType(v as TabFieldType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPE_CONFIG.map(t => {
                    const Ic = t.icon;
                    return (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2"><Ic className="h-4 w-4" />{t.label}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Options for select/multiselect */}
            {needsOptions && (
              <div className="space-y-1.5">
                <Label>Opções *</Label>
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={e => setNewOption(e.target.value)}
                    placeholder="Adicionar opção"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption(); } }}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={handleAddOption}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formOptions.map((opt, i) => (
                      <Badge key={i} variant="secondary" className="flex items-center gap-1">
                        {opt}
                        <button onClick={() => handleRemoveOption(i)} className="ml-1 hover:text-destructive">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Placeholder */}
            <div className="space-y-1.5">
              <Label>Placeholder</Label>
              <Input value={formPlaceholder} onChange={e => setFormPlaceholder(e.target.value)} placeholder="Texto exibido quando vazio" />
            </div>

            {/* Default value */}
            <div className="space-y-1.5">
              <Label>Valor padrão</Label>
              <Input value={formDefault} onChange={e => setFormDefault(e.target.value)} placeholder="Valor pré-preenchido" />
            </div>

            {/* Required */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Obrigatório</Label>
                <p className="text-xs text-muted-foreground">Deve ser preenchido antes de salvar</p>
              </div>
              <Switch checked={formRequired} onCheckedChange={setFormRequired} />
            </div>

            <Separator />

            {/* Advanced toggle */}
            <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAdvanced(!showAdvanced)}>
              {showAdvanced ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              Configurações avançadas
            </Button>

            {showAdvanced && (
              <div className="space-y-4 p-3 rounded-md border bg-muted/30">
                {/* RBAC */}
                <div className="space-y-1.5">
                  <Label>Visível por perfis (RBAC)</Label>
                  <Input
                    value={formRoles}
                    onChange={e => setFormRoles(e.target.value)}
                    placeholder="admin, profissional, recepcionista"
                  />
                  <p className="text-xs text-muted-foreground">Separe por vírgulas. Vazio = visível para todos.</p>
                </div>

                {/* Conditional */}
                <div className="space-y-1.5">
                  <Label>Condicional (mostrar se…)</Label>
                  {otherFields.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={formCondFieldId} onValueChange={setFormCondFieldId}>
                        <SelectTrigger><SelectValue placeholder="Campo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {otherFields.map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={formCondOp} onValueChange={setFormCondOp}>
                        <SelectTrigger><SelectValue placeholder="Operador" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eq">Igual a</SelectItem>
                          <SelectItem value="neq">Diferente de</SelectItem>
                          <SelectItem value="contains">Contém</SelectItem>
                          <SelectItem value="not_empty">Não vazio</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={formCondValue}
                        onChange={e => setFormCondValue(e.target.value)}
                        placeholder="Valor"
                        disabled={formCondOp === 'not_empty'}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Adicione outros campos primeiro para criar condições.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving || !formLabel.trim() || (needsOptions && formOptions.length === 0)}>
              {saving ? 'Salvando...' : editingField ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campo?</AlertDialogTitle>
            <AlertDialogDescription>
              O campo "{toDelete?.label}" será excluído. Dados já preenchidos em atendimentos anteriores não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
