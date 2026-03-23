/**
 * Clinical Modules System Types
 * Hybrid architecture: code defaults + clinic overrides
 */

export type ClinicalModuleCategory = 
  | 'clinical_record'
  | 'documentation'
  | 'assessment'
  | 'visual'
  | 'planning';

export type ClinicalModuleKey = 
  | 'recurring_sessions'
  | 'clinical_scales'
  | 'procedures_module'
  | 'advanced_uploads'
  | 'interactive_map'
  | 'odontogram'
  | 'body_measurements'
  | 'before_after'
  | 'consent_terms'
  | 'therapeutic_plan';

export interface ClinicalModule {
  id: string;
  key: ClinicalModuleKey;
  name: string;
  description: string | null;
  category: ClinicalModuleCategory;
  icon: string | null;
  display_order: number;
  is_system: boolean;
}

export interface SpecialtyModuleDefault {
  id: string;
  specialty_id: string;
  module_id: string;
  is_enabled: boolean;
}

export interface ClinicSpecialtyModule {
  id: string;
  clinic_id: string;
  specialty_id: string;
  module_id: string;
  is_enabled: boolean;
  updated_at: string;
}

export interface ModuleWithStatus extends ClinicalModule {
  is_enabled: boolean;
  source: 'default' | 'clinic_override';
}

// Clinical Scales
export type ScaleType = 'numeric' | 'categorical' | 'visual_analog';

export interface ScaleRange {
  min: number;
  max: number;
  label: string;
}

export interface ScaleOption {
  value: number;
  label: string;
}

export interface ClinicalScale {
  id: string;
  clinic_id: string | null;
  name: string;
  description: string | null;
  scale_type: ScaleType;
  min_value: number | null;
  max_value: number | null;
  unit: string | null;
  options: ScaleOption[] | null;
  interpretation_guide: { ranges?: ScaleRange[]; description?: string } | null;
  is_system: boolean;
  is_active: boolean;
}

export interface PatientScaleReading {
  id: string;
  clinic_id: string;
  patient_id: string;
  scale_id: string;
  appointment_id: string | null;
  evolution_id: string | null;
  value: number;
  notes: string | null;
  recorded_by: string;
  recorded_at: string;
  scale?: ClinicalScale;
}

// Body Measurements
export interface BodyMeasurement {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id: string | null;
  measurement_date: string;
  weight_kg: number | null;
  height_cm: number | null;
  bmi: number | null;
  body_fat_percent: number | null;
  muscle_mass_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  chest_cm: number | null;
  arm_left_cm: number | null;
  arm_right_cm: number | null;
  thigh_left_cm: number | null;
  thigh_right_cm: number | null;
  calf_left_cm: number | null;
  calf_right_cm: number | null;
  custom_measurements: Record<string, number> | null;
  notes: string | null;
  recorded_by: string;
  created_at: string;
}

// Before/After
export interface BeforeAfterRecord {
  id: string;
  clinic_id: string;
  patient_id: string;
  procedure_id: string | null;
  appointment_id: string | null;
  title: string;
  description: string | null;
  before_image_url: string;
  before_date: string;
  after_image_url: string | null;
  after_date: string | null;
  is_consent_given: boolean;
  consent_for_marketing: boolean;
  created_by: string;
  created_at: string;
}

// Recurring Sessions
export type SessionPlanStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type SessionEntryStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled';

