import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Stethoscope,
  Heart,
  Thermometer,
  Wind,
  Activity,
  Droplets,
  Eye,
  Ear,
  CircleDot,
  ChevronDown,
  ChevronRight,
  Save,
  Edit2,
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { z } from 'zod';

// ===== VALIDATION SCHEMA =====
const avaliacaoClinicaSchema = z.object({
  // Sinais Vitais
  temperature_celsius: z.number().min(30).max(45).optional().nullable(),
  heart_rate_bpm: z.number().min(30).max(250).optional().nullable(),
  respiratory_rate_rpm: z.number().min(5).max(80).optional().nullable(),
  oxygen_saturation_percent: z.number().min(50).max(100).optional().nullable(),
  systolic_bp_mmhg: z.number().min(40).max(200).optional().nullable(),
  diastolic_bp_mmhg: z.number().min(20).max(150).optional().nullable(),
  capillary_refill_seconds: z.number().min(0).max(10).optional().nullable(),
  
  // Exame Físico Geral
  general_state: z.enum(['bom', 'regular', 'mau', '']).optional(),
  consciousness_level: z.enum(['alerta', 'sonolento', 'torporoso', 'comatoso', '']).optional(),
  hydration_status: z.enum(['hidratado', 'leve_desidratacao', 'moderada_desidratacao', 'grave_desidratacao', '']).optional(),
  skin_color: z.enum(['corado', 'palido', 'cianotico', 'icterico', '']).optional(),
  skin_turgor: z.enum(['normal', 'diminuido', '']).optional(),
  fontanelle: z.enum(['normotensa', 'abaulada', 'deprimida', 'fechada', '']).optional(),
  
  // Exame Segmentar
  head_neck_exam: z.string().max(500).optional(),
  thorax_exam: z.string().max(500).optional(),
  abdomen_exam: z.string().max(500).optional(),
  extremities_exam: z.string().max(500).optional(),
  neurological_exam: z.string().max(500).optional(),
  
  // Observações
  clinical_observations: z.string().max(1000).optional(),
});

// ===== TYPES =====
export type AvaliacaoClinicaPediatriaData = z.infer<typeof avaliacaoClinicaSchema>;

export interface AvaliacaoClinicaRecord {
  id: string;
  patient_id: string;
  appointment_id?: string;
  data: AvaliacaoClinicaPediatriaData;
  recorded_by: string;
  recorded_by_name?: string;
  recorded_at: string;
}

// ===== CONSTANTS =====
export const GENERAL_STATE_OPTIONS: Record<string, { label: string; color: string }> = {
  bom: { label: 'Bom Estado Geral', color: 'bg-primary/10 text-primary' },
  regular: { label: 'Regular Estado Geral', color: 'bg-warning/10 text-warning' },
  mau: { label: 'Mau Estado Geral', color: 'bg-destructive/10 text-destructive' },
};

export const CONSCIOUSNESS_OPTIONS: Record<string, string> = {
  alerta: 'Alerta',
  sonolento: 'Sonolento',
  torporoso: 'Torporoso',
  comatoso: 'Comatoso',
};

export const HYDRATION_OPTIONS: Record<string, { label: string; severity: string }> = {
  hidratado: { label: 'Hidratado', severity: 'normal' },
  leve_desidratacao: { label: 'Desidratação Leve', severity: 'warning' },
  moderada_desidratacao: { label: 'Desidratação Moderada', severity: 'warning' },
  grave_desidratacao: { label: 'Desidratação Grave', severity: 'critical' },
};

export const SKIN_COLOR_OPTIONS: Record<string, string> = {
  corado: 'Corado',
  palido: 'Pálido',
  cianotico: 'Cianótico',
  icterico: 'Ictérico',
};

export const SKIN_TURGOR_OPTIONS: Record<string, string> = {
  normal: 'Normal',
  diminuido: 'Diminuído',
};

export const FONTANELLE_OPTIONS: Record<string, string> = {
  normotensa: 'Normotensa',
  abaulada: 'Abaulada',
  deprimida: 'Deprimida',
  fechada: 'Fechada',
};

// Normal vital signs ranges by age (simplified)
const VITAL_SIGNS_RANGES = {
  heart_rate: { min: 60, max: 180, unit: 'bpm' },
  respiratory_rate: { min: 12, max: 60, unit: 'rpm' },
  temperature: { min: 36, max: 37.5, unit: '°C' },
  oxygen_saturation: { min: 95, max: 100, unit: '%' },
};

