/**
 * Hook para exportação consolidada do PDF de Preenchimento com Ácido Hialurônico.
 * 
 * Une em um único documento:
 * - Dados do paciente
 * - Plano clínico (anamnese estética)
 * - Mapa facial com marcações
 * - Resumo de aplicações
 * - Produtos utilizados
 * - Observações finais
 */

import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { escapeHtml } from '@/lib/htmlEscape';
import {
  FACIAL_MUSCLES,
  SIDE_LABELS,
} from '@/components/prontuario/aesthetics/types';
import type { FacialMapApplication } from '@/components/prontuario/aesthetics/types';

// Import the filler base image
import fillerFrontalImg from '@/assets/facial-map-filler-frontal.png';

interface PatientForPdf {
  full_name: string;
  birth_date?: string | null;
  phone?: string | null;
  cpf?: string | null;
}

interface ConsolidatedPdfParams {
  patientId: string;
  appointmentId?: string | null;
  patient: PatientForPdf;
  professionalName?: string | null;
  professionalRegistration?: string | null;
  recordId?: string | null;
  recordTemplateId?: string | null;
  recordTemplateVersionId?: string | null;
  recordStructureSnapshot?: unknown | null;
  recordSpecialtyId?: string | null;
  /** Pass the current record's responses directly so the PDF reads from the active record */
  recordResponses?: Record<string, any> | null;
  /** Pass the current record's data directly */
  recordData?: Record<string, any> | null;
}

interface ConsolidatedProduct {
  product_name: string;
  manufacturer?: string | null;
  batch_number?: string | null;
  expiry_date?: string | null;
  quantity: number;
  unit: string;
  application_area?: string | null;
}

interface RawAnamnesisRecord {
  id: string;
  appointment_id: string | null;
  specialty_id: string | null;
  template_id: string | null;
  template_version_id: string | null;
  responses: unknown;
  data: unknown;
  structure_snapshot: unknown;
  created_at: string;
}

interface TemplateFieldDefinition {
  id: string;
  label: string;
  order: number;
}

interface FacialMapSelectionContext {
  appointmentId?: string | null;
  recordId?: string | null;
  templateId?: string | null;
  templateVersionId?: string | null;
  recordCreatedAt?: string | null;
}

const SYSTEM_RESPONSE_KEYS = new Set([
  'id',
  'created_at',
  'updated_at',
  'template_id',
  'template_version_id',
  'appointment_id',
  'specialty_id',
  'patient_id',
  'clinic_id',
  'professional_id',
]);

function asRecord(value: unknown): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, any>;
}

function mergeRecordData(...sources: unknown[]): Record<string, any> {
  return sources.reduce<Record<string, any>>((acc, source) => {
    return { ...acc, ...asRecord(source) };
  }, {});
}

function isMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.some(isMeaningfulValue);
  if (typeof value === 'object') return Object.keys(asRecord(value)).length > 0;
  return true;
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function valueToDisplay(value: unknown): string {
  if (!isMeaningfulValue(value)) return '';

  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => valueToDisplay(item))
      .filter(Boolean)
      .join(', ');
  }

  const objectValue = asRecord(value);
  const entries = Object.entries(objectValue)
    .map(([key, nestedValue]) => {
      const nestedDisplay = valueToDisplay(nestedValue);
      return nestedDisplay ? `${humanizeKey(key)}: ${nestedDisplay}` : '';
    })
    .filter(Boolean);

  return entries.join(' • ');
}

function buildFieldRow(label: string, value: unknown): string {
  const renderedValue = valueToDisplay(value);
  if (!renderedValue) return '';

  return `<div class="field-row"><span class="field-label">${escapeHtml(label)}:</span> <span class="field-value">${escapeHtml(renderedValue)}</span></div>`;
}

