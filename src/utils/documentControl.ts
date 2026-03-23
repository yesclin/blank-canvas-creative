import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';
import { logAudit } from '@/utils/auditLog';

const DOCUMENT_TYPE_PREFIX: Record<string, string> = {
  anamnese: 'AN',
  receita: 'RC',
  atestado: 'AT',
  evolucao: 'EV',
  relatorio: 'RL',
};

/**
 * Generate a SHA-256 hash of the given content string.
 */
export async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get the next sequential document number for a clinic using the atomic DB function.
 */
export async function getNextDocumentNumber(clinicId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_next_document_number', {
    p_clinic_id: clinicId,
  });
  if (error) throw new Error(`Failed to get next document number: ${error.message}`);
  return data as number;
}

/**
 * Build the document reference string, e.g., AN-2026-000001
 */
export function buildDocumentReference(type: string, sequentialNumber: number): string {
  const prefix = DOCUMENT_TYPE_PREFIX[type] || 'DOC';
  const year = new Date().getFullYear();
  const padded = String(sequentialNumber).padStart(6, '0');
  return `${prefix}-${year}-${padded}`;
}

/**
 * Generate a QR code as a data URL for the validation page.
 */
export async function generateValidationQRCode(documentId: string): Promise<string> {
  const baseUrl = window.location.origin;
  const validationUrl = `${baseUrl}/validar/${documentId}`;
  return QRCode.toDataURL(validationUrl, {
    width: 100,
    margin: 1,
    color: { dark: '#1f2937', light: '#ffffff' },
  });
}

interface RegisterDocumentParams {
  clinicId: string;
  patientId: string;
  documentType: 'anamnese' | 'receita' | 'atestado' | 'evolucao' | 'relatorio';
  documentReference: string;
  documentHash: string;
  pdfUrl?: string;
  sourceRecordId?: string;
  patientName?: string;
  professionalName?: string;
  replacesDocumentId?: string;
}

/**
 * Register a clinical document in the control table.
 * Returns the inserted document record.
 */
export async function registerClinicalDocument(params: RegisterDocumentParams) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  const insertPayload: Record<string, unknown> = {
    clinic_id: params.clinicId,
    patient_id: params.patientId,
    document_type: params.documentType,
    document_reference: params.documentReference,
    document_hash: params.documentHash,
    pdf_url: params.pdfUrl || null,
    source_record_id: params.sourceRecordId || null,
    patient_name: params.patientName || null,
    professional_name: params.professionalName || null,
    created_by: userId || null,
  };

  if (params.replacesDocumentId) {
    insertPayload.replaces_document_id = params.replacesDocumentId;
  }

  const { data, error } = await supabase
    .from('clinical_documents')
    .insert(insertPayload as any)
    .select('id')
    .single();

  if (error) throw new Error(`Failed to register document: ${error.message}`);
  return data;
}

/**
 * Replace a clinical document: revoke the old one, create a new one, and link them.
 */
export async function replaceDocument(params: {
  oldDocumentId: string;
  clinicId: string;
  patientId: string;
  documentType: string;
  reason: string;
  patientName?: string;
  professionalName?: string;
  sourceRecordId?: string;
}): Promise<{ newDocId: string; newReference: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('Não autenticado');

  // 1) Get next sequential number
  const seqNum = await getNextDocumentNumber(params.clinicId);
  const newReference = buildDocumentReference(params.documentType, seqNum);

  // 2) Build a simple hash for the replacement doc
  const hashContent = `replacement:${params.oldDocumentId}:${newReference}:${Date.now()}`;
  const newHash = await generateHash(hashContent);

  // 3) Register new document linked to old
  const registered = await registerClinicalDocument({
    clinicId: params.clinicId,
    patientId: params.patientId,
    documentType: params.documentType as any,
    documentReference: newReference,
    documentHash: newHash,
    patientName: params.patientName || null,
    professionalName: params.professionalName || null,
    sourceRecordId: params.sourceRecordId || null,
    replacesDocumentId: params.oldDocumentId,
  });

  const newDocId = registered.id;

  // 4) Revoke old document and set replaced_by link
  await supabase
    .from('clinical_documents')
    .update({
      is_revoked: true,
      revoked_at: new Date().toISOString(),
      revoked_by: userId,
      revoked_reason: params.reason,
      replaced_by_document_id: newDocId,
    } as any)
    .eq('id', params.oldDocumentId);

  // 5) Generate QR code for the new document
  const qrCodeDataUrl = await generateValidationQRCode(newDocId);

  // 6) Audit log (legacy)
  await supabase.from('clinic_audit_logs').insert({
    clinic_id: params.clinicId,
    user_id: userId,
    action: 'document_replaced',
    changes: {
      old_document_id: params.oldDocumentId,
      new_document_id: newDocId,
      new_reference: newReference,
      reason: params.reason,
    },
  });

  // 7) Audit log (new system)
  await logAudit({
    clinicId: params.clinicId,
    action: 'document_replaced',
    entityType: 'clinical_document',
    entityId: newDocId,
    metadata: {
      old_document_id: params.oldDocumentId,
      new_document_id: newDocId,
      new_reference: newReference,
      reason: params.reason,
    },
  });

  return { newDocId, newReference };
}