// ===== UTILITIES =====
function isVitalSignAbnormal(type: string, value?: number | null): 'normal' | 'warning' | 'critical' | null {
  if (value === undefined || value === null) return null;
  
  const ranges: Record<string, { min: number; max: number; criticalMin?: number; criticalMax?: number }> = {
    temperature_celsius: { min: 36, max: 37.5, criticalMin: 35, criticalMax: 39 },
    heart_rate_bpm: { min: 60, max: 160, criticalMin: 40, criticalMax: 200 },
    respiratory_rate_rpm: { min: 12, max: 40, criticalMin: 8, criticalMax: 60 },
    oxygen_saturation_percent: { min: 95, max: 100, criticalMin: 90 },
  };
  
  const range = ranges[type];
  if (!range) return null;
  
  if ((range.criticalMin && value < range.criticalMin) || (range.criticalMax && value > range.criticalMax)) {
    return 'critical';
  }
  if (value < range.min || value > range.max) {
    return 'warning';
  }
  return 'normal';
}

function getVitalSignStatusColor(status: 'normal' | 'warning' | 'critical' | null): string {
  switch (status) {
    case 'critical': return 'text-destructive';
    case 'warning': return 'text-warning';
    case 'normal': return 'text-primary';
    default: return 'text-muted-foreground';
  }
}

// ===== PROPS =====
interface AvaliacaoClinicaPediatriaBlockProps {
  patientId: string;
  appointmentId?: string;
  record?: AvaliacaoClinicaRecord;
  onSave?: (data: AvaliacaoClinicaPediatriaData) => Promise<void>;
  isEditable?: boolean;
  className?: string;
}

