import { useState, useMemo } from 'react';
import type {
  Insurance,
  PatientInsurance,
  InsuranceFeeRule,
  TissGuide,
  TissGuideItem,
  TissGuideHistory,
  InsuranceFeeCalculation,
  InsuranceProcedure,
  InsuranceAuthorization,
  ConveniosStats,
  ConvenioFinancialSummary,
} from '@/types/convenios';

// =============================================
// MOCK DATA - CONVÊNIOS
// =============================================

const mockInsurances: Insurance[] = [
  { 
    id: '1', 
    clinic_id: '1', 
    name: 'Unimed', 
    code: 'UNI001', 
    ans_code: '359017', 
    tiss_code: '359017',
    contact_phone: '(11) 3344-5566', 
    contact_email: 'autorizacao@unimed.com.br',
    requires_authorization: true, 
    return_allowed: true, 
    return_days: 30, 
    allowed_guide_types: ['consulta', 'sp_sadt'],
    default_fee_type: 'percentage',
    default_fee_value: 50,
    default_payment_deadline_days: 45,
    is_active: true, 
    created_at: '2024-01-01', 
    updated_at: '2024-01-01' 
  },
  { 
    id: '2', 
    clinic_id: '1', 
    name: 'Bradesco Saúde', 
    code: 'BRA001', 
    ans_code: '005711', 
    tiss_code: '005711',
    contact_phone: '(11) 4444-5555',
    contact_email: 'guias@bradescosaude.com.br', 
    requires_authorization: true, 
    return_allowed: true, 
    return_days: 15, 
    allowed_guide_types: ['consulta', 'sp_sadt', 'internacao'],
    default_fee_type: 'percentage',
    default_fee_value: 40,
    default_payment_deadline_days: 30,
    is_active: true, 
    created_at: '2024-01-01', 
    updated_at: '2024-01-01' 
  },
  { 
    id: '3', 
    clinic_id: '1', 
    name: 'SulAmérica', 
    code: 'SUL001', 
    ans_code: '006246',
    tiss_code: '006246', 
    contact_phone: '(11) 5555-6666',
    requires_authorization: false, 
    return_allowed: true, 
    return_days: 30, 
    allowed_guide_types: ['consulta', 'sp_sadt'],
    default_fee_type: 'fixed',
    default_fee_value: 150,
    default_payment_deadline_days: 60,
    is_active: true, 
    created_at: '2024-01-01', 
    updated_at: '2024-01-01' 
  },
  { 
    id: '4', 
    clinic_id: '1', 
    name: 'Amil', 
    code: 'AMI001', 
    ans_code: '326305',
    tiss_code: '326305', 
    contact_phone: '(11) 6666-7777',
    requires_authorization: true, 
    return_allowed: false, 
    return_days: 0, 
    allowed_guide_types: ['consulta', 'sp_sadt'],
    default_fee_type: 'percentage',
    default_fee_value: 35,
    default_payment_deadline_days: 30,
    is_active: true, 
    created_at: '2024-01-01', 
    updated_at: '2024-01-01' 
  },
];

const mockPatientInsurances: PatientInsurance[] = [
  { 
    id: '1', 
    clinic_id: '1', 
    patient_id: '1', 
    insurance_id: '1', 
    card_number: '0123456789012345', 
    valid_until: '2025-12-31', 
    holder_type: 'titular',
    is_primary: true, 
    is_active: true, 
    created_at: '2024-01-01', 
    updated_at: '2024-01-01',
    patient_name: 'Maria Silva',
    insurance_name: 'Unimed'
  },
  { 
    id: '2', 
    clinic_id: '1', 
    patient_id: '2', 
    insurance_id: '2', 
    card_number: '9876543210123456', 
    valid_until: '2025-06-30', 
    holder_type: 'dependente',
    holder_name: 'João Santos Sr.',
    holder_cpf: '123.456.789-00',
    is_primary: true, 
    is_active: true, 
    created_at: '2024-01-01', 
    updated_at: '2024-01-01',
    patient_name: 'João Santos',
    insurance_name: 'Bradesco Saúde'
  },
  { 
    id: '3', 
    clinic_id: '1', 
    patient_id: '3', 
    insurance_id: '3', 
    card_number: '5678901234567890', 
    valid_until: '2024-12-31', 
    holder_type: 'titular',
    is_primary: true, 
    is_active: true, 
    created_at: '2024-01-01', 
    updated_at: '2024-01-01',
    patient_name: 'Ana Costa',
    insurance_name: 'SulAmérica'
  },
];

