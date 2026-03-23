import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from './useClinicData';
import { toast } from 'sonner';

export interface AppointmentRules {
  id: string;
  clinic_id: string;
  arrival_tolerance_minutes: number;
  min_advance_hours: number;
  confirmation_advance_hours: number;
  max_reschedules: number;
  created_at: string;
  updated_at: string;
}

export interface AppointmentRulesFormData {
  arrival_tolerance_minutes: number;
  min_advance_hours: number;
  confirmation_advance_hours: number;
  max_reschedules: number;
}

const DEFAULT_RULES: AppointmentRulesFormData = {
  arrival_tolerance_minutes: 15,
  min_advance_hours: 2,
  confirmation_advance_hours: 24,
  max_reschedules: 3,
};

export function useAppointmentRules() {
  const { clinic, isLoading: isClinicLoading } = useClinicData();
  const [rules, setRules] = useState<AppointmentRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchRules = useCallback(async () => {
    if (!clinic?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointment_rules')
        .select('*')
        .eq('clinic_id', clinic.id)
        .maybeSingle();

      if (error) throw error;
      setRules(data as AppointmentRules | null);
      setHasFetched(true);
    } catch (error) {
      console.error('Error fetching appointment rules:', error);
      toast.error('Erro ao carregar regras de atendimento');
    } finally {
      setIsLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    if (clinic?.id && !isClinicLoading) {
      fetchRules();
    }
  }, [clinic?.id, isClinicLoading, fetchRules]);

  const saveRules = async (data: AppointmentRulesFormData): Promise<boolean> => {
    if (!clinic?.id) {
      toast.error('Clínica não encontrada');
      return false;
    }

    // Validate data
    const validatedData: AppointmentRulesFormData = {
      arrival_tolerance_minutes: Math.max(0, Math.floor(data.arrival_tolerance_minutes) || 0),
      min_advance_hours: Math.max(0, Math.floor(data.min_advance_hours) || 0),
      confirmation_advance_hours: Math.max(0, Math.floor(data.confirmation_advance_hours) || 0),
      max_reschedules: Math.max(0, Math.floor(data.max_reschedules) || 0),
    };

    setIsSaving(true);
    try {
      if (rules?.id) {
        // Update existing rules
        const { error } = await supabase
          .from('appointment_rules')
          .update({
            arrival_tolerance_minutes: validatedData.arrival_tolerance_minutes,
            min_advance_hours: validatedData.min_advance_hours,
            confirmation_advance_hours: validatedData.confirmation_advance_hours,
            max_reschedules: validatedData.max_reschedules,
          })
          .eq('id', rules.id);

        if (error) throw error;
      } else {
        // Create new rules (singleton per clinic)
        const { data: newRules, error } = await supabase
          .from('appointment_rules')
          .insert({
            clinic_id: clinic.id,
            arrival_tolerance_minutes: validatedData.arrival_tolerance_minutes,
            min_advance_hours: validatedData.min_advance_hours,
            confirmation_advance_hours: validatedData.confirmation_advance_hours,
            max_reschedules: validatedData.max_reschedules,
          })
          .select()
          .single();

        if (error) throw error;
        setRules(newRules as AppointmentRules);
      }
      
      toast.success('Regras de atendimento salvas com sucesso!');
      await fetchRules();
      return true;
    } catch (error) {
      console.error('Error saving appointment rules:', error);
      toast.error('Erro ao salvar regras de atendimento');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Memoize currentRules to prevent unnecessary re-renders
  const currentRules: AppointmentRulesFormData = useMemo(() => {
    if (rules) {
      return {
        arrival_tolerance_minutes: rules.arrival_tolerance_minutes,
        min_advance_hours: rules.min_advance_hours,
        confirmation_advance_hours: rules.confirmation_advance_hours,
        max_reschedules: rules.max_reschedules,
      };
    }
    return DEFAULT_RULES;
  }, [rules]);

  return {
    rules,
    currentRules,
    isLoading: isLoading || isClinicLoading,
    isSaving,
    saveRules,
    refetch: fetchRules,
    hasFetched,
  };
}
