// =============================================
// TIPOS DO MÓDULO CONVÊNIOS AVANÇADO - TISS
// =============================================

// =============================================
// CONVÊNIOS
// =============================================

export interface Insurance {
  id: string;
  clinic_id: string;
  name: string;
  code?: string;
  ans_code?: string;
  tiss_code?: string;
  contact_phone?: string;
  contact_email?: string;
  requires_authorization: boolean;
  return_allowed: boolean;
  return_days: number;
  allowed_guide_types?: string[];
  default_fee_type?: string;
  default_fee_value?: number;
  default_payment_deadline_days?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// VÍNCULO PACIENTE-CONVÊNIO
// =============================================

export type HolderType = 'titular' | 'dependente';

export interface PatientInsurance {
  id: string;
  clinic_id: string;
  patient_id: string;
  insurance_id: string;
  insurance?: Insurance;
  card_number: string;
  valid_until?: string;
  holder_type: HolderType;
  holder_name?: string;
  holder_cpf?: string;
  is_primary: boolean;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  patient_name?: string;
  insurance_name?: string;
}

export const holderTypeLabels: Record<HolderType, string> = {
  titular: 'Titular',
  dependente: 'Dependente',
};

// =============================================
// REGRAS DE REPASSE
// =============================================

export type FeeType = 'percentage' | 'fixed';

export interface InsuranceFeeRule {
  id: string;
  clinic_id: string;
  insurance_id: string;
  procedure_id?: string;
  professional_id?: string;
  fee_type: FeeType;
  fee_value: number;
  payment_deadline_days: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  insurance_name?: string;
  procedure_name?: string;
  professional_name?: string;
}

export const feeTypeLabels: Record<FeeType, string> = {
  percentage: 'Percentual',
  fixed: 'Valor Fixo',
};

// =============================================
// GUIAS TISS
// =============================================

export type TissGuideType = 'consulta' | 'sp_sadt' | 'internacao' | 'honorarios' | 'outras_despesas';

export type TissGuideStatus = 'rascunho' | 'aberta' | 'enviada' | 'aprovada' | 'aprovada_parcial' | 'negada' | 'cancelada';

export interface TissGuide {
  id: string;
  clinic_id: string;
  patient_id: string;
  insurance_id: string;
  professional_id?: string;
  appointment_id?: string;
  patient_insurance_id?: string;
  
  // Identificação
  guide_type: TissGuideType;
  guide_number: string;
  main_authorization_number?: string;
  
  // Datas
  issue_date: string;
  service_date: string;
  valid_until?: string;
  
  // Status
  status: TissGuideStatus;
  
  // Valores
  total_requested: number;
  total_approved: number;
  total_glosa: number;
  
  // Beneficiário
  beneficiary_card_number?: string;
  beneficiary_name?: string;
  beneficiary_card_validity?: string;
  
  // Contratado
  contractor_code?: string;
  contractor_name?: string;
  cnes_code?: string;
  
  // TISS
  tiss_version?: string;
  xml_data?: Record<string, unknown>;
  
  // Observações
  notes?: string;
  rejection_reason?: string;
  
  // Auditoria
  created_by?: string;
  updated_by?: string;
  submitted_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  patient_name?: string;
  insurance_name?: string;
  professional_name?: string;
  items?: TissGuideItem[];
}

export interface TissGuideItem {
  id: string;
  clinic_id: string;
  guide_id: string;
  procedure_id?: string;
  
  // Procedimento
  procedure_code?: string;
  procedure_description: string;
  
  // Valores
  quantity: number;
  unit_value: number;
  total_value: number;
  
  // Aprovação
  approved_quantity?: number;
  approved_value?: number;
  glosa_value: number;
  glosa_code?: string;
  glosa_reason?: string;
  
  // Informações
  execution_date?: string;
  start_time?: string;
  end_time?: string;
  pathway?: string;
  technique?: string;
  