const mockFeeRules: InsuranceFeeRule[] = [
  { 
    id: '1', 
    clinic_id: '1', 
    insurance_id: '1',
    fee_type: 'percentage', 
    fee_value: 50, 
    payment_deadline_days: 45,
    description: 'Repasse padrão Unimed',
    is_active: true, 
    created_at: '2024-01-01', 
    updated_at: '2024-01-01',
    insurance_name: 'Unimed'
  },
  { 
    id: '2', 
    clinic_id: '1', 
    insurance_id: '2',
    fee_type: 'percentage', 
    fee_value: 40, 
    payment_deadline_days: 30,
    description: 'Repasse padrão Bradesco',
    is_active: true, 
    created_at: '2024-01-01', 
    updated_at: '2024-01-01',
    insurance_name: 'Bradesco Saúde'
  },
  { 
    id: '3', 
    clinic_id: '1', 
    insurance_id: '3',
    fee_type: 'fixed', 
    fee_value: 150, 
    payment_deadline_days: 60,
    description: 'Repasse fixo SulAmérica',
    is_active: true, 
    created_at: '2024-01-01', 
    updated_at: '2024-01-01',
    insurance_name: 'SulAmérica'
  },
];

const mockTissGuides: TissGuide[] = [
  {
    id: '1',
    clinic_id: '1',
    patient_id: '1',
    insurance_id: '1',
    professional_id: '1',
    patient_insurance_id: '1',
    guide_type: 'consulta',
    guide_number: 'GUIA-2024-0001',
    main_authorization_number: 'AUTH-2024-001',
    issue_date: '2024-01-20',
    service_date: '2024-01-20',
    status: 'aprovada',
    total_requested: 250.00,
    total_approved: 250.00,
    total_glosa: 0,
    beneficiary_card_number: '0123456789012345',
    beneficiary_name: 'Maria Silva',
    tiss_version: '4.00.00',
    created_at: '2024-01-20',
    updated_at: '2024-01-21',
    patient_name: 'Maria Silva',
    insurance_name: 'Unimed',
    professional_name: 'Dra. Ana Santos',
  },
  {
    id: '2',
    clinic_id: '1',
    patient_id: '2',
    insurance_id: '2',
    professional_id: '1',
    patient_insurance_id: '2',
    guide_type: 'sp_sadt',
    guide_number: 'GUIA-2024-0002',
    issue_date: '2024-01-22',
    service_date: '2024-01-22',
    status: 'enviada',
    total_requested: 850.00,
    total_approved: 0,
    total_glosa: 0,
    beneficiary_card_number: '9876543210123456',
    beneficiary_name: 'João Santos',
    tiss_version: '4.00.00',
    created_at: '2024-01-22',
    updated_at: '2024-01-22',
    patient_name: 'João Santos',
    insurance_name: 'Bradesco Saúde',
    professional_name: 'Dra. Ana Santos',
  },
  {
    id: '3',
    clinic_id: '1',
    patient_id: '3',
    insurance_id: '3',
    professional_id: '2',
    patient_insurance_id: '3',
    guide_type: 'consulta',
    guide_number: 'GUIA-2024-0003',
    issue_date: '2024-01-23',
    service_date: '2024-01-23',
    status: 'aberta',
    total_requested: 200.00,
    total_approved: 0,
    total_glosa: 0,
    beneficiary_card_number: '5678901234567890',
    beneficiary_name: 'Ana Costa',
    tiss_version: '4.00.00',
    created_at: '2024-01-23',
    updated_at: '2024-01-23',
    patient_name: 'Ana Costa',
    insurance_name: 'SulAmérica',
    professional_name: 'Dr. Carlos Lima',
  },
  {
    id: '4',
    clinic_id: '1',
    patient_id: '1',
    insurance_id: '1',
    professional_id: '1',
    patient_insurance_id: '1',
    guide_type: 'sp_sadt',
    guide_number: 'GUIA-2024-0004',
    main_authorization_number: 'AUTH-2024-004',
    issue_date: '2024-01-18',
    service_date: '2024-01-18',
    status: 'aprovada_parcial',
    total_requested: 1200.00,
    total_approved: 950.00,
    total_glosa: 250.00,
    beneficiary_card_number: '0123456789012345',
    beneficiary_name: 'Maria Silva',
    tiss_version: '4.00.00',
    notes: 'Glosa parcial no procedimento 2',
    created_at: '2024-01-18',
    updated_at: '2024-01-19',
    patient_name: 'Maria Silva',
    insurance_name: 'Unimed',
    professional_name: 'Dra. Ana Santos',
  },
  {
    id: '5',
    clinic_id: '1',
    patient_id: '2',
    insurance_id: '2',
    professional_id: '2',
    guide_type: 'consulta',
    guide_number: 'GUIA-2024-0005',
    issue_date: '2024-01-15',
    service_date: '2024-01-15',
    status: 'negada',
    total_requested: 300.00,
    total_approved: 0,
    total_glosa: 300.00,
    beneficiary_card_number: '9876543210123456',
    beneficiary_name: 'João Santos',
    tiss_version: '4.00.00',
    rejection_reason: 'Carteirinha vencida no momento do atendimento',
    created_at: '2024-01-15',
    updated_at: '2024-01-17',
    patient_name: 'João Santos',
    insurance_name: 'Bradesco Saúde',
    professional_name: 'Dr. Carlos Lima',
  },
];

