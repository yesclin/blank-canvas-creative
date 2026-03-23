import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Globe, Stethoscope, FileText } from 'lucide-react';
import { useCustomProntuarioFields, type CustomProntuarioField, type CustomFieldType } from '@/hooks/prontuario/useCustomProntuarioFields';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';

interface CustomFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CustomProntuarioField | null;
}

const FIELD_TYPES: { value: CustomFieldType; label: string; description: string }[] = [
  { value: 'text', label: 'Texto curto', description: 'Campo de texto simples' },
  { value: 'textarea', label: 'Texto longo', description: 'Área para textos extensos' },
  { value: 'number', label: 'Número', description: 'Valores numéricos' },
  { value: 'date', label: 'Data', description: 'Seletor de data' },
  { value: 'select', label: 'Lista de opções', description: 'Escolha única de uma lista' },
  { value: 'checkbox', label: 'Checkbox', description: 'Sim ou Não' },
  { value: 'multiselect', label: 'Seleção múltipla', description: 'Escolha várias opções' },
];

type AssociationType = 'all' | 'specialty' | 'procedure';

export function CustomFieldDialog({ open, onOpenChange, editing }: CustomFieldDialogProps) {
  const { clinic } = useClinicData();
  const { create, update, saving } = useCustomProntuarioFields();
  
  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldType>('text');
  const [description, setDescription] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [associationType, setAssociationType] = useState<AssociationType>('all');
  const [specialtyId, setSpecialtyId] = useState<string>('');
  const [procedureId, setProcedureId] = useState<string>('');
  
  const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([]);
  const [procedures, setProcedures] = useState<{ id: string; name: string }[]>([]);

  // Load specialties and procedures
  useEffect(() => {
    if (!clinic?.id) return;
    
    const loadOptions = async () => {
      const [specResult, procResult] = await Promise.all([
        supabase.from('specialties').select('id, name').eq('clinic_id', clinic.id).eq('is_active', true).order('name'),
        supabase.from('procedures').select('id, name').eq('clinic_id', clinic.id).eq('is_active', true).order('name'),
      ]);
      
      setSpecialties(specResult.data || []);
      setProcedures(procResult.data || []);
    };
    
    loadOptions();
  }, [clinic?.id]);

  // Reset form when dialog opens/closes or editing changes
  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setFieldType(editing.field_type);
      setDescription(editing.description || '');
      setPlaceholder(editing.placeholder || '');
      setIsRequired(editing.is_required);
      setOptions(editing.options || []);
      
      if (editing.all_appointments) {
        setAssociationType('all');
      } else if (editing.specialty_id) {
        setAssociationType('specialty');
        setSpecialtyId(editing.specialty_id);
      } else if (editing.procedure_id) {
        setAssociationType('procedure');
        setProcedureId(editing.procedure_id);
      }
    } else {
      setName('');
      setFieldType('text');
      setDescription('');
      setPlaceholder('');
      setIsRequired(false);
      setOptions([]);
      setNewOption('');
      setAssociationType('all');
      setSpecialtyId('');
      setProcedureId('');
    }
  }, [editing, open]);

  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    const input = {
      name: name.trim(),
      field_type: fieldType,
      description: description.trim() || undefined,
      placeholder: placeholder.trim() || undefined,
      is_required: isRequired,
      options: (fieldType === 'select' || fieldType === 'multiselect') ? options : undefined,
      all_appointments: associationType === 'all',
      specialty_id: associationType === 'specialty' ? specialtyId : null,
      procedure_id: associationType === 'procedure' ? procedureId : null,
    };

    let success: boolean | string | null;
    if (editing) {
      success = await update(editing.id, input);
    } else {
      success = await create(input);
    }

    if (success) {
      onOpenChange(false);
    }
  };

  const needsOptions = fieldType === 'select' || fieldType === 'multiselect';
  const isValid = name.trim() && 
    (associationType === 'all' || 
     (associationType === 'specialty' && specialtyId) || 
     (associationType === 'procedure' && procedureId)) &&
    (!needsOptions || options.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Campo' : 'Novo Campo Personalizado'}</DialogTitle>
          <DialogDescription>
            Configure um campo customizado para capturar dados específicos durante os atendimentos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nome do campo */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do campo *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pressão Arterial Sistólica"
            />
          </div>

          {/* Tipo do campo */}
          <div className="space-y-2">
            <Label>Tipo do campo *</Label>
            <Select value={fieldType} onValueChange={(v) => setFieldType(v as CustomFieldType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">- {type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opções para select/multiselect */}
          {needsOptions && (
            <div className="space-y-2">
              <Label>Opções da lista *</Label>
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Adicionar opção"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                />
                <Button type="button" variant="outline" onClick={handleAddOption}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {options.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {options.map((opt, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                      {opt}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleRemoveOption(i)} 
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Descrição/Ajuda */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição/Ajuda</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Texto de ajuda para o profissional"
              rows={2}
            />
          </div>

          {/* Placeholder */}
          <div className="space-y-2">
            <Label htmlFor="placeholder">Placeholder</Label>
            <Input
              id="placeholder"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="Texto exibido quando vazio"
            />
          </div>

          {/* Obrigatório */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Campo obrigatório</Label>
              <p className="text-xs text-muted-foreground">O campo deve ser preenchido antes de salvar</p>
            </div>
            <Switch checked={isRequired} onCheckedChange={setIsRequired} />
          </div>

          {/* Associação */}
          <div className="space-y-3">
            <Label>Onde este campo aparece? *</Label>
            <RadioGroup value={associationType} onValueChange={(v) => setAssociationType(v as AssociationType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer font-normal">
                  <Globe className="h-4 w-4" />
                  Todos os atendimentos
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specialty" id="specialty" />
                <Label htmlFor="specialty" className="flex items-center gap-2 cursor-pointer font-normal">
                  <Stethoscope className="h-4 w-4" />
                  Apenas em uma especialidade
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="procedure" id="procedure" />
                <Label htmlFor="procedure" className="flex items-center gap-2 cursor-pointer font-normal">
                  <FileText className="h-4 w-4" />
                  Apenas em um procedimento
                </Label>
              </div>
            </RadioGroup>

            {associationType === 'specialty' && (
              <Select value={specialtyId} onValueChange={setSpecialtyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a especialidade" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((spec) => (
                    <SelectItem key={spec.id} value={spec.id}>
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {associationType === 'procedure' && (
              <Select value={procedureId} onValueChange={setProcedureId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {procedures.map((proc) => (
                    <SelectItem key={proc.id} value={proc.id}>
                      {proc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !isValid}>
            {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Campo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
