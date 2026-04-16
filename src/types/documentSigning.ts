/**
 * Unified Document Signing Types
 * 
 * Context-agnostic types for signing any document in YesClin.
 * Used by all modules: prontuário, atendimento, termos, documentos clínicos, PDFs.
 */

export type DocumentType =
  | 'evolution'
  | 'anamnesis'
  | 'consolidated_document'
  | 'consent_term'
  | 'clinical_document'
  | 'prescription'
  | 'certificate'
  | 'report';

export type SourceModule =
  | 'prontuario'
  | 'atendimento'
  | 'documentos'
  | 'termos'
  | 'comercial';

export type SigningMode = 'saved_signature' | 'manual_canvas' | 'password_reauth';

export interface SignableDocumentContext {
  /** Unique ID of the record/document being signed */
  record_id: string;
  /** Type of document */
  document_type: DocumentType;
  /** Module that originated the signing request */
  source_module: SourceModule;
  /** Specialty slug (optional, for clinical records) */
  specialty_slug?: string;
  /** Patient ID */
  patient_id: string;
  /** Appointment ID (optional) */
  appointment_id?: string;
  /** Content snapshot for hashing and immutability */
  content: Record<string, unknown>;
  /** Display label for the document type */
  document_label?: string;
  /** Display info */
  patient_name: string;
  professional_name: string;
  /** Whether LGPD consent is valid */
  has_valid_consent?: boolean;
  /** The DB table to update status on (e.g. 'anamnesis_records', 'clinical_evolutions') */
  target_table?: string;
}

export interface DocumentSignatureResult {
  success: boolean;
  signature_id?: string;
  verification_token?: string;
  document_hash?: string;
  signed_at?: string;
}

export interface DocumentSignatureRecord {
  id: string;
  clinic_id: string;
  patient_id: string;
  record_id: string;
  record_type: string;
  signature_hash: string;
  signed_by: string;
  signed_by_name: string;
  signed_at: string;
  sign_method: string;
  signature_level: string;
  verification_token: string;
  is_revoked: boolean;
  evidence_snapshot?: Record<string, unknown>;
}
