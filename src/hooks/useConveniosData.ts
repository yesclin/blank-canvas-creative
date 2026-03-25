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
  TissGuideType,
  TissGuideStatus,
  FeeType,
} from '@/types/convenios';

// =============================================
// ENUM MAPPING: DB ↔ Frontend
// =============================================
// DB guide_type enum: consulta, sadt, internacao, honorarios, odontologica
// Frontend TissGuideType: consulta, sp_sadt, internacao, honorarios, outras_despesas

const dbToFrontendGuideType: Record<string, TissGuideType> = {
  consulta: 'consulta',
  sadt: 'sp_sadt',
  internacao: 'internacao',
  honorarios: 'honorarios',
  odontologica: 'outras_despesas',
};

const frontendToDbGuideType: Record<TissGuideType, string> = {
  consulta: 'consulta',
  sp_sadt: 'sadt',
  internacao: 'internacao',
  honorarios: 'honorarios',
  outras_despesas: 'odontologica',
};

// DB guide_status enum: rascunho, enviada, autorizada, negada, paga, glosada
// Frontend TissGuideStatus: rascunho, aberta, enviada, aprovada, aprovada_parcial, negada, cancelada

const dbToFrontendGuideStatus: Record<string, TissGuideStatus> = {
  rascunho: 'rascunho',
  enviada: 'enviada',
  autorizada: 'aprovada',
  negada: 'negada',
  paga: 'aprovada', // treat paga as approved
  glosada: 'aprovada_parcial',
};

const frontendToDbGuideStatus: Record<TissGuideStatus, string> = {
  rascunho: 'rascunho',
  aberta: 'rascunho',
  enviada: 'enviada',
  aprovada: 'autorizada',
  aprovada_parcial: 'glosada',
  negada: 'negada',
  cancelada: 'negada',
};

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
          allowed_guide_types: formData.allowed_guide_types || ['consulta', 'sadt'],
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
          allowed_guide_types: formData.allowed_guide_types || ['consulta', 'sadt'],
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
        // Map DB column names to frontend type
        valid_until: item.validity_date || null,
        holder_type: item.holder_type || 'titular',
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
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        // Map DB column names to frontend type
        authorization_date: item.requested_at ? item.requested_at.split('T')[0] : '',
        authorization_number: item.authorization_number || '',
        valid_until: item.expires_at ? item.expires_at.split('T')[0] : undefined,
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
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        // Map DB enums to frontend types
        guide_type: dbToFrontendGuideType[item.guide_type] || item.guide_type,
        status: dbToFrontendGuideStatus[item.status] || item.status,
        // Map column names
        guide_number: item.guide_number || `GUIA-${item.id.slice(0, 8).toUpperCase()}`,
        main_authorization_number: item.authorization_number || null,
        issue_date: item.issue_date || (item.created_at ? item.created_at.split('T')[0] : ''),
        service_date: item.service_date || (item.created_at ? item.created_at.split('T')[0] : ''),
        total_requested: Number(item.total_requested) || Number(item.total_amount) || 0,
        total_approved: Number(item.total_approved) || 0,
        total_glosa: Number(item.total_glosa) || 0,
        // Joined fields
        insurance_name: item.insurances?.name || '',
        patient_name: item.patients?.full_name || '',
        professional_name: item.professionals?.full_name || '',
      })) as TissGuide[];
    },
  });
}