const mockGuideItems: TissGuideItem[] = [
  {
    id: '1',
    clinic_id: '1',
    guide_id: '1',
    procedure_id: '1',
    procedure_code: '10101012',
    procedure_description: 'Consulta em consultório',
    quantity: 1,
    unit_value: 250.00,
    total_value: 250.00,
    approved_quantity: 1,
    approved_value: 250.00,
    glosa_value: 0,
    execution_date: '2024-01-20',
    item_order: 1,
    created_at: '2024-01-20',
    updated_at: '2024-01-20',
  },
  {
    id: '2',
    clinic_id: '1',
    guide_id: '2',
    procedure_id: '2',
    procedure_code: '20104090',
    procedure_description: 'Limpeza de pele',
    quantity: 1,
    unit_value: 350.00,
    total_value: 350.00,
    glosa_value: 0,
    execution_date: '2024-01-22',
    item_order: 1,
    created_at: '2024-01-22',
    updated_at: '2024-01-22',
  },
  {
    id: '3',
    clinic_id: '1',
    guide_id: '2',
    procedure_id: '3',
    procedure_code: '20104091',
    procedure_description: 'Peeling químico',
    quantity: 1,
    unit_value: 500.00,
    total_value: 500.00,
    glosa_value: 0,
    execution_date: '2024-01-22',
    item_order: 2,
    created_at: '2024-01-22',
    updated_at: '2024-01-22',
  },
];

