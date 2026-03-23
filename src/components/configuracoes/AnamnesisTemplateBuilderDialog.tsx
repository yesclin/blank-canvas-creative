/**
 * Builder Dialog V2 — Seções e Campos com Reordenação
 */

import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Trash2, ChevronUp, ChevronDown, ClipboardList, Stethoscope, FolderPlus, Copy,
} from 'lucide-react';
import { useAnamnesisTemplatesV2, type AnamnesisTemplateV2, type TemplateSection, type TemplateField } from '@/hooks/useAnamnesisTemplatesV2';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: AnamnesisTemplateV2 | null;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'select', label: 'Lista suspensa' },
  { value: 'multiselect', label: 'Múltipla escolha' },
  { value: 'radio', label: 'Opções (radio)' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'scale', label: 'Escala' },
  { value: 'calculated', label: 'Campo automático' },
];

export function AnamnesisTemplateBuilderDialog({ open, onOpenChange, template }: Props) {
  const { createTemplate, updateTemplate, isCreating, isUpdating } = useAnamnesisTemplatesV2();
  const { clinic } = useClinicData();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [icon, setIcon] = useState('Stethoscope');
  const [isDefault, setIsDefault] = useState(false);
  const [sections, setSections] = useState<TemplateSection[]>([]);

  const isEditing = template && template.id && !template.is_system;

  // Fetch specialties
  const { data: specialties } = useQuery({
    queryKey: ['specialties-for-builder', clinic?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('specialties')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      return data || [];
    },
    enabled: !!clinic?.id,
  });

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setSpecialtyId(template.specialty_id || '');
      setIcon(template.icon);
      setIsDefault(template.is_default);
      setSections(template.structure.length > 0 ? JSON.parse(JSON.stringify(template.structure)) : []);
    } else {
      setName('');
      setDescription('');
      setSpecialtyId('');
      setIcon('Stethoscope');
      setIsDefault(false);
      setSections([]);
    }
  }, [template, open]);

  // ─── Section helpers ────────────────────────────────────────
  const addSection = () => {
    setSections([...sections, {
      id: `section_${Date.now()}`,
      type: 'section',
      title: `Seção ${sections.length + 1}`,
      fields: [],
    }]);
  };

  const updateSection = (idx: number, updates: Partial<TemplateSection>) => {
    const next = [...sections];
    next[idx] = { ...next[idx], ...updates };
    setSections(next);
  };

  const removeSection = (idx: number) => setSections(sections.filter((_, i) => i !== idx));

  const moveSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[idx], next[target]] = [next[target], next[idx]];
    setSections(next);
  };

  // ─── Field helpers ──────────────────────────────────────────
  const addField = (sIdx: number) => {
    const next = [...sections];
    next[sIdx].fields.push({
      id: `field_${Date.now()}`,
      type: 'textarea',
      label: '',
    });
    setSections(next);
  };

  const updateField = (sIdx: number, fIdx: number, updates: Partial<TemplateField>) => {
    const next = [...sections];
    next[sIdx].fields[fIdx] = { ...next[sIdx].fields[fIdx], ...updates };
    setSections(next);
  };

  const removeField = (sIdx: number, fIdx: number) => {
    const next = [...sections];
    next[sIdx].fields = next[sIdx].fields.filter((_, i) => i !== fIdx);
    setSections(next);
  };

  const duplicateField = (sIdx: number, fIdx: number) => {
    const next = [...sections];
    const original = next[sIdx].fields[fIdx];
    const clone = { ...original, id: `field_${Date.now()}`, label: `${original.label} (cópia)` };
    next[sIdx].fields.splice(fIdx + 1, 0, clone);
    setSections(next);
  };

  const moveField = (sIdx: number, fIdx: number, dir: -1 | 1) => {
    const target = fIdx + dir;
    if (target < 0 || target >= sections[sIdx].fields.length) return;
    const next = [...sections];
    const fields = [...next[sIdx].fields];
    [fields[fIdx], fields[target]] = [fields[target], fields[fIdx]];
    next[sIdx].fields = fields;
    setSections(next);
  };

  // ─── Save ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim() || !specialtyId) return;

    if (isEditing && template) {
      await updateTemplate({
        id: template.id,
        name,
        description,
        specialty_id: specialtyId,
        icon,
        is_default: isDefault,
        structure: sections,
      });
    } else {
      await createTemplate({
        name,
        description,
        specialty_id: specialtyId,
        icon,
        is_default: isDefault,
        structure: sections,
      });
    }
    onOpenChange(false);
  };

  const isValid = name.trim() && specialtyId;
  const isSaving = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Modelo' : 'Novo Modelo de Anamnese'}
          </DialogTitle>
          <DialogDescription>
            Configure seções e campos. Ao salvar edições, uma nova versão é criada automaticamente.
          </DialogDescription>
          {isEditing && template && (template as any).usage_count > 0 && (
            <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              ⚠️ Este modelo já foi utilizado em {(template as any).usage_count} prontuário{(template as any).usage_count > 1 ? 's' : ''}. As alterações afetarão apenas novos registros.
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="space-y-6 p-1">
            {/* ─── Metadata ─────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Modelo *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Anamnese Cardiológica" />
              </div>
              <div className="space-y-2">
                <Label>Especialidade *</Label>
                <Select value={specialtyId} onValueChange={setSpecialtyId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {(specialties || []).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Breve descrição" />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                <Label className="text-sm">Modelo padrão da especialidade</Label>
              </div>
            </div>

            <Separator />

            {/* ─── Sections Builder ──────────────────────────── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Seções e Campos</h3>
                <Button onClick={addSection} size="sm" variant="outline">
                  <FolderPlus className="h-4 w-4 mr-2" /> Adicionar Seção
                </Button>
              </div>

              {sections.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma seção adicionada</p>
                    <p className="text-sm">Clique em "Adicionar Seção" para começar</p>
                  </CardContent>
                </Card>
              )}

              {sections.map((section, sIdx) => (
                <Card key={section.id} className="border">
                  <CardContent className="pt-4 space-y-3">
                    {/* Section header */}
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveSection(sIdx, -1)} disabled={sIdx === 0}>
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveSection(sIdx, 1)} disabled={sIdx === sections.length - 1}>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        value={section.title}
                        onChange={e => updateSection(sIdx, { title: e.target.value })}
                        placeholder="Título da seção"
                        className="font-medium"
                      />
                      <Badge variant="outline" className="whitespace-nowrap text-xs">
                        {section.fields.length} campos
                      </Badge>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeSection(sIdx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Fields */}
                    <div className="ml-8 space-y-2">
                      {section.fields.map((field, fIdx) => (
                        <div key={field.id} className="flex items-start gap-2 p-2 border rounded bg-muted/30">
                          <div className="flex flex-col mt-1">
                            <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => moveField(sIdx, fIdx, -1)} disabled={fIdx === 0}>
                              <ChevronUp className="h-2.5 w-2.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => moveField(sIdx, fIdx, 1)} disabled={fIdx === section.fields.length - 1}>
                              <ChevronDown className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                          <div className="flex-1 grid grid-cols-6 gap-2">
                            <div className="col-span-3">
                              <Input
                                value={field.label}
                                onChange={e => updateField(sIdx, fIdx, { label: e.target.value })}
                                placeholder="Label do campo"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Select value={field.type} onValueChange={v => updateField(sIdx, fIdx, { type: v as TemplateField['type'] })}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-background z-50">
                                  {FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={field.required || false}
                                onCheckedChange={v => updateField(sIdx, fIdx, { required: v })}
                              />
                              <span className="text-xs text-muted-foreground">Obrig.</span>
                            </div>
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateField(sIdx, fIdx)} title="Duplicar campo">
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeField(sIdx, fIdx)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            {['select', 'multiselect', 'radio', 'checkbox'].includes(field.type) && (
                              <div className="col-span-6">
                                <Input
                                  value={field.options?.join(', ') || ''}
                                  onChange={e => updateField(sIdx, fIdx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                  placeholder="Opções separadas por vírgula"
                                  className="h-7 text-xs"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="w-full border-dashed border" onClick={() => addField(sIdx)}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Campo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving}>
            {isSaving ? 'Salvando...' : isEditing ? 'Salvar (Nova Versão)' : 'Criar Modelo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
