/**
 * ESTÉTICA - Anamnese Estética (Unified Selector)
 *
 * Manual save only — NO autosave.
 * Full lifecycle: draft → saved (editable window) → locked → signed → addendum
 * Advanced YesClin signature only — no legacy simple signature.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Save,
  FileText,
  Lock,
  User,
  Printer,
  Download,
  Clock,
  Plus,
  Undo2,
  ShieldCheck,
  PenLine,
  FilePlus,
  Trash2,
  Ban,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useConsolidatedFillerPdf } from '@/hooks/aesthetics/useConsolidatedFillerPdf';
import { DynamicAnamneseRenderer } from './DynamicAnamneseRenderer';
import { StandardTemplateRenderer } from './StandardTemplateRenderer';
import { useDynamicAnamneseEstetica } from '@/hooks/aesthetics/useDynamicAnamneseEstetica';
import { ADVANCED_TEMPLATE_MAP } from '@/hooks/prontuario/estetica/esteticaAdvancedTemplates';
import {
  getCatalogEntry,
  getRendererKind,
  ESTETICA_TEMPLATE_CATALOG,
  CATEGORY_LABELS,
  type RendererKind,
  type TemplateCategory,
} from '@/hooks/prontuario/estetica/esteticaTemplateCatalog';
import type { DynamicFormValues } from './anamnese-fields/types';
import { useAnamnesisTemplatesV2, useAnamnesisRecords } from '@/hooks/useAnamnesisTemplatesV2';
import type { AnamnesisTemplateV2 } from '@/hooks/useAnamnesisTemplatesV2';
import { useAnamnesisEditability } from '@/hooks/prontuario/useAnamnesisEditability';
import { RecordEditLockBanner } from '@/components/prontuario/RecordEditLockBanner';
import { AddendumSection } from '@/components/prontuario/AddendumSection';
import { useAdvancedSignature } from '@/hooks/prontuario/useAdvancedSignature';
import { SignatureAdvancedWizard } from '@/components/prontuario/signature/SignatureAdvancedWizard';
import type { MedicalRecordEntry } from '@/hooks/prontuario/useMedicalRecordEntries';
import { cn } from '@/lib/utils';

// ─── Template classification using catalog ─────────────────────────
type TemplateKind = 'advanced' | 'standard' | 'incomplete';

function classifyTemplate(t: AnamnesisTemplateV2): TemplateKind {
  const kind = getRendererKind({ template_type: t.template_type, name: t.name });
  if (kind === 'dynamic') return 'advanced';
  if (t.structure && t.structure.length > 0) return 'standard';
  return 'incomplete';
}

function getTemplateCategory(t: AnamnesisTemplateV2): TemplateCategory {
  const entry = getCatalogEntry({ template_type: t.template_type, name: t.name });
  return entry?.category || 'procedural';
}

function getDisplayOrder(t: AnamnesisTemplateV2): number {
  const entry = getCatalogEntry({ template_type: t.template_type, name: t.name });
  return entry?.displayOrder ?? 99;
}

function kindLabel(kind: TemplateKind): string {
  switch (kind) {
    case 'advanced': return 'Avançado';
    case 'standard': return 'Padrão';
    case 'incomplete': return 'Incompleto';
  }
}

function kindBadgeClass(kind: TemplateKind): string {
  switch (kind) {
    case 'advanced': return 'bg-primary/10 text-primary border-primary/20';
    case 'standard': return 'bg-secondary text-secondary-foreground';
    case 'incomplete': return 'bg-destructive/10 text-destructive border-destructive/20';
  }
}

// ─── Editability status helpers ────────────────────────────────────
type AnamneseUiStatus = 'draft_local' | 'saved_editable' | 'locked' | 'signed' | 'discarded';

function resolveUiStatus(record: any | null, editability: ReturnType<typeof useAnamnesisEditability>): AnamneseUiStatus {
  if (!record) return 'draft_local';
  if (record.discarded_at || editability.status === 'discarded') return 'discarded';
  if (record.signed_at) return 'signed';
  if (editability.status === 'locked' || editability.status === 'addendum_only') return 'locked';
  if (editability.status === 'signed') return 'signed';
  return 'saved_editable';
}

// ─── Props ──────────────────────────────────────────────────────────
interface AnamneseEsteticaBlockProps {
  patientId: string | null;
  clinicId: string | null;
  appointmentId?: string | null;
  canEdit?: boolean;
  specialtyId?: string | null;
  procedureId?: string | null;
  patientName?: string;
  patientBirthDate?: string | null;
  patientPhone?: string | null;
  patientCpf?: string | null;
  professionalName?: string | null;
  professionalRegistration?: string | null;
  canExport?: boolean;
}

export function AnamneseEsteticaBlock({
  patientId,
  clinicId,
  appointmentId,
  canEdit = false,
  specialtyId,
  procedureId,
  patientName,
  patientBirthDate,
  patientPhone,
  patientCpf,
  professionalName,
  professionalRegistration,
  canExport = true,
}: AnamneseEsteticaBlockProps) {
  // ─── Template resolution ──────────────────────────────────────────
  const { templates: allTemplates, isLoading: loadingTemplates } = useAnamnesisTemplatesV2({
    specialtyId,
    activeOnly: true,
  });

  // ─── V2 Records ──────────────────────────────────────────────────
  const { records: v2Records } = useAnamnesisRecords(patientId, null, specialtyId);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Classify, filter incomplete, sort locked first then by catalog display order
  const selectableTemplates = useMemo(() => {
    return allTemplates
      .filter(t => classifyTemplate(t) !== 'incomplete')
      .sort((a, b) => {
        if (a.system_locked && !b.system_locked) return -1;
        if (!a.system_locked && b.system_locked) return 1;
        return getDisplayOrder(a) - getDisplayOrder(b);
      });
  }, [allTemplates]);

  // Active template
  const activeTemplate = useMemo(() => {
    if (!selectableTemplates.length) return null;
    if (selectedTemplateId) {
      const found = selectableTemplates.find(t => t.id === selectedTemplateId);
      if (found) return found;
    }
    const defaultTpl = selectableTemplates.find(t => t.is_default);
    return defaultTpl || selectableTemplates[0];
  }, [selectableTemplates, selectedTemplateId]);

  const activeKind = activeTemplate ? classifyTemplate(activeTemplate) : null;

  // Auto-select first template
  useEffect(() => {
    if (activeTemplate && !selectedTemplateId) {
      setSelectedTemplateId(activeTemplate.id);
    }
  }, [activeTemplate, selectedTemplateId]);

  // ─── Advanced dynamic pipeline ──────────────────────────────────
  const templateType = activeTemplate?.template_type || null;
  const isAdvanced = activeKind === 'advanced';

  const {
    record: dynamicRecord,
    fields: dynamicFields,
    loading: dynamicLoading,
    saving: dynamicSaving,
    saveResponses,
    refetch: refetchDynamic,
    isSigned: dynamicSigned,
  } = useDynamicAnamneseEstetica({
    patientId: isAdvanced ? patientId : null,
    appointmentId,
    templateId: isAdvanced ? activeTemplate?.id || null : null,
    templateVersionId: isAdvanced ? activeTemplate?.current_version_id || null : null,
    templateType,
    specialtyId,
  });

  // ─── Standard template state (for legacy/standard templates) ────
  const [standardValues, setStandardValues] = useState<Record<string, unknown>>({});
  const [standardHasChanges, setStandardHasChanges] = useState(false);
  const [standardSaving, setStandardSaving] = useState(false);
  const [standardRecord, setStandardRecord] = useState<any>(null);
  const [standardLoading, setStandardLoading] = useState(false);

  // Load standard record when template changes
  useEffect(() => {
    if (activeKind !== 'standard' || !patientId || !activeTemplate?.id || !clinicId) {
      setStandardRecord(null);
      setStandardValues({});
      return;
    }

    let cancelled = false;
    setStandardLoading(true);

    (async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data } = await supabase
          .from('anamnesis_records')
          .select('*')
          .eq('patient_id', patientId)
          .eq('clinic_id', clinicId)
          .eq('template_id', activeTemplate.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!cancelled) {
          setStandardRecord(data);
          setStandardValues((data?.responses as Record<string, unknown>) || {});
          setStandardHasChanges(false);
        }
      } catch (err) {
        console.error('Error loading standard record:', err);
      } finally {
        if (!cancelled) setStandardLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [activeKind, patientId, clinicId, activeTemplate?.id]);

  const handleStandardFieldChange = useCallback((fieldId: string, value: unknown) => {
    setStandardValues(prev => ({ ...prev, [fieldId]: value }));
    setStandardHasChanges(true);
  }, []);

  const handleStandardSave = useCallback(async () => {
    if (!patientId || !clinicId || !activeTemplate?.id) return;
    setStandardSaving(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { toast } = await import('sonner');
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { data: professional } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('clinic_id', clinicId)
        .maybeSingle();

      const professionalId = professional?.id || userData.user.id;

      const { getEditWindowFields } = await import('@/hooks/prontuario/anamnesisEditWindowUtils');
      const editWindowFields = getEditWindowFields();

      if (standardRecord && !standardRecord.signed_at) {
        await supabase
          .from('anamnesis_records')
          .update({
            responses: standardValues as any,
            data: standardValues as any,
            updated_at: new Date().toISOString(),
            ...editWindowFields,
          })
          .eq('id', standardRecord.id);
        setStandardRecord((prev: any) => prev ? { ...prev, ...editWindowFields, updated_at: new Date().toISOString() } : prev);
        toast.success('Anamnese salva');
      } else {
        const { data } = await supabase
          .from('anamnesis_records')
          .insert({
            patient_id: patientId,
            clinic_id: clinicId,
            professional_id: professionalId,
            template_id: activeTemplate.id,
            template_version_id: activeTemplate.current_version_id,
            specialty_id: specialtyId,
            appointment_id: appointmentId || null,
            responses: standardValues as any,
            structure_snapshot: activeTemplate.structure as any,
            data: standardValues as any,
            status: 'rascunho',
            created_by: userData.user.id,
            ...editWindowFields,
          })
          .select()
          .single();
        setStandardRecord(data);
        toast.success('Anamnese criada');
      }
      setStandardHasChanges(false);
    } catch (err) {
      console.error('Error saving standard anamnese:', err);
      const { toast } = await import('sonner');
      toast.error('Erro ao salvar anamnese');
    } finally {
      setStandardSaving(false);
    }
  }, [patientId, clinicId, activeTemplate, standardValues, standardRecord, specialtyId, appointmentId]);

  // ─── Dynamic form state — NO AUTOSAVE ────────────────────────────
  const [dynamicValues, setDynamicValues] = useState<DynamicFormValues>({});
  const [dynamicHasChanges, setDynamicHasChanges] = useState(false);

  // Only hydrate from DB when record ID changes (new record loaded)
  const hydratedRecordIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (dynamicRecord?.responses && dynamicRecord.id !== hydratedRecordIdRef.current) {
      hydratedRecordIdRef.current = dynamicRecord.id;
      setDynamicValues(dynamicRecord.responses);
      setDynamicHasChanges(false);
    }
  }, [dynamicRecord]);

  // Field change — local only, NO autosave
  const handleDynamicFieldChange = useCallback((fieldId: string, value: unknown) => {
    setDynamicValues(prev => ({ ...prev, [fieldId]: value }));
    setDynamicHasChanges(true);
  }, []);

  // Explicit manual save
  const handleDynamicSave = useCallback(async () => {
    await saveResponses(dynamicValues);
    setDynamicHasChanges(false);
  }, [saveResponses, dynamicValues]);

  // Discard local changes
  const handleDiscard = useCallback(() => {
    if (isAdvanced && dynamicRecord?.responses) {
      setDynamicValues(dynamicRecord.responses);
      setDynamicHasChanges(false);
    } else if (!isAdvanced && standardRecord?.responses) {
      setStandardValues(standardRecord.responses as Record<string, unknown>);
      setStandardHasChanges(false);
    }
  }, [isAdvanced, dynamicRecord, standardRecord]);

  // ─── Editability / Lock / Sign ───────────────────────────────────
  const currentRecord = isAdvanced ? dynamicRecord : standardRecord;

  const editabilityRecord = useMemo(() => {
    if (!currentRecord) return null;
    return {
      id: currentRecord.id,
      created_at: currentRecord.created_at,
      signed_at: currentRecord.signed_at,
      saved_at: currentRecord.saved_at,
      edit_window_until: currentRecord.edit_window_until,
      locked_at: currentRecord.locked_at,
      status: currentRecord.status,
      discarded_at: currentRecord.discarded_at,
    };
  }, [currentRecord]);

  const anamnesisEditability = useAnamnesisEditability(editabilityRecord);
  const uiStatus = resolveUiStatus(currentRecord, anamnesisEditability);

  // Signature flow — Advanced YesClin
  const { signRecord: advancedSignRecord, signing: signingSig } = useAdvancedSignature();
  const [showAdvancedSignDialog, setShowAdvancedSignDialog] = useState(false);
  const [signatureEntry, setSignatureEntry] = useState<MedicalRecordEntry | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [discardReason, setDiscardReason] = useState('');

  const handleSign = useCallback(async () => {
    if (!currentRecord) return;
    const currentHasChanges = isAdvanced ? dynamicHasChanges : standardHasChanges;
    if (currentHasChanges) {
      const { toast } = await import('sonner');
      toast.error('Salve as alterações antes de assinar.');
      return;
    }
    // Build a MedicalRecordEntry-like object for the dialog
    setSignatureEntry({
      id: currentRecord.id,
      entry_type: 'anamnesis',
      content: (isAdvanced ? dynamicValues : standardValues) as Record<string, unknown>,
      created_at: currentRecord.created_at,
      professional_id: currentRecord.professional_id,
      professional_name: professionalName || 'Profissional',
    } as unknown as MedicalRecordEntry);
    setShowAdvancedSignDialog(true);
  }, [currentRecord, isAdvanced, dynamicHasChanges, standardHasChanges, dynamicValues, standardValues, professionalName]);

  const handleAdvancedSign = useCallback(async (password: string): Promise<boolean> => {
    if (!currentRecord || !patientId) return false;
    const content = isAdvanced ? dynamicValues : standardValues;
    const result = await advancedSignRecord({
      record_id: currentRecord.id,
      record_type: 'anamnesis',
      patient_id: patientId,
      content: content as Record<string, unknown>,
      professional_name: professionalName || 'Profissional',
    }, password);
    if (result.success) {
      if (isAdvanced) {
        refetchDynamic();
      } else {
        setStandardRecord((prev: any) => prev ? { ...prev, signed_at: new Date().toISOString() } : prev);
      }
    }
    return result.success;
  }, [currentRecord, patientId, isAdvanced, dynamicValues, standardValues, advancedSignRecord, professionalName, refetchDynamic]);

  // ─── Unsaved changes guard ───────────────────────────────────────
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  const currentHasChanges = isAdvanced ? dynamicHasChanges : standardHasChanges;
  const currentSaving = isAdvanced ? dynamicSaving : standardSaving;
  const currentSigned = uiStatus === 'signed';
  const currentLoading = isAdvanced ? dynamicLoading : standardLoading;
  const hasAnyRecord = !!currentRecord || v2Records.length > 0;
  const isFormReadonly = uiStatus === 'locked' || uiStatus === 'signed' || uiStatus === 'discarded';
  const isDiscarded = uiStatus === 'discarded';

  // Discard handler
  const handleDiscard2 = useCallback(async () => {
    if (!currentRecord || !discardReason.trim()) return;
    await anamnesisEditability.discardRecord(currentRecord.id, discardReason.trim());
    setShowDiscardConfirm(false);
    setDiscardReason('');
    // Refetch
    if (isAdvanced) {
      refetchDynamic();
    } else {
      setStandardRecord((prev: any) => prev ? { ...prev, discarded_at: new Date().toISOString(), discard_reason: discardReason.trim() } : prev);
    }
    const { toast } = await import('sonner');
    toast.success('Documento descartado.');
  }, [currentRecord, discardReason, anamnesisEditability, isAdvanced, refetchDynamic]);

  // Browser beforeunload guard
  useEffect(() => {
    if (!currentHasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [currentHasChanges]);

  // ─── PDF export ──────────────────────────────────────────────────
  const { generateConsolidatedPdf, exporting: exportingPdf } = useConsolidatedFillerPdf();

  const handlePrint = useCallback(() => {
    if (!patientId) return;
    const responses = isAdvanced
      ? (dynamicRecord?.responses as Record<string, any> | null)
      : standardValues;
    generateConsolidatedPdf({
      patientId,
      appointmentId: appointmentId || undefined,
      patient: {
        full_name: patientName || 'Paciente',
        birth_date: patientBirthDate,
        phone: patientPhone,
        cpf: patientCpf,
      },
      professionalName,
      professionalRegistration,
      recordResponses: responses,
      recordData: responses,
    });
  }, [patientId, appointmentId, isAdvanced, dynamicRecord, standardValues, patientName, patientBirthDate, patientPhone, patientCpf, professionalName, professionalRegistration, generateConsolidatedPdf]);

  // Template change with unsaved guard
  const handleTemplateChange = useCallback((templateId: string) => {
    if (currentHasChanges) {
      pendingNavigationRef.current = () => {
        setSelectedTemplateId(templateId);
        setDynamicValues({});
        setDynamicHasChanges(false);
        setStandardValues({});
        setStandardHasChanges(false);
        setIsCreatingNew(false);
      };
      setShowUnsavedDialog(true);
      return;
    }
    setSelectedTemplateId(templateId);
    setDynamicValues({});
    setDynamicHasChanges(false);
    setStandardValues({});
    setStandardHasChanges(false);
    setIsCreatingNew(false);
  }, [currentHasChanges]);

  const handleUnsavedSaveAndLeave = useCallback(async () => {
    setShowUnsavedDialog(false);
    if (isAdvanced) {
      await handleDynamicSave();
    } else {
      await handleStandardSave();
    }
    pendingNavigationRef.current?.();
    pendingNavigationRef.current = null;
  }, [isAdvanced, handleDynamicSave, handleStandardSave]);

  const handleUnsavedLeave = useCallback(() => {
    setShowUnsavedDialog(false);
    setDynamicHasChanges(false);
    setStandardHasChanges(false);
    pendingNavigationRef.current?.();
    pendingNavigationRef.current = null;
  }, []);

  // Auto-select first record
  useEffect(() => {
    if (v2Records.length > 0 && !selectedRecordId) {
      setSelectedRecordId(v2Records[0].id);
    }
  }, [v2Records, selectedRecordId]);

  // ─── Loading ──────────────────────────────────────────────────────
  if (loadingTemplates) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um paciente para visualizar a anamnese.</p>
        </CardContent>
      </Card>
    );
  }

  if (selectableTemplates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-10 text-center">
          <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Nenhum modelo de anamnese disponível</h3>
          <p className="text-sm text-muted-foreground">
            Não foram encontrados modelos de anamnese para a especialidade estética.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Template selector dropdown ──────────────────────────────────
  const renderTemplateSelector = () => {
    if (selectableTemplates.length <= 1) return null;

    const baseTemplates = selectableTemplates.filter(t => getTemplateCategory(t) === 'avaliacao_base');
    const proceduralTemplates = selectableTemplates.filter(t => getTemplateCategory(t) === 'procedural');

    const renderGroup = (label: string, templates: AnamnesisTemplateV2[], showBorder = false) => {
      if (!templates.length) return null;
      return (
        <>
          <div className={cn(
            "px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",
            showBorder && "mt-1 border-t border-border"
          )}>
            {label}
          </div>
          {templates.map(t => (
            <SelectItem key={t.id} value={t.id}>
              <div className="flex items-center gap-2">
                <span className="truncate">{t.name}</span>
                {t.is_system && <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
              </div>
            </SelectItem>
          ))}
        </>
      );
    };

    return (
      <Select value={selectedTemplateId || ''} onValueChange={handleTemplateChange}>
        <SelectTrigger className="w-72 h-8 text-xs">
          <SelectValue placeholder="Selecionar modelo..." />
        </SelectTrigger>
        <SelectContent>
          {renderGroup(CATEGORY_LABELS.avaliacao_base, baseTemplates)}
          {renderGroup(CATEGORY_LABELS.procedural, proceduralTemplates, baseTemplates.length > 0)}
        </SelectContent>
      </Select>
    );
  };

  // ─── Status badge ────────────────────────────────────────────────
  const renderStatusBadge = () => {
    switch (uiStatus) {
      case 'draft_local':
        if (currentHasChanges) {
          return (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
              Alterações não salvas
            </Badge>
          );
        }
        return null;
      case 'saved_editable':
        if (currentHasChanges) {
          return (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
              Alterações não salvas
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
            Salvo
          </Badge>
        );
      case 'locked':
        return (
          <Badge variant="outline" className="text-amber-700 border-amber-400 bg-amber-50 dark:bg-amber-950/30">
            <Lock className="h-3 w-3 mr-1" />
            Bloqueado
          </Badge>
        );
      case 'signed':
        return (
          <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950/30">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Assinado
          </Badge>
        );
      case 'discarded':
        return (
          <Badge variant="destructive">
            <Ban className="h-3 w-3 mr-1" />
            Descartado
          </Badge>
        );
    }
  };

  // ─── Action buttons ──────────────────────────────────────────────
  const renderActions = () => {
    const actions: React.ReactNode[] = [];

    // Template selector always
    const selector = renderTemplateSelector();
    if (selector) actions.push(<span key="selector">{selector}</span>);

    // PDF/Print for saved records
    if (canExport && currentRecord) {
      actions.push(
        <Button key="print" variant="outline" size="sm" onClick={handlePrint} disabled={exportingPdf}>
          <Printer className="h-4 w-4 mr-1.5" />
          {exportingPdf ? 'Gerando...' : 'Imprimir'}
        </Button>
      );
      actions.push(
        <Button key="pdf" variant="outline" size="sm" onClick={handlePrint} disabled={exportingPdf}>
          <Download className="h-4 w-4 mr-1.5" />
          PDF
        </Button>
      );
    }

    // STATE-DEPENDENT ACTIONS
    if (uiStatus === 'draft_local' || uiStatus === 'saved_editable') {
      // Discard button when there are unsaved changes
      if (currentHasChanges && currentRecord) {
        actions.push(
          <Button key="discard" variant="ghost" size="sm" onClick={handleDiscard}>
            <Undo2 className="h-4 w-4 mr-1.5" />
            Descartar
          </Button>
        );
      }

      // Save button
      if (canEdit) {
        actions.push(
          <Button
            key="save"
            size="sm"
            onClick={isAdvanced ? handleDynamicSave : handleStandardSave}
            disabled={currentSaving || !currentHasChanges}
          >
            <Save className="h-4 w-4 mr-1.5" />
            {currentSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        );
      }

      // Sign button (only after save)
      if (currentRecord && !currentHasChanges) {
        actions.push(
          <Button key="sign" variant="outline" size="sm" onClick={handleSign} disabled={signingSig}>
            <ShieldCheck className="h-4 w-4 mr-1.5" />
            Assinatura Avançada YesClin
          </Button>
        );
      }
      // Discard document button (saved, not signed)
      if (anamnesisEditability.canDiscard) {
        actions.push(
          <Button key="discard-doc" variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setShowDiscardConfirm(true)}>
            <Trash2 className="h-4 w-4 mr-1.5" />
            Descartar documento
          </Button>
        );
      }
    }

    if (uiStatus === 'locked') {
      // Can still sign if not yet signed
      if (currentRecord) {
        actions.push(
          <Button key="sign" variant="outline" size="sm" onClick={handleSign} disabled={signingSig}>
            <ShieldCheck className="h-4 w-4 mr-1.5" />
            Assinatura Avançada YesClin
          </Button>
        );
      }
      // Discard document button (locked but not signed)
      if (anamnesisEditability.canDiscard) {
        actions.push(
          <Button key="discard-doc" variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setShowDiscardConfirm(true)}>
            <Trash2 className="h-4 w-4 mr-1.5" />
            Descartar documento
          </Button>
        );
      }
    }

    // Discarded: no actions except view

    return actions;
  };

  // ─── Empty state ─────────────────────────────────────────────────
  if (!hasAnyRecord && !isCreatingNew) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Anamnese Estética</h3>
          </div>
          {renderTemplateSelector()}
        </div>

        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-3">Nenhuma anamnese registrada</h3>
            <p className="text-sm text-muted-foreground mb-1">
              {activeTemplate ? `Modelo: ${activeTemplate.name}` : 'Selecione um modelo para começar'}
            </p>
            {activeKind && (
              <Badge variant="outline" className={cn('mb-4 text-[10px]', kindBadgeClass(activeKind))}>
                {kindLabel(activeKind)}
              </Badge>
            )}
            {canEdit && (
              <div>
                <Button onClick={() => setIsCreatingNew(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Anamnese
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Main rendering ──────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                {activeTemplate?.name || 'Anamnese Estética'}
              </h3>
              {activeKind && (
                <Badge variant="outline" className={cn('text-[10px]', kindBadgeClass(activeKind))}>
                  {kindLabel(activeKind)}
                </Badge>
              )}
              {renderStatusBadge()}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentRecord
                ? `Registro de ${format(parseISO(currentRecord.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                : 'Novo registro'}
              {currentSigned && currentRecord?.signed_at && (
                <> • Assinado em {format(parseISO(currentRecord.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {renderActions()}
        </div>
      </div>

      {/* Discarded banner */}
      {isDiscarded && currentRecord && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive dark:bg-destructive/20">
          <Ban className="h-4 w-4 flex-shrink-0" />
          <div>
            <span className="font-semibold">Documento descartado</span>
            {currentRecord.discard_reason && (
              <span className="ml-1">— Motivo: {currentRecord.discard_reason}</span>
            )}
            {currentRecord.discarded_at && (
              <span className="ml-1 text-xs opacity-75">
                em {format(parseISO(currentRecord.discarded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Edit lock banner */}
      {currentRecord && !isDiscarded && (
        <RecordEditLockBanner editability={anamnesisEditability.editability} />
      )}

      {/* Records list */}
      {v2Records.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {v2Records.map(record => (
            <div
              key={record.id}
              onClick={() => {
                if (currentHasChanges) {
                  pendingNavigationRef.current = () => {
                    setSelectedRecordId(record.id);
                    if (record.template_id) setSelectedTemplateId(record.template_id);
                  };
                  setShowUnsavedDialog(true);
                  return;
                }
                setSelectedRecordId(record.id);
                if (record.template_id) setSelectedTemplateId(record.template_id);
              }}
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
            </div>
          ))}
        </div>
      )}

      {/* Form content — routed by template kind */}
      {currentLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isAdvanced && dynamicFields.length > 0 ? (
        <DynamicAnamneseRenderer
          fields={dynamicFields}
          values={dynamicValues}
          onChange={handleDynamicFieldChange}
          disabled={!canEdit || isFormReadonly}
        />
      ) : activeKind === 'standard' && activeTemplate?.structure && activeTemplate.structure.length > 0 ? (
        <StandardTemplateRenderer
          sections={activeTemplate.structure}
          values={standardValues}
          onChange={handleStandardFieldChange}
          disabled={!canEdit || isFormReadonly}
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar a estrutura deste modelo. Tente selecionar outro modelo.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Addendum section — visible when locked or signed */}
      {currentRecord && patientId && anamnesisEditability.canAddAddendum && (
        <AddendumSection
          recordType="anamnesis"
          recordId={currentRecord.id}
          patientId={patientId}
          professionalId={currentRecord.professional_id || ''}
          specialtyId={specialtyId}
          moduleOrigin="anamnese"
          editability={anamnesisEditability.editability}
        />
      )}

      {/* Advanced Signature Dialog */}
      <AdvancedSignatureDialog
        open={showAdvancedSignDialog}
        onOpenChange={setShowAdvancedSignDialog}
        entry={signatureEntry}
        professionalName={professionalName || 'Profissional'}
        patientName={patientName || 'Paciente'}
        hasValidConsent={true}
        onSign={handleAdvancedSign}
        signing={signingSig}
      />

      {/* Unsaved changes confirmation dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Existem alterações não salvas. Deseja salvar antes de sair?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowUnsavedDialog(false); pendingNavigationRef.current = null; }}>
              Cancelar
            </AlertDialogCancel>
            <Button variant="ghost" onClick={handleUnsavedLeave}>
              Sair sem salvar
            </Button>
            <AlertDialogAction onClick={handleUnsavedSaveAndLeave}>
              Salvar e sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discard document confirmation dialog */}
      <AlertDialog open={showDiscardConfirm} onOpenChange={(open) => { setShowDiscardConfirm(open); if (!open) setDiscardReason(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar documento</AlertDialogTitle>
            <AlertDialogDescription>
              Este documento será descartado e <strong>não poderá mais ser editado nem assinado</strong>. O histórico será preservado para auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium mb-1.5 block">Motivo do descarte <span className="text-destructive">*</span></label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Informe o motivo do descarte..."
              value={discardReason}
              onChange={(e) => setDiscardReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDiscard2} disabled={!discardReason.trim()}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Confirmar descarte
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