export interface RecurringSessionPlan {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  procedure_id: string | null;
  title: string;
  description: string | null;
  total_sessions: number;
  completed_sessions: number;
  frequency: string | null;
  start_date: string;
  expected_end_date: string | null;
  actual_end_date: string | null;
  status: SessionPlanStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface RecurringSessionEntry {
  id: string;
  plan_id: string;
  session_number: number;
  appointment_id: string | null;
  status: SessionEntryStatus;
  notes: string | null;
  completed_at: string | null;
  completed_by: string | null;
}

// Therapeutic Plans
export type TherapeuticPlanStatus = 'draft' | 'active' | 'under_review' | 'completed' | 'discontinued';

export interface TherapeuticObjective {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'achieved' | 'not_achieved';
  notes?: string;
}

export interface TherapeuticIntervention {
  id: string;
  description: string;
  frequency?: string;
  status: 'planned' | 'ongoing' | 'completed';
}

export interface TherapeuticPlan {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  specialty_id: string | null;
  title: string;
  objectives: TherapeuticObjective[] | null;
  interventions: TherapeuticIntervention[] | null;
  expected_outcomes: string | null;
  start_date: string;
  review_date: string | null;
  status: TherapeuticPlanStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
}

// Interactive Maps
export interface MapAnnotation {
  x: number;
  y: number;
  label: string;
  color?: string;
  notes?: string;
}

export interface InteractiveMapAnnotation {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id: string | null;
  map_type: 'body_front' | 'body_back' | 'face' | 'custom';
  custom_image_url: string | null;
  annotations: MapAnnotation[];
  notes: string | null;
  created_by: string;
  created_at: string;
}

// Clinical Media
export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface ClinicalMedia {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id: string | null;
  evolution_id: string | null;
  media_type: MediaType;
  file_url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  metadata: Record<string, unknown> | null;
  tags: string[] | null;
  is_consent_given: boolean;
  uploaded_by: string;
  created_at: string;
}

// Module key to specialty mapping (defaults)
// Core modules active for ALL specialties
export const CORE_MODULES: ClinicalModuleKey[] = [
  'clinical_scales',
  'consent_terms',
];

export const DEFAULT_SPECIALTY_MODULES: Record<string, ClinicalModuleKey[]> = {
  // Clínica Geral - base + procedimentos
  'clinica_geral': [...CORE_MODULES, 'procedures_module'],
  'clinica geral': [...CORE_MODULES, 'procedures_module'],
  
  // Psicologia - sessões recorrentes + plano terapêutico
  'psicologia': [...CORE_MODULES, 'recurring_sessions', 'therapeutic_plan'],
  
  // Nutrição - medidas corporais + plano terapêutico
  'nutricao': [...CORE_MODULES, 'body_measurements', 'therapeutic_plan'],
  'nutrição': [...CORE_MODULES, 'body_measurements', 'therapeutic_plan'],
  
  // Fisioterapia - sessões + medidas + plano + mapa interativo
  'fisioterapia': [...CORE_MODULES, 'recurring_sessions', 'body_measurements', 'therapeutic_plan', 'interactive_map'],
  
  // Fisioterapia – Pilates (subtipo, mesmos módulos)
  'fisioterapia_pilates': [...CORE_MODULES, 'recurring_sessions', 'body_measurements', 'therapeutic_plan', 'interactive_map'],
  'fisioterapia – pilates': [...CORE_MODULES, 'recurring_sessions', 'body_measurements', 'therapeutic_plan', 'interactive_map'],
  'fisioterapia - pilates': [...CORE_MODULES, 'recurring_sessions', 'body_measurements', 'therapeutic_plan', 'interactive_map'],
  
  // Fonoaudiologia - sessões recorrentes + plano terapêutico
  'fonoaudiologia': [...CORE_MODULES, 'recurring_sessions', 'therapeutic_plan'],
  
  // Estética / Harmonização Facial - antes/depois + medidas + uploads + mapa
  'estetica': [...CORE_MODULES, 'before_after', 'body_measurements', 'procedures_module', 'advanced_uploads', 'interactive_map'],
  'estética': [...CORE_MODULES, 'before_after', 'body_measurements', 'procedures_module', 'advanced_uploads', 'interactive_map'],
  'harmonizacao_facial': [...CORE_MODULES, 'before_after', 'body_measurements', 'procedures_module', 'advanced_uploads', 'interactive_map'],
  'harmonização facial': [...CORE_MODULES, 'before_after', 'body_measurements', 'procedures_module', 'advanced_uploads', 'interactive_map'],
  'estetica / harmonizacao facial': [...CORE_MODULES, 'before_after', 'body_measurements', 'procedures_module', 'advanced_uploads', 'interactive_map'],
  'estética / harmonização facial': [...CORE_MODULES, 'before_after', 'body_measurements', 'procedures_module', 'advanced_uploads', 'interactive_map'],
  
  // Odontologia - odontograma + procedimentos + antes/depois
  'odontologia': [...CORE_MODULES, 'odontogram', 'procedures_module', 'before_after'],
  
  // Dermatologia - antes/depois + uploads + mapa interativo
  'dermatologia': [...CORE_MODULES, 'before_after', 'procedures_module', 'advanced_uploads', 'interactive_map'],
  
  // Pediatria - escalas + medidas corporais
  'pediatria': [...CORE_MODULES, 'body_measurements'],
  
  // Psiquiatria - sessões + plano terapêutico
  'psiquiatria': [...CORE_MODULES, 'recurring_sessions', 'therapeutic_plan'],
  
  // Cardiologia
  'cardiologia': [...CORE_MODULES, 'procedures_module'],
  
  // Oftalmologia
  'oftalmologia': [...CORE_MODULES, 'procedures_module'],
  
  // Especialidade Personalizada - apenas núcleo comum por padrão
  'especialidade_personalizada': [...CORE_MODULES],
  'personalizada': [...CORE_MODULES],
  'outra': [...CORE_MODULES],
  'outro': [...CORE_MODULES],
  'outros': [...CORE_MODULES],
};

// Category labels in Portuguese
export const MODULE_CATEGORY_LABELS: Record<ClinicalModuleCategory, string> = {
  clinical_record: 'Registro Clínico',
  documentation: 'Documentação',
  assessment: 'Avaliação',
  visual: 'Visual',
  planning: 'Planejamento',
};
