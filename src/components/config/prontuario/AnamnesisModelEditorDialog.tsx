/**
 * AnamnesisModelEditorDialog — Editor completo de estrutura de modelo de anamnese
 * 
 * Permite: editar nome/descrição, adicionar/remover/reordenar seções e campos,
 * marcar campos obrigatórios, e salva com versionamento automático.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, Trash2, GripVertical, ArrowUp, ArrowDown, Save, X,
  ClipboardList, Edit3, Settings2, Asterisk, Copy,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { AnamnesisModel } from '@/hooks/prontuario/useAnamnesisModels';
import type { Json } from '@/integrations/supabase/types';
import { getDefaultAnamnesisStructure } from '@/constants/defaultAnamnesisStructures';

// ===== TYPES =====

interface EditorField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  description?: string;
}

interface EditorSection {
  id: string;
  type: 'section';
  title: string;
  fields: EditorField[];
}

const ALL_FIELD_TYPES = [
  { value: 'text', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'select', label: 'Seleção única' },
  { value: 'multiselect', label: 'Seleção múltipla' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Opções (radio)' },
  { value: 'calculated', label: 'Calculado' },
  { value: 'gallery', label: 'Galeria de imagens' },
  { value: 'file', label: 'Upload de arquivo' },
  { value: 'signature', label: 'Assinatura' },
  { value: 'scale', label: 'Escala' },
];

// Psychology: only narrative/free field types
const PSICOLOGIA_FIELD_TYPES = [
  'text', 'textarea', 'date', 'select', 'multiselect', 'checkbox', 'radio',
];

const getFieldTypes = (specialtySlug?: string) => {
  if (specialtySlug === 'psicologia') {
    return ALL_FIELD_TYPES.filter(ft => PSICOLOGIA_FIELD_TYPES.includes(ft.value));
  }
  return ALL_FIELD_TYPES;
};

interface AnamnesisModelEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: AnamnesisModel | null;
  onSave: (id: string, data: { name?: string; description?: string; campos?: Json }) => Promise<boolean>;
  saving: boolean;
  specialtySlug?: string;
}

export function AnamnesisModelEditorDialog({
  open,
  onOpenChange,
  model,
  onSave,
  saving,
  specialtySlug,
}: AnamnesisModelEditorDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<EditorSection[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const fieldTypes = getFieldTypes(specialtySlug);

  // Load model data and structure from version
  useEffect(() => {
    if (!open || !model) return;

    setName(model.name);
    setDescription(model.description || '');
    setHasChanges(false);

    // Load structure from current version or campos
    const loadStructure = async () => {
      setLoadingStructure(true);
      try {
        let structure: any[] = [];

        // Try loading from current version first
        if (model.current_version_id) {
          const { data } = await supabase
            .from('anamnesis_template_versions')
            .select('structure')
            .eq('id', model.current_version_id)
            .single();
          if (data?.structure && Array.isArray(data.structure)) {
            structure = data.structure as any[];
          }
        }

        // Fallback to campos
        if (structure.length === 0 && model.campos && Array.isArray(model.campos)) {
          structure = model.campos as any[];
        }

        // Fallback to default specialty structure if still empty
        if (structure.length === 0 && specialtySlug) {
          const defaultStructure = getDefaultAnamnesisStructure(specialtySlug);
          if (defaultStructure.length > 0) {
            structure = defaultStructure;
          }
        }

        // Parse into EditorSection[]
        const parsed: EditorSection[] = structure.map((s: any, idx: number) => ({
          id: s.id || `section_${idx}`,
          type: 'section',
          title: s.title || `Seção ${idx + 1}`,
          fields: (s.fields || []).map((f: any, fIdx: number) => ({
            id: f.id || `field_${idx}_${fIdx}`,
            type: f.type || 'text',
            label: f.label || '',
            required: f.required || false,
            placeholder: f.placeholder || '',
            options: f.options || [],
            description: f.description || '',
          })),
        }));

        setSections(parsed);
      } catch (err) {
        console.error('Error loading template structure:', err);
      } finally {
        setLoadingStructure(false);
      }
    };

    loadStructure();
  }, [open, model]);

  const markChanged = useCallback(() => setHasChanges(true), []);

  // Section operations
  const addSection = () => {
    const newId = `section_${Date.now()}`;
    setSections(prev => [...prev, { id: newId, type: 'section', title: 'Nova Seção', fields: [] }]);
    markChanged();
  };

  const removeSection = (idx: number) => {
    setSections(prev => prev.filter((_, i) => i !== idx));
    markChanged();
  };

  const duplicateSection = (idx: number) => {
    setSections(prev => {
      const src = prev[idx];
      const dup: EditorSection = {
        ...src,
        id: `section_${Date.now()}`,
        title: `${src.title} (cópia)`,
        fields: src.fields.map(f => ({ ...f, id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` })),
      };
      const arr = [...prev];
      arr.splice(idx + 1, 0, dup);
      return arr;
    });
    markChanged();
  };

  const moveSectionUp = (idx: number) => {
    if (idx === 0) return;
    setSections(prev => {
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
    markChanged();
  };

  const moveSectionDown = (idx: number) => {
    setSections(prev => {
      if (idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
    markChanged();
  };

  const updateSectionTitle = (idx: number, title: string) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, title } : s));
    markChanged();
  };

  // Field operations
  const addField = (sectionIdx: number) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s;
      return {
        ...s,
        fields: [...s.fields, {
          id: `field_${Date.now()}`,
          type: 'text',
          label: '',
          required: false,
          placeholder: '',
          options: [],
          description: '',
        }],
      };
    }));
    markChanged();
  };

  const updateField = (sectionIdx: number, fieldIdx: number, updates: Partial<EditorField>) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s;
      return {
        ...s,
        fields: s.fields.map((f, fi) => fi === fieldIdx ? { ...f, ...updates } : f),
      };
    }));
    markChanged();
  };

  const removeField = (sectionIdx: number, fieldIdx: number) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s;
      return { ...s, fields: s.fields.filter((_, fi) => fi !== fieldIdx) };
    }));
    markChanged();
  };

  const duplicateField = (sectionIdx: number, fieldIdx: number) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s;
      const src = s.fields[fieldIdx];
      const dup: EditorField = { ...src, id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, label: `${src.label} (cópia)` };
      const fields = [...s.fields];
      fields.splice(fieldIdx + 1, 0, dup);
      return { ...s, fields };
    }));
    markChanged();
  };

  const moveFieldUp = (sectionIdx: number, fieldIdx: number) => {
    if (fieldIdx === 0) return;
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s;
      const fields = [...s.fields];
      [fields[fieldIdx - 1], fields[fieldIdx]] = [fields[fieldIdx], fields[fieldIdx - 1]];
      return { ...s, fields };
    }));
    markChanged();
  };

  const moveFieldDown = (sectionIdx: number, fieldIdx: number) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s;
      if (fieldIdx >= s.fields.length - 1) return s;
      const fields = [...s.fields];
      [fields[fieldIdx], fields[fieldIdx + 1]] = [fields[fieldIdx + 1], fields[fieldIdx]];
      return { ...s, fields };
    }));
    markChanged();
  };

  // Save
  const handleSave = async () => {
    if (!model) return;

    const structure = sections.map(s => ({
      id: s.id,
      type: 'section',
      title: s.title,
      fields: s.fields.map(f => ({
        id: f.id,
        type: f.type,
        label: f.label,
        required: f.required,
        ...(f.placeholder ? { placeholder: f.placeholder } : {}),
        ...(f.options && f.options.length > 0 ? { options: f.options } : {}),
        ...(f.description ? { description: f.description } : {}),
      })),
    }));

    const success = await onSave(model.id, {
      name: name.trim(),
      description: description.trim(),
      campos: structure as Json,
    });

    if (success) {
      setHasChanges(false);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      setConfirmClose(true);
    } else {
      onOpenChange(false);
    }
  };

  const totalFields = sections.reduce((acc, s) => acc + s.fields.length, 0);
  const requiredFields = sections.reduce((acc, s) => acc + s.fields.filter(f => f.required).length, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Editor de Modelo
              {model?.is_default && (
                <Badge variant="outline" className="text-xs ml-2">Padrão</Badge>
              )}
              {model?.current_version_number && (
                <Badge variant="secondary" className="text-xs font-mono">v{model.current_version_number}</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Edite a estrutura do modelo. Ao salvar, uma nova versão será criada automaticamente.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 overflow-auto" style={{ maxHeight: 'calc(95vh - 220px)' }}>
            <div className="space-y-6 pr-4 pb-4">
              {/* Name & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Modelo</Label>
                  <Input
                    value={name}
                    onChange={e => { setName(e.target.value); markChanged(); }}
                    placeholder="Nome do modelo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={description}
                    onChange={e => { setDescription(e.target.value); markChanged(); }}
                    placeholder="Descrição opcional"
                  />
                </div>
              </div>

              <Separator />

              {/* Stats bar */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{sections.length} seção(ões)</span>
                <span>{totalFields} campo(s)</span>
                <span>{requiredFields} obrigatório(s)</span>
                {hasChanges && (
                  <Badge variant="destructive" className="text-xs">Alterações não salvas</Badge>
                )}
              </div>

              {/* Sections */}
              {loadingStructure ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <Accordion type="multiple" defaultValue={sections.map(s => s.id)} className="space-y-2">
                  {sections.map((section, sIdx) => (
                    <AccordionItem key={section.id} value={section.id} className="border rounded-lg">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={e => { e.stopPropagation(); moveSectionUp(sIdx); }}
                              disabled={sIdx === 0}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={e => { e.stopPropagation(); moveSectionDown(sIdx); }}
                              disabled={sIdx === sections.length - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {sIdx + 1}
                          </Badge>
                          <span className="font-medium text-sm truncate">{section.title}</span>
                          <Badge variant="secondary" className="text-xs ml-auto shrink-0">
                            {section.fields.length} campo(s)
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        {/* Section title edit */}
                        <div className="flex items-center gap-2 mb-4">
                          <Label className="text-xs shrink-0">Título da seção:</Label>
                          <Input
                            value={section.title}
                            onChange={e => updateSectionTitle(sIdx, e.target.value)}
                            className="h-8 text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="shrink-0 h-8"
                            onClick={() => duplicateSection(sIdx)}
                            title="Duplicar seção"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive shrink-0 h-8"
                            onClick={() => removeSection(sIdx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Fields */}
                        <div className="space-y-2">
                          {section.fields.map((field, fIdx) => (
                            <div
                              key={field.id}
                              className="space-y-2 p-3 rounded-md border bg-background"
                            >
                              <div className="flex items-start gap-2">
                                {/* Reorder */}
                                <div className="flex flex-col gap-0.5 pt-1">
                                  <Button type="button" variant="ghost" size="icon" className="h-5 w-5"
                                    onClick={() => moveFieldUp(sIdx, fIdx)} disabled={fIdx === 0}>
                                    <ArrowUp className="h-3 w-3" />
                                  </Button>
                                  <Button type="button" variant="ghost" size="icon" className="h-5 w-5"
                                    onClick={() => moveFieldDown(sIdx, fIdx)} disabled={fIdx === section.fields.length - 1}>
                                    <ArrowDown className="h-3 w-3" />
                                  </Button>
                                </div>

                                {/* Field config */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <Input
                                    value={field.label}
                                    onChange={e => updateField(sIdx, fIdx, { label: e.target.value })}
                                    placeholder="Nome do campo"
                                    className="h-8 text-sm"
                                  />
                                  <Select
                                    value={field.type}
                                    onValueChange={v => updateField(sIdx, fIdx, { type: v })}
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {fieldTypes.map(ft => (
                                        <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    value={field.placeholder || ''}
                                    onChange={e => updateField(sIdx, fIdx, { placeholder: e.target.value })}
                                    placeholder="Placeholder"
                                    className="h-8 text-sm"
                                  />
                                </div>

                                {/* Required toggle */}
                                <div className="flex items-center gap-1 pt-1">
                                  <Checkbox
                                    checked={field.required}
                                    onCheckedChange={v => updateField(sIdx, fIdx, { required: !!v })}
                                  />
                                  <Asterisk className={`h-3 w-3 ${field.required ? 'text-destructive' : 'text-muted-foreground/40'}`} />
                                </div>

                                {/* Duplicate */}
                                <Button type="button" variant="ghost" size="icon"
                                  className="h-8 w-8 shrink-0" onClick={() => duplicateField(sIdx, fIdx)} title="Duplicar campo">
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>

                                {/* Remove */}
                                <Button type="button" variant="ghost" size="icon"
                                  className="h-8 w-8 text-destructive/60 hover:text-destructive shrink-0"
                                  onClick={() => removeField(sIdx, fIdx)}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              {/* Options editor for select/multiselect/radio */}
                              {['select', 'multiselect', 'radio'].includes(field.type) && (
                                <div className="ml-12 space-y-1">
                                  <Label className="text-xs text-muted-foreground">Opções (uma por linha)</Label>
                                  <textarea
                                    className="w-full text-xs rounded-md border border-input bg-background px-2 py-1.5 min-h-[60px] resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={(field.options || []).join('\n')}
                                    onChange={e => updateField(sIdx, fIdx, { options: e.target.value.split('\n') })}
                                    placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                                  />
                                </div>
                              )}
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => addField(sIdx)}
                          >
                            <Plus className="h-3 w-3 mr-1" />Adicionar campo
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}

              {/* Add section button */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addSection}
              >
                <Plus className="h-4 w-4 mr-2" />Adicionar Seção
              </Button>
            </div>
          </ScrollArea>

          <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Ao salvar, uma nova versão (v{(model?.current_version_number || 0) + 1}) será criada automaticamente.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !hasChanges || !name.trim()}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar e Versionar'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm discard changes */}
      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Deseja descartá-las?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmClose(false); onOpenChange(false); }}>
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
