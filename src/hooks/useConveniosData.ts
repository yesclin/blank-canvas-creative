import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  Insurance,
  PatientInsurance,
  InsuranceFeeRule,
  TissGuide,
  InsuranceFeeCalculation,
  InsuranceProcedure,
  InsuranceAuthorization,
  ConveniosStats,
  ConvenioFinancialSummary,
} from '@/types/convenios';

// =============================================
// HELPER: Get clinic_id from current user
// =============================================

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single();
    
  if (!profile?.clinic_id) throw new Error('Clínica não encontrada');
  return profile.clinic_id;
}

// =============================================
// INSURANCES (Convênios)
// =============================================

export function useInsurances() {
  return useQuery({
    queryKey: ['insurances'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('insurances')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('name');
      
      if (error) throw error;
      return (data || []) as Insurance[];
    },
  });
}

export function useCreateInsurance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: Partial<Insurance>) => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('insurances')
        .insert({
          clinic_id: clinicId,
          name: formData.name,
          code: formData.code || null,
          ans_code: formData.ans_code || null,
          tiss_code: formData.tiss_code || null,
          contact_phone: formData.contact_phone || null,
          contact_email: formData.contact_email || null,
          requires_authorization: formData.requires_authorization || false,
          return_allowed: formData.return_allowed ?? true,
          return_days: formData.return_days || 30,
          allowed_guide_types: formData.allowed_guide_types || ['consulta', 'sp_sadt'],
          default_fee_type: formData.default_fee_type || 'percentage',
          default_fee_value: formData.default_fee_value || 50,
          default_payment_deadline_days: formData.default_payment_deadline_days || 30,
          notes: formData.notes || null,
          is_active: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurances'] });
      queryClient.invalidateQueries({ queryKey: ['convenios-stats'] });
      toast.success('Convênio cadastrado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating insurance:', error);
      toast.error(error.message || 'Erro ao cadastrar convênio');
    },
  });
}

export function useUpdateInsurance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: Partial<Insurance> }) => {
      const { data, error } = await supabase
        .from('insurances')
        .update({
          name: formData.name,
          code: formData.code || null,
          ans_code: formData.ans_code || null,
          tiss_code: formData.tiss_code || null,
          contact_phone: formData.contact_phone || null,
          contact_email: formData.contact_email || null,
          requires_authorization: formData.requires_authorization || false,
          return_allowed: formData.return_allowed ?? true,
          return_days: formData.return_days || 30,
          allowed_guide_types: formData.allowed_guide_types || ['consulta', 'sp_sadt'],
          default_fee_type: formData.default_fee_type || 'percentage',
          default_fee_value: formData.default_fee_value || 50,
          default_payment_deadline_days: formData.default_payment_deadline_days || 30,
          notes: formData.notes || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurances'] });
      queryClient.invalidateQueries({ queryKey: ['convenios-stats'] });
      toast.success('Convênio atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error updating insurance:', error);
      toast.error(error.message || 'Erro ao atualizar convênio');
    },
  });
}

export function useToggleInsuranceStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('insurances')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['insurances'] });
      queryClient.invalidateQueries({ queryKey: ['convenios-stats'] });
      toast.success(variables.is_active ? 'Convênio ativado!' : 'Convênio desativado!');
    },
    onError: (error: any) => {
      console.error('Error toggling insurance status:', error);
      toast.error('Erro ao alterar status do convênio');
    },
  });
}

// =============================================
// PATIENT INSURANCES (Carteirinhas)
// =============================================

