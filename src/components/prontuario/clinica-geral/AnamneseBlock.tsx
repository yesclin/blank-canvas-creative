import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { AnamnesisTemplateBuilderDialog } from "@/components/configuracoes/AnamnesisTemplateBuilderDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FileText,
  Edit3,
  Save,
  X,
  ArrowLeft,
  Clock,
  History,
  AlertTriangle,
  Stethoscope,
  ChevronRight,
  Lock,
  Settings,
  Check,
  CheckCircle2,
  Calculator,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  calculateIMC,
  mapStructuredToLegacy,
  type SecaoAnamnese,
} from "@/hooks/prontuario/clinica-geral/anamneseTemplates";
import { useAnamnesisTemplatesV2, useAnamnesisRecords, type AnamnesisTemplateV2, type AnamnesisRecord } from "@/hooks/useAnamnesisTemplatesV2";
import { useInstitutionalPdf } from "@/hooks/useInstitutionalPdf";
import { useConsolidatedFillerPdf } from "@/hooks/aesthetics/useConsolidatedFillerPdf";
import { FileDown, Printer, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────

export interface AnamneseData {
  id: string;
  patient_id: string;
  version: number;
  queixa_principal: string;
  historia_doenca_atual: string;
  antecedentes_pessoais: string;
  antecedentes_familiares: string;
  habitos_vida: string;
  medicamentos_uso_continuo: string;
  alergias: string;
  comorbidades: string;
  historia_ginecologica?: string;
  revisao_sistemas?: string;
  structured_data?: Record<string, unknown>;
  template_id?: string;
  created_at: string;
  created_by: string;
  created_by_name?: string;
  is_current: boolean;
}

interface AnamneseBlockProps {
  currentAnamnese: AnamneseData | null;
  anamneseHistory: AnamneseData[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onSave: (data: Omit<AnamneseData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
  onUpdate?: (id: string, data: Omit<AnamneseData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
  patientName?: string;
  patientCpf?: string;
  patientData?: any;
  specialtyId?: string | null;
  specialtyName?: string | null;
  specialtyKey?: string | null;
  appointmentId?: string | null;
  professionalName?: string | null;
  professionalRegistration?: string | null;
}

// ─── Multi-select badge component ────────────────────────────────────

function MultiSelectField({
  options, value, onChange, readOnly
}: { options: string[]; value: string[]; onChange: (v: string[]) => void; readOnly?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const selected = value.includes(opt);
        return (
          <Badge
            key={opt}
            variant={selected ? 'default' : 'outline'}
            className={!readOnly ? 'cursor-pointer transition-colors' : ''}
            onClick={() => {
              if (readOnly) return;
              onChange(selected ? value.filter(v => v !== opt) : [...value, opt]);
            }}
          >
            {selected ? '✓ ' : ''}{opt}
          </Badge>
        );
      })}
    </div>
  );
}

// ─── Unified template type ───────────────────────────────────────

interface UnifiedTemplate {
  id: string;
  nome: string;
  descricao: string;
  icon: string;
  is_system: boolean;
  secoes: SecaoAnamnese[];
}

// Fields that duplicate patient/appointment data and must be excluded
const IDENTIFICATION_FIELD_IDS = new Set([
  'f_nome', 'f_idade', 'f_data_atendimento', 'f_profissional', 'f_sexo',
]);

const IDENTIFICATION_SECTION_IDS = new Set([
  'section_identificacao', 'identificacao', 'identificacao_complementar',
]);

const SPECIALTY_SLUG_BY_NAME: Record<string, string> = {
  'clínica geral': 'geral',
  'clinica geral': 'geral',
  'psicologia': 'psicologia',
  'nutrição': 'nutricao',
  'nutricao': 'nutricao',
  'fisioterapia': 'fisioterapia',
  'pilates': 'pilates',
  'estética / harmonização facial': 'estetica',
  'estetica / harmonizacao facial': 'estetica',
  'estética': 'estetica',
  'estetica': 'estetica',
  'odontologia': 'odontologia',
  'dermatologia': 'dermatologia',
  'pediatria': 'pediatria',
};

function resolveSpecialtySlug(name?: string | null) {
  const normalized = name?.trim().toLowerCase();
  return (normalized && SPECIALTY_SLUG_BY_NAME[normalized]) || 'geral';
}

function v2TemplateToUnified(t: AnamnesisTemplateV2): UnifiedTemplate {
  return {
    id: t.id,
    nome: t.name,
    descricao: t.description || '',
    icon: t.icon || 'Stethoscope',
    is_system: t.is_system,
    secoes: t.structure
      .map(section => {
        const filteredFields = (section.fields || []).filter(f => !IDENTIFICATION_FIELD_IDS.has(f.id));
        return {
          id: section.id,
          titulo: section.title,
          icon: 'Stethoscope',
          campos: filteredFields.map(f => ({
            id: f.id,
            label: f.label,
            type: f.type as any,
            placeholder: f.placeholder,
            options: f.options,
            required: f.required,
            section: section.title,
          })),
        };
      })
      .filter(s => s.campos.length > 0 || !IDENTIFICATION_SECTION_IDS.has(s.id))
      .filter(s => s.campos.length > 0),
  };
}

// ─── Main component ──────────────────────────────────────────────────

export function AnamneseBlock({
  currentAnamnese,
  anamneseHistory,
  loading = false,
  saving = false,
  canEdit = false,
  onSave,
  onUpdate,
  patientName,
  patientCpf,
  patientData,
  specialtyId,
  specialtyName,
  specialtyKey,
  appointmentId,
  professionalName,
  professionalRegistration,
}: AnamneseBlockProps) {
  const navigate = useNavigate();
  const { generateAnamnesisPdf, generating } = useInstitutionalPdf();
  const { generateConsolidatedPdf, exporting: exportingConsolidated } = useConsolidatedFillerPdf();

  const isEstetica = specialtyKey === 'estetica';

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<AnamneseData | null>(null);
  const [structuredData, setStructuredData] = useState<Record<string, unknown>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingV2Template, setEditingV2Template] = useState<AnamnesisTemplateV2 | null>(null);
  const [creatingDefault, setCreatingDefault] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Auto-save refs
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedData = useRef<string>('');
  const editingInitialData = useRef<string>('{}');

  // ─── Fetch clinic templates from DB (V2) ──────────────────────────
  const { templates: v2Templates, isLoading: loadingTemplates } = useAnamnesisTemplatesV2({
    specialtyId: specialtyId,
    activeOnly: true
  });

  // ─── V2 Records: ALL records for this patient (no appointment filter) ──
  const patientIdForRecords = patientData?.id || currentAnamnese?.patient_id || null;
  const { records: v2Records, saveRecord: saveV2Record, isSaving: savingV2 } = useAnamnesisRecords(patientIdForRecords, null, specialtyId);

  useEffect(() => {
    console.log('[YesClin][AnamneseBlock] receivedSpecialty', {
      specialtyId,
      specialtyName,
      patientIdForRecords,
      appointmentId,
    });
  }, [specialtyId, specialtyName, patientIdForRecords, appointmentId]);

  const allTemplates: UnifiedTemplate[] = useMemo(() => {
    return v2Templates.map(v2TemplateToUnified);
  }, [v2Templates]);

  useEffect(() => {
    console.log('[YesClin][AnamneseBlock] resolvedTemplatesAndRecords', {
      specialtyId,
      specialtyName,
      templateIds: v2Templates.map((template) => ({
        id: template.id,
        name: template.name,
        specialty_id: template.specialty_id,
      })),
      recordIds: v2Records.map((record) => ({
        id: record.id,
        template_id: record.template_id,
      })),
    });
  }, [specialtyId, specialtyName, v2Templates, v2Records]);

  const activeTemplate = useMemo(() => {
    if (!allTemplates.length) return null;
    if (selectedTemplateId) {
      const found = allTemplates.find(t => t.id === selectedTemplateId);
      if (found) return found;
    }
    const defaultTpl = allTemplates.find(t => allTemplates.length === 1 || t.is_system);
    return defaultTpl || allTemplates[0];
  }, [allTemplates, selectedTemplateId]);

  useEffect(() => {
    if (activeTemplate && !selectedTemplateId) {
      setSelectedTemplateId(activeTemplate.id);
    }
  }, [activeTemplate, selectedTemplateId]);

  // ─── Selected record from records list ────────────────────────────
  const selectedRecord = useMemo(() => {
    if (!v2Records.length) return null;
    if (selectedRecordId) {
      return v2Records.find(r => r.id === selectedRecordId) || v2Records[0];
    }
    return v2Records[0];
  }, [v2Records, selectedRecordId]);

  // Backward compat alias
  const existingV2Record = selectedRecord;

  // Auto-select first record when records load
  useEffect(() => {
    if (v2Records.length > 0 && !selectedRecordId) {
      setSelectedRecordId(v2Records[0].id);
    }
  }, [v2Records, selectedRecordId]);

  // Load selected record data into view (when not editing)
  useEffect(() => {
    if (!isEditing && selectedRecord) {
      const responses = selectedRecord.responses as Record<string, unknown>;
      if (responses && Object.keys(responses).length > 0) {
        setStructuredData(responses);
      }
      if (selectedRecord.template_id) {
        setSelectedTemplateId(selectedRecord.template_id);
      }
    }
  }, [selectedRecord, isEditing]);

  // ─── Auto-save (10s debounce, silent) ───────────────────────────────
  useEffect(() => {
    if (!isEditing) return;
    const currentDataStr = JSON.stringify(structuredData);
    if (currentDataStr === lastSavedData.current || currentDataStr === '{}') return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      lastSavedData.current = currentDataStr;
      setLastAutoSave(new Date());
    }, 10000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [structuredData, isEditing]);

  // ─── IMC calculation ────────────────────────────────────────────
  const imcResult = useMemo(() => {
    const peso = structuredData.peso_kg as number | null;
    const altura = structuredData.altura_cm as number | null;
    return calculateIMC(peso ?? null, altura ?? null);
  }, [structuredData.peso_kg, structuredData.altura_cm]);

  // ─── Check if form has data ─────────────────────────────────────
  const hasFilledData = useCallback(() => {
    return Object.values(structuredData).some(v => {
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && v !== '';
    });
  }, [structuredData]);

  const hasUnsavedChanges = useCallback(() => {
    return JSON.stringify(structuredData) !== editingInitialData.current;
  }, [structuredData]);

  // ─── Template switch handler ────────────────────────────────────
  const handleTemplateSwitch = useCallback((newTemplateId: string) => {
    if (newTemplateId === selectedTemplateId) return;
    if (hasFilledData()) {
      setPendingTemplateId(newTemplateId);
      setShowSwitchConfirm(true);
    } else {
      setSelectedTemplateId(newTemplateId);
      setStructuredData({});
    }
  }, [selectedTemplateId, hasFilledData]);

  const confirmTemplateSwitch = useCallback(() => {
    if (pendingTemplateId) {
      setSelectedTemplateId(pendingTemplateId);
      setStructuredData({});
      setPendingTemplateId(null);
    }
    setShowSwitchConfirm(false);
  }, [pendingTemplateId]);

  // ─── Open template editor ──────────────────────────────────────
  const handleOpenTemplateEditor = useCallback(() => {
    if (!activeTemplate || activeTemplate.is_system) {
      setEditingV2Template(null);
    } else {
      const v2Tpl = v2Templates.find(t => t.id === activeTemplate.id);
      setEditingV2Template(v2Tpl || null);
    }
    setShowTemplateEditor(true);
  }, [activeTemplate, v2Templates]);

  // ─── Create default template (IDEMPOTENT) ─────────────────────
  const { clinic } = useClinicData();

  const handleCreateDefaultTemplate = useCallback(async () => {
    if (!specialtyId || !clinic?.id || creatingDefault) return;
    setCreatingDefault(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { data: existing, error: fetchErr } = await supabase
        .from('anamnesis_templates')
        .select('id, current_version_id, is_active, is_default')
        .eq('clinic_id', clinic.id)
        .eq('specialty_id', specialtyId)
        .eq('archived', false)
        .limit(1)
        .maybeSingle();

      if (fetchErr) {
        console.error('Erro ao verificar modelo existente:', fetchErr);
        throw fetchErr;
      }

      if (existing) {
        if (!existing.is_active || !existing.is_default) {
          await supabase
            .from('anamnesis_templates')
            .update({ is_active: true, is_default: true } as any)
            .eq('id', existing.id);
        }

        if (!existing.current_version_id) {
          const { error: provisionError } = await supabase.rpc('provision_specialty', {
            _clinic_id: clinic.id,
            _specialty_slug: resolveSpecialtySlug(specialtyName),
          });

          if (provisionError) throw provisionError;
        }

        window.location.reload();
        return;
      }
      const { error: provisionError } = await supabase.rpc('provision_specialty', {
        _clinic_id: clinic.id,
        _specialty_slug: resolveSpecialtySlug(specialtyName),
      });

      if (provisionError) throw provisionError;

      window.location.reload();
    } catch (err: any) {
      console.error('Erro ao criar modelo padrão:', err);
      toast.error(`Erro ao criar modelo: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setCreatingDefault(false);
    }
  }, [specialtyId, specialtyName, clinic?.id, creatingDefault]);

  // ─── Auto-provision default template if none exist ──────────────
  const autoProvisionTriggered = useRef(false);
  useEffect(() => {
    if (
      !loadingTemplates &&
      allTemplates.length === 0 &&
      specialtyId &&
      clinic?.id &&
      !creatingDefault &&
      !autoProvisionTriggered.current
    ) {
      autoProvisionTriggered.current = true;
      handleCreateDefaultTemplate();
    }
  }, [loadingTemplates, allTemplates.length, specialtyId, clinic?.id, creatingDefault, handleCreateDefaultTemplate]);

  // ─── Handlers ───────────────────────────────────────────────────

  const handleSelectRecord = useCallback((recordId: string) => {
    setSelectedRecordId(recordId);
    setIsEditing(false);
    setIsEditingExisting(false);
    setIsCreatingNew(false);
  }, []);

  const handleStartNewAnamnese = useCallback(() => {
    const nextData = {};
    editingInitialData.current = JSON.stringify(nextData);
    setStructuredData(nextData);
    setIsCreatingNew(true);
    setIsEditingExisting(false);
    setIsEditing(true);
    setLastAutoSave(null);
  }, []);

  const handleStartEdit = () => {
    let nextData: Record<string, unknown> = {};

    if (selectedRecord?.template_id) {
      setSelectedTemplateId(selectedRecord.template_id);
    }

    // Priority: selected V2 record > legacy structured_data > legacy flat fields
    if (selectedRecord && Object.keys(selectedRecord.responses).length > 0) {
      nextData = { ...selectedRecord.responses as Record<string, unknown> };
    } else if (currentAnamnese?.structured_data && Object.keys(currentAnamnese.structured_data).length > 0) {
      nextData = { ...currentAnamnese.structured_data };
    } else if (currentAnamnese) {
      nextData = {
        qp_descricao: currentAnamnese.queixa_principal || '',
        hda_evolucao: currentAnamnese.historia_doenca_atual || '',
        hpp_doencas_obs: currentAnamnese.antecedentes_pessoais || '',
        hf_detalhes: currentAnamnese.antecedentes_familiares || '',
        med_lista: currentAnamnese.medicamentos_uso_continuo || '',
        alergias_medicamentosas: currentAnamnese.alergias || '',
        hab_alimentacao: currentAnamnese.habitos_vida || '',
      };
    }

    editingInitialData.current = JSON.stringify(nextData);
    setStructuredData(nextData);
    setLastAutoSave(null);
    setIsEditingExisting(true);
    setIsCreatingNew(false);
    setIsEditing(true);
  };

  const handleStartNewVersion = () => {
    let nextData: Record<string, unknown> = {};

    // Copy data from selected record but create a new one
    if (selectedRecord) {
      if (selectedRecord.template_id) setSelectedTemplateId(selectedRecord.template_id);
      if (Object.keys(selectedRecord.responses).length > 0) {
        nextData = { ...selectedRecord.responses as Record<string, unknown> };
      }
    } else if (currentAnamnese?.structured_data && Object.keys(currentAnamnese.structured_data).length > 0) {
      nextData = { ...currentAnamnese.structured_data };
    } else if (currentAnamnese) {
      nextData = {
        qp_descricao: currentAnamnese.queixa_principal || '',
        hda_evolucao: currentAnamnese.historia_doenca_atual || '',
        hpp_doencas_obs: currentAnamnese.antecedentes_pessoais || '',
        hf_detalhes: currentAnamnese.antecedentes_familiares || '',
        med_lista: currentAnamnese.medicamentos_uso_continuo || '',
        alergias_medicamentosas: currentAnamnese.alergias || '',
        hab_alimentacao: currentAnamnese.habitos_vida || '',
      };
    }

    editingInitialData.current = JSON.stringify(nextData);
    setStructuredData(nextData);
    setLastAutoSave(null);
    setIsEditingExisting(false);
    setIsCreatingNew(false);
    setIsEditing(true);
  };

  const handleCancel = () => {
    editingInitialData.current = '{}';
    setIsEditing(false);
    setIsEditingExisting(false);
    setIsCreatingNew(false);
    setStructuredData({});
    setLastAutoSave(null);
  };

  const handleBackClick = () => {
    if (hasUnsavedChanges()) {
      setShowDiscardConfirm(true);
    } else {
      handleCancel();
    }
  };

  const [isSavingLocal, setIsSavingLocal] = useState(false);

  const handleSave = async () => {
    if (isSavingLocal) return;
    setIsSavingLocal(true);

    try {
      if (activeTemplate && patientIdForRecords) {
        const v2Template = v2Templates.find(t => t.id === activeTemplate.id);
        await saveV2Record({
          // Only pass id when editing existing — new anamnese and new version create fresh records
          id: isEditingExisting ? existingV2Record?.id : undefined,
          patient_id: patientIdForRecords,
          template_id: activeTemplate.id,
          template_version_id: v2Template?.current_version_id || '',
          responses: structuredData,
          specialty_id: specialtyId,
          appointment_id: appointmentId || undefined,
        });
      } else {
        // Fallback to legacy save
        const legacy = mapStructuredToLegacy(structuredData);
        const saveData = {
          queixa_principal: legacy.queixa_principal || '',
          historia_doenca_atual: legacy.historia_doenca_atual || '',
          antecedentes_pessoais: legacy.antecedentes_pessoais || '',
          antecedentes_familiares: legacy.antecedentes_familiares || '',
          habitos_vida: legacy.habitos_vida || '',
          medicamentos_uso_continuo: legacy.medicamentos_uso_continuo || '',
          alergias: legacy.alergias || '',
          comorbidades: currentAnamnese?.comorbidades || '',
          structured_data: structuredData,
          template_id: activeTemplate?.id || '',
        };

        if (isEditingExisting && currentAnamnese && onUpdate) {
          await onUpdate(currentAnamnese.id, saveData);
        } else {
          await onSave(saveData);
        }
      }

      setIsEditing(false);
      setIsEditingExisting(false);
      setIsCreatingNew(false);
      editingInitialData.current = '{}';
      setStructuredData({});
      setLastAutoSave(null);
    } catch (err) {
      console.error('handleSave error:', err);
    } finally {
      setIsSavingLocal(false);
    }
  };

  const updateField = (fieldId: string, value: unknown) => {
    setStructuredData(prev => ({ ...prev, [fieldId]: value }));
  };

  // ─── Field renderer ─────────────────────────────────────────────
  const renderField = (campo: { id: string; label: string; type: string; placeholder?: string; options?: string[]; required?: boolean }) => {
    const value = structuredData[campo.id];

    switch (campo.type) {
      case 'text':
        return (
          <Input
            value={(value as string) || ''}
            onChange={e => updateField(campo.id, e.target.value)}
            placeholder={campo.placeholder}
            className="bg-background"
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={(value as string) || ''}
            onChange={e => updateField(campo.id, e.target.value)}
            placeholder={campo.placeholder}
            rows={campo.required ? 5 : 3}
            className="bg-background resize-none text-sm leading-relaxed"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={(value as number) ?? ''}
            onChange={e => updateField(campo.id, e.target.value ? parseFloat(e.target.value) : null)}
            placeholder={campo.placeholder}
            className="bg-background"
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={(value as string) || ''}
            onChange={e => updateField(campo.id, e.target.value)}
            className="bg-background"
          />
        );
      case 'select':
        return (
          <Select value={(value as string) || ''} onValueChange={v => updateField(campo.id, v)}>
            <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent className="bg-background z-50">
              {campo.options?.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'radio':
        return (
          <RadioGroup value={(value as string) || ''} onValueChange={v => updateField(campo.id, v)} className="flex flex-wrap gap-4">
            {campo.options?.map(opt => (
              <div key={opt} className="flex items-center space-x-2">
                <RadioGroupItem value={opt} id={`${campo.id}-${opt}`} />
                <Label htmlFor={`${campo.id}-${opt}`} className="text-sm font-normal">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'multiselect':
        return (
          <MultiSelectField
            options={campo.options || []}
            value={(value as string[]) || []}
            onChange={v => updateField(campo.id, v)}
          />
        );
      default:
        return (
          <Input
            value={(value as string) || ''}
            onChange={e => updateField(campo.id, e.target.value)}
            placeholder={campo.placeholder}
            className="bg-background"
          />
        );
    }
  };

  // ─── Render section in view mode ────────────────────────────────
  const renderViewSection = (secao: SecaoAnamnese, data: Record<string, unknown>) => {
    const filledFields = secao.campos.filter(c => {
      const v = data[c.id];
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && v !== '';
    });
    if (filledFields.length === 0) return null;

    return (
      <div key={secao.id} className="space-y-3 p-5">
        <h4 className="font-semibold text-sm text-foreground">{secao.titulo}</h4>
        <div className="grid gap-3">
          {filledFields.map(campo => {
            const val = data[campo.id];
            const display = Array.isArray(val) ? val.join(', ') : String(val);
            return (
              <div key={campo.id}>
                <Label className="text-xs text-muted-foreground">{campo.label}</Label>
                <p className="text-sm whitespace-pre-wrap mt-0.5">{display}</p>
              </div>
            );
          })}
          {secao.id === 'dados_antropometricos' && data.peso_kg && data.altura_cm && (() => {
            const imc = calculateIMC(data.peso_kg as number, data.altura_cm as number);
            if (!imc) return null;
            return (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">IMC: {imc.value} — {imc.classification}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  // ─── Legacy view ─────────────────────────────────────────────────
  const renderLegacyView = (anamnese: AnamneseData) => {
    const sections = [
      { key: 'queixa_principal', label: 'Queixa Principal', value: anamnese.queixa_principal },
      { key: 'historia_doenca_atual', label: 'HDA', value: anamnese.historia_doenca_atual },
      { key: 'antecedentes_pessoais', label: 'Antecedentes Pessoais', value: anamnese.antecedentes_pessoais },
      { key: 'antecedentes_familiares', label: 'Antecedentes Familiares', value: anamnese.antecedentes_familiares },
      { key: 'habitos_vida', label: 'Hábitos de Vida', value: anamnese.habitos_vida },
      { key: 'medicamentos', label: 'Medicamentos', value: anamnese.medicamentos_uso_continuo },
      { key: 'alergias', label: 'Alergias', value: anamnese.alergias },
      { key: 'comorbidades', label: 'Comorbidades', value: anamnese.comorbidades },
    ].filter(s => s.value);

    return (
      <div className="divide-y">
        {sections.map(s => (
          <div key={s.key} className="p-5">
            <h4 className="font-semibold text-sm mb-1.5">{s.label}</h4>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">{s.value}</p>
          </div>
        ))}
      </div>
    );
  };

  // Resolve the template for the selected record (must be before early returns)
  const viewTemplate = useMemo(() => {
    if (selectedRecord?.template_id) {
      return allTemplates.find(t => t.id === selectedRecord.template_id) || activeTemplate;
    }
    return activeTemplate;
  }, [selectedRecord, allTemplates, activeTemplate]);

  // ─── Loading ────────────────────────────────────────────────────
  if (loading || loadingTemplates) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // ─── No templates exist ─────────────────────────────────────────
  if (allTemplates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-10 text-center">
          <Stethoscope className="h-10 w-10 mx-auto mb-4 text-primary animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">
            {creatingDefault ? 'Criando modelo padrão...' : 'Preparando modelo de anamnese...'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            O modelo padrão será configurado automaticamente para esta especialidade.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Template exists but no structure ───────────────────────────
  if (activeTemplate && activeTemplate.secoes.length === 0 && !currentAnamnese && v2Records.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-10 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-semibold mb-2">
            Este modelo não possui estrutura configurada.
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            O modelo "{activeTemplate.nome}" não possui campos definidos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={() => specialtyId && navigate(`/app/config/prontuario?especialidade_id=${specialtyId}&tipo=anamnese`)}>
              <Settings className="h-4 w-4 mr-2" />
              Editar modelo
            </Button>
            <Button variant="outline" onClick={handleCreateDefaultTemplate} disabled={creatingDefault}>
              <Stethoscope className="h-4 w-4 mr-2" />
              {creatingDefault ? 'Criando...' : 'Criar modelo padrão'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Template selector (compact) ────────────────────────────────
  const renderTemplateSelector = () => (
    <div className="flex items-center gap-2">
      <Select value={selectedTemplateId || ''} onValueChange={handleTemplateSwitch}>
        <SelectTrigger className="bg-background h-8 text-xs w-64">
          <div className="flex items-center gap-1.5 truncate">
            <SelectValue placeholder="Selecionar modelo..." />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          {allTemplates.map(t => (
            <SelectItem key={t.id} value={t.id}>
              <div className="flex items-center gap-2">
                <span className="truncate">{t.nome}</span>
                {t.is_system && <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" size="sm" onClick={handleOpenTemplateEditor} className="h-8 px-2">
        <Settings className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  // ─── Switch confirmation dialog ─────────────────────────────────
  const renderSwitchConfirmDialog = () => (
    <AlertDialog open={showSwitchConfirm} onOpenChange={setShowSwitchConfirm}>
      <AlertDialogContent className="bg-background">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Trocar modelo de anamnese?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Trocar o modelo irá apagar os dados atuais preenchidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingTemplateId(null)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmTemplateSwitch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Trocar modelo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ─── Records list ─────────────────────────────────────────────────
  const renderRecordsList = () => {
    if (v2Records.length === 0) return null;
    return (
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Registros de Anamnese ({v2Records.length})
          </h3>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={handleStartNewAnamnese}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nova Anamnese
            </Button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {v2Records.map((record) => (
            <div
              key={record.id}
              onClick={() => handleSelectRecord(record.id)}
              className={cn(
                "flex-shrink-0 p-3 rounded-lg border cursor-pointer transition-all min-w-[200px] max-w-[280px]",
                "hover:bg-muted/50 hover:shadow-sm",
                record.id === selectedRecordId
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border"
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
                <span className="text-xs font-medium truncate">
                  {record.template_name || 'Anamnese'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {format(parseISO(record.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
              </div>
              {record.version_number && (
                <Badge variant="outline" className="text-[9px] mt-1 px-1 py-0">
                  v{record.version_number}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Empty state ────────────────────────────────────────────────
  if (!currentAnamnese && !existingV2Record && v2Records.length === 0 && !isEditing) {
    return (
      <>
        {renderSwitchConfirmDialog()}
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-3">Nenhuma anamnese registrada</h3>
            <div className="flex flex-col items-center gap-3 mb-4">
              {renderTemplateSelector()}
            </div>
            {canEdit && activeTemplate && (
              <Button onClick={handleStartNewAnamnese}>
                <Edit3 className="h-4 w-4 mr-2" />
                Registrar Anamnese
              </Button>
            )}
          </CardContent>
        </Card>
        <AnamnesisTemplateBuilderDialog
          open={showTemplateEditor}
          onOpenChange={setShowTemplateEditor}
          template={editingV2Template}
        />
      </>
    );
  }

  // ─── EDITING MODE — Premium single-page layout ──────────────────
  if (isEditing) {
    const sections = activeTemplate?.secoes || [];
    const blockIcons: Record<string, React.ReactNode> = {
      'motivo_consulta': <Stethoscope className="h-4 w-4" />,
      'section_queixa_principal': <Stethoscope className="h-4 w-4" />,
      'queixa_principal': <Stethoscope className="h-4 w-4" />,
      'section_hda': <Clock className="h-4 w-4" />,
      'historia_atual': <Clock className="h-4 w-4" />,
      'historia_doenca_atual': <Clock className="h-4 w-4" />,
      'section_antecedentes_pessoais': <FileText className="h-4 w-4" />,
      'section_medicamentos_alergias': <FileText className="h-4 w-4" />,
      'section_historico_familiar': <FileText className="h-4 w-4" />,
      'section_habitos': <FileText className="h-4 w-4" />,
      'contexto_clinico': <FileText className="h-4 w-4" />,
      'section_exame_fisico': <Stethoscope className="h-4 w-4" />,
      'section_hipoteses': <CheckCircle2 className="h-4 w-4" />,
      'section_conduta': <CheckCircle2 className="h-4 w-4" />,
      'impressao_conduta': <CheckCircle2 className="h-4 w-4" />,
      'plano_conduta': <CheckCircle2 className="h-4 w-4" />,
    };

    const isCompactSection = (secao: SecaoAnamnese) => {
      const selectFields = secao.campos.filter(c => c.type === 'select' || c.type === 'radio');
      return selectFields.length >= 3;
    };

    return (
      <>
        {renderSwitchConfirmDialog()}
        <div className="space-y-6">
          {/* Minimal header */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 shrink-0 px-0"
                onClick={handleBackClick}
                disabled={isSavingLocal || savingV2}
                aria-label="Voltar para a lista de anamneses"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex min-w-0 flex-wrap items-center gap-2 md:gap-3">
                <h3 className="font-semibold text-base tracking-tight">
                  {isCreatingNew ? 'Nova Anamnese' : isEditingExisting ? 'Editar Anamnese' : 'Nova Versão'}
                </h3>
                <Badge variant="outline" className="text-xs font-medium">
                  Rascunho
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
              {lastAutoSave && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                  <Check className="h-3 w-3" />
                  {format(lastAutoSave, "HH:mm")}
                </span>
              )}
              {(isCreatingNew || allTemplates.length > 1) && renderTemplateSelector()}
            </div>
          </div>

          {/* Discard changes confirmation */}
          <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
            <AlertDialogContent className="bg-background">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Deseja sair sem salvar?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  As alterações não salvas serão perdidas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continuar editando</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Sair sem salvar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Premium blocks */}
          <div className="space-y-8">
            {sections.map((secao) => {
              const compact = isCompactSection(secao);
              const textareaFields = secao.campos.filter(c => c.type === 'textarea');
              const otherFields = secao.campos.filter(c => c.type !== 'textarea');
              const icon = blockIcons[secao.id] || <FileText className="h-4 w-4" />;

              return (
                <div key={secao.id} className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/50">
                    <span className="text-primary/70">{icon}</span>
                    <h4 className="font-semibold text-sm tracking-tight text-foreground">
                      {secao.titulo}
                    </h4>
                  </div>

                  <div className="space-y-5 pl-0.5">
                    {textareaFields.map(campo => (
                      <div key={campo.id} className="space-y-1.5">
                        <Label className={cn(
                          "text-xs font-medium text-muted-foreground uppercase tracking-wider",
                          campo.required && "after:content-['*'] after:text-destructive after:ml-0.5"
                        )}>
                          {campo.label}
                        </Label>
                        {renderField(campo)}
                      </div>
                    ))}

                    {otherFields.length > 0 && (
                      <div className={cn(
                        compact ? "grid grid-cols-2 md:grid-cols-4 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"
                      )}>
                        {otherFields.map(campo => (
                          <div key={campo.id} className="space-y-1.5">
                            <Label className={cn(
                              "text-xs font-medium text-muted-foreground uppercase tracking-wider",
                              campo.required && "after:content-['*'] after:text-destructive after:ml-0.5"
                            )}>
                              {campo.label}
                            </Label>
                            {renderField(campo)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky action bar */}
          <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm border-t py-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSavingLocal || savingV2} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1.5" />
              Cancelar
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSavingLocal || savingV2}>
                <Save className="h-4 w-4 mr-1.5" />
                {isSavingLocal || savingV2 ? 'Salvando...' : 'Salvar Rascunho'}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSavingLocal || savingV2}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                {isSavingLocal || savingV2 ? 'Salvando...' : 'Finalizar'}
              </Button>
            </div>
          </div>
        </div>

        <AnamnesisTemplateBuilderDialog
          open={showTemplateEditor}
          onOpenChange={setShowTemplateEditor}
          template={editingV2Template}
        />
      </>
    );
  }

  // ─── VIEW MODE ──────────────────────────────────────────────────
  const hasStructuredData = (selectedRecord && Object.keys(selectedRecord.responses).length > 0)
    || (currentAnamnese?.structured_data && Object.keys(currentAnamnese.structured_data).length > 0);
  const viewData = (selectedRecord && Object.keys(selectedRecord.responses).length > 0)
    ? selectedRecord.responses as Record<string, unknown>
    : currentAnamnese?.structured_data;

  // viewTemplate is defined above early returns

  return (
    <div className="space-y-3">
      {/* Records list */}
      {renderRecordsList()}

      {/* Compact header + actions for selected record */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left: title, version, status */}
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-semibold text-sm truncate">
            {viewTemplate?.nome || selectedRecord?.template_name || 'Anamnese'}
          </h3>
          {selectedRecord?.version_number && (
            <Badge variant="outline" className="text-[10px] flex-shrink-0">
              v{selectedRecord.version_number}
            </Badge>
          )}
          {!selectedRecord && currentAnamnese && (
            <Badge variant="outline" className="text-[10px] flex-shrink-0">
              v{currentAnamnese.version || 1}
            </Badge>
          )}
          <Badge variant="secondary" className="text-[10px] flex-shrink-0 bg-emerald-500/10 text-emerald-700 border-emerald-200">
            <Check className="h-2.5 w-2.5 mr-0.5" />
            Finalizado
          </Badge>
        </div>

        {/* Right: date + actions — single horizontal group */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-nowrap">
          {(selectedRecord || currentAnamnese) && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
              <Clock className="h-3 w-3 flex-shrink-0" />
              {format(parseISO(selectedRecord?.created_at || currentAnamnese!.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </span>
          )}
          {/* Estética: consolidated PDF with map + products */}
          {isEstetica && (selectedRecord || currentAnamnese) && patientData?.id && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={exportingConsolidated}
                onClick={() => {
                  const activeRecord = selectedRecord || currentAnamnese;
                  generateConsolidatedPdf({
                    patientId: patientData.id,
                    appointmentId: appointmentId,
                    patient: {
                      full_name: patientName || 'Paciente',
                      birth_date: patientData?.birth_date || patientData?.data_nascimento,
                      phone: patientData?.phone || patientData?.telefone,
                      cpf: patientCpf,
                    },
                    professionalName,
                    professionalRegistration,
                    recordResponses: activeRecord?.responses as Record<string, any> || null,
                    recordData: activeRecord?.data as Record<string, any> || null,
                  });
                }}
                title="Gerar ficha consolidada com plano + mapa facial + produtos"
              >
                <Printer className="h-4 w-4 mr-1" />
                {exportingConsolidated ? 'Gerando...' : 'Imprimir Registro'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={exportingConsolidated}
                onClick={() => {
                  generateConsolidatedPdf({
                    patientId: patientData.id,
                    appointmentId: appointmentId,
                    patient: {
                      full_name: patientName || 'Paciente',
                      birth_date: patientData?.birth_date || patientData?.data_nascimento,
                      phone: patientData?.phone || patientData?.telefone,
                      cpf: patientCpf,
                    },
                    professionalName,
                    professionalRegistration,
                  });
                }}
                title="Gerar PDF consolidado deste registro"
              >
                <Download className="h-4 w-4 mr-1" />
                {exportingConsolidated ? 'Gerando...' : 'Gerar PDF'}
              </Button>
            </>
          )}
          {/* Non-Estética: standard anamnesis PDF */}
          {!isEstetica && currentAnamnese && (
            <Button variant="ghost" size="sm" disabled={generating} onClick={() => {
              generateAnamnesisPdf(
                {
                  name: patientName || 'Paciente',
                  cpf: patientCpf,
                  id: patientData?.id,
                  age: patientData?.age || patientData?.idade,
                  sex: patientData?.sex || patientData?.sexo,
                  phone: patientData?.phone || patientData?.telefone,
                  insurance_name: patientData?.insurance_name || patientData?.convenio,
                  birth_date: patientData?.birth_date || patientData?.data_nascimento,
                },
                currentAnamnese,
                viewTemplate?.secoes || [],
                {
                  name: currentAnamnese.created_by_name,
                  specialty: specialtyName || undefined,
                },
              );
            }}>
              <FileDown className="h-4 w-4 mr-1" />
              {generating ? 'Gerando...' : 'PDF'}
            </Button>
          )}
          {anamneseHistory.length > 1 && (
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-1" />
              Histórico ({anamneseHistory.length})
            </Button>
          )}
          {canEdit && onUpdate && selectedRecord && (
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              <Edit3 className="h-4 w-4 mr-1.5" />
              Editar
            </Button>
          )}
          {canEdit && selectedRecord && (
            <Button size="sm" onClick={handleStartNewVersion}>
              <Edit3 className="h-4 w-4 mr-1.5" />
              Nova Versão
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-0 divide-y">
          {hasStructuredData && viewData ? (
            (viewTemplate?.secoes || []).map(secao =>
              renderViewSection(secao, viewData)
            )
          ) : (
            currentAnamnese && renderLegacyView(currentAnamnese)
          )}
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Anamneses
            </DialogTitle>
            <DialogDescription>
              Versões anteriores da anamnese
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {anamneseHistory.map((anamnese) => (
                <div
                  key={anamnese.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                    anamnese.is_current && "border-primary bg-primary/5"
                  )}
                  onClick={() => setSelectedVersion(anamnese)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={anamnese.is_current ? 'default' : 'outline'}>v{anamnese.version}</Badge>
                      {anamnese.is_current && <Badge variant="secondary" className="text-xs">Atual</Badge>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(parseISO(anamnese.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {anamnese.created_by_name && ` • ${anamnese.created_by_name}`}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Version Detail Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Anamnese — Versão {selectedVersion?.version}</DialogTitle>
            <DialogDescription>
              {selectedVersion && format(parseISO(selectedVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {selectedVersion?.created_by_name && ` • ${selectedVersion.created_by_name}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            {selectedVersion && (
              selectedVersion.structured_data && Object.keys(selectedVersion.structured_data).length > 0 ? (
                <div className="space-y-4 pr-4">
                  {(viewTemplate?.secoes || []).map(secao => {
                    const filledFields = secao.campos.filter(c => {
                      const v = selectedVersion.structured_data?.[c.id];
                      if (Array.isArray(v)) return v.length > 0;
                      return v !== undefined && v !== null && v !== '';
                    });
                    if (filledFields.length === 0) return null;
                    return (
                      <div key={secao.id}>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">{secao.titulo}</h4>
                        {filledFields.map(campo => {
                          const val = selectedVersion.structured_data?.[campo.id];
                          const display = Array.isArray(val) ? val.join(', ') : String(val);
                          return (
                            <div key={campo.id} className="mb-2">
                              <Label className="text-xs text-muted-foreground">{campo.label}</Label>
                              <p className="text-sm whitespace-pre-wrap">{display}</p>
                            </div>
                          );
                        })}
                        <Separator className="my-3" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4 pr-4">
                  {[
                    { label: 'Queixa Principal', value: selectedVersion.queixa_principal },
                    { label: 'HDA', value: selectedVersion.historia_doenca_atual },
                    { label: 'Antecedentes Pessoais', value: selectedVersion.antecedentes_pessoais },
                    { label: 'Antecedentes Familiares', value: selectedVersion.antecedentes_familiares },
                    { label: 'Hábitos de Vida', value: selectedVersion.habitos_vida },
                    { label: 'Medicamentos', value: selectedVersion.medicamentos_uso_continuo },
                    { label: 'Alergias', value: selectedVersion.alergias },
                    { label: 'Comorbidades', value: selectedVersion.comorbidades },
                  ].filter(s => s.value).map(s => (
                    <div key={s.label}>
                      <Label className="text-muted-foreground">{s.label}</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{s.value}</p>
                      <Separator className="mt-3" />
                    </div>
                  ))}
                </div>
              )
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedVersion(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Editor Dialog */}
      <AnamnesisTemplateBuilderDialog
        open={showTemplateEditor}
        onOpenChange={setShowTemplateEditor}
        template={editingV2Template}
      />
    </div>
  );
}