export function useCreateTissGuide() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: {
      guide_type: TissGuideType;
      patient_id: string;
      insurance_id: string;
      professional_id: string;
      service_date: string;
      authorization_number?: string;
      beneficiary_card_number?: string;
      notes?: string;
      total_requested?: number;
    }) => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('tiss_guides')
        .insert({
          clinic_id: clinicId,
          patient_id: formData.patient_id,
          insurance_id: formData.insurance_id,
          professional_id: formData.professional_id,
          guide_type: frontendToDbGuideType[formData.guide_type] || formData.guide_type,
          status: 'rascunho',
          service_date: formData.service_date,
          issue_date: new Date().toISOString().split('T')[0],
          authorization_number: formData.authorization_number || null,
          beneficiary_card_number: formData.beneficiary_card_number || null,
          notes: formData.notes || null,
          total_requested: formData.total_requested || 0,
          total_amount: formData.total_requested || 0,
          data: {},
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiss-guides'] });
      queryClient.invalidateQueries({ queryKey: ['convenios-stats'] });
      toast.success('Guia TISS criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating TISS guide:', error);
      toast.error(error.message || 'Erro ao criar guia TISS');
    },
  });
}

export function useUpdateTissGuideStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TissGuideStatus }) => {
      const dbStatus = frontendToDbGuideStatus[status] || status;
      const updateData: any = { status: dbStatus, updated_at: new Date().toISOString() };
      if (status === 'enviada') updateData.submitted_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('tiss_guides')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiss-guides'] });
      queryClient.invalidateQueries({ queryKey: ['convenios-stats'] });
      toast.success('Status da guia atualizado!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar status');
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
          insurances:insurance_id (name),
          professionals:professional_id (full_name),
          procedures:procedure_id (name)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => {
        // Extract fee info from flat columns or fallback to config JSONB
        const config = item.config || {};
        return {
          ...item,
          fee_type: (item.fee_type || config.fee_type || 'percentage') as FeeType,
          fee_value: Number(item.fee_value) || Number(config.fee_value) || 0,
          payment_deadline_days: item.payment_deadline_days || config.payment_deadline_days || 30,
          description: item.description || config.description || '',
          insurance_name: item.insurances?.name || '',
          professional_name: item.professionals?.full_name || '',
          procedure_name: item.procedures?.name || '',
        };
      }) as InsuranceFeeRule[];
    },
  });
}

export function useCreateFeeRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: {
      insurance_id: string;
      fee_type: FeeType;
      fee_value: number;
      payment_deadline_days: number;
      description?: string;
      professional_id?: string;
      procedure_id?: string;
    }) => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('insurance_fee_rules')
        .insert({
          clinic_id: clinicId,
          insurance_id: formData.insurance_id,
          rule_type: formData.fee_type,
          fee_type: formData.fee_type,
          fee_value: formData.fee_value,
          payment_deadline_days: formData.payment_deadline_days,
          description: formData.description || null,
          professional_id: formData.professional_id || null,
          procedure_id: formData.procedure_id || null,
          config: {
            fee_type: formData.fee_type,
            fee_value: formData.fee_value,
            payment_deadline_days: formData.payment_deadline_days,
          },
          is_active: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-fee-rules'] });
      toast.success('Regra de repasse criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar regra de repasse');
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
          professionals:professional_id (full_name)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        // Map DB columns to frontend type
        gross_value: Number(item.gross_value) || Number(item.calculated_amount) || 0,
        professional_fee: Number(item.professional_fee) || 0,
        clinic_net_value: Number(item.clinic_net_value) || (Number(item.gross_value || item.calculated_amount || 0) - Number(item.professional_fee || 0)),
        service_date: item.service_date || (item.created_at ? item.created_at.split('T')[0] : ''),
        // Joined fields
        insurance_name: item.insurances?.name || '',
        patient_name: item.patients?.full_name || '',
        professional_name: item.professionals?.full_name || '',
        guide_number: '', // We don't join guide here to avoid complexity
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
      
      // insurance_procedures doesn't have clinic_id directly, join through insurances
      const { data, error } = await supabase
        .from('insurance_procedures')
        .select(`
          *,
          insurances:insurance_id!inner (name, clinic_id),
          procedures:procedure_id (name)
        `)
        .eq('insurances.clinic_id', clinicId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        clinic_id: item.insurances?.clinic_id || clinicId,
        covered_value: Number(item.authorized_price) || 0,
        insurance_name: item.insurances?.name || '',
        procedure_name: item.procedures?.name || '',
        procedure_code: item.tuss_code || '',
        is_active: true,
      })) as InsuranceProcedure[];
    },
  });
}

