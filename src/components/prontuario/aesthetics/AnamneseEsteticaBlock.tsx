/**
 * ESTÉTICA - Anamnese Estética (Unified Selector)
 *
 * Shows ALL aesthetics templates in a single dropdown:
 * - Advanced dynamic templates → DynamicAnamneseRenderer
 * - Legacy/standard templates → StandardTemplateRenderer
 * - Persistence: anamnesis_records for all new records
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
  Save,
  FileText,
  Lock,
  User,
  Printer,
  Download,
  Clock,
  Plus,
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
        // Locked templates always first
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

      if (standardRecord && !standardRecord.signed_at) {
        await supabase
          .from('anamnesis_records')
          .update({
            responses: standardValues as any,
            updated_at: new Date().toISOString(),
          })
          .eq('id', standardRecord.id);
        toast.success('Anamnese salva');
      } else {
        const { getEditWindowFields } = await import('@/hooks/prontuario/anamnesisEditWindowUtils');
        const editWindowFields = getEditWindowFields();
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

  // ─── Dynamic form state ──────────────────────────────────────────
  const [dynamicValues, setDynamicValues] = useState<DynamicFormValues>({});
  const [dynamicHasChanges, setDynamicHasChanges] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (dynamicRecord?.responses) {
      setDynamicValues(dynamicRecord.responses);
      setDynamicHasChanges(false);
    }
  }, [dynamicRecord]);

  const handleDynamicFieldChange = useCallback((fieldId: string, value: unknown) => {
    setDynamicValues(prev => ({ ...prev, [fieldId]: value }));
    setDynamicHasChanges(true);

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      setDynamicValues(latest => {
        saveResponses(latest);
        return latest;
      });
      setDynamicHasChanges(false);
    }, 3000);
  }, [saveResponses]);

  const handleDynamicSave = useCallback(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    saveResponses(dynamicValues);
    setDynamicHasChanges(false);
  }, [saveResponses, dynamicValues]);

  // ─── Autosave for standard templates ─────────────────────────────
  const standardAutosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (activeKind !== 'standard' || !standardHasChanges) return;
    if (standardAutosaveRef.current) clearTimeout(standardAutosaveRef.current);
    standardAutosaveRef.current = setTimeout(() => {
      handleStandardSave();
    }, 3000);
    return () => {
      if (standardAutosaveRef.current) clearTimeout(standardAutosaveRef.current);
    };
  }, [standardValues, activeKind, standardHasChanges, handleStandardSave]);

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

  // Template change
  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    setDynamicValues({});
    setDynamicHasChanges(false);
    setStandardValues({});
    setStandardHasChanges(false);
    setIsCreatingNew(false);
  }, []);

  // Auto-select first record
  useEffect(() => {
    if (v2Records.length > 0 && !selectedRecordId) {
      setSelectedRecordId(v2Records[0].id);
    }
  }, [v2Records, selectedRecordId]);

  // ─── Computed state ──────────────────────────────────────────────
  const currentRecord = isAdvanced ? dynamicRecord : standardRecord;
  const currentSigned = isAdvanced ? dynamicSigned : !!standardRecord?.signed_at;
  const currentLoading = isAdvanced ? dynamicLoading : standardLoading;
  const currentSaving = isAdvanced ? dynamicSaving : standardSaving;
  const currentHasChanges = isAdvanced ? dynamicHasChanges : standardHasChanges;
  const hasAnyRecord = !!currentRecord || v2Records.length > 0;

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
            Não foram encontrados modelos de anamnese para a especialidade estética. Verifique as configurações.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Template selector dropdown ──────────────────────────────────
  const renderTemplateSelector = () => {
    if (selectableTemplates.length <= 1) return null;

    // Group by catalog category
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
            </div>
            <p className="text-xs text-muted-foreground">
              {currentRecord
                ? `Registro de ${format(parseISO(currentRecord.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                : 'Novo registro'}
              {currentSigned && ' • Assinada'}
            </p>
          </div>
          {currentSigned && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Assinada
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {renderTemplateSelector()}

          {canExport && currentRecord && (
            <>
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={exportingPdf} title="Imprimir">
                <Printer className="h-4 w-4 mr-1.5" />
                {exportingPdf ? 'Gerando...' : 'Imprimir'}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={exportingPdf} title="PDF">
                <Download className="h-4 w-4 mr-1.5" />
                {exportingPdf ? 'Gerando...' : 'PDF'}
              </Button>
            </>
          )}

          {canEdit && (
            <Button
              size="sm"
              onClick={isAdvanced ? handleDynamicSave : handleStandardSave}
              disabled={currentSaving || !currentHasChanges}
            >
              <Save className="h-4 w-4 mr-1.5" />
              {currentSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </div>
      </div>

      {/* Records list */}
      {v2Records.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {v2Records.map(record => (
            <div
              key={record.id}
              onClick={() => {
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
          disabled={!canEdit || currentSigned}
        />
      ) : activeKind === 'standard' && activeTemplate?.structure && activeTemplate.structure.length > 0 ? (
        <StandardTemplateRenderer
          sections={activeTemplate.structure}
          values={standardValues}
          onChange={handleStandardFieldChange}
          disabled={!canEdit || currentSigned}
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
    </div>
  );
}
