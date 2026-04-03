/**
 * ESTÉTICA - Anamnese Estética (Unified)
 *
 * Single entry point for aesthetics anamnesis.
 * - New records: anamnesis_records only (dynamic pipeline)
 * - Legacy records: read-only from clinical_evolutions (for history)
 * - Renderer: DynamicAnamneseRenderer only
 * - Field contract: DynamicField only
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
  History,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useResolvedAnamnesisTemplate } from '@/hooks/prontuario/useResolvedAnamnesisTemplate';
import { useConsolidatedFillerPdf } from '@/hooks/aesthetics/useConsolidatedFillerPdf';
import { DynamicAnamneseRenderer } from './DynamicAnamneseRenderer';
import { useDynamicAnamneseEstetica } from '@/hooks/aesthetics/useDynamicAnamneseEstetica';
import { ADVANCED_TEMPLATE_MAP } from '@/hooks/prontuario/estetica/esteticaAdvancedTemplates';
import type { DynamicFormValues } from './anamnese-fields/types';
import { supabase } from '@/integrations/supabase/client';
import { useAnamnesisTemplatesV2, useAnamnesisRecords } from '@/hooks/useAnamnesisTemplatesV2';
import { cn } from '@/lib/utils';

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
  const { templates: v2Templates, isLoading: loadingTemplates } = useAnamnesisTemplatesV2({
    specialtyId,
    activeOnly: true,
  });

  // ─── V2 Records (all records for this patient in this specialty) ──
  const { records: v2Records } = useAnamnesisRecords(patientId, null, specialtyId);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Active template
  const activeTemplate = useMemo(() => {
    if (!v2Templates.length) return null;
    if (selectedTemplateId) {
      const found = v2Templates.find(t => t.id === selectedTemplateId);
      if (found) return found;
    }
    const defaultTpl = v2Templates.find(t => t.is_default);
    return defaultTpl || v2Templates[0];
  }, [v2Templates, selectedTemplateId]);

  // Auto-select first template
  useEffect(() => {
    if (activeTemplate && !selectedTemplateId) {
      setSelectedTemplateId(activeTemplate.id);
    }
  }, [activeTemplate, selectedTemplateId]);

  // Resolve template_type for dynamic field lookup
  const templateType = activeTemplate?.template_type || null;
  const isDynamic = templateType ? !!ADVANCED_TEMPLATE_MAP[templateType] : false;

  // ─── Dynamic anamnese hook ──────────────────────────────────────
  const {
    record: dynamicRecord,
    fields: dynamicFields,
    loading: dynamicLoading,
    saving: dynamicSaving,
    saveResponses,
    isSigned: dynamicSigned,
    refetch: refetchDynamic,
  } = useDynamicAnamneseEstetica({
    patientId: isDynamic ? patientId : null,
    appointmentId,
    templateId: isDynamic ? activeTemplate?.id || null : null,
    templateVersionId: isDynamic ? activeTemplate?.current_version_id || null : null,
    templateType,
    specialtyId,
  });

  // ─── Dynamic form state ──────────────────────────────────────────
  const [dynamicValues, setDynamicValues] = useState<DynamicFormValues>({});
  const [dynamicHasChanges, setDynamicHasChanges] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load dynamic record into form
  useEffect(() => {
    if (dynamicRecord?.responses) {
      setDynamicValues(dynamicRecord.responses);
      setDynamicHasChanges(false);
    }
  }, [dynamicRecord]);

  const handleDynamicFieldChange = useCallback((fieldId: string, value: unknown) => {
    setDynamicValues(prev => ({ ...prev, [fieldId]: value }));
    setDynamicHasChanges(true);

    // Autosave after 3 seconds
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

  // ─── PDF export ──────────────────────────────────────────────────
  const { generateConsolidatedPdf, exporting: exportingPdf } = useConsolidatedFillerPdf();

  const handlePrint = useCallback(() => {
    if (!patientId) return;
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
      recordResponses: dynamicRecord?.responses as Record<string, any> | null,
      recordData: dynamicRecord?.responses as Record<string, any> | null,
    });
  }, [patientId, appointmentId, dynamicRecord, patientName, patientBirthDate, patientPhone, patientCpf, professionalName, professionalRegistration, generateConsolidatedPdf]);

  // Template change
  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    setDynamicValues({});
    setDynamicHasChanges(false);
    setIsCreatingNew(false);
  }, []);

  // ─── Auto-select first record when loaded ──────────────────────
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

  // ─── No templates available ──────────────────────────────────────
  if (v2Templates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-10 text-center">
          <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Nenhum modelo de anamnese configurado</h3>
          <p className="text-sm text-muted-foreground">
            Configure os modelos de anamnese para a especialidade Estética nas configurações.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Determine what to show ──────────────────────────────────────
  const hasDynamicRecord = !!dynamicRecord;
  const showForm = isDynamic && (hasDynamicRecord || isCreatingNew);
  const hasAnyRecord = hasDynamicRecord || v2Records.length > 0;

  // ─── Empty state: no records yet ─────────────────────────────────
  if (!hasAnyRecord && !isCreatingNew) {
    return (
      <div className="space-y-4">
        {/* Template selector */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Anamnese Estética</h3>
          </div>
          {v2Templates.length > 1 && (
            <Select value={selectedTemplateId || ''} onValueChange={handleTemplateChange}>
              <SelectTrigger className="w-64 h-8 text-xs">
                <SelectValue placeholder="Selecionar modelo..." />
              </SelectTrigger>
              <SelectContent>
                {v2Templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-3">Nenhuma anamnese registrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {activeTemplate ? `Modelo: ${activeTemplate.name}` : 'Selecione um modelo para começar'}
            </p>
            {canEdit && isDynamic && (
              <Button onClick={() => setIsCreatingNew(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Anamnese
              </Button>
            )}
            {!isDynamic && activeTemplate && (
              <p className="text-sm text-muted-foreground">
                Este modelo não possui estrutura avançada configurada.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Main rendering: dynamic form ────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">
              {activeTemplate?.name || 'Anamnese Estética'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {dynamicRecord
                ? `Registro de ${format(parseISO(dynamicRecord.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                : 'Novo registro'}
              {dynamicSigned && ' • Assinada'}
            </p>
          </div>
          {dynamicSigned && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Assinada
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Template selector */}
          {v2Templates.length > 1 && (
            <Select value={selectedTemplateId || ''} onValueChange={handleTemplateChange}>
              <SelectTrigger className="w-56 h-8 text-xs">
                <SelectValue placeholder="Modelo..." />
              </SelectTrigger>
              <SelectContent>
                {v2Templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* PDF export */}
          {canExport && dynamicRecord && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={exportingPdf}
                title="Imprimir ficha consolidada"
              >
                <Printer className="h-4 w-4 mr-1.5" />
                {exportingPdf ? 'Gerando...' : 'Imprimir'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={exportingPdf}
                title="Gerar PDF consolidado"
              >
                <Download className="h-4 w-4 mr-1.5" />
                {exportingPdf ? 'Gerando...' : 'PDF'}
              </Button>
            </>
          )}

          {/* Save button */}
          {canEdit && isDynamic && (
            <Button
              size="sm"
              onClick={handleDynamicSave}
              disabled={dynamicSaving || !dynamicHasChanges}
            >
              <Save className="h-4 w-4 mr-1.5" />
              {dynamicSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </div>
      </div>

      {/* V2 Records list (if multiple) */}
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

      {/* Dynamic form */}
      {isDynamic ? (
        dynamicLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <DynamicAnamneseRenderer
            fields={dynamicFields}
            values={dynamicValues}
            onChange={handleDynamicFieldChange}
            disabled={!canEdit || dynamicSigned}
          />
        )
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Este modelo não possui estrutura avançada configurada.
              Selecione um modelo com estrutura dinâmica.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
