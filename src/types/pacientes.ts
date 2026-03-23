// Types for Patients module

export interface Patient {
  id: string;
  clinic_id: string;
  full_name: string;
  birth_date: string | null;
  gender: 'M' | 'F' | 'O' | null;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  notes: string | null;
  has_clinical_alert: boolean;
  clinical_alert_text: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed/joined fields
  insurance?: PatientInsurance | null;
  clinical_data?: PatientClinicalData | null;
  guardian?: PatientGuardian | null;
  last_appointment_date?: string | null;
  total_appointments?: number;
}

export interface PatientClinicalData {
  id: string;
  patient_id: string;
  clinic_id: string;
  allergies: string[];
  chronic_diseases: string[];
  current_medications: string[];
  blood_type: string | null;
  family_history: string | null;
  clinical_restrictions: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientGuardian {
  id: string;
  patient_id: string;
  clinic_id: string;
  full_name: string;
  relationship: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientInsurance {
  id: string;
  patient_id: string;
  insurance_id: string;
  insurance_name: string;
  card_number: string | null;
  valid_until: string | null;
  plan_name: string | null;
}

export interface PatientAppointmentHistory {
  id: string;
  scheduled_date: string;
  start_time: string;
  status: string;
  appointment_type: string;
  professional_name: string;
  specialty_name: string | null;
  procedure_name: string | null;
}

export interface PatientAttachment {
  id: string;
  patient_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number | null;
  category: 'document' | 'exam' | 'image' | 'other';
  description: string | null;
  created_at: string;
  uploaded_by: string | null;
}

// Filter types
export interface PatientFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  insuranceType: 'all' | 'particular' | 'insurance';
  insuranceId: string | null;
  professionalId: string | null;
}

export type PatientSortField = 'name' | 'last_appointment' | 'created_at';
export type PatientSortOrder = 'asc' | 'desc';

// Form types
export interface PatientFormData {
  full_name: string;
  birth_date: string;
  gender: 'M' | 'F' | 'O' | '';
  cpf: string;
  rg: string;
  marital_status: string;
  phone: string;
  email: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  notes: string;
  // Insurance
  payment_type: 'particular' | 'insurance';
  insurance_id: string;
  card_number: string;
  valid_until: string;
  plan_name: string;
  // Guardian
  has_guardian: boolean;
  guardian_name: string;
  guardian_relationship: string;
  guardian_cpf: string;
  guardian_rg: string;
  guardian_phone: string;
  guardian_email: string;
  // Clinical summary
  allergies: string;
  chronic_diseases: string;
  current_medications: string;
  clinical_restrictions: string;
}

// Labels and constants
export const genderLabels: Record<string, string> = {
  M: 'Masculino',
  F: 'Feminino',
  O: 'Outro',
};

export const maritalStatusOptions = [
  'Solteiro(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viúvo(a)',
  'União Estável',
  'Separado(a)',
];

export const relationshipOptions = [
  'Pai',
  'Mãe',
  'Cônjuge',
  'Filho(a)',
  'Irmão(ã)',
  'Avô/Avó',
  'Tio(a)',
  'Outro',
];

export const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];
