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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  Syringe,
  Plus,
  X,
  Save,
  Edit2,
  Clock,
  CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  Calendar as CalendarDays,
  Shield,
  FileText
} from 'lucide-react';
import { format, parseISO, addMonths, isBefore, isAfter, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { z } from 'zod';

// ===== VALIDATION SCHEMA =====
const vacinaAplicadaSchema = z.object({
  id: z.string(),
  vaccine_id: z.string(),
  vaccine_name: z.string().min(1).max(100),
  dose_number: z.number().min(1).max(10),
  dose_label: z.string().max(20).optional(),
  applied_at: z.string(),
  batch_number: z.string().max(50).optional(),
  manufacturer: z.string().max(100).optional(),
  application_site: z.string().max(50).optional(),
  next_dose_at: z.string().optional(),
  notes: z.string().max(500).optional(),
  registered_by: z.string().optional(),
});

const vacinacaoPediatriaSchema = z.object({
  applied_vaccines: z.array(vacinaAplicadaSchema).max(100),
  observations: z.string().max(1000).optional(),
});

// ===== TYPES =====
export interface VacinaAplicada {
  id: string;
  vaccine_id: string;
  vaccine_name: string;
  dose_number: number;
  dose_label?: string;
  applied_at: string;
  batch_number?: string;
  manufacturer?: string;
  application_site?: string;
  next_dose_at?: string;
  notes?: string;
  registered_by?: string;
}

export type VacinacaoPediatriaData = z.infer<typeof vacinacaoPediatriaSchema>;

export interface VacinacaoPediatriaRecord {
  id: string;
  patient_id: string;
  data: VacinacaoPediatriaData;
  updated_by: string;
  updated_by_name?: string;
  updated_at: string;
}

// Vaccine status for summary
export interface VaccineStatusSummary {
  total_expected: number;
  total_applied: number;
  pending: number;
  overdue: number;
  up_to_date: boolean;
}

// ===== CONSTANTS =====
export interface VaccineDefinition {
  id: string;
  name: string;
  doses: { number: number; label: string; age_months: number }[];
  mandatory: boolean;
}

export const PEDIATRIC_VACCINE_CALENDAR: VaccineDefinition[] = [
  {
    id: 'bcg',
    name: 'BCG',
    doses: [{ number: 1, label: 'Dose única', age_months: 0 }],
    mandatory: true,
  },
  {
    id: 'hepatite_b',
    name: 'Hepatite B',
    doses: [
      { number: 1, label: '1ª dose', age_months: 0 },
      { number: 2, label: '2ª dose', age_months: 2 },
      { number: 3, label: '3ª dose', age_months: 6 },
    ],
    mandatory: true,
  },
  {
    id: 'pentavalente',
    name: 'Pentavalente (DTP+Hib+HB)',
    doses: [
      { number: 1, label: '1ª dose', age_months: 2 },
      { number: 2, label: '2ª dose', age_months: 4 },
      { number: 3, label: '3ª dose', age_months: 6 },
    ],
    mandatory: true,
  },
  {
    id: 'vip',
    name: 'VIP/VOP (Poliomielite)',
    doses: [
      { number: 1, label: '1ª dose (VIP)', age_months: 2 },
      { number: 2, label: '2ª dose (VIP)', age_months: 4 },
      { number: 3, label: '3ª dose (VIP)', age_months: 6 },
      { number: 4, label: 'Reforço (VOP)', age_months: 15 },
      { number: 5, label: 'Reforço (VOP)', age_months: 48 },
    ],
    mandatory: true,
  },
  {
    id: 'rotavirus',
    name: 'Rotavírus',
    doses: [
      { number: 1, label: '1ª dose', age_months: 2 },
      { number: 2, label: '2ª dose', age_months: 4 },
    ],
    mandatory: true,
  },
  {
    id: 'pneumo10',
    name: 'Pneumocócica 10-valente',
    doses: [
      { number: 1, label: '1ª dose', age_months: 2 },
      { number: 2, label: '2ª dose', age_months: 4 },
      { number: 3, label: 'Reforço', age_months: 12 },
    ],
    mandatory: true,
  },
  {
    id: 'meningo_c',
    name: 'Meningocócica C',
    doses: [
      { number: 1, label: '1ª dose', age_months: 3 },
      { number: 2, label: '2ª dose', age_months: 5 },
      { number: 3, label: 'Reforço', age_months: 12 },
    ],
    mandatory: true,
  },
  {
    id: 'febre_amarela',
    name: 'Febre Amarela',
    doses: [
      { number: 1, label: '1ª dose', age_months: 9 },
      { number: 2, label: 'Reforço', age_months: 48 },
    ],
    mandatory: true,
  },
  {
    id: 'triplice_viral',
    name: 'Tríplice Viral (SCR)',
    doses: [
      { number: 1, label: '1ª dose', age_months: 12 },
      { number: 2, label: '2ª dose', age_months: 15 },
    ],
    mandatory: true,
  },
  {
    id: 'hepatite_a',
    name: 'Hepatite A',
    doses: [{ number: 1, label: 'Dose única', age_months: 15 }],
    mandatory: true,
  },
  {
    id: 'dtp',
    name: 'DTP (Tríplice Bacteriana)',
    doses: [
      { number: 1, label: '1º Reforço', age_months: 15 },
      { number: 2, label: '2º Reforço', age_months: 48 },
    ],
    mandatory: true,
  },
  {
    id: 'varicela',
    name: 'Varicela',
    doses: [
      { number: 1, label: '1ª dose', age_months: 15 },
      { number: 2, label: '2ª dose', age_months: 48 },
    ],
    mandatory: true,
  },
  {
    id: 'hpv',
    name: 'HPV',
    doses: [
      { number: 1, label: '1ª dose', age_months: 108 },
      { number: 2, label: '2ª dose', age_months: 114 },
    ],
    mandatory: true,
  },
  {
    id: 'meningo_acwy',
    name: 'Meningocócica ACWY',
    doses: [{ number: 1, label: 'Dose única', age_months: 132 }],
    mandatory: true,
  },
];

export const APPLICATION_SITES = [
  { value: 'deltoid_d', label: 'Deltóide Direito' },
  { value: 'deltoid_e', label: 'Deltóide Esquerdo' },
  { value: 'vasto_lateral_d', label: 'Vasto Lateral Direito' },
  { value: 'vasto_lateral_e', label: 'Vasto Lateral Esquerdo' },
  { value: 'gluteo_d', label: 'Glúteo Direito' },
  { value: 'gluteo_e', label: 'Glúteo Esquerdo' },
  { value: 'oral', label: 'Via Oral' },
];

// ===== UTILITIES =====
export function calculateVaccineStatus(
  appliedVaccines: VacinaAplicada[],
  patientAgeMonths: number
): VaccineStatusSummary {
  let totalExpected = 0;
  let totalApplied = 0;
  let overdue = 0;

  PEDIATRIC_VACCINE_CALENDAR.forEach(vaccine => {
    vaccine.doses.forEach(dose => {
      if (dose.age_months <= patientAgeMonths) {
        totalExpected++;
        const applied = appliedVaccines.find(
          v => v.vaccine_id === vaccine.id && v.dose_number === dose.number
        );
        if (applied) {
          totalApplied++;
        } else {
          overdue++;
        }
      }
    });
  });

  return {
    total_expected: totalExpected,
    total_applied: totalApplied,
    pending: totalExpected - totalApplied,
    overdue,
    up_to_date: overdue === 0,
  };
}

function formatAgeLabel(months: number): string {
  if (months === 0) return 'Ao nascer';
  if (months < 12) return `${months} meses`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} ano${years > 1 ? 's' : ''}`;
  return `${years} ano${years > 1 ? 's' : ''} e ${remainingMonths} meses`;
}

// ===== PROPS =====
interface VacinacaoPediatriaBlockProps {
  patientId: string;
  patientAgeMonths: number;
  record?: VacinacaoPediatriaRecord;
  onSave?: (data: VacinacaoPediatriaData) => Promise<void>;
  isEditable?: boolean;
  className?: string;
}

// ===== COMPONENT =====
export function VacinacaoPediatriaBlock({
  patientId,
  patientAgeMonths,
  record,
  onSave,
  isEditable = true,
  className,
}: VacinacaoPediatriaBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'calendario' | 'registro'>('calendario');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const [formData, setFormData] = useState<VacinacaoPediatriaData>({
    applied_vaccines: record?.data.applied_vaccines || [],
    observations: record?.data.observations || '',
  });

  const [newVaccine, setNewVaccine] = useState<Omit<VacinaAplicada, 'id'>>({
    vaccine_id: '',
    vaccine_name: '',
    dose_number: 1,
    dose_label: '',
    applied_at: format(new Date(), 'yyyy-MM-dd'),
    batch_number: '',
    manufacturer: '',
    application_site: '',
    next_dose_at: '',
    notes: '',
  });

  // Calculate status
  const vaccineStatus = useMemo(() => 
    calculateVaccineStatus(formData.applied_vaccines as VacinaAplicada[], patientAgeMonths),
    [formData.applied_vaccines, patientAgeMonths]
  );

  // Group vaccines by calendar
  const vaccineCalendarWithStatus = useMemo(() => {
    return PEDIATRIC_VACCINE_CALENDAR.map(vaccine => {
      const dosesWithStatus = vaccine.doses.map(dose => {
        const applied = formData.applied_vaccines.find(
          v => v.vaccine_id === vaccine.id && v.dose_number === dose.number
        );
        const isExpected = dose.age_months <= patientAgeMonths;
        const isOverdue = isExpected && !applied;
        
        return {
          ...dose,
          applied,
          isExpected,
          isOverdue,
        };
      });
      
      return {
        ...vaccine,
        doses: dosesWithStatus,
      };
    });
  }, [formData.applied_vaccines, patientAgeMonths]);

  const handleSelectVaccine = (vaccineId: string, doseNumber: number) => {
    const vaccine = PEDIATRIC_VACCINE_CALENDAR.find(v => v.id === vaccineId);
    const dose = vaccine?.doses.find(d => d.number === doseNumber);
    
    if (vaccine && dose) {
      setNewVaccine(prev => ({
        ...prev,
        vaccine_id: vaccineId,
        vaccine_name: vaccine.name,
        dose_number: doseNumber,
        dose_label: dose.label,
      }));
      setShowAddForm(true);
    }
  };

  const handleAddVaccine = () => {
    if (!newVaccine.vaccine_id || !newVaccine.applied_at) return;

    const vaccine: VacinaAplicada = {
      id: crypto.randomUUID(),
      vaccine_id: newVaccine.vaccine_id,
      vaccine_name: newVaccine.vaccine_name,
      dose_number: newVaccine.dose_number,
      dose_label: newVaccine.dose_label,
      applied_at: newVaccine.applied_at,
      batch_number: newVaccine.batch_number || undefined,
      manufacturer: newVaccine.manufacturer || undefined,
      application_site: newVaccine.application_site || undefined,
      next_dose_at: newVaccine.next_dose_at || undefined,
      notes: newVaccine.notes || undefined,
    };

    setFormData(prev => ({
      ...prev,
      applied_vaccines: [...prev.applied_vaccines, vaccine],
    }));

    setNewVaccine({
      vaccine_id: '',
      vaccine_name: '',
      dose_number: 1,
      dose_label: '',
      applied_at: format(new Date(), 'yyyy-MM-dd'),
      batch_number: '',
      manufacturer: '',
      application_site: '',
      next_dose_at: '',
      notes: '',
    });
    setShowAddForm(false);
  };

  const handleRemoveVaccine = (id: string) => {
    setFormData(prev => ({
      ...prev,
      applied_vaccines: prev.applied_vaccines.filter(v => v.id !== id),
    }));
  };

  const handleSave = async () => {
    if (!onSave) return;

    const result = vacinacaoPediatriaSchema.safeParse(formData);
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

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Cartão de Vacinação</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {vaccineStatus.up_to_date ? (
              <Badge className="bg-primary/10 text-primary">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Em dia
              </Badge>
            ) : (
              <Badge variant="outline" className="border-destructive/50 text-destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {vaccineStatus.overdue} pendente(s)
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
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 text-center">
            <div className="text-2xl font-bold text-primary">{vaccineStatus.total_applied}</div>
            <div className="text-xs text-muted-foreground">Aplicadas</div>
          </div>
          <div className="p-3 rounded-lg bg-muted text-center">
            <div className="text-2xl font-bold">{vaccineStatus.total_expected}</div>
            <div className="text-xs text-muted-foreground">Esperadas</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${vaccineStatus.overdue > 0 ? 'bg-destructive/10' : 'bg-primary/5'}`}>
            <div className={`text-2xl font-bold ${vaccineStatus.overdue > 0 ? 'text-destructive' : 'text-primary'}`}>
              {vaccineStatus.overdue}
            </div>
            <div className="text-xs text-muted-foreground">Em atraso</div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendario" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendário
            </TabsTrigger>
            <TabsTrigger value="registro" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Registro
            </TabsTrigger>
          </TabsList>

          {/* CALENDÁRIO TAB */}
          <TabsContent value="calendario" className="mt-4">
            <ScrollArea className="h-[350px]">
              <div className="space-y-3 pr-4">
                {vaccineCalendarWithStatus.map((vaccine) => (
                  <div key={vaccine.id} className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium">{vaccine.name}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {vaccine.doses.map((dose) => (
                        <div 
                          key={`${vaccine.id}-${dose.number}`}
                          className={cn(
                            "p-2 rounded border text-sm",
                            dose.applied 
                              ? "bg-primary/10 border-primary/30" 
                              : dose.isOverdue
                                ? "bg-destructive/10 border-destructive/30"
                                : "bg-muted/30"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                {dose.applied ? (
                                  <CheckCircle2 className="h-3 w-3 text-primary" />
                                ) : dose.isOverdue ? (
                                  <AlertTriangle className="h-3 w-3 text-destructive" />
                                ) : (
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                )}
                                {dose.label}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatAgeLabel(dose.age_months)}
                              </div>
                            </div>
                            {isEditing && !dose.applied && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7"
                                onClick={() => handleSelectVaccine(vaccine.id, dose.number)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          {dose.applied && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {format(parseISO(dose.applied.applied_at), 'dd/MM/yyyy', { locale: ptBR })}
                              {dose.applied.batch_number && ` • Lote: ${dose.applied.batch_number}`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* REGISTRO TAB */}
          <TabsContent value="registro" className="mt-4">
            <ScrollArea className="h-[350px]">
              <div className="space-y-2 pr-4">
                {formData.applied_vaccines
                  .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
                  .map((vaccine) => (
                    <div 
                      key={vaccine.id}
                      className="flex items-start justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium">{vaccine.vaccine_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {vaccine.dose_label} • {format(parseISO(vaccine.applied_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {vaccine.batch_number && (
                              <Badge variant="outline" className="text-xs">
                                Lote: {vaccine.batch_number}
                              </Badge>
                            )}
                            {vaccine.manufacturer && (
                              <Badge variant="outline" className="text-xs">
                                {vaccine.manufacturer}
                              </Badge>
                            )}
                          </div>
                          {vaccine.next_dose_at && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Próxima dose: {format(parseISO(vaccine.next_dose_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          )}
                          {vaccine.notes && (
                            <p className="text-sm text-muted-foreground italic mt-1">{vaccine.notes}</p>
                          )}
                        </div>
                      </div>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleRemoveVaccine(vaccine.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                {formData.applied_vaccines.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Syringe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma vacina registrada</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Add Vaccine Form */}
        {showAddForm && isEditing && (
          <div className="space-y-4 p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Registrar Vacina: {newVaccine.vaccine_name} - {newVaccine.dose_label}
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Aplicação *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        if (date) {
                          setNewVaccine({ ...newVaccine, applied_at: format(date, 'yyyy-MM-dd') });
                        }
                      }}
                      disabled={(date) => isAfter(date, new Date())}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Lote</Label>
                <Input
                  placeholder="Número do lote"
                  value={newVaccine.batch_number}
                  onChange={(e) => setNewVaccine({ ...newVaccine, batch_number: e.target.value })}
                  maxLength={50}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fabricante</Label>
                <Input
                  placeholder="Nome do fabricante"
                  value={newVaccine.manufacturer}
                  onChange={(e) => setNewVaccine({ ...newVaccine, manufacturer: e.target.value })}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Local de Aplicação</Label>
                <Select
                  value={newVaccine.application_site}
                  onValueChange={(v) => setNewVaccine({ ...newVaccine, application_site: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLICATION_SITES.map((site) => (
                      <SelectItem key={site.value} value={site.value}>{site.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data da Próxima Dose (se aplicável)</Label>
              <Input
                type="date"
                value={newVaccine.next_dose_at}
                onChange={(e) => setNewVaccine({ ...newVaccine, next_dose_at: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Reações, intercorrências..."
                value={newVaccine.notes}
                onChange={(e) => setNewVaccine({ ...newVaccine, notes: e.target.value })}
                maxLength={500}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddVaccine}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Registrar
              </Button>
            </div>
          </div>
        )}

        {/* Observations */}
        {(isEditing || formData.observations) && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Observações Gerais
            </Label>
            {isEditing ? (
              <Textarea
                placeholder="Reações adversas, contraindicações, observações..."
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                maxLength={1000}
                rows={2}
              />
            ) : (
              <p className="text-sm p-3 bg-muted/30 rounded-lg">
                {formData.observations}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {isEditing && isEditable && (
          <>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Cartão'}
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

export default VacinacaoPediatriaBlock;
