import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Appointment } from '@/types/agenda';
import type { TissGuide, InsuranceFeeCalculation, TissGuideType } from '@/types/convenios';
import type { GeneratedGuideData } from '@/components/agenda/TissGuideGenerationDialog';
import { format } from 'date-fns';

// Default prices by guide type (fallback when no insurance procedure price exists)
const defaultPrices: Record<TissGuideType, number> = {
  consulta: 150,
  sp_sadt: 350,
  internacao: 1500,
  honorarios: 200,
  outras_despesas: 100,
};

// Map frontend guide types to DB enum values
const frontendToDbGuideType: Record<TissGuideType, string> = {
  consulta: 'consulta',
  sp_sadt: 'sadt',
  internacao: 'internacao',
  honorarios: 'honorarios',
  outras_despesas: 'odontologica',
};

interface UseTissGuideGenerationReturn {
  pendingAppointment: Appointment | null;
  setPendingAppointment: (apt: Appointment | null) => void;
  generateGuide: (data: GeneratedGuideData) => Promise<{
    guide: TissGuide;
    feeCalculation?: InsuranceFeeCalculation;
  }>;
  generatedGuides: TissGuide[];
  generatedFeeCalculations: InsuranceFeeCalculation[];
  clearGeneratedData: () => void;
}

// Hook to fetch real fee rules for a given insurance
function useFeeRuleForInsurance(insuranceId: string | null) {
  return useQuery({
    queryKey: ['fee-rule-for-insurance', insuranceId],
    queryFn: async () => {
      if (!insuranceId) return null;
      
      // First try insurance_fee_rules
      const { data: rules } = await supabase
        .from('insurance_fee_rules')
        .select('fee_type, fee_value, config')
        .eq('insurance_id', insuranceId)
        .eq('is_active', true)
        .limit(1);
      
      if (rules && rules.length > 0) {
        const rule = rules[0] as any;
        return {
          type: (rule.fee_type || rule.config?.fee_type || 'percentage') as 'percentage' | 'fixed',
          value: Number(rule.fee_value) || Number(rule.config?.fee_value) || 40,
        };
      }
      
      // Fallback: check default_fee_type on the insurance itself
      const { data: insurance } = await supabase
        .from('insurances')
        .select('default_fee_type, default_fee_value')
        .eq('id', insuranceId)
        .single();
      
      if (insurance) {
        return {
          type: ((insurance as any).default_fee_type || 'percentage') as 'percentage' | 'fixed',
          value: Number((insurance as any).default_fee_value) || 40,
        };
      }
      
      return { type: 'percentage' as const, value: 40 };
    },
    enabled: !!insuranceId,
  });
}

