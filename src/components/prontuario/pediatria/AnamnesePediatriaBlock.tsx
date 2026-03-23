import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText,
  Baby,
  Heart,
  Pill,
  Users,
  Moon,
  Utensils,
  Brain,
  ChevronDown,
  ChevronRight,
  Save,
  Edit2,
  AlertTriangle,
  Plus,
  X,
  Clock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { z } from 'zod';

// ===== VALIDATION SCHEMA =====
const anamnesePediatriaSchema = z.object({
  chief_complaint: z.string().max(500, 'Máximo 500 caracteres').optional(),
  gestational_history: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  gestational_age_weeks: z.number().min(20).max(45).optional().nullable(),
  delivery_type: z.enum(['vaginal', 'cesarean', 'forceps', 'vacuum', '']).optional(),
  birth_weight_grams: z.number().min(300).max(7000).optional().nullable(),
  birth_length_cm: z.number().min(20).max(60).optional().nullable(),
  apgar_1min: z.number().min(0).max(10).optional().nullable(),
  apgar_5min: z.number().min(0).max(10).optional().nullable(),
  neonatal_complications: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  family_history: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  allergies: z.array(z.string().max(100)).max(20),
  current_medications: z.array(z.object({
    name: z.string().max(100),
    dosage: z.string().max(50).optional(),
    frequency: z.string().max(50).optional(),
  })).max(20),
  sleep_habits: z.string().max(500, 'Máximo 500 caracteres').optional(),
  current_feeding: z.string().max(500, 'Máximo 500 caracteres').optional(),
  feeding_type: z.enum(['exclusive_breastfeeding', 'mixed', 'formula', 'solid', '']).optional(),
  development_notes: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
});

// ===== TYPES =====
export type AnamnesePediatriaData = z.infer<typeof anamnesePediatriaSchema>;