function extractTemplateFields(structure: unknown): TemplateFieldDefinition[] {
  if (!Array.isArray(structure)) return [];

  const fields: TemplateFieldDefinition[] = [];

  structure.forEach((section, sectionIndex) => {
    const sectionObj = asRecord(section);
    const sectionFields = Array.isArray(sectionObj.fields)
      ? sectionObj.fields
      : Array.isArray(sectionObj.campos)
        ? sectionObj.campos
        : [];

    sectionFields.forEach((field, fieldIndex) => {
      const fieldObj = asRecord(field);
      const id = String(fieldObj.id || fieldObj.name || fieldObj.nome || '').trim();
      if (!id) return;

      const label = String(fieldObj.label || fieldObj.nome || fieldObj.name || humanizeKey(id)).trim();

      fields.push({
        id,
        label,
        order: sectionIndex * 1000 + fieldIndex,
      });
    });
  });

  const uniqueById = new Map<string, TemplateFieldDefinition>();
  fields
    .sort((a, b) => a.order - b.order)
    .forEach((field) => {
      if (!uniqueById.has(field.id)) {
        uniqueById.set(field.id, field);
      }
    });

  return Array.from(uniqueById.values());
}

function buildPlanFields(data: Record<string, any>, templateStructure: unknown): string {
  const renderedRows: string[] = [];
  const renderedKeys = new Set<string>();

  const templateFields = extractTemplateFields(templateStructure);
  if (templateFields.length > 0) {
    templateFields.forEach((field) => {
      const value = data[field.id];
      if (!isMeaningfulValue(value)) return;

      const row = buildFieldRow(field.label, value);
      if (row) {
        renderedRows.push(row);
        renderedKeys.add(field.id);
      }
    });
  }

  Object.entries(data)
    .filter(([key, value]) => {
      if (renderedKeys.has(key)) return false;
      if (SYSTEM_RESPONSE_KEYS.has(key)) return false;
      return isMeaningfulValue(value);
    })
    .forEach(([key, value]) => {
      const row = buildFieldRow(humanizeKey(key), value);
      if (row) {
        renderedRows.push(row);
      }
    });

  if (renderedRows.length === 0) {
    return '<p style="font-size:11px; color:#64748b;">Nenhum campo preenchido encontrado no registro selecionado.</p>';
  }

  return renderedRows.join('');
}

function mapDistanceScore(sourceDate: string | null | undefined, targetDate: string | null | undefined): number {
  if (!sourceDate || !targetDate) return 0;

  const source = new Date(sourceDate).getTime();
  const target = new Date(targetDate).getTime();
  if (!Number.isFinite(source) || !Number.isFinite(target)) return 0;

  const diffInDays = Math.abs(source - target) / (1000 * 60 * 60 * 24);
  return Math.max(0, 40 - diffInDays);
}

function scoreFacialMap(mapRow: any, context: FacialMapSelectionContext): number {
  const rowData = asRecord(mapRow?.data);
  let score = 0;

  if (context.recordId && (rowData.anamnesis_record_id === context.recordId || rowData.record_id === context.recordId)) {
    score += 1000;
  }

  if (context.templateVersionId && rowData.template_version_id === context.templateVersionId) {
    score += 700;
  }

  if (context.templateId && rowData.template_id === context.templateId) {
    score += 500;
  }

  const mapAppointmentId = rowData.appointment_id || null;
  if (context.appointmentId) {
    if (mapAppointmentId === context.appointmentId) {
      score += 300;
    } else {
      score -= 120;
    }
  } else if (!mapAppointmentId) {
    score += 80;
  }

  if (rowData.specialty_key === 'estetica' || rowData.specialty === 'estetica') {
    score += 60;
  }

  score += mapDistanceScore(mapRow?.created_at, context.recordCreatedAt);
  return score;
}

function selectBestFacialMap(mapRows: any[], context: FacialMapSelectionContext): any | null {
  if (!mapRows.length) return null;

  return [...mapRows].sort((a, b) => {
    const scoreDiff = scoreFacialMap(b, context) - scoreFacialMap(a, context);
    if (scoreDiff !== 0) return scoreDiff;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  })[0];
}