const mockGuideHistory: TissGuideHistory[] = [
  {
    id: '1',
    clinic_id: '1',
    guide_id: '1',
    action: 'create',
    new_status: 'rascunho',
    performed_at: '2024-01-20T09:00:00',
    performer_name: 'Recepcionista Maria',
  },
  {
    id: '2',
    clinic_id: '1',
    guide_id: '1',
    action: 'update',
    previous_status: 'rascunho',
    new_status: 'enviada',
    performed_at: '2024-01-20T10:00:00',
    performer_name: 'Recepcionista Maria',
  },
  {
    id: '3',
    clinic_id: '1',
    guide_id: '1',
    action: 'update',
    previous_status: 'enviada',
    new_status: 'aprovada',
    performed_at: '2024-01-21T14:00:00',
    performer_name: 'Sistema',
  },
];

const mockFeeCalculations: InsuranceFeeCalculation[] = [
  {
    id: '1',
    clinic_id: '1',
    guide_id: '1',
    insurance_id: '1',
    professional_id: '1',
    patient_id: '1',
    gross_value: 250.00,
    professional_fee: 125.00,
    clinic_net_value: 125.00,
    fee_type: 'percentage',
    fee_percentage: 50,
    status: 'calculado',
    service_date: '2024-01-20',
    payment_due_date: '2024-03-05',
    reference_period: '2024-01',
    created_at: '2024-01-21',
    updated_at: '2024-01-21',
    insurance_name: 'Unimed',
    professional_name: 'Dra. Ana Santos',
    patient_name: 'Maria Silva',
    guide_number: 'GUIA-2024-0001',
  },
  {
    id: '2',
    clinic_id: '1',
    guide_id: '4',
    insurance_id: '1',
    professional_id: '1',
    patient_id: '1',
    gross_value: 950.00,
    professional_fee: 475.00,
    clinic_net_value: 475.00,
    fee_type: 'percentage',
    fee_percentage: 50,
    status: 'pendente',
    service_date: '2024-01-18',
    payment_due_date: '2024-03-03',
    reference_period: '2024-01',
    created_at: '2024-01-19',
    updated_at: '2024-01-19',
    insurance_name: 'Unimed',
    professional_name: 'Dra. Ana Santos',
    patient_name: 'Maria Silva',
    guide_number: 'GUIA-2024-0004',
  },
];

const mockInsuranceProcedures: InsuranceProcedure[] = [
  { 
    id: '1', 
    clinic_id: '1', 
    insurance_id: '1', 
    procedure_id: '1', 
    covered_value: 250.00, 
    requires_authorization: false, 
    is_active: true, 
    created_at: '2024-01-01', 
    updated_at: '2024-01-01',
    procedure_name: 'Consulta',
    procedure_code: '10101012'
  },
  { 
    id: '2', 
    clinic_id: '1', 
    insurance_id: '1', 
    procedure_id: '2', 
    covered_value: 350.00, 
    requires_authorization: true, 
    is_active: true, 
    created_at: '2024-01-01', 
    updated_at: '2024-01-01',
    procedure_name: 'Limpeza de Pele',
    procedure_code: '20104090'
  },
  { 
    id: '3', 
    clinic_id: '1', 
    insurance_id: '2', 
    procedure_id: '1', 
    covered_value: 280.00, 
    requires_authorization: false, 
    is_active: true, 
    created_at: '2024-01-01', 
    updated_at: '2024-01-01',
    procedure_name: 'Consulta',
    procedure_code: '10101012'
  },
];

