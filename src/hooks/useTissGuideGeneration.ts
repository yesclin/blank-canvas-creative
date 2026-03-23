import { useState, useCallback } from 'react';
import type { Appointment } from '@/types/agenda';
import type { TissGuide, InsuranceFeeCalculation, TissGuideType } from '@/types/convenios';
import type { GeneratedGuideData } from '@/components/agenda/TissGuideGenerationDialog';
import { format } from 'date-fns';

// Simulated fee rules per insurance
const mockFeeRules: Record<string, { type: 'percentage' | 'fixed'; value: number }> = {
  '1': { type: 'percentage', value: 40 }, // Unimed: 40%
  '2': { type: 'percentage', value: 35 }, // Bradesco: 35%
  '3': { type: 'percentage', value: 50 }, // SulAmérica: 50%
};

// Default prices by guide type
const defaultPrices: Record<TissGuideType, number> = {
  consulta: 150,
  sp_sadt: 350,
  internacao: 1500,
  honorarios: 200,
  outras_despesas: 100,
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

export function useTissGuideGeneration(): UseTissGuideGenerationReturn {
  const [pendingAppointment, setPendingAppointment] = useState<Appointment | null>(null);
  const [generatedGuides, setGeneratedGuides] = useState<TissGuide[]>([]);
  const [generatedFeeCalculations, setGeneratedFeeCalculations] = useState<InsuranceFeeCalculation[]>([]);

  const generateGuideNumber = (): string => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TISS${timestamp}${random}`;
  };

  const calculateFee = (
    insuranceId: string,
    grossValue: number
  ): { professionalFee: number; clinicNet: number; feeType: string; feeValue: number } => {
    const rule = mockFeeRules[insuranceId] || { type: 'percentage', value: 40 };
    
    let professionalFee: number;
    if (rule.type === 'percentage') {
      professionalFee = grossValue * (rule.value / 100);
    } else {
      professionalFee = rule.value;
    }

    const clinicNet = grossValue - professionalFee;

    return {
      professionalFee,
      clinicNet,
      feeType: rule.type,
      feeValue: rule.value,
    };
  };

  const generateGuide = useCallback(async (data: GeneratedGuideData): Promise<{
    guide: TissGuide;
    feeCalculation?: InsuranceFeeCalculation;
  }> => {
    const guideNumber = generateGuideNumber();
    const now = new Date().toISOString();
    const grossValue = defaultPrices[data.guide_type];

    // Create the TISS guide
    const guide: TissGuide = {
      id: `guide-${Date.now()}`,
      clinic_id: '1',
      patient_id: data.patient_id,
      insurance_id: data.insurance_id,
      professional_id: data.professional_id,
      appointment_id: data.appointment_id,
      
      guide_type: data.guide_type,
      guide_number: guideNumber,
      main_authorization_number: data.authorization_number,
      
      issue_date: now.split('T')[0],
      service_date: data.service_date,
      
      status: 'aberta',
      
      total_requested: grossValue,
      total_approved: 0,
      total_glosa: 0,
      
      beneficiary_card_number: data.card_number,
      beneficiary_name: data.patient_name,
      
      created_at: now,
      updated_at: now,
      
      // Joined fields for display
      patient_name: data.patient_name,
      insurance_name: data.insurance_name,
      professional_name: data.professional_name,
    };

    setGeneratedGuides(prev => [...prev, guide]);

    // Create fee calculation if auto-calculate is enabled
    let feeCalculation: InsuranceFeeCalculation | undefined;
    
    if (data.auto_calculate_fee) {
      const { professionalFee, clinicNet, feeType, feeValue } = calculateFee(
        data.insurance_id,
        grossValue
      );

      feeCalculation = {
        id: `fee-${Date.now()}`,
        clinic_id: '1',
        guide_id: guide.id,
        insurance_id: data.insurance_id,
        professional_id: data.professional_id,
        patient_id: data.patient_id,
        appointment_id: data.appointment_id,
        
        gross_value: grossValue,
        professional_fee: professionalFee,
        clinic_net_value: clinicNet,
        
        fee_type: feeType,
        fee_percentage: feeType === 'percentage' ? feeValue : undefined,
        fee_fixed_value: feeType === 'fixed' ? feeValue : undefined,
        
        status: 'pendente',
        service_date: data.service_date,
        payment_due_date: format(
          new Date(new Date(data.service_date).getTime() + 30 * 24 * 60 * 60 * 1000),
          'yyyy-MM-dd'
        ),
        
        reference_period: format(new Date(data.service_date), 'yyyy-MM'),
        created_at: now,
        updated_at: now,
        
        // Joined fields
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
  
  // Must have insurance
  if (!appointment.insurance_id || !appointment.insurance) return false;
  
  // Must be a finalized appointment
  if (appointment.status !== 'finalizado') return false;
  
  // Must be convenio payment type
  if (appointment.payment_type !== 'convenio') return false;
  
  return true;
}