function parseApplicationRow(row: any): FacialMapApplication {
  const rowData = asRecord(row?.data);
  const positionX = Number(rowData.position_x ?? 50);
  const positionY = Number(rowData.position_y ?? 50);

  return {
    id: row.id,
    clinic_id: String(rowData.clinic_id || ''),
    patient_id: String(rowData.patient_id || ''),
    appointment_id: (rowData.appointment_id as string | null) ?? null,
    professional_id: (rowData.professional_id as string | null) ?? null,
    facial_map_id: row.facial_map_id,
    procedure_type: (rowData.procedure_type || 'filler') as any,
    view_type: (rowData.view_type || 'frontal') as any,
    position_x: Number.isFinite(positionX) ? positionX : 50,
    position_y: Number.isFinite(positionY) ? positionY : 50,
    muscle: (row.region || rowData.muscle || null) as string | null,
    product_name: (row.product_name || 'A definir') as string,
    quantity: Number(row.units ?? rowData.quantity ?? 0),
    unit: String(rowData.unit || 'ml'),
    side: (rowData.side as any) ?? null,
    notes: (row.notes || null) as string | null,
    created_at: row.created_at,
    created_by: (rowData.created_by || null) as string | null,
    updated_at: (rowData.updated_at || row.created_at) as string,
  };
}

function buildProductsFromApplications(applications: FacialMapApplication[]): ConsolidatedProduct[] {
  const grouped = new Map<string, ConsolidatedProduct>();

  applications.forEach((application) => {
    const productName = application.product_name || 'Produto não informado';
    const unit = application.unit || 'ml';
    const key = `${productName.toLowerCase()}::${unit.toLowerCase()}`;
    const muscleName = application.muscle ? getMuscleName(application.muscle) : null;

    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        product_name: productName,
        quantity: Number(application.quantity || 0),
        unit,
        application_area: muscleName,
      });
      return;
    }

    existing.quantity += Number(application.quantity || 0);
    if (muscleName) {
      const currentAreas = new Set((existing.application_area || '').split(',').map((area) => area.trim()).filter(Boolean));
      currentAreas.add(muscleName);
      existing.application_area = Array.from(currentAreas).join(', ');
    }
  });

  return Array.from(grouped.values());
}