  item_order: number;
  created_at: string;
  updated_at: string;
}

export interface TissGuideHistory {
  id: string;
  clinic_id: string;
  guide_id: string;
  action: string;
  previous_status?: string;
  new_status?: string;
  changes?: Record<string, unknown>;
  notes?: string;
  performed_by?: string;
  performed_at: string;
  // Joined
  performer_name?: string;
}

export const guideTypeLabels: Record<TissGuideType, string> = {
  consulta: 'Consulta',
  sp_sadt: 'SP/SADT',
  internacao: 'Internação',
  honorarios: 'Honorários',
  outras_despesas: 'Outras Despesas',
};

export const guideTypeDescriptions: Record<TissGuideType, string> = {
  consulta: 'Guia para consultas médicas',
  sp_sadt: 'Serviços Profissionais e SADT',
  internacao: 'Guia de internação hospitalar',
  honorarios: 'Guia de honorários individuais',
  outras_despesas: 'Outras despesas e materiais',
};

export const guideStatusLabels: Record<TissGuideStatus, string> = {
  rascunho: 'Rascunho',
  aberta: 'Em Aberto',
  enviada: 'Enviada',
  aprovada: 'Aprovada',
  aprovada_parcial: 'Aprovada Parcial',
  negada: 'Negada',
  cancelada: 'Cancelada',
};

export const guideStatusColors: Record<TissGuideStatus, string> = {
  rascunho: 'bg-muted text-muted-foreground',
  aberta: 'bg-blue-100 text-blue-800',
  enviada: 'bg-yellow-100 text-yellow-800',
  aprovada: 'bg-green-100 text-green-800',
  aprovada_parcial: 'bg-orange-100 text-orange-800',
  negada: 'bg-red-100 text-red-800',
  cancelada: 'bg-gray-100 text-gray-800',
};

// =============================================
// CÁLCULO DE REPASSES
// =============================================

export type FeeCalculationStatus = 'pendente' | 'calculado' | 'pago' | 'cancelado';

export interface InsuranceFeeCalculation {
  id: string;
  clinic_id: string;
  guide_id?: string;
  insurance_id: string;
  professional_id?: string;
  patient_id?: string;
  appointment_id?: string;
  
  // Valores
  gross_value: number;
  professional_fee: number;
  clinic_net_value: number;
  
  // Detalhes
  fee_type: string;
  fee_percentage?: number;
  fee_fixed_value?: number;
  
  // Status
  status: FeeCalculationStatus;
  service_date: string;
  payment_due_date?: string;
  payment_date?: string;
  
  reference_period?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Joined
  insurance_name?: string;
  professional_name?: string;
  patient_name?: string;
  guide_number?: string;
}

export const feeCalculationStatusLabels: Record<FeeCalculationStatus, string> = {
  pendente: 'Pendente',
  calculado: 'Calculado',
  pago: 'Pago',
  cancelado: 'Cancelado',
};

export const feeCalculationStatusColors: Record<FeeCalculationStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  calculado: 'bg-blue-100 text-blue-800',
  pago: 'bg-green-100 text-green-800',
  cancelado: 'bg-gray-100 text-gray-800',
};

// =============================================
// PROCEDIMENTOS COBERTOS
// =============================================

export interface InsuranceProcedure {
  id: string;
  clinic_id: string;
  insurance_id: string;
  procedure_id: string;
  covered_value?: number;
  requires_authorization: boolean;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  procedure_name?: string;
  procedure_code?: string;
}

// =============================================
// AUTORIZAÇÕES (existente, expandido)
// =============================================

export type AuthorizationStatus = 'pendente' | 'aprovada' | 'negada' | 'utilizada';

export interface InsuranceAuthorization {
  id: string;
  clinic_id: string;
  insurance_id: string;
  patient_id: string;
  procedure_id?: string;
  appointment_id?: string;
  authorization_number: string;
  authorization_date: string;
  valid_until?: string;
  status: AuthorizationStatus;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined
  insurance_name?: string;
  patient_name?: string;
  procedure_name?: string;
}

export const authorizationStatusLabels: Record<AuthorizationStatus, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  negada: 'Negada',
  utilizada: 'Utilizada',
};

export const authorizationStatusColors: Record<AuthorizationStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  aprovada: 'bg-green-100 text-green-800',
  negada: 'bg-red-100 text-red-800',
  utilizada: 'bg-blue-100 text-blue-800',
};

// =============================================
// ESTATÍSTICAS E RESUMOS
// =============================================

export interface ConveniosStats {
  totalInsurances: number;
  activeInsurances: number;
  totalPatientInsurances: number;
  pendingAuthorizations: number;
  approvedAuthorizations: number;
  totalGuides: number;
  openGuides: number;
  approvedGuides: number;
  pendingFees: number;
  totalPendingValue: number;
  totalApprovedValue: number;
}

export interface ConvenioFinancialSummary {
  insuranceId: string;
  insuranceName: string;
  totalGuides: number;
  totalRequested: number;
  totalApproved: number;
  totalGlosa: number;
  totalProfessionalFees: number;
  totalClinicNet: number;
  pendingPayments: number;
}