export interface AnamnesePediatriaRecord {
  id: string;
  patient_id: string;
  version: number;
  data: AnamnesePediatriaData;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicationItem {
  name: string;
  dosage?: string;
  frequency?: string;
}

// ===== CONSTANTS =====
export const DELIVERY_TYPES: Record<string, string> = {
  vaginal: 'Parto Normal',
  cesarean: 'Cesárea',
  forceps: 'Fórceps',
  vacuum: 'Vácuo-extrator',
};

export const FEEDING_TYPES: Record<string, string> = {
  exclusive_breastfeeding: 'Aleitamento Materno Exclusivo',
  mixed: 'Aleitamento Misto',
  formula: 'Fórmula Infantil',
  solid: 'Alimentação Sólida',
};

const SECTION_CONFIG = [
  { id: 'queixa', label: 'Queixa Principal', icon: FileText },
  { id: 'gestacional', label: 'Histórico Gestacional e Parto', icon: Baby },
  { id: 'neonatal', label: 'Período Neonatal', icon: Heart },
  { id: 'familiar', label: 'Histórico Familiar', icon: Users },
  { id: 'alergias', label: 'Alergias', icon: AlertTriangle },
  { id: 'medicamentos', label: 'Medicamentos em Uso', icon: Pill },
  { id: 'sono', label: 'Hábitos de Sono', icon: Moon },
  { id: 'alimentacao', label: 'Alimentação', icon: Utensils },
  { id: 'desenvolvimento', label: 'Desenvolvimento Neuropsicomotor', icon: Brain },
];

// ===== PROPS =====
interface AnamnesePediatriaBlockProps {
  patientId: string;
  record?: AnamnesePediatriaRecord;
  onSave?: (data: AnamnesePediatriaData) => Promise<void>;
  isEditable?: boolean;
  className?: string;
}

// ===== COMPONENT =====
export function AnamnesePediatriaBlock({
  patientId,
  record,
  onSave,
  isEditable = true,
  className,
}: AnamnesePediatriaBlockProps) {
  const [isEditing, setIsEditing] = useState(!record);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(
    record ? [] : SECTION_CONFIG.map(s => s.id)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<AnamnesePediatriaData>({
    chief_complaint: record?.data.chief_complaint || '',
    gestational_history: record?.data.gestational_history || '',
    gestational_age_weeks: record?.data.gestational_age_weeks ?? null,
    delivery_type: record?.data.delivery_type || '',
    birth_weight_grams: record?.data.birth_weight_grams ?? null,
    birth_length_cm: record?.data.birth_length_cm ?? null,
    apgar_1min: record?.data.apgar_1min ?? null,
    apgar_5min: record?.data.apgar_5min ?? null,
    neonatal_complications: record?.data.neonatal_complications || '',
    family_history: record?.data.family_history || '',
    allergies: record?.data.allergies || [],
    current_medications: record?.data.current_medications || [],
    sleep_habits: record?.data.sleep_habits || '',
    current_feeding: record?.data.current_feeding || '',
    feeding_type: record?.data.feeding_type || '',
    development_notes: record?.data.development_notes || '',
  });

  // Allergy input state
  const [newAllergy, setNewAllergy] = useState('');

  // Medication input state
  const [newMedication, setNewMedication] = useState<MedicationItem>({
    name: '',
    dosage: '',
    frequency: '',
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSave = async () => {
    if (!onSave) return;

    // Validate
    const result = anamnesePediatriaSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path.join('.')] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      await onSave(result.data);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = () => {
    const trimmed = newAllergy.trim();
    if (trimmed && !formData.allergies.includes(trimmed) && formData.allergies.length < 20) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, trimmed],
      }));
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy),
    }));
  };

  const addMedication = () => {
    if (newMedication.name.trim() && formData.current_medications.length < 20) {
      setFormData(prev => ({
        ...prev,
        current_medications: [...prev.current_medications, { ...newMedication, name: newMedication.name.trim() }],
      }));
      setNewMedication({ name: '', dosage: '', frequency: '' });
    }
  };

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      current_medications: prev.current_medications.filter((_, i) => i !== index),
    }));
  };

  const renderSectionHeader = (section: typeof SECTION_CONFIG[0], isOpen: boolean) => {
    const Icon = section.icon;
    return (
      <div className="flex items-center justify-between w-full py-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-medium">{section.label}</span>
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Anamnese Pediátrica</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {record && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                v{record.version}
              </Badge>
            )}
            {isEditable && !isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
          </div>
        </div>
        {record && (
          <p className="text-xs text-muted-foreground">
            Atualizado em {format(parseISO(record.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {record.created_by_name && ` por ${record.created_by_name}`}
          </p>
        )}
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {SECTION_CONFIG.map((section) => {
              const isOpen = expandedSections.includes(section.id);
              
              return (
                <Collapsible key={section.id} open={isOpen} onOpenChange={() => toggleSection(section.id)}>
                  <CollapsibleTrigger asChild>
                    <div className="cursor-pointer rounded-lg border p-2 hover:bg-muted/50 transition-colors">
                      {renderSectionHeader(section, isOpen)}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 pb-2 px-2">
                    {/* Queixa Principal */}
                    {section.id === 'queixa' && (
                      <div className="space-y-2">
                        <Label htmlFor="chief_complaint">Queixa Principal</Label>
                        {isEditing ? (
                          <Textarea
                            id="chief_complaint"
                            placeholder="Descreva a queixa principal..."
                            value={formData.chief_complaint}
                            onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                            maxLength={500}
                            rows={3}
                          />
                        ) : (
                          <p className="text-sm p-3 bg-muted/30 rounded-lg">
                            {formData.chief_complaint || 'Não informado'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Histórico Gestacional */}
                    {section.id === 'gestacional' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="gestational_history">Histórico da Gestação</Label>
                          {isEditing ? (
                            <Textarea
                              id="gestational_history"
                              placeholder="Pré-natal, intercorrências gestacionais..."
                              value={formData.gestational_history}
                              onChange={(e) => setFormData({ ...formData, gestational_history: e.target.value })}
                              maxLength={1000}
                              rows={3}
                            />
                          ) : (
                            <p className="text-sm p-3 bg-muted/30 rounded-lg">
                              {formData.gestational_history || 'Não informado'}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>IG ao Nascer (sem)</Label>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={20}
                                max={45}
                                placeholder="Ex: 39"
                                value={formData.gestational_age_weeks ?? ''}
                                onChange={(e) => setFormData({ 
                                  ...formData, 
                                  gestational_age_weeks: e.target.value ? Number(e.target.value) : null 
                                })}
                              />
                            ) : (
                              <p className="text-sm p-2 bg-muted/30 rounded">
                                {formData.gestational_age_weeks ? `${formData.gestational_age_weeks} sem` : '—'}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Tipo de Parto</Label>
                            {isEditing ? (
                              <Select
                                value={formData.delivery_type}
                                onValueChange={(v) => setFormData({ ...formData, delivery_type: v as AnamnesePediatriaData['delivery_type'] })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(DELIVERY_TYPES).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="text-sm p-2 bg-muted/30 rounded">
                                {formData.delivery_type ? DELIVERY_TYPES[formData.delivery_type] : '—'}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Peso ao Nascer (g)</Label>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={300}
                                max={7000}
                                placeholder="Ex: 3200"
                                value={formData.birth_weight_grams ?? ''}
                                onChange={(e) => setFormData({ 
                                  ...formData, 
                                  birth_weight_grams: e.target.value ? Number(e.target.value) : null 
                                })}
                              />
                            ) : (
                              <p className="text-sm p-2 bg-muted/30 rounded">
                                {formData.birth_weight_grams ? `${formData.birth_weight_grams}g` : '—'}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Comprimento (cm)</Label>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={20}
                                max={60}
                                step={0.1}
                                placeholder="Ex: 49"
                                value={formData.birth_length_cm ?? ''}
                                onChange={(e) => setFormData({ 
                                  ...formData, 
                                  birth_length_cm: e.target.value ? Number(e.target.value) : null 
                                })}
                              />
                            ) : (
                              <p className="text-sm p-2 bg-muted/30 rounded">
                                {formData.birth_length_cm ? `${formData.birth_length_cm}cm` : '—'}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Apgar 1º min</Label>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                placeholder="0-10"
                                value={formData.apgar_1min ?? ''}
                                onChange={(e) => setFormData({ 
                                  ...formData, 
                                  apgar_1min: e.target.value ? Number(e.target.value) : null 
                                })}
                              />
                            ) : (
                              <p className="text-sm p-2 bg-muted/30 rounded">
                                {formData.apgar_1min ?? '—'}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Apgar 5º min</Label>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                placeholder="0-10"
                                value={formData.apgar_5min ?? ''}
                                onChange={(e) => setFormData({ 
                                  ...formData, 
                                  apgar_5min: e.target.value ? Number(e.target.value) : null 
                                })}
                              />
                            ) : (
                              <p className="text-sm p-2 bg-muted/30 rounded">
                                {formData.apgar_5min ?? '—'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Período Neonatal */}
                    {section.id === 'neonatal' && (
                      <div className="space-y-2">
                        <Label htmlFor="neonatal_complications">Intercorrências Neonatais</Label>
                        {isEditing ? (
                          <Textarea
                            id="neonatal_complications"
                            placeholder="Icterícia, infecções, internações UTI neonatal..."
                            value={formData.neonatal_complications}
                            onChange={(e) => setFormData({ ...formData, neonatal_complications: e.target.value })}
                            maxLength={1000}
                            rows={3}
                          />
                        ) : (
                          <p className="text-sm p-3 bg-muted/30 rounded-lg">
                            {formData.neonatal_complications || 'Nenhuma intercorrência informada'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Histórico Familiar */}
                    {section.id === 'familiar' && (
                      <div className="space-y-2">
                        <Label htmlFor="family_history">Histórico Familiar</Label>
                        {isEditing ? (
                          <Textarea
                            id="family_history"
                            placeholder="Doenças hereditárias, condições crônicas na família..."
                            value={formData.family_history}
                            onChange={(e) => setFormData({ ...formData, family_history: e.target.value })}
                            maxLength={1000}
                            rows={3}
                          />
                        ) : (
                          <p className="text-sm p-3 bg-muted/30 rounded-lg">
                            {formData.family_history || 'Não informado'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Alergias */}
                    {section.id === 'alergias' && (
                      <div className="space-y-3">
                        {isEditing && (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Adicionar alergia..."
                              value={newAllergy}
                              onChange={(e) => setNewAllergy(e.target.value)}
                              maxLength={100}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                            />
                            <Button type="button" variant="outline" size="icon" onClick={addAllergy}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {formData.allergies.length > 0 ? (
                            formData.allergies.map((allergy, idx) => (
                              <Badge 
                                key={idx} 
                                variant="secondary" 
                                className="bg-destructive/10 text-destructive border-destructive/20"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {allergy}
                                {isEditing && (
                                  <button
                                    type="button"
                                    onClick={() => removeAllergy(allergy)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">Nenhuma alergia conhecida</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Medicamentos */}
                    {section.id === 'medicamentos' && (
                      <div className="space-y-3">
                        {isEditing && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              placeholder="Nome do medicamento"
                              value={newMedication.name}
                              onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                              maxLength={100}
                              className="flex-1"
                            />
                            <Input
                              placeholder="Dosagem"
                              value={newMedication.dosage}
                              onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                              maxLength={50}
                              className="w-24"
                            />
                            <Input
                              placeholder="Frequência"
                              value={newMedication.frequency}
                              onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                              maxLength={50}
                              className="w-28"
                            />
                            <Button type="button" variant="outline" size="icon" onClick={addMedication}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <div className="space-y-2">
                          {formData.current_medications.length > 0 ? (
                            formData.current_medications.map((med, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border"
                              >
                                <div className="flex items-center gap-2">
                                  <Pill className="h-4 w-4 text-primary" />
                                  <span className="font-medium">{med.name}</span>
                                  {med.dosage && (
                                    <Badge variant="outline" className="text-xs">{med.dosage}</Badge>
                                  )}
                                  {med.frequency && (
                                    <span className="text-xs text-muted-foreground">{med.frequency}</span>
                                  )}
                                </div>
                                {isEditing && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => removeMedication(idx)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">Nenhum medicamento em uso</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sono */}
                    {section.id === 'sono' && (
                      <div className="space-y-2">
                        <Label htmlFor="sleep_habits">Hábitos de Sono</Label>
                        {isEditing ? (
                          <Textarea
                            id="sleep_habits"
                            placeholder="Horários, qualidade do sono, despertares noturnos..."
                            value={formData.sleep_habits}
                            onChange={(e) => setFormData({ ...formData, sleep_habits: e.target.value })}
                            maxLength={500}
                            rows={2}
                          />
                        ) : (
                          <p className="text-sm p-3 bg-muted/30 rounded-lg">
                            {formData.sleep_habits || 'Não informado'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Alimentação */}
                    {section.id === 'alimentacao' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Tipo de Alimentação</Label>
                          {isEditing ? (
                            <Select
                              value={formData.feeding_type}
                              onValueChange={(v) => setFormData({ ...formData, feeding_type: v as AnamnesePediatriaData['feeding_type'] })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(FEEDING_TYPES).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm p-2 bg-muted/30 rounded">
                              {formData.feeding_type ? FEEDING_TYPES[formData.feeding_type] : '—'}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="current_feeding">Detalhes da Alimentação Atual</Label>
                          {isEditing ? (
                            <Textarea
                              id="current_feeding"
                              placeholder="Frequência das mamadas/refeições, aceitação alimentar..."
                              value={formData.current_feeding}
                              onChange={(e) => setFormData({ ...formData, current_feeding: e.target.value })}
                              maxLength={500}
                              rows={2}
                            />
                          ) : (
                            <p className="text-sm p-3 bg-muted/30 rounded-lg">
                              {formData.current_feeding || 'Não informado'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Desenvolvimento */}
                    {section.id === 'desenvolvimento' && (
                      <div className="space-y-2">
                        <Label htmlFor="development_notes">Observações sobre Desenvolvimento</Label>
                        {isEditing ? (
                          <Textarea
                            id="development_notes"
                            placeholder="Marcos alcançados, preocupações, avaliações anteriores..."
                            value={formData.development_notes}
                            onChange={(e) => setFormData({ ...formData, development_notes: e.target.value })}
                            maxLength={1000}
                            rows={3}
                          />
                        ) : (
                          <p className="text-sm p-3 bg-muted/30 rounded-lg">
                            {formData.development_notes || 'Não informado'}
                          </p>
                        )}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        {isEditing && isEditable && (
          <>
            <Separator className="my-4" />
            <div className="flex justify-end gap-2">
              {record && (
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancelar
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Anamnese'}
              </Button>
            </div>
          </>
        )}

        {/* Validation Errors */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-medium text-destructive">Corrija os erros:</p>
            <ul className="text-sm text-destructive list-disc list-inside mt-1">
              {Object.values(errors).map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AnamnesePediatriaBlock;