const mockAuthorizations: InsuranceAuthorization[] = [
  { 
    id: '1', 
    clinic_id: '1', 
    insurance_id: '1', 
    patient_id: '1', 
    procedure_id: '2', 
    authorization_number: 'AUTH-2024-001', 
    authorization_date: '2024-01-15', 
    valid_until: '2024-02-15', 
    status: 'aprovada', 
    created_at: '2024-01-15', 
    updated_at: '2024-01-15',
    insurance_name: 'Unimed',
    patient_name: 'Maria Silva',
    procedure_name: 'Limpeza de Pele'
  },
  { 
    id: '2', 
    clinic_id: '1', 
    insurance_id: '2', 
    patient_id: '2', 
    procedure_id: '1', 
    authorization_number: 'AUTH-2024-002', 
    authorization_date: '2024-01-18', 
    status: 'pendente', 
    created_at: '2024-01-18', 
    updated_at: '2024-01-18',
    insurance_name: 'Bradesco Saúde',
    patient_name: 'João Santos',
    procedure_name: 'Consulta'
  },
  { 
    id: '3', 
    clinic_id: '1', 
    insurance_id: '1', 
    patient_id: '3', 
    procedure_id: '2', 
    authorization_number: 'AUTH-2024-003', 
    authorization_date: '2024-01-10', 
    valid_until: '2024-01-20', 
    status: 'utilizada', 
    created_at: '2024-01-10', 
    updated_at: '2024-01-20',
    insurance_name: 'Unimed',
    patient_name: 'Ana Costa',
    procedure_name: 'Limpeza de Pele'
  },
  { 
    id: '4', 
    clinic_id: '1', 
    insurance_id: '4', 
    patient_id: '1', 
    procedure_id: '3', 
    authorization_number: 'AUTH-2024-004', 
    authorization_date: '2024-01-22', 
    status: 'pendente', 
    created_at: '2024-01-22', 
    updated_at: '2024-01-22',
    insurance_name: 'Amil',
    patient_name: 'Maria Silva',
    procedure_name: 'Botox'
  },
];

// =============================================
// MOCK PROCEDURES (para referência)
// =============================================

export const mockProcedures = [
  { id: '1', name: 'Consulta', code: '10101012', price: 300.00 },
  { id: '2', name: 'Limpeza de Pele', code: '20104090', price: 450.00 },
  { id: '3', name: 'Botox', code: '20104095', price: 1500.00 },
  { id: '4', name: 'Peeling Químico', code: '20104091', price: 600.00 },
  { id: '5', name: 'Preenchimento Facial', code: '20104096', price: 2000.00 },
];

export const mockProfessionals = [
  { id: '1', name: 'Dra. Ana Santos', specialty: 'Dermatologia' },
  { id: '2', name: 'Dr. Carlos Lima', specialty: 'Clínica Geral' },
  { id: '3', name: 'Dra. Beatriz Oliveira', specialty: 'Estética' },
];

export const mockPatients = [
  { id: '1', name: 'Maria Silva' },
  { id: '2', name: 'João Santos' },
  { id: '3', name: 'Ana Costa' },
  { id: '4', name: 'Pedro Lima' },
  { id: '5', name: 'Carla Ferreira' },
];

// =============================================
// HOOK PRINCIPAL
// =============================================

