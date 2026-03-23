/**
 * Dialog com formulário dinâmico baseado no template selecionado
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Save, 
  FileSignature, 
  X, 
  Plus,
  ClipboardList,
  Ruler,
  Stethoscope,
  UtensilsCrossed,
  RefreshCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getTemplateById, 
  type TipoEvolucaoNutricao, 
  type CampoTemplate,
  type EvolucaoTemplate 
} from '@/hooks/prontuario/nutricao/evolucaoTemplates';

interface EvolucaoTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: TipoEvolucaoNutricao;
  onSave: (data: { templateId: TipoEvolucaoNutricao; content: Record<string, unknown> }) => Promise<unknown>;
  onSign: (data: { templateId: TipoEvolucaoNutricao; content: Record<string, unknown> }) => Promise<boolean>;
  saving: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ClipboardList,
  Ruler,
  Stethoscope,
  UtensilsCrossed,
  RefreshCcw,
};

export function EvolucaoTemplateFormDialog({
  open,
  onOpenChange,
  templateId,
  onSave,
  onSign,
  saving,
}: EvolucaoTemplateFormDialogProps) {
  const template = getTemplateById(templateId);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});

  if (!template) return null;

  const IconComponent = iconMap[template.icon] || ClipboardList;

  const updateField = (fieldId: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (fieldId: string, optionValue: string, checked: boolean) => {
    const currentValues = (formData[fieldId] as string[]) || [];
    if (checked) {
      updateField(fieldId, [...currentValues, optionValue]);
    } else {
      updateField(fieldId, currentValues.filter(v => v !== optionValue));
    }
  };

  const addTag = (fieldId: string) => {
    const value = tagInputs[fieldId]?.trim();
    if (value) {
      const currentTags = (formData[fieldId] as string[]) || [];
      if (!currentTags.includes(value)) {
        updateField(fieldId, [...currentTags, value]);
      }
      setTagInputs(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const removeTag = (fieldId: string, tagToRemove: string) => {
    const currentTags = (formData[fieldId] as string[]) || [];
    updateField(fieldId, currentTags.filter(t => t !== tagToRemove));
  };

  const validateForm = (): boolean => {
    const missingRequired = template.campos
      .filter(c => c.required)
      .filter(c => {
        const value = formData[c.id];
        if (Array.isArray(value)) return value.length === 0;
        return !value || (typeof value === 'string' && !value.trim());
      });

    if (missingRequired.length > 0) {
      toast.error(`Preencha os campos obrigatórios: ${missingRequired.map(c => c.label).join(', ')}`);
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    const result = await onSave({ templateId, content: formData });
    if (result) {
      setFormData({});
      onOpenChange(false);
    }
  };

  const handleSign = async () => {
    if (!validateForm()) return;
    
    const result = await onSign({ templateId, content: formData });
    if (result) {
      setFormData({});
      onOpenChange(false);
    }
  };

  const renderField = (campo: CampoTemplate) => {
    switch (campo.type) {
      case 'text':
        return (
          <Input
            id={campo.id}
            value={(formData[campo.id] as string) || ''}
            onChange={(e) => updateField(campo.id, e.target.value)}
            placeholder={campo.placeholder}
          />
        );

      case 'number':
        return (
          <div className="flex items-center gap-2">
            <Input
              id={campo.id}
              type="number"
              value={(formData[campo.id] as number) ?? ''}
              onChange={(e) => updateField(campo.id, e.target.value ? parseFloat(e.target.value) : null)}
              placeholder={campo.placeholder}
              min={campo.min}
              max={campo.max}
              step={campo.step}
              className="flex-1"
            />
            {campo.unit && (
              <span className="text-sm text-muted-foreground w-12">{campo.unit}</span>
            )}
          </div>
        );

      case 'textarea':
        return (
          <Textarea
            id={campo.id}
            value={(formData[campo.id] as string) || ''}
            onChange={(e) => updateField(campo.id, e.target.value)}
            placeholder={campo.placeholder}
            rows={campo.rows || 3}
          />
        );

      case 'select':
        return (
          <Select
            value={(formData[campo.id] as string) || ''}
            onValueChange={(value) => updateField(campo.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {campo.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox_group':
        return (
          <div className="grid grid-cols-2 gap-2">
            {campo.options?.map((opt) => {
              const isChecked = ((formData[campo.id] as string[]) || []).includes(opt.value);
              return (
                <div key={opt.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${campo.id}-${opt.value}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(campo.id, opt.value, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`${campo.id}-${opt.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {opt.label}
                  </label>
                </div>
              );
            })}
          </div>
        );

      case 'tags':
        const tags = (formData[campo.id] as string[]) || [];
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={tagInputs[campo.id] || ''}
                onChange={(e) => setTagInputs(prev => ({ ...prev, [campo.id]: e.target.value }))}
                placeholder={campo.placeholder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(campo.id);
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => addTag(campo.id)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(campo.id, tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );

      case 'date':
        return (
          <Input
            id={campo.id}
            type="date"
            value={(formData[campo.id] as string) || ''}
            onChange={(e) => updateField(campo.id, e.target.value)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5 text-primary" />
            {template.nome}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 pb-4">
            {template.campos.map((campo) => (
              <div key={campo.id} className="space-y-2">
                <Label htmlFor={campo.id} className="flex items-center gap-1">
                  {campo.label}
                  {campo.required && <span className="text-destructive">*</span>}
                </Label>
                {renderField(campo)}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleSaveDraft} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Rascunho'}
          </Button>
          <Button onClick={handleSign} disabled={saving}>
            <FileSignature className="h-4 w-4 mr-2" />
            Assinar Evolução
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