export function useCreateInsuranceProcedure() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: {
      insurance_id: string;
      procedure_id: string;
      authorized_price?: number;
      tuss_code?: string;
      requires_authorization: boolean;
    }) => {
      const { data, error } = await supabase
        .from('insurance_procedures')
        .insert({
          insurance_id: formData.insurance_id,
          procedure_id: formData.procedure_id,
          authorized_price: formData.authorized_price || null,
          tuss_code: formData.tuss_code || null,
          requires_authorization: formData.requires_authorization,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-procedures'] });
      toast.success('Procedimento vinculado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao vincular procedimento');
    },
  });
}

// =============================================
// PATIENT INSURANCE MUTATIONS
// =============================================

export function useCreatePatientInsurance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: {
      patient_id: string;
      insurance_id: string;
      card_number: string;
      validity_date?: string;
      holder_type?: string;
      holder_name?: string;
      holder_cpf?: string;
      notes?: string;
    }) => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('patient_insurances')
        .insert({
          clinic_id: clinicId,
          patient_id: formData.patient_id,
          insurance_id: formData.insurance_id,
          card_number: formData.card_number,
          validity_date: formData.validity_date || null,
          holder_type: formData.holder_type || 'titular',
          holder_name: formData.holder_name || null,
          holder_cpf: formData.holder_cpf || null,
          notes: formData.notes || null,
          is_active: true,
          is_primary: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-insurances'] });
      queryClient.invalidateQueries({ queryKey: ['convenios-stats'] });
      toast.success('Carteirinha vinculada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao vincular carteirinha');
    },
  });
}

// =============================================
// AUTHORIZATIONS MUTATIONS
// =============================================

export function useCreateAuthorization() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: {
      insurance_id: string;
      patient_id: string;
      procedure_id?: string;
      authorization_number?: string;
      notes?: string;
    }) => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('insurance_authorizations')
        .insert({
          clinic_id: clinicId,
          insurance_id: formData.insurance_id,
          patient_id: formData.patient_id,
          procedure_id: formData.procedure_id || null,
          authorization_number: formData.authorization_number || null,
          status: 'pendente',
          notes: formData.notes || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-authorizations'] });
      queryClient.invalidateQueries({ queryKey: ['convenios-stats'] });
      toast.success('Autorização solicitada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao solicitar autorização');
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
          .select('id, status, total_requested, total_approved, total_amount')
          .eq('clinic_id', clinicId),
        supabase
          .from('insurance_fee_calculations')
          .select('id, status, gross_value, calculated_amount')
          .eq('clinic_id', clinicId),
      ]);
      
      const insurances = insurancesResult.data || [];
      const patientInsurances = patientInsurancesResult.data || [];
      const authorizations = authorizationsResult.data || [];
      const guides = guidesResult.data || [];
      const feeCalculations = feeCalculationsResult.data || [];
      
      const activeInsurances = insurances.filter((i: any) => i.is_active);
      const openGuides = guides.filter((g: any) => ['rascunho', 'enviada'].includes(g.status));
      const approvedGuides = guides.filter((g: any) => ['autorizada', 'paga'].includes(g.status));
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
        totalPendingValue: pendingFees.reduce((sum: number, f: any) => sum + (Number(f.gross_value) || Number(f.calculated_amount) || 0), 0),
        totalApprovedValue: approvedGuides.reduce((sum: number, g: any) => sum + (Number(g.total_approved) || Number(g.total_amount) || 0), 0),
      } as ConveniosStats;
    },
    refetchInterval: 30000,
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
    insurances,
    patientInsurances,
    feeRules,
    guides,
    feeCalculations,
    insuranceProcedures,
    authorizations,
    stats: stats || defaultStats,
    financialSummary,
    patients,
    professionals,
    isLoading,
  };
}