async function fetchLatestAnamnesisRecord(params: {
  clinicId: string;
  patientId: string;
  appointmentId?: string | null;
  specialtyId?: string | null;
}): Promise<RawAnamnesisRecord | null> {
  const runQuery = async (withAppointment: boolean) => {
    let query = supabase
      .from('anamnesis_records')
      .select('id, appointment_id, specialty_id, template_id, template_version_id, responses, data, structure_snapshot, created_at')
      .eq('clinic_id', params.clinicId)
      .eq('patient_id', params.patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (withAppointment && params.appointmentId) {
      query = query.eq('appointment_id', params.appointmentId);
    }

    if (params.specialtyId) {
      query = query.eq('specialty_id', params.specialtyId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as RawAnamnesisRecord | null) || null;
  };

  const withAppointment = await runQuery(true);
  if (withAppointment) return withAppointment;

  if (params.appointmentId) {
    return runQuery(false);
  }

  return withAppointment;
}

function getMuscleName(id: string): string {
  return FACIAL_MUSCLES.find(m => m.id === id)?.name || id;
}

function calcAge(birthDate: string | null | undefined): string {
  if (!birthDate) return '';
  try {
    const diff = new Date().getFullYear() - new Date(birthDate).getFullYear();
    return `${diff} anos`;
  } catch { return ''; }
}

export function useConsolidatedFillerPdf() {
  const [exporting, setExporting] = useState(false);
  const { clinic } = useClinicData();

  const generateConsolidatedPdf = useCallback(async ({
    patientId,
    appointmentId,
    patient,
    professionalName,
    professionalRegistration,
    recordId,
    recordTemplateId,
    recordTemplateVersionId,
    recordStructureSnapshot,
    recordSpecialtyId,
    recordResponses,
    recordData,
  }: ConsolidatedPdfParams) => {
    setExporting(true);
    try {
      if (!clinic?.id) {
        toast.error('Clínica não identificada para exportação.');
        return;
      }

      // 1. Fetch document settings
      let docSettings: any = null;
      {
        const { data } = await supabase
          .from('clinic_document_settings')
          .select('*')
          .eq('clinic_id', clinic.id)
          .maybeSingle();
        docSettings = data;
      }

      // 2. Resolve current anamnesis record (recordId > payload snapshot > latest)
      let resolvedRecord: RawAnamnesisRecord | null = null;
      let resolvedTemplateId = recordTemplateId || null;
      let resolvedTemplateVersionId = recordTemplateVersionId || null;
      let resolvedAppointmentId = appointmentId || null;
      let resolvedStructureSnapshot = recordStructureSnapshot || null;

      let anamnesisData = mergeRecordData(recordData, recordResponses);

      if (recordId) {
        const { data: selectedRecord, error } = await supabase
          .from('anamnesis_records')
          .select('id, appointment_id, specialty_id, template_id, template_version_id, responses, data, structure_snapshot, created_at')
          .eq('id', recordId)
          .eq('clinic_id', clinic.id)
          .eq('patient_id', patientId)
          .maybeSingle();

        if (error) throw error;

        if (!selectedRecord) {
          toast.error('Registro selecionado não foi encontrado para exportação.');
          return;
        }

        resolvedRecord = selectedRecord as RawAnamnesisRecord;
        resolvedTemplateId = resolvedRecord.template_id || resolvedTemplateId;
        resolvedTemplateVersionId = resolvedRecord.template_version_id || resolvedTemplateVersionId;
        resolvedAppointmentId = resolvedRecord.appointment_id || resolvedAppointmentId;
        resolvedStructureSnapshot = resolvedRecord.structure_snapshot || resolvedStructureSnapshot;

        anamnesisData = mergeRecordData(resolvedRecord.data, resolvedRecord.responses);
      }

      if (!resolvedRecord && Object.keys(anamnesisData).length === 0) {
        const fallbackRecord = await fetchLatestAnamnesisRecord({
          clinicId: clinic.id,
          patientId,
          appointmentId: resolvedAppointmentId,
          specialtyId: recordSpecialtyId || null,
        });

        if (fallbackRecord) {
          resolvedRecord = fallbackRecord;
          resolvedTemplateId = fallbackRecord.template_id || resolvedTemplateId;
          resolvedTemplateVersionId = fallbackRecord.template_version_id || resolvedTemplateVersionId;
          resolvedAppointmentId = fallbackRecord.appointment_id || resolvedAppointmentId;
          resolvedStructureSnapshot = fallbackRecord.structure_snapshot || resolvedStructureSnapshot;
          anamnesisData = mergeRecordData(fallbackRecord.data, fallbackRecord.responses);
        }
      }

      if (Object.keys(anamnesisData).length === 0) {
        toast.error('O registro selecionado não possui dados preenchidos para exportação.');
        return;
      }

      // 3. Resolve template structure + title (version snapshot first)
      let templateStructure: unknown = resolvedStructureSnapshot;
      let documentTitle = 'Plano de Preenchimento com Ácido Hialurônico';

      if (!templateStructure && resolvedTemplateVersionId) {
        const { data: templateVersion, error } = await supabase
          .from('anamnesis_template_versions')
          .select('structure')
          .eq('id', resolvedTemplateVersionId)
          .maybeSingle();

        if (error) throw error;
        templateStructure = templateVersion?.structure || null;
      }

      if (resolvedTemplateId) {
        const { data: template, error } = await supabase
          .from('anamnesis_templates')
          .select('name')
          .eq('id', resolvedTemplateId)
          .maybeSingle();

        if (error) throw error;
        if (template?.name) {
          documentTitle = template.name;
        }
      }

      const planFieldsHtml = buildPlanFields(anamnesisData, templateStructure);

      // 4. Resolve linked facial map + applications + map image
      const { data: mapRows, error: mapError } = await supabase
        .from('facial_maps')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (mapError) throw mapError;

      const selectedMap = selectBestFacialMap(mapRows || [], {
        appointmentId: resolvedAppointmentId,
        recordId: recordId || resolvedRecord?.id || null,
        templateId: resolvedTemplateId,
        templateVersionId: resolvedTemplateVersionId,
        recordCreatedAt: resolvedRecord?.created_at || null,
      });

      if (!selectedMap) {
        toast.error('Não foi encontrado mapa facial vinculado ao registro selecionado.');
        return;
      }

      const [applicationsResult, mapImagesResult] = await Promise.all([
        supabase
          .from('facial_map_applications')
          .select('*')
          .eq('facial_map_id', selectedMap.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('facial_map_images')
          .select('image_url')
          .eq('facial_map_id', selectedMap.id)
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      if (applicationsResult.error) throw applicationsResult.error;
      if (mapImagesResult.error) throw mapImagesResult.error;

      const applications = (applicationsResult.data || []).map(parseApplicationRow);
      const fillerApps = applications.filter((application) => (application.procedure_type || 'filler') === 'filler');
      const mapImageUrl = mapImagesResult.data?.[0]?.image_url || fillerFrontalImg;
      const mapNotes = selectedMap?.notes || '';

      // 5. Fetch products used (and fallback to map applications if table is unavailable)
      let products: ConsolidatedProduct[] = [];
      try {
        let query = supabase
          .from('aesthetic_products_used')
          .select('*')
          .eq('clinic_id', clinic.id)
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });

        if (resolvedAppointmentId) {
          query = query.eq('appointment_id', resolvedAppointmentId);
        }

        const { data, error } = await query;

        if (error) {
          const errorMessage = `${error.message || ''} ${(error as any).details || ''}`;
          const tableMissing = errorMessage.includes('does not exist') || String((error as any).code || '').includes('42P01');
          if (!tableMissing) {
            throw error;
          }
        } else {
          const rows = (data as any[]) || [];
          products = rows
            .filter((row) => {
              if (!resolvedAppointmentId) return true;
              return row.appointment_id === resolvedAppointmentId || row.appointment_id == null;
            })
            .filter((row) => {
              if (!row.facial_map_id) return true;
              return row.facial_map_id === selectedMap.id;
            })
            .filter((row) => (row.procedure_type || 'filler') === 'filler')
            .map((row) => ({
              product_name: row.product_name || 'Produto não informado',
              manufacturer: row.manufacturer || null,
              batch_number: row.batch_number || null,
              expiry_date: row.expiry_date || null,
              quantity: Number(row.quantity || 0),
              unit: row.unit || 'ml',
              application_area: row.application_area || null,
            }));
        }
      } catch (error) {
        console.warn('[ConsolidatedPDF] fallback para produtos derivados das aplicações do mapa', error);
      }

      if (products.length === 0) {
        products = buildProductsFromApplications(fillerApps);
      }

      // 6. Calculate totals and derived content
      const totalVolume = fillerApps.reduce((sum, application) => sum + Number(application.quantity || 0), 0);
      const treatedRegions = [...new Set(fillerApps.map((application) => getMuscleName(application.muscle || 'outros')))];
      const productByName = new Map(products.map((product) => [product.product_name.toLowerCase(), product]));

      const finalObservations = [
        valueToDisplay(anamnesisData.observacoes_finais),
        valueToDisplay(anamnesisData.observacoes_gerais),
        valueToDisplay(anamnesisData.observacoes_clinicas),
        valueToDisplay(anamnesisData.orientacoes_pos_procedimento),
        valueToDisplay(mapNotes),
      ].filter(Boolean);

      const uniqueObservations = Array.from(new Set(finalObservations));

      const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const clinicName = docSettings?.clinic_name || clinic?.name || '';
      const primaryColor = docSettings?.primary_color || '#2563eb';
      const footerText = docSettings?.footer_text || '';
      const showFooter = docSettings?.show_footer ?? true;
      const logoUrl = docSettings?.logo_url || clinic?.logo_url || '';
      const profName = professionalName || docSettings?.responsible_name || '';
      const profReg = professionalRegistration || docSettings?.responsible_crm || '';

      // 7. Build HTML
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(documentTitle)} - ${escapeHtml(patient.full_name)}</title>
  <style>
    @media print { @page { margin: 12mm; size: A4; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; line-height: 1.5; color: #1a1a1a; }
    
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${primaryColor}; padding-bottom: 12px; margin-bottom: 16px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .header-logo { max-height: 50px; max-width: 120px; }
    .header h1 { font-size: 16px; color: ${primaryColor}; margin-bottom: 2px; }
    .header .doc-title { font-size: 13px; color: #475569; font-weight: 600; }
    .header .meta { text-align: right; font-size: 10px; color: #64748b; }

    .patient-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .patient-box .label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .patient-box .value { font-size: 11px; font-weight: 500; }

    .section { margin-bottom: 18px; }
    .section-title { font-size: 13px; font-weight: 700; color: ${primaryColor}; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
    .section-content { font-size: 11px; }
    .field-row { margin-bottom: 6px; }
    .field-label { font-weight: 600; color: #334155; }
    .field-value { color: #1e293b; }

    .map-container { text-align: center; margin: 12px 0; position: relative; }
    .map-container img { max-width: 320px; max-height: 400px; border: 1px solid #e2e8f0; border-radius: 8px; }
    .map-marker { position: absolute; width: 18px; height: 18px; border-radius: 50%; background: rgba(37, 99, 235, 0.85); color: white; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); transform: translate(-50%, -50%); }

    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 8px; }
    th { background: #f1f5f9; padding: 6px 5px; text-align: left; font-weight: 600; color: #475569; border-bottom: 1px solid #cbd5e1; }
    td { padding: 5px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .badge { display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 9px; font-weight: 500; }
    .badge-filler { background: #eff6ff; color: #2563eb; }

    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 10px 0; }
    .summary-card { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 10px; text-align: center; }
    .summary-card .val { font-size: 18px; font-weight: 700; color: ${primaryColor}; }
    .summary-card .lbl { font-size: 9px; color: #64748b; text-transform: uppercase; }

    .notes-box { background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; margin: 10px 0; }
    .notes-box h4 { font-size: 11px; color: #854d0e; margin-bottom: 4px; }
    .notes-box p { color: #713f12; font-size: 11px; }

    .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
    .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
    .sig-block { width: 200px; text-align: center; }
    .sig-line { border-top: 1px solid #1a1a1a; padding-top: 4px; font-size: 10px; color: #475569; }
    .footer-text { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 16px; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 60px; color: rgba(0,0,0,0.03); font-weight: 700; pointer-events: none; z-index: -1; }
  </style>
</head>
<body>
  ${docSettings?.watermark_type === 'text' && docSettings?.watermark_text ? `<div class="watermark">${escapeHtml(docSettings.watermark_text)}</div>` : ''}

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" class="header-logo" crossorigin="anonymous" />` : ''}
      <div>
        <h1>${escapeHtml(clinicName)}</h1>
        <div class="doc-title">${escapeHtml(documentTitle)}</div>
      </div>
    </div>
    <div class="meta">
      Emitido em ${dateStr}<br/>
      ${profName ? `Prof.: ${escapeHtml(profName)}` : ''}
      ${profReg ? `<br/>${escapeHtml(profReg)}` : ''}
    </div>
  </div>

  <!-- PATIENT DATA -->
  <div class="patient-box">
    <div><span class="label">Paciente</span><div class="value">${escapeHtml(patient.full_name)}</div></div>
    <div><span class="label">Data de Nascimento / Idade</span><div class="value">${patient.birth_date ? escapeHtml(format(new Date(patient.birth_date), 'dd/MM/yyyy')) + ' (' + calcAge(patient.birth_date) + ')' : '-'}</div></div>
    ${patient.cpf ? `<div><span class="label">CPF</span><div class="value">${escapeHtml(patient.cpf)}</div></div>` : ''}
    ${patient.phone ? `<div><span class="label">Telefone</span><div class="value">${escapeHtml(patient.phone)}</div></div>` : ''}
  </div>

  <!-- CLINICAL PLAN DATA -->
  <div class="section">
    <div class="section-title">Dados Clínicos do Plano</div>
    <div class="section-content">
      ${planFieldsHtml}
    </div>
  </div>

  <!-- FACIAL MAP -->
  <div class="section">
    <div class="section-title">Mapa Facial</div>
    <div class="map-container" style="display: inline-block; position: relative;">
      <img src="${escapeHtml(mapImageUrl)}" alt="Mapa Facial" crossorigin="anonymous" />
      ${fillerApps.map((app, i) => {
        const x = app.position_x ?? 50;
        const y = app.position_y ?? 50;
        return `<div class="map-marker" style="left: ${x}%; top: ${y}%;" title="${escapeHtml(getMuscleName(app.muscle || ''))}">${i + 1}</div>`;
      }).join('')}
    </div>
    ${fillerApps.length > 0 ? `<p style="font-size:10px; color:#64748b; text-align:center; margin-top:4px;">Os números correspondem às aplicações listadas abaixo.</p>` : '<p style="font-size:10px; color:#94a3b8; text-align:center;">Nenhuma marcação registrada.</p>'}
  </div>

  <!-- APPLICATIONS SUMMARY -->
  ${fillerApps.length > 0 ? `
  <div class="section">
    <div class="section-title">Resumo das Aplicações</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Região</th>
          <th>Lado</th>
          <th>Produto</th>
          <th>Fabricante</th>
          <th>Lote</th>
          <th>Validade</th>
          <th>Qtd</th>
          <th>Unidade</th>
          <th>Observações</th>
        </tr>
      </thead>
      <tbody>
        ${fillerApps.map((app, i) => {
          const relatedProduct = productByName.get((app.product_name || '').toLowerCase());
          return `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${escapeHtml(getMuscleName(app.muscle || 'outros'))}</strong></td>
          <td>${escapeHtml(app.side ? SIDE_LABELS[app.side] || app.side : '-')}</td>
          <td>${escapeHtml(app.product_name || '-')}</td>
          <td>${escapeHtml(relatedProduct?.manufacturer || '-')}</td>
          <td>${escapeHtml(relatedProduct?.batch_number || '-')}</td>
          <td>${relatedProduct?.expiry_date ? escapeHtml(format(new Date(relatedProduct.expiry_date), 'dd/MM/yyyy')) : '-'}</td>
          <td><strong>${app.quantity}</strong></td>
          <td>${escapeHtml(app.unit)}</td>
          <td>${escapeHtml(app.notes) || '-'}</td>
        </tr>
        `;
        }).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <!-- PRODUCTS USED -->
  ${products.length > 0 ? `
  <div class="section">
    <div class="section-title">Produtos Utilizados — Rastreabilidade</div>
    <table>
      <thead>
        <tr>
          <th>Produto</th>
          <th>Fabricante</th>
          <th>Lote</th>
          <th>Validade</th>
          <th>Qtd</th>
          <th>Área</th>
        </tr>
      </thead>
      <tbody>
        ${products.map(p => `
        <tr>
          <td><strong>${escapeHtml(p.product_name)}</strong></td>
          <td>${escapeHtml(p.manufacturer) || '-'}</td>
          <td>${escapeHtml(p.batch_number) || '-'}</td>
          <td>${p.expiry_date ? format(new Date(p.expiry_date), 'dd/MM/yyyy') : '-'}</td>
          <td>${Number(p.quantity || 0)} ${escapeHtml(p.unit || '')}</td>
          <td>${escapeHtml(p.application_area) || '-'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <!-- FINAL SUMMARY -->
  <div class="section">
    <div class="section-title">Resumo Final</div>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="val">${totalVolume.toFixed(1)} ml</div>
        <div class="lbl">Volume Total</div>
      </div>
      <div class="summary-card">
        <div class="val">${fillerApps.length}</div>
        <div class="lbl">Pontos Aplicados</div>
      </div>
      <div class="summary-card">
        <div class="val">${treatedRegions.length}</div>
        <div class="lbl">Regiões Tratadas</div>
      </div>
    </div>
    ${treatedRegions.length > 0 ? `<p style="margin-top:6px;"><strong>Regiões:</strong> ${treatedRegions.map(r => escapeHtml(String(r))).join(', ')}</p>` : ''}
  </div>

  ${uniqueObservations.length > 0 ? `
  <div class="notes-box">
    <h4>Observações Clínicas Finais</h4>
    <p>${escapeHtml(uniqueObservations.join(' • '))}</p>
  </div>
  ` : ''}

  <!-- SIGNATURES & FOOTER -->
  <div class="footer">
    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line">Profissional Responsável${profName ? `<br/>${escapeHtml(profName)}` : ''}${profReg ? `<br/>${escapeHtml(profReg)}` : ''}</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Paciente<br/>${escapeHtml(patient.full_name)}</div>
      </div>
    </div>
    ${showFooter && footerText ? `<div class="footer-text">${escapeHtml(footerText)}</div>` : ''}
    <div class="footer-text">Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
  </div>
</body>
</html>`;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
        toast.success('PDF consolidado gerado com sucesso!');
      } else {
        toast.error('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.');
      }
    } catch (error) {
      console.error('Consolidated PDF error:', error);
      toast.error('Erro ao gerar PDF consolidado. Tente novamente.');
    } finally {
      setExporting(false);
    }
  }, [clinic]);

  return { generateConsolidatedPdf, exporting };
}