// ===== COMPONENT =====
export function AvaliacaoClinicaPediatriaBlock({
  patientId,
  appointmentId,
  record,
  onSave,
  isEditable = true,
  className,
}: AvaliacaoClinicaPediatriaBlockProps) {
  const [isEditing, setIsEditing] = useState(!record);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(
    record ? ['vitais'] : ['vitais', 'fisico', 'segmentar', 'observacoes']
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<AvaliacaoClinicaPediatriaData>({
    temperature_celsius: record?.data.temperature_celsius ?? null,
    heart_rate_bpm: record?.data.heart_rate_bpm ?? null,
    respiratory_rate_rpm: record?.data.respiratory_rate_rpm ?? null,
    oxygen_saturation_percent: record?.data.oxygen_saturation_percent ?? null,
    systolic_bp_mmhg: record?.data.systolic_bp_mmhg ?? null,
    diastolic_bp_mmhg: record?.data.diastolic_bp_mmhg ?? null,
    capillary_refill_seconds: record?.data.capillary_refill_seconds ?? null,
    general_state: record?.data.general_state || '',
    consciousness_level: record?.data.consciousness_level || '',
    hydration_status: record?.data.hydration_status || '',
    skin_color: record?.data.skin_color || '',
    skin_turgor: record?.data.skin_turgor || '',
    fontanelle: record?.data.fontanelle || '',
    head_neck_exam: record?.data.head_neck_exam || '',
    thorax_exam: record?.data.thorax_exam || '',
    abdomen_exam: record?.data.abdomen_exam || '',
    extremities_exam: record?.data.extremities_exam || '',
    neurological_exam: record?.data.neurological_exam || '',
    clinical_observations: record?.data.clinical_observations || '',
  });

  // Check for abnormal vitals
  const vitalAlerts = useMemo(() => {
    const alerts: { field: string; status: 'warning' | 'critical' }[] = [];
    
    const checks = [
      { field: 'temperature_celsius', value: formData.temperature_celsius },
      { field: 'heart_rate_bpm', value: formData.heart_rate_bpm },
      { field: 'respiratory_rate_rpm', value: formData.respiratory_rate_rpm },
      { field: 'oxygen_saturation_percent', value: formData.oxygen_saturation_percent },
    ];
    
    checks.forEach(({ field, value }) => {
      const status = isVitalSignAbnormal(field, value);
      if (status === 'warning' || status === 'critical') {
        alerts.push({ field, status });
      }
    });
    
    return alerts;
  }, [formData]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSave = async () => {
    if (!onSave) return;

    const result = avaliacaoClinicaSchema.safeParse(formData);
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

  const renderVitalCard = (
    icon: React.ReactNode,
    label: string,
    fieldName: keyof AvaliacaoClinicaPediatriaData,
    unit: string,
    min?: number,
    max?: number,
    step?: number
  ) => {
    const value = formData[fieldName] as number | null;
    const status = isVitalSignAbnormal(fieldName, value);
    const statusColor = getVitalSignStatusColor(status);

    return (
      <div className="p-3 rounded-lg border bg-card space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          <span>{label}</span>
          {status === 'critical' && <AlertTriangle className="h-3 w-3 text-destructive" />}
          {status === 'warning' && <AlertTriangle className="h-3 w-3 text-warning" />}
          {status === 'normal' && <CheckCircle2 className="h-3 w-3 text-primary" />}
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={min}
              max={max}
              step={step || 1}
              placeholder="—"
              value={value ?? ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                [fieldName]: e.target.value ? Number(e.target.value) : null 
              })}
              className="h-9"
            />
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
        ) : (
          <div className={`text-lg font-semibold ${statusColor}`}>
            {value !== null ? `${value} ${unit}` : '—'}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Avaliação Clínica</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {vitalAlerts.length > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {vitalAlerts.length} alerta(s)
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
            Registrado em {format(parseISO(record.recorded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {record.recorded_by_name && ` por ${record.recorded_by_name}`}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sinais Vitais */}
        <Collapsible open={expandedSections.includes('vitais')} onOpenChange={() => toggleSection('vitais')}>
          <CollapsibleTrigger asChild>
            <div className="cursor-pointer rounded-lg border p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <span className="font-medium">Sinais Vitais</span>
                </div>
                {expandedSections.includes('vitais') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {renderVitalCard(<Thermometer className="h-4 w-4" />, 'Temperatura', 'temperature_celsius', '°C', 30, 45, 0.1)}
              {renderVitalCard(<Heart className="h-4 w-4" />, 'FC', 'heart_rate_bpm', 'bpm', 30, 250)}
              {renderVitalCard(<Wind className="h-4 w-4" />, 'FR', 'respiratory_rate_rpm', 'rpm', 5, 80)}
              {renderVitalCard(<Droplets className="h-4 w-4" />, 'SpO2', 'oxygen_saturation_percent', '%', 50, 100)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border bg-card space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span>PA</span>
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={40}
                      max={200}
                      placeholder="Sis"
                      value={formData.systolic_bp_mmhg ?? ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        systolic_bp_mmhg: e.target.value ? Number(e.target.value) : null 
                      })}
                      className="h-9 w-16"
                    />
                    <span>/</span>
                    <Input
                      type="number"
                      min={20}
                      max={150}
                      placeholder="Dia"
                      value={formData.diastolic_bp_mmhg ?? ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        diastolic_bp_mmhg: e.target.value ? Number(e.target.value) : null 
                      })}
                      className="h-9 w-16"
                    />
                    <span className="text-sm text-muted-foreground">mmHg</span>
                  </div>
                ) : (
                  <div className="text-lg font-semibold">
                    {formData.systolic_bp_mmhg && formData.diastolic_bp_mmhg 
                      ? `${formData.systolic_bp_mmhg}/${formData.diastolic_bp_mmhg} mmHg` 
                      : '—'}
                  </div>
                )}
              </div>
              {renderVitalCard(<CircleDot className="h-4 w-4" />, 'TEC', 'capillary_refill_seconds', 's', 0, 10, 0.5)}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Exame Físico Geral */}
        <Collapsible open={expandedSections.includes('fisico')} onOpenChange={() => toggleSection('fisico')}>
          <CollapsibleTrigger asChild>
            <div className="cursor-pointer rounded-lg border p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="font-medium">Exame Físico Geral</span>
                </div>
                {expandedSections.includes('fisico') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Estado Geral</Label>
                {isEditing ? (
                  <Select
                    value={formData.general_state}
                    onValueChange={(v) => setFormData({ ...formData, general_state: v as AvaliacaoClinicaPediatriaData['general_state'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GENERAL_STATE_OPTIONS).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 rounded bg-muted/30">
                    {formData.general_state ? (
                      <Badge className={GENERAL_STATE_OPTIONS[formData.general_state]?.color}>
                        {GENERAL_STATE_OPTIONS[formData.general_state]?.label}
                      </Badge>
                    ) : '—'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nível de Consciência</Label>
                {isEditing ? (
                  <Select
                    value={formData.consciousness_level}
                    onValueChange={(v) => setFormData({ ...formData, consciousness_level: v as AvaliacaoClinicaPediatriaData['consciousness_level'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONSCIOUSNESS_OPTIONS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm p-2 bg-muted/30 rounded">
                    {formData.consciousness_level ? CONSCIOUSNESS_OPTIONS[formData.consciousness_level] : '—'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Hidratação</Label>
                {isEditing ? (
                  <Select
                    value={formData.hydration_status}
                    onValueChange={(v) => setFormData({ ...formData, hydration_status: v as AvaliacaoClinicaPediatriaData['hydration_status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(HYDRATION_OPTIONS).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm p-2 bg-muted/30 rounded">
                    {formData.hydration_status ? HYDRATION_OPTIONS[formData.hydration_status]?.label : '—'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Coloração da Pele</Label>
                {isEditing ? (
                  <Select
                    value={formData.skin_color}
                    onValueChange={(v) => setFormData({ ...formData, skin_color: v as AvaliacaoClinicaPediatriaData['skin_color'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SKIN_COLOR_OPTIONS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm p-2 bg-muted/30 rounded">
                    {formData.skin_color ? SKIN_COLOR_OPTIONS[formData.skin_color] : '—'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Turgor Cutâneo</Label>
                {isEditing ? (
                  <Select
                    value={formData.skin_turgor}
                    onValueChange={(v) => setFormData({ ...formData, skin_turgor: v as AvaliacaoClinicaPediatriaData['skin_turgor'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SKIN_TURGOR_OPTIONS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm p-2 bg-muted/30 rounded">
                    {formData.skin_turgor ? SKIN_TURGOR_OPTIONS[formData.skin_turgor] : '—'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Fontanela</Label>
                {isEditing ? (
                  <Select
                    value={formData.fontanelle}
                    onValueChange={(v) => setFormData({ ...formData, fontanelle: v as AvaliacaoClinicaPediatriaData['fontanelle'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FONTANELLE_OPTIONS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm p-2 bg-muted/30 rounded">
                    {formData.fontanelle ? FONTANELLE_OPTIONS[formData.fontanelle] : '—'}
                  </p>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Exame Segmentar */}
        <Collapsible open={expandedSections.includes('segmentar')} onOpenChange={() => toggleSection('segmentar')}>
          <CollapsibleTrigger asChild>
            <div className="cursor-pointer rounded-lg border p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ear className="h-4 w-4 text-primary" />
                  <span className="font-medium">Exame Segmentar</span>
                </div>
                {expandedSections.includes('segmentar') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            {[
              { key: 'head_neck_exam', label: 'Cabeça e Pescoço', placeholder: 'Orofaringe, otoscopia, linfonodos...' },
              { key: 'thorax_exam', label: 'Tórax', placeholder: 'Ausculta pulmonar e cardíaca...' },
              { key: 'abdomen_exam', label: 'Abdome', placeholder: 'Palpação, ruídos hidroaéreos...' },
              { key: 'extremities_exam', label: 'Extremidades', placeholder: 'Pulsos, perfusão, edema...' },
              { key: 'neurological_exam', label: 'Exame Neurológico', placeholder: 'Reflexos, tônus, força...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                {isEditing ? (
                  <Textarea
                    placeholder={placeholder}
                    value={(formData as Record<string, string>)[key] || ''}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    maxLength={500}
                    rows={2}
                  />
                ) : (
                  <p className="text-sm p-3 bg-muted/30 rounded-lg">
                    {(formData as Record<string, string>)[key] || 'Não examinado'}
                  </p>
                )}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Observações */}
        <Collapsible open={expandedSections.includes('observacoes')} onOpenChange={() => toggleSection('observacoes')}>
          <CollapsibleTrigger asChild>
            <div className="cursor-pointer rounded-lg border p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">Observações Clínicas</span>
                </div>
                {expandedSections.includes('observacoes') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="space-y-2">
              <Label>Observações Relevantes</Label>
              {isEditing ? (
                <Textarea
                  placeholder="Impressões clínicas, hipóteses diagnósticas, sinais de alerta..."
                  value={formData.clinical_observations}
                  onChange={(e) => setFormData({ ...formData, clinical_observations: e.target.value })}
                  maxLength={1000}
                  rows={4}
                />
              ) : (
                <p className="text-sm p-3 bg-muted/30 rounded-lg">
                  {formData.clinical_observations || 'Nenhuma observação registrada'}
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        {isEditing && isEditable && (
          <>
            <Separator />
            <div className="flex justify-end gap-2">
              {record && (
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancelar
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Avaliação'}
              </Button>
            </div>
          </>
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

export default AvaliacaoClinicaPediatriaBlock;