export function usePatientInsurances() {
  return useQuery({
    queryKey: ['patient-insurances'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('patient_insurances')
        .select(`
          *,
          patients:patient_id (full_name),
          insurances:insurance_id (name)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        patient_name: item.patients?.full_name || 'Paciente não encontrado',
        insurance_name: item.insurances?.name || 'Convênio não encontrado',
      })) as PatientInsurance[];
    },
  });
}

// =============================================
// AUTHORIZATIONS (Autorizações)
// =============================================

export function useAuthorizations() {
  return useQuery({
    queryKey: ['insurance-authorizations'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('insurance_authorizations')
        .select(`
          *,
          insurances:insurance_id (name),
          patients:patient_id (full_name),
          procedures:procedure_id (name)
        `)
        .eq('clinic_id', clinicId)
        .order('authorization_date', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        insurance_name: item.insurances?.name || '',
        patient_name: item.patients?.full_name || '',
        procedure_name: item.procedures?.name || '',
      })) as InsuranceAuthorization[];
    },
  });
}

// =============================================
// TISS GUIDES (Guias TISS)
// =============================================

export function useTissGuides() {
  return useQuery({
    queryKey: ['tiss-guides'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('tiss_guides')
        .select(`
          *,
          insurances:insurance_id (name),
          patients:patient_id (full_name),
          professionals:professional_id (full_name)
        `)
        .eq('clinic_id', clinicId)
        .order('issue_date', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        insurance_name: item.insurances?.name || '',
        patient_name: item.patients?.full_name || '',
        professional_name: item.professionals?.full_name || '',
      })) as TissGuide[];
    },
  });
}

// =============================================
// FEE RULES (Regras de Repasse)
// =============================================

export function useFeeRules() {
  return useQuery({
    queryKey: ['insurance-fee-rules'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('insurance_fee_rules')
        .select(`
          *,
          insurances:insurance_id (name)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        insurance_name: item.insurances?.name || '',
      })) as InsuranceFeeRule[];
    },
  });
}

// =============================================
// FEE CALCULATIONS (Cálculos de Repasse)
// =============================================

export function useFeeCalculations() {
  return useQuery({
    queryKey: ['insurance-fee-calculations'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('insurance_fee_calculations')
        .select(`
          *,
          insurances:insurance_id (name),
          patients:patient_id (full_name),
          professionals:professional_id (full_name),
          tiss_guides:guide_id (guide_number)
        `)
        .eq('clinic_id', clinicId)
        .order('service_date', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        insurance_name: item.insurances?.name || '',
        patient_name: item.patients?.full_name || '',
        professional_name: item.professionals?.full_name || '',
        guide_number: item.tiss_guides?.guide_number || '',
      })) as InsuranceFeeCalculation[];
    },
  });
}

// =============================================
// INSURANCE PROCEDURES
// =============================================

