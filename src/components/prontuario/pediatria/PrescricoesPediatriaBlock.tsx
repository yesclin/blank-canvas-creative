import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Pill,
  Plus,
  X,
  Save,
  Edit2,
  Clock,
  Calculator,
  FileText,
  Printer,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Weight,
  Baby
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { z } from 'zod';

// ===== VALIDATION SCHEMA =====
const prescricaoItemSchema = z.object({
  id: z.string(),
  medication_name: z.string().min(1, 'Nome obrigatório').max(200),
  presentation: z.string().max(100).optional(),
  dose_per_kg: z.number().min(0).optional().nullable(),
  patient_weight_kg: z.number().min(0).optional().nullable(),
  calculated_dose: z.string().max(100).optional(),
  manual_dose: z.string().max(100).optional(),
  frequency: z.string().max(50),
  duration_days: z.number().min(1).max(365).optional().nullable(),
  duration_text: z.string().max(50).optional(),
  route: z.string().max(30),
  instructions: z.string().max(500).optional(),
  is_continuous: z.boolean(),
  is_controlled: z.boolean(),
  prescribed_at: z.string(),
});

const prescricaoPediatriaSchema = z.object({
  prescriptions: z.array(prescricaoItemSchema).max(30),
  general_instructions: z.string().max(1000).optional(),
  patient_weight_kg: z.number().min(0).max(200).optional().nullable(),
});

// ===== TYPES =====
export interface PrescricaoItem {
  id: string;
  medication_name: string;
  presentation?: string;
  dose_per_kg?: number | null;
  patient_weight_kg?: number | null;
  calculated_dose?: string;
  manual_dose?: string;
  frequency: string;
  duration_days?: number | null;
  duration_text?: string;
  route: string;
  instructions?: string;
  is_continuous: boolean;
  is_controlled: boolean;
  prescribed_at: string;
}

export type PrescricaoPediatriaData = z.infer<typeof prescricaoPediatriaSchema>;

export interface PrescricaoPediatriaRecord {
  id: string;
  patient_id: string;
  appointment_id?: string;
  data: PrescricaoPediatriaData;
  prescribed_by: string;
  prescribed_by_name?: string;
  prescribed_at: string;
  digital_signature_id?: string;
  status: 'draft' | 'signed' | 'printed';
}

// ===== CONSTANTS =====
export const FREQUENCY_OPTIONS = [
  { value: '1x/dia', label: '1x ao dia' },
  { value: '2x/dia', label: '2x ao dia (12/12h)' },
  { value: '3x/dia', label: '3x ao dia (8/8h)' },
  { value: '4x/dia', label: '4x ao dia (6/6h)' },
  { value: '6x/dia', label: '6x ao dia (4/4h)' },
  { value: 'SOS', label: 'Se necessário (SOS)' },
  { value: 'dose_unica', label: 'Dose única' },
];

export const ROUTE_OPTIONS = [
  { value: 'VO', label: 'Via Oral (VO)' },
  { value: 'Tópico', label: 'Tópico' },
  { value: 'Nasal', label: 'Nasal' },
  { value: 'Oftálmico', label: 'Oftálmico' },
  { value: 'Otológico', label: 'Otológico' },
  { value: 'Retal', label: 'Retal' },
  { value: 'Inalatório', label: 'Inalatório' },
  { value: 'IM', label: 'Intramuscular (IM)' },
  { value: 'SC', label: 'Subcutânea (SC)' },
  { value: 'IV', label: 'Intravenosa (IV)' },
];

export const COMMON_PEDIATRIC_MEDICATIONS: { name: string; presentation: string; dose_per_kg?: number; unit?: string }[] = [
  { name: 'Amoxicilina', presentation: 'Suspensão 250mg/5mL', dose_per_kg: 50, unit: 'mg/kg/dia' },
  { name: 'Azitromicina', presentation: 'Suspensão 200mg/5mL', dose_per_kg: 10, unit: 'mg/kg/dia' },
  { name: 'Ibuprofeno', presentation: 'Gotas 50mg/mL', dose_per_kg: 10, unit: 'mg/kg/dose' },
  { name: 'Paracetamol', presentation: 'Gotas 200mg/mL', dose_per_kg: 15, unit: 'mg/kg/dose' },
  { name: 'Dipirona', presentation: 'Gotas 500mg/mL', dose_per_kg: 25, unit: 'mg/kg/dose' },
  { name: 'Prednisolona', presentation: 'Solução 3mg/mL', dose_per_kg: 1, unit: 'mg/kg/dia' },
  { name: 'Salbutamol', presentation: 'Aerossol 100mcg/dose' },
  { name: 'Loratadina', presentation: 'Xarope 1mg/mL' },
  { name: 'Sulfato Ferroso', presentation: 'Gotas 125mg/mL', dose_per_kg: 3, unit: 'mg/kg/dia' },
  { name: 'Vitamina D', presentation: 'Gotas 200UI/gota' },
];