export function useConveniosFullData() {
  const [insurances] = useState<Insurance[]>(mockInsurances);
  const [patientInsurances] = useState<PatientInsurance[]>(mockPatientInsurances);
  const [feeRules] = useState<InsuranceFeeRule[]>(mockFeeRules);
  const [guides] = useState<TissGuide[]>(mockTissGuides);
  const [guideItems] = useState<TissGuideItem[]>(mockGuideItems);
  const [guideHistory] = useState<TissGuideHistory[]>(mockGuideHistory);
  const [feeCalculations] = useState<InsuranceFeeCalculation[]>(mockFeeCalculations);
  const [insuranceProcedures] = useState<InsuranceProcedure[]>(mockInsuranceProcedures);
  const [authorizations] = useState<InsuranceAuthorization[]>(mockAuthorizations);

  const stats = useMemo((): ConveniosStats => {
    const activeInsurances = insurances.filter(i => i.is_active);
    const openGuides = guides.filter(g => ['rascunho', 'aberta', 'enviada'].includes(g.status));
    const approvedGuides = guides.filter(g => ['aprovada', 'aprovada_parcial'].includes(g.status));
    const pendingFees = feeCalculations.filter(f => f.status === 'pendente');
    
    return {
      totalInsurances: insurances.length,
      activeInsurances: activeInsurances.length,
      totalPatientInsurances: patientInsurances.filter(p => p.is_active).length,
      pendingAuthorizations: authorizations.filter(a => a.status === 'pendente').length,
      approvedAuthorizations: authorizations.filter(a => a.status === 'aprovada').length,
      totalGuides: guides.length,
      openGuides: openGuides.length,
      approvedGuides: approvedGuides.length,
      pendingFees: pendingFees.length,
      totalPendingValue: pendingFees.reduce((sum, f) => sum + f.gross_value, 0),
      totalApprovedValue: approvedGuides.reduce((sum, g) => sum + g.total_approved, 0),
    };
  }, [insurances, patientInsurances, authorizations, guides, feeCalculations]);

  const financialSummary = useMemo((): ConvenioFinancialSummary[] => {
    return insurances.filter(i => i.is_active).map(insurance => {
      const insuranceGuides = guides.filter(g => g.insurance_id === insurance.id);
      const insuranceFees = feeCalculations.filter(f => f.insurance_id === insurance.id);
      
      return {
        insuranceId: insurance.id,
        insuranceName: insurance.name,
        totalGuides: insuranceGuides.length,
        totalRequested: insuranceGuides.reduce((sum, g) => sum + g.total_requested, 0),
        totalApproved: insuranceGuides.reduce((sum, g) => sum + g.total_approved, 0),
        totalGlosa: insuranceGuides.reduce((sum, g) => sum + g.total_glosa, 0),
        totalProfessionalFees: insuranceFees.reduce((sum, f) => sum + f.professional_fee, 0),
        totalClinicNet: insuranceFees.reduce((sum, f) => sum + f.clinic_net_value, 0),
        pendingPayments: insuranceFees.filter(f => f.status === 'pendente').length,
      };
    });
  }, [insurances, guides, feeCalculations]);

  // Helpers
  const getInsuranceById = (id: string) => insurances.find(i => i.id === id);
  const getPatientInsurancesByPatient = (patientId: string) => 
    patientInsurances.filter(p => p.patient_id === patientId && p.is_active);
  const getGuidesByInsurance = (insuranceId: string) => 
    guides.filter(g => g.insurance_id === insuranceId);
  const getGuideItems = (guideId: string) => 
    guideItems.filter(i => i.guide_id === guideId);
  const getGuideHistory = (guideId: string) => 
    guideHistory.filter(h => h.guide_id === guideId).sort((a, b) => 
      new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime()
    );
  const getProceduresByInsurance = (insuranceId: string) =>
    insuranceProcedures.filter(p => p.insurance_id === insuranceId && p.is_active);
  const getAuthorizationsByInsurance = (insuranceId: string) =>
    authorizations.filter(a => a.insurance_id === insuranceId);
  const getFeeRulesByInsurance = (insuranceId: string) =>
    feeRules.filter(r => r.insurance_id === insuranceId && r.is_active);
  const getFeeCalculationsByProfessional = (professionalId: string) =>
    feeCalculations.filter(f => f.professional_id === professionalId);

  // Generate next guide number
  const generateGuideNumber = () => {
    const year = new Date().getFullYear();
    const lastNumber = guides
      .filter(g => g.guide_number.startsWith(`GUIA-${year}`))
      .length;
    return `GUIA-${year}-${String(lastNumber + 1).padStart(4, '0')}`;
  };

  return {
    // Data
    insurances,
    patientInsurances,
    feeRules,
    guides,
    guideItems,
    guideHistory,
    feeCalculations,
    insuranceProcedures,
    authorizations,
    
    // Aggregations
    stats,
    financialSummary,
    
    // Reference data
    procedures: mockProcedures,
    professionals: mockProfessionals,
    patients: mockPatients,
    
    // Helpers
    getInsuranceById,
    getPatientInsurancesByPatient,
    getGuidesByInsurance,
    getGuideItems,
    getGuideHistory,
    getProceduresByInsurance,
    getAuthorizationsByInsurance,
    getFeeRulesByInsurance,
    getFeeCalculationsByProfessional,
    generateGuideNumber,
  };
}
