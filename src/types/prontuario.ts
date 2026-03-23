// Tipos para o módulo de Prontuário Inteligente

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'allergy' | 'medication' | 'disease' | 'exam' | 'return' | 'contraindication' | 'other';
export type EvolutionStatus = 'draft' | 'signed' | 'amended';
export type EvolutionType = 'consultation' | 'return' | 'procedure' | 'exam' | 'followup';
export type AttachmentCategory = 'document' | 'exam' | 'image' | 'report' | 'consent' | 'prescription' | 'other';
export type Specialty = 'medical_general' | 'dentistry' | 'psychology' | 'physiotherapy' | 'nutrition' | 'aesthetics';

export interface ClinicalAlert {
  id: string;
  patient_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  description?: string;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface PatientClinicalData {
  id: string;
  patient_id: string;
  allergies: string[];
  chronic_diseases: string[];
  current_medications: string[];
  family_history?: string;
  clinical_restrictions?: string;
  blood_type?: string;
}

export interface PatientGuardian {
  id: string;
  patient_id: string;
  full_name: string;
  relationship: string;
  cpf?: string;
  phone?: string;
  email?: string;
  is_primary: boolean;
}

export interface ClinicalEvolution {
  id: string;
  patient_id: string;
  professional_id: string;
  professional_name?: string;
  appointment_id?: string;
  specialty?: Specialty;
  evolution_type: EvolutionType;
  content: Record<string, unknown>;
  notes?: string;
  status: EvolutionStatus;
  next_steps?: string;
  signed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalAttachment {
  id: string;
  patient_id: string;
  evolution_id?: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  file_url: string;
  category: AttachmentCategory;
  description?: string;
  is_before_after: boolean;
  before_after_type?: 'before' | 'after';
  created_at: string;
}

export interface SpecialtyFieldTemplate {
  id: string;
  specialty: Specialty;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options?: Record<string, unknown>;
  field_order: number;
  is_required: boolean;
}

export interface PatientSummary {
  id: string;
  full_name: string;
  birth_date?: string;
  gender?: string;
  phone?: string;
  email?: string;
  cpf?: string;
  has_clinical_alert: boolean;
  clinical_alert_text?: string;
}

// ===== ANAMNESE ESTRUTURADA =====
export interface Anamnesis {
  id: string;
  patient_id: string;
  version: number;
  is_active: boolean;
  
  // Queixa principal
  chief_complaint?: string;
  
  // História da doença atual
  current_disease_history?: string;
  
  // Doenças pré-existentes
  pre_existing_conditions: string[];
  
  // Alergias (alimenta alertas clínicos)
  allergies: string[];
  
  // Medicamentos em uso
  current_medications: string[];
  
  // Histórico familiar
  family_history?: string;
  
  // Hábitos
  habits: {
    smoking?: 'never' | 'former' | 'current';
    smoking_details?: string;
    alcohol?: 'never' | 'social' | 'regular' | 'former';
    alcohol_details?: string;
    physical_activity?: 'sedentary' | 'light' | 'moderate' | 'intense';
    physical_activity_details?: string;
    diet_notes?: string;
    sleep_notes?: string;
  };
  
  // Tipo sanguíneo
  blood_type?: string;
  
  // Restrições clínicas
  clinical_restrictions?: string;
  
  // Observações gerais
  general_observations?: string;
  
  // Campos personalizados por especialidade
  custom_fields?: Record<string, unknown>;
  
  // Auditoria
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_by?: string;
  updated_by_name?: string;
  updated_at: string;
}

export interface AnamnesisVersion {
  id: string;
  anamnesis_id: string;
  version: number;
  data: Anamnesis;
  changed_by: string;
  changed_by_name?: string;
  changed_at: string;
  change_summary?: string;
}

// ===== RESULTADO DE PESQUISA =====
export type SearchResultType = 'anamnesis' | 'evolution' | 'attachment' | 'alert';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  snippet: string;
  matchedText: string;
  date: string;
  professional?: string;
  highlight: { start: number; end: number }[];
}

// Labels e configurações
export const alertSeverityConfig: Record<AlertSeverity, { label: string; color: string; bgColor: string }> = {
  critical: { label: 'Crítico', color: 'text-red-700', bgColor: 'bg-red-100 border-red-300' },
  warning: { label: 'Atenção', color: 'text-yellow-700', bgColor: 'bg-yellow-100 border-yellow-300' },
  info: { label: 'Informativo', color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-300' },
};

export const alertTypeLabels: Record<AlertType, string> = {
  allergy: 'Alergia',
  medication: 'Medicamento',
  disease: 'Doença',
  exam: 'Exame Pendente',
  return: 'Retorno em Atraso',
  contraindication: 'Contraindicação',
  other: 'Outro',
};

export const evolutionTypeLabels: Record<EvolutionType, string> = {
  consultation: 'Consulta',
  return: 'Retorno',
  procedure: 'Procedimento',
  exam: 'Exame',
  followup: 'Acompanhamento',
};

export const evolutionStatusLabels: Record<EvolutionStatus, string> = {
  draft: 'Rascunho',
  signed: 'Assinado',
  amended: 'Retificado',
};

export const specialtyLabels: Record<Specialty, string> = {
  medical_general: 'Clínica Médica Geral',
  dentistry: 'Odontologia',
  psychology: 'Psicologia / Psiquiatria',
  physiotherapy: 'Fisioterapia',
  nutrition: 'Nutrição',
  aesthetics: 'Estética / Harmonização',
};

export const attachmentCategoryLabels: Record<AttachmentCategory, string> = {
  document: 'Documento',
  exam: 'Exame',
  image: 'Imagem',
  report: 'Laudo',
  consent: 'Consentimento',
  prescription: 'Receituário',
  other: 'Outro',
};

export const smokingLabels: Record<string, string> = {
  never: 'Nunca fumou',
  former: 'Ex-fumante',
  current: 'Fumante',
};

export const alcoholLabels: Record<string, string> = {
  never: 'Não consome',
  social: 'Social',
  regular: 'Regular',
  former: 'Ex-etilista',
};

export const physicalActivityLabels: Record<string, string> = {
  sedentary: 'Sedentário',
  light: 'Leve',
  moderate: 'Moderado',
  intense: 'Intenso',
};

export const searchResultTypeLabels: Record<SearchResultType, string> = {
  anamnesis: 'Anamnese',
  evolution: 'Evolução',
  attachment: 'Documento',
  alert: 'Alerta',
};