// ===== UTILITIES =====
function calculateDose(dosePerKg: number, weightKg: number, unit: string = 'mg'): string {
  const totalDose = dosePerKg * weightKg;
  return `${totalDose.toFixed(1)} ${unit}`;
}

// ===== PROPS =====
interface PrescricoesPediatriaBlockProps {
  patientId: string;
  appointmentId?: string;
  patientWeight?: number;
  record?: PrescricaoPediatriaRecord;
  onSave?: (data: PrescricaoPediatriaData) => Promise<void>;
  onPrint?: (record: PrescricaoPediatriaRecord) => void;
  onSign?: (record: PrescricaoPediatriaRecord) => Promise<void>;
  isEditable?: boolean;
  className?: string;
}

// ===== COMPONENT =====
export function PrescricoesPediatriaBlock({
  patientId,
  appointmentId,
  patientWeight,
  record,
  onSave,
  onPrint,
  onSign,
  isEditable = true,
  className,
}: PrescricoesPediatriaBlockProps) {
  const [isEditing, setIsEditing] = useState(!record || record.data.prescriptions.length === 0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMedSuggestions, setShowMedSuggestions] = useState(false);
  const [medSearch, setMedSearch] = useState('');

  const [formData, setFormData] = useState<PrescricaoPediatriaData>({
    prescriptions: record?.data.prescriptions || [],
    general_instructions: record?.data.general_instructions || '',
    patient_weight_kg: record?.data.patient_weight_kg ?? patientWeight ?? null,
  });

  const [newPrescription, setNewPrescription] = useState<Omit<PrescricaoItem, 'id' | 'prescribed_at'>>({
    medication_name: '',
    presentation: '',
    dose_per_kg: null,
    patient_weight_kg: formData.patient_weight_kg,
    calculated_dose: '',
    manual_dose: '',
    frequency: '',
    duration_days: null,
    duration_text: '',
    route: 'VO',
    instructions: '',
    is_continuous: false,
    is_controlled: false,
  });

  const filteredMedSuggestions = COMMON_PEDIATRIC_MEDICATIONS.filter(
    med => med.name.toLowerCase().includes(medSearch.toLowerCase())
  ).slice(0, 5);

  // Auto-calculate dose when weight or dose_per_kg changes
  const calculatedDoseDisplay = useMemo(() => {
    if (newPrescription.dose_per_kg && formData.patient_weight_kg) {
      return calculateDose(newPrescription.dose_per_kg, formData.patient_weight_kg);
    }
    return '';
  }, [newPrescription.dose_per_kg, formData.patient_weight_kg]);

  const handleSelectMedication = (med: typeof COMMON_PEDIATRIC_MEDICATIONS[0]) => {
    setNewPrescription(prev => ({
      ...prev,
      medication_name: med.name,
      presentation: med.presentation,
      dose_per_kg: med.dose_per_kg ?? null,
    }));
    setMedSearch(med.name);
    setShowMedSuggestions(false);
  };

  const handleAddPrescription = () => {
    if (!newPrescription.medication_name.trim() || !newPrescription.frequency) return;

    const prescription: PrescricaoItem = {
      id: crypto.randomUUID(),
      medication_name: newPrescription.medication_name.trim(),
      presentation: newPrescription.presentation?.trim() || undefined,
      dose_per_kg: newPrescription.dose_per_kg,
      patient_weight_kg: formData.patient_weight_kg,
      calculated_dose: calculatedDoseDisplay || undefined,
      manual_dose: newPrescription.manual_dose?.trim() || undefined,
      frequency: newPrescription.frequency,
      duration_days: newPrescription.duration_days,
      duration_text: newPrescription.duration_text?.trim() || undefined,
      route: newPrescription.route,
      instructions: newPrescription.instructions?.trim() || undefined,
      is_continuous: newPrescription.is_continuous,
      is_controlled: newPrescription.is_controlled,
      prescribed_at: new Date().toISOString(),
    };

    setFormData(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, prescription],
    }));

    setNewPrescription({
      medication_name: '',
      presentation: '',
      dose_per_kg: null,
      patient_weight_kg: formData.patient_weight_kg,
      calculated_dose: '',
      manual_dose: '',
      frequency: '',
      duration_days: null,
      duration_text: '',
      route: 'VO',
      instructions: '',
      is_continuous: false,
      is_controlled: false,
    });
    setMedSearch('');
  };

  const handleRemovePrescription = (id: string) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter(p => p.id !== id),
    }));
  };

  const handleSave = async () => {
    if (!onSave) return;

    const result = prescricaoPediatriaSchema.safeParse(formData);
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

  const handleCopyToClipboard = () => {
    const text = formData.prescriptions.map((p, idx) => {
      let line = `${idx + 1}. ${p.medication_name}`;
      if (p.presentation) line += ` (${p.presentation})`;
      line += `\n   ${p.calculated_dose || p.manual_dose || ''} - ${p.frequency} - ${p.route}`;
      if (p.duration_days) line += ` - ${p.duration_days} dias`;
      if (p.instructions) line += `\n   ${p.instructions}`;
      return line;
    }).join('\n\n');

    navigator.clipboard.writeText(text);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Prescrições</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {record?.status === 'signed' && (
              <Badge className="bg-primary/10 text-primary">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Assinada
              </Badge>
            )}
            {formData.prescriptions.length > 0 && (
              <Badge variant="outline">
                {formData.prescriptions.length} item(s)
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
            Prescrito em {format(parseISO(record.prescribed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {record.prescribed_by_name && ` por ${record.prescribed_by_name}`}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Patient Weight */}
        {isEditing && (
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border">
            <Weight className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <Label htmlFor="patient_weight" className="text-sm">Peso do Paciente (para cálculo de dose)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="patient_weight"
                  type="number"
                  step="0.1"
                  min={0}
                  max={200}
                  placeholder="Ex: 12.5"
                  value={formData.patient_weight_kg ?? ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    patient_weight_kg: e.target.value ? Number(e.target.value) : null 
                  })}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">kg</span>
              </div>
            </div>
            {formData.patient_weight_kg && (
              <Badge variant="secondary" className="shrink-0">
                <Calculator className="h-3 w-3 mr-1" />
                Dose automática ativa
              </Badge>
            )}
          </div>
        )}

        {/* Prescriptions List */}
        {formData.prescriptions.length > 0 && (
          <ScrollArea className={formData.prescriptions.length > 3 ? 'h-[280px]' : ''}>
            <div className="space-y-3 pr-2">
              {formData.prescriptions.map((prescription, idx) => (
                <div 
                  key={prescription.id}
                  className={`p-4 rounded-lg border ${prescription.is_controlled ? 'border-destructive/30 bg-destructive/5' : 'bg-card'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-muted-foreground">{idx + 1}.</span>
                        <span className="font-semibold">{prescription.medication_name}</span>
                        {prescription.presentation && (
                          <span className="text-sm text-muted-foreground">({prescription.presentation})</span>
                        )}
                        {prescription.is_controlled && (
                          <Badge variant="outline" className="border-destructive/50 text-destructive text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Controlado
                          </Badge>
                        )}
                        {prescription.is_continuous && (
                          <Badge variant="outline" className="text-xs">
                            Uso contínuo
                          </Badge>
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-3 text-sm flex-wrap">
                          <Badge variant="secondary">
                            {prescription.calculated_dose || prescription.manual_dose || 'Dose não especificada'}
                          </Badge>
                          <span className="text-muted-foreground">•</span>
                          <span>{prescription.frequency}</span>
                          <span className="text-muted-foreground">•</span>
                          <span>{prescription.route}</span>
                          {prescription.duration_days && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span>{prescription.duration_days} dias</span>
                            </>
                          )}
                        </div>

                        {prescription.instructions && (
                          <p className="text-sm text-muted-foreground italic mt-2">
                            📋 {prescription.instructions}
                          </p>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleRemovePrescription(prescription.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Empty State */}
        {formData.prescriptions.length === 0 && !isEditing && (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma prescrição registrada</p>
          </div>
        )}

        {/* Add New Prescription Form */}
        {isEditing && (
          <div className="space-y-4 p-4 rounded-lg border-2 border-dashed border-muted-foreground/30">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Medicamento
            </h4>

            <div className="grid gap-4">
              {/* Medication Name */}
              <div className="space-y-2 relative">
                <Label>Medicamento *</Label>
                <Input
                  placeholder="Digite o nome do medicamento..."
                  value={medSearch}
                  onChange={(e) => {
                    setMedSearch(e.target.value);
                    setNewPrescription({ ...newPrescription, medication_name: e.target.value });
                    setShowMedSuggestions(true);
                  }}
                  onFocus={() => setShowMedSuggestions(true)}
                  maxLength={200}
                />
                {showMedSuggestions && medSearch && filteredMedSuggestions.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-popover border rounded-lg shadow-lg max-h-48 overflow-auto">
                    {filteredMedSuggestions.map((med) => (
                      <button
                        key={med.name}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                        onClick={() => handleSelectMedication(med)}
                      >
                        <span className="font-medium">{med.name}</span>
                        <span className="text-muted-foreground ml-2">{med.presentation}</span>
                        {med.dose_per_kg && (
                          <Badge variant="outline" className="ml-2 text-xs">{med.dose_per_kg} {med.unit}</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Presentation */}
              <div className="space-y-2">
                <Label>Apresentação</Label>
                <Input
                  placeholder="Ex: Suspensão 250mg/5mL"
                  value={newPrescription.presentation}
                  onChange={(e) => setNewPrescription({ ...newPrescription, presentation: e.target.value })}
                  maxLength={100}
                />
              </div>

              {/* Dose Calculation */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Dose/kg</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      placeholder="Ex: 50"
                      value={newPrescription.dose_per_kg ?? ''}
                      onChange={(e) => setNewPrescription({ 
                        ...newPrescription, 
                        dose_per_kg: e.target.value ? Number(e.target.value) : null 
                      })}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">mg/kg</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dose Calculada</Label>
                  <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm">
                    {calculatedDoseDisplay || (
                      <span className="text-muted-foreground">Informe peso e dose/kg</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dose Manual</Label>
                  <Input
                    placeholder="Ex: 5mL, 1 comp"
                    value={newPrescription.manual_dose}
                    onChange={(e) => setNewPrescription({ ...newPrescription, manual_dose: e.target.value })}
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Frequency, Route, Duration */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Frequência *</Label>
                  <Select
                    value={newPrescription.frequency}
                    onValueChange={(v) => setNewPrescription({ ...newPrescription, frequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Via *</Label>
                  <Select
                    value={newPrescription.route}
                    onValueChange={(v) => setNewPrescription({ ...newPrescription, route: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUTE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duração (dias)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    placeholder="Ex: 7"
                    value={newPrescription.duration_days ?? ''}
                    onChange={(e) => setNewPrescription({ 
                      ...newPrescription, 
                      duration_days: e.target.value ? Number(e.target.value) : null 
                    })}
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <Label>Orientações aos Responsáveis</Label>
                <Textarea
                  placeholder="Ex: Administrar após as refeições. Manter refrigerado após aberto."
                  value={newPrescription.instructions}
                  onChange={(e) => setNewPrescription({ ...newPrescription, instructions: e.target.value })}
                  maxLength={500}
                  rows={2}
                />
              </div>

              {/* Flags */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_continuous"
                    checked={newPrescription.is_continuous}
                    onCheckedChange={(checked) => setNewPrescription({ ...newPrescription, is_continuous: checked })}
                  />
                  <Label htmlFor="is_continuous" className="text-sm cursor-pointer">
                    Uso contínuo
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_controlled"
                    checked={newPrescription.is_controlled}
                    onCheckedChange={(checked) => setNewPrescription({ ...newPrescription, is_controlled: checked })}
                  />
                  <Label htmlFor="is_controlled" className="text-sm cursor-pointer">
                    Medicamento controlado
                  </Label>
                </div>
              </div>

              <Button 
                type="button" 
                onClick={handleAddPrescription}
                disabled={!newPrescription.medication_name.trim() || !newPrescription.frequency}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar à Prescrição
              </Button>
            </div>
          </div>
        )}

        {/* General Instructions */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Orientações Gerais
          </Label>
          {isEditing ? (
            <Textarea
              placeholder="Orientações gerais para os responsáveis, cuidados especiais, sinais de alerta..."
              value={formData.general_instructions}
              onChange={(e) => setFormData({ ...formData, general_instructions: e.target.value })}
              maxLength={1000}
              rows={3}
            />
          ) : (
            <p className="text-sm p-3 bg-muted/30 rounded-lg">
              {formData.general_instructions || 'Nenhuma orientação adicional'}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <Separator />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {formData.prescriptions.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
                {onPrint && record && (
                  <Button variant="outline" size="sm" onClick={() => onPrint(record)}>
                    <Printer className="h-4 w-4 mr-1" />
                    Imprimir
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing && isEditable && (
              <>
                {record && record.data.prescriptions.length > 0 && (
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                    Cancelar
                  </Button>
                )}
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Prescrição'}
                </Button>
              </>
            )}
            {!isEditing && onSign && record && record.status !== 'signed' && (
              <Button onClick={() => onSign(record)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Assinar Digitalmente
              </Button>
            )}
          </div>
        </div>

        {/* Digital Prescription Ready Notice */}
        {formData.prescriptions.length > 0 && !isEditing && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" />
            <p className="text-sm text-primary">
              Prescrição pronta para integração com receita digital
            </p>
          </div>
        )}

        {Object.keys(errors).length > 0 && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
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

export default PrescricoesPediatriaBlock;