export function useInsuranceProcedures() {
  return useQuery({
    queryKey: ['insurance-procedures'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('insurance_procedures')
        .select(`
          *,
          insurances:insurance_id (name),
          procedures:procedure_id (name, tuss_code)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        insurance_name: item.insurances?.name || '',
        procedure_name: item.procedures?.name || '',
        procedure_code: item.procedures?.tuss_code || '',
      })) as InsuranceProcedure[];
    },
  });
}

// =============================================
// STATS (Estatísticas)
// =============================================

export function useConveniosStats() {
  return useQuery({
    queryKey: ['convenios-stats'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      // Fetch all necessary data in parallel
      const [
        insurancesResult,
        patientInsurancesResult,
        authorizationsResult,
        guidesResult,
        feeCalculationsResult,
      ] = await Promise.all([
        supabase
          .from('insurances')
          .select('id, is_active')
          .eq('clinic_id', clinicId),
        supabase
          .from('patient_insurances')
          .select('id, is_active')
          .eq('clinic_id', clinicId)
          .eq('is_active', true),
        supabase
          .from('insurance_authorizations')
          .select('id, status')
          .eq('clinic_id', clinicId),
        supabase
          .from('tiss_guides')
          .select('id, status, total_requested, total_approved')
          .eq('clinic_id', clinicId),
        supabase
          .from('insurance_fee_calculations')
          .select('id, status, gross_value')
          .eq('clinic_id', clinicId),
      ]);
      
      const insurances = insurancesResult.data || [];
      const patientInsurances = patientInsurancesResult.data || [];
      const authorizations = authorizationsResult.data || [];
      const guides = guidesResult.data || [];
      const feeCalculations = feeCalculationsResult.data || [];
      
      const activeInsurances = insurances.filter((i: any) => i.is_active);
      const openGuides = guides.filter((g: any) => ['rascunho', 'aberta', 'enviada'].includes(g.status));
      const approvedGuides = guides.filter((g: any) => ['aprovada', 'aprovada_parcial'].includes(g.status));
      const pendingAuthorizations = authorizations.filter((a: any) => a.status === 'pendente');
      const approvedAuthorizations = authorizations.filter((a: any) => a.status === 'aprovada');
      const pendingFees = feeCalculations.filter((f: any) => f.status === 'pendente');
      
      return {
        totalInsurances: insurances.length,
        activeInsurances: activeInsurances.length,
        totalPatientInsurances: patientInsurances.length,
        pendingAuthorizations: pendingAuthorizations.length,
        approvedAuthorizations: approvedAuthorizations.length,
        totalGuides: guides.length,
        openGuides: openGuides.length,
        approvedGuides: approvedGuides.length,
        pendingFees: pendingFees.length,
        totalPendingValue: pendingFees.reduce((sum: number, f: any) => sum + (f.gross_value || 0), 0),
        totalApprovedValue: approvedGuides.reduce((sum: number, g: any) => sum + (g.total_approved || 0), 0),
      } as ConveniosStats;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// =============================================
// FINANCIAL SUMMARY
// =============================================

export function useFinancialSummary() {
  const { data: insurances = [] } = useInsurances();
  const { data: guides = [] } = useTissGuides();
  const { data: feeCalculations = [] } = useFeeCalculations();
  
  const summary: ConvenioFinancialSummary[] = insurances
    .filter((i: Insurance) => i.is_active)
    .map((insurance: Insurance) => {
      const insuranceGuides = guides.filter((g: TissGuide) => g.insurance_id === insurance.id);
      const insuranceFees = feeCalculations.filter((f: InsuranceFeeCalculation) => f.insurance_id === insurance.id);
      
      return {
        insuranceId: insurance.id,
        insuranceName: insurance.name,
        totalGuides: insuranceGuides.length,
        totalRequested: insuranceGuides.reduce((sum, g) => sum + (g.total_requested || 0), 0),
        totalApproved: insuranceGuides.reduce((sum, g) => sum + (g.total_approved || 0), 0),
        totalGlosa: insuranceGuides.reduce((sum, g) => sum + (g.total_glosa || 0), 0),
        totalProfessionalFees: insuranceFees.reduce((sum, f) => sum + (f.professional_fee || 0), 0),
        totalClinicNet: insuranceFees.reduce((sum, f) => sum + (f.clinic_net_value || 0), 0),
        pendingPayments: insuranceFees.filter(f => f.status === 'pendente').length,
      };
    });
  
  return summary;
}

// =============================================
// PATIENTS & PROFESSIONALS (Reference Data)
// =============================================

export function usePatients() {
  return useQuery({
    queryKey: ['patients-reference'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('full_name');
      
      if (error) throw error;
      
      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.full_name,
      }));
    },
  });
}

export function useProfessionals() {
  return useQuery({
    queryKey: ['professionals-reference'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('professionals')
        .select('id, full_name')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('full_name');
      
      if (error) throw error;
      
      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.full_name,
      }));
    },
  });
}

// =============================================
// MAIN HOOK
// =============================================

export function useConveniosFullData() {
  const { data: insurances = [], isLoading: insurancesLoading } = useInsurances();
  const { data: patientInsurances = [], isLoading: patientInsurancesLoading } = usePatientInsurances();
  const { data: authorizations = [], isLoading: authorizationsLoading } = useAuthorizations();
  const { data: guides = [], isLoading: guidesLoading } = useTissGuides();
  const { data: feeRules = [], isLoading: feeRulesLoading } = useFeeRules();
  const { data: feeCalculations = [], isLoading: feeCalculationsLoading } = useFeeCalculations();
  const { data: insuranceProcedures = [], isLoading: insuranceProceduresLoading } = useInsuranceProcedures();
  const { data: stats, isLoading: statsLoading } = useConveniosStats();
  const financialSummary = useFinancialSummary();
  const { data: patients = [] } = usePatients();
  const { data: professionals = [] } = useProfessionals();
  
  const isLoading = insurancesLoading || patientInsurancesLoading || authorizationsLoading || 
    guidesLoading || feeRulesLoading || feeCalculationsLoading || insuranceProceduresLoading || statsLoading;
  
  // Default stats if loading
  const defaultStats: ConveniosStats = {
    totalInsurances: 0,
    activeInsurances: 0,
    totalPatientInsurances: 0,
    pendingAuthorizations: 0,
    approvedAuthorizations: 0,
    totalGuides: 0,
    openGuides: 0,
    approvedGuides: 0,
    pendingFees: 0,
    totalPendingValue: 0,
    totalApprovedValue: 0,
  };
  
  return {
    // Data
    insurances,
    patientInsurances,
    feeRules,
    guides,
    feeCalculations,
    insuranceProcedures,
    authorizations,
    
    // Aggregations
    stats: stats || defaultStats,
    financialSummary,
    
    // Reference data
    patients,
    professionals,
    
    // Loading state
    isLoading,
  };
}