export function useTissGuideGeneration(): UseTissGuideGenerationReturn {
  const [pendingAppointment, setPendingAppointment] = useState<Appointment | null>(null);
  const [generatedGuides, setGeneratedGuides] = useState<TissGuide[]>([]);
  const [generatedFeeCalculations, setGeneratedFeeCalculations] = useState<InsuranceFeeCalculation[]>([]);

  const generateGuideNumber = (): string => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TISS${timestamp}${random}`;
  };

  const generateGuide = useCallback(async (data: GeneratedGuideData): Promise<{
    guide: TissGuide;
    feeCalculation?: InsuranceFeeCalculation;
  }> => {
    const guideNumber = generateGuideNumber();
    const now = new Date().toISOString();
    const grossValue = defaultPrices[data.guide_type];

    // Fetch real fee rule
    let feeRule = { type: 'percentage' as const, value: 40 };
    try {
      const { data: rules } = await supabase
        .from('insurance_fee_rules')
        .select('fee_type, fee_value, config')
        .eq('insurance_id', data.insurance_id)
        .eq('is_active', true)
        .limit(1);
      
      if (rules && rules.length > 0) {
        const rule = rules[0] as any;
        feeRule = {
          type: (rule.fee_type || rule.config?.fee_type || 'percentage') as 'percentage' | 'fixed',
          value: Number(rule.fee_value) || Number(rule.config?.fee_value) || 40,
        };
      } else {
        // Fallback to insurance defaults
        const { data: insurance } = await supabase
          .from('insurances')
          .select('default_fee_type, default_fee_value')
          .eq('id', data.insurance_id)
          .single();
        
        if (insurance) {
          feeRule = {
            type: ((insurance as any).default_fee_type || 'percentage') as 'percentage' | 'fixed',
            value: Number((insurance as any).default_fee_value) || 40,
          };
        }
      }
    } catch (e) {
      console.warn('Could not fetch fee rule, using default:', e);
    }

    // Create the TISS guide in DB
    const dbGuideType = frontendToDbGuideType[data.guide_type] || data.guide_type;
    
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('clinic_id')
      .eq('user_id', user?.id || '')
      .single();
    
    const clinicId = profile?.clinic_id;
    
    const { data: createdGuide, error: guideError } = await supabase
      .from('tiss_guides')
      .insert({
        clinic_id: clinicId,
        patient_id: data.patient_id,
        insurance_id: data.insurance_id,
        professional_id: data.professional_id,
        appointment_id: data.appointment_id || null,
        guide_type: dbGuideType,
        guide_number: guideNumber,
        authorization_number: data.authorization_number || null,
        status: 'rascunho',
        issue_date: now.split('T')[0],
        service_date: data.service_date,
        total_requested: grossValue,
        total_amount: grossValue,
        beneficiary_card_number: data.card_number || null,
        beneficiary_name: data.patient_name || null,
        data: {},
      })
      .select()
      .single();

    if (guideError) {
      console.error('Error creating guide:', guideError);
      throw guideError;
    }

    // Build frontend guide object
    const guide: TissGuide = {
      id: createdGuide?.id || `guide-${Date.now()}`,
      clinic_id: clinicId || '1',
      patient_id: data.patient_id,
      insurance_id: data.insurance_id,
      professional_id: data.professional_id,
      appointment_id: data.appointment_id,
      guide_type: data.guide_type,
      guide_number: guideNumber,
      main_authorization_number: data.authorization_number,
      issue_date: now.split('T')[0],
      service_date: data.service_date,
      status: 'rascunho',
      total_requested: grossValue,
      total_approved: 0,
      total_glosa: 0,
      beneficiary_card_number: data.card_number,
      beneficiary_name: data.patient_name,
      created_at: now,
      updated_at: now,
      patient_name: data.patient_name,
      insurance_name: data.insurance_name,
      professional_name: data.professional_name,
    };

    setGeneratedGuides(prev => [...prev, guide]);

    // Create fee calculation if auto-calculate is enabled
    let feeCalculation: InsuranceFeeCalculation | undefined;
    
    if (data.auto_calculate_fee) {
      let professionalFee: number;
      if (feeRule.type === 'percentage') {
        professionalFee = grossValue * (feeRule.value / 100);
      } else {
        professionalFee = feeRule.value;
      }
      const clinicNet = grossValue - professionalFee;

      // Save to DB
      const { data: createdFee } = await supabase
        .from('insurance_fee_calculations')
        .insert({
          clinic_id: clinicId,
          guide_id: createdGuide?.id || null,
          insurance_id: data.insurance_id,
          professional_id: data.professional_id,
          patient_id: data.patient_id,
          appointment_id: data.appointment_id || null,
          calculated_amount: grossValue,
          gross_value: grossValue,
          professional_fee: professionalFee,
          clinic_net_value: clinicNet,
          fee_type: feeRule.type,
          fee_percentage: feeRule.type === 'percentage' ? feeRule.value : null,
          fee_fixed_value: feeRule.type === 'fixed' ? feeRule.value : null,
          status: 'pendente',
          service_date: data.service_date,
          payment_due_date: format(
            new Date(new Date(data.service_date).getTime() + 30 * 24 * 60 * 60 * 1000),
            'yyyy-MM-dd'
          ),
          reference_period: format(new Date(data.service_date), 'yyyy-MM'),
        })
        .select()
        .single();

      feeCalculation = {
        id: createdFee?.id || `fee-${Date.now()}`,
        clinic_id: clinicId || '1',
        guide_id: createdGuide?.id,
        insurance_id: data.insurance_id,
        professional_id: data.professional_id,
        patient_id: data.patient_id,
        appointment_id: data.appointment_id,
        gross_value: grossValue,
        professional_fee: professionalFee,
        clinic_net_value: clinicNet,
        fee_type: feeRule.type,
        fee_percentage: feeRule.type === 'percentage' ? feeRule.value : undefined,
        fee_fixed_value: feeRule.type === 'fixed' ? feeRule.value : undefined,
        status: 'pendente',
        service_date: data.service_date,
        payment_due_date: format(
          new Date(new Date(data.service_date).getTime() + 30 * 24 * 60 * 60 * 1000),
          'yyyy-MM-dd'
        ),
        reference_period: format(new Date(data.service_date), 'yyyy-MM'),
        created_at: now,
        updated_at: now,
        insurance_name: data.insurance_name,
        professional_name: data.professional_name,
        patient_name: data.patient_name,
        guide_number: guideNumber,
      };

      setGeneratedFeeCalculations(prev => [...prev, feeCalculation!]);
    }

    return { guide, feeCalculation };
  }, []);

  const clearGeneratedData = useCallback(() => {
    setGeneratedGuides([]);
    setGeneratedFeeCalculations([]);
  }, []);

  return {
    pendingAppointment,
    setPendingAppointment,
    generateGuide,
    generatedGuides,
    generatedFeeCalculations,
    clearGeneratedData,
  };
}

// Utility hook to check if an appointment is eligible for TISS guide generation
export function useCanGenerateTissGuide(appointment: Appointment | null): boolean {
  if (!appointment) return false;
  if (!appointment.insurance_id || !appointment.insurance) return false;
  if (appointment.status !== 'finalizado') return false;
  if (appointment.payment_type !== 'convenio') return false;
  return true;
}
