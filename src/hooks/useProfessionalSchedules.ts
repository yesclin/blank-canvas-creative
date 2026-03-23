import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WeekSchedule, getDefaultWeekSchedule } from "@/components/config/EnhancedWorkingHoursCard";
import type { Json } from "@/integrations/supabase/types";

export interface Professional {
  id: string;
  full_name: string;
  email: string | null;
  specialty_id: string | null;
  specialty_name?: string;
  color: string;
  is_active: boolean;
}

export interface ProfessionalScheduleConfig {
  id: string;
  professional_id: string;
  clinic_id: string;
  use_clinic_default: boolean;
  working_days: WeekSchedule;
  default_duration_minutes: number;
}

export function useProfessionalSchedules() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [scheduleConfigs, setScheduleConfigs] = useState<Map<string, ProfessionalScheduleConfig>>(new Map());
  const [clinicSchedule, setClinicSchedule] = useState<WeekSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.clinic_id) return;
      setClinicId(profile.clinic_id);

      // Fetch professionals with specialties
      const { data: professionalsData, error: profError } = await supabase
        .from("professionals")
        .select(`
          id,
          full_name,
          email,
          specialty_id,
          color,
          is_active,
          specialties:specialty_id (name)
        `)
        .eq("clinic_id", profile.clinic_id)
        .eq("is_active", true)
        .order("full_name");

      if (profError) {
        console.error("Error fetching professionals:", profError);
        return;
      }

      const formattedProfessionals: Professional[] = (professionalsData || []).map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        specialty_id: p.specialty_id,
        specialty_name: (p.specialties as any)?.name || undefined,
        color: p.color || "#10B981",
        is_active: p.is_active,
      }));

      setProfessionals(formattedProfessionals);

      // Fetch existing schedule configs
      const { data: configsData, error: configsError } = await supabase
        .from("professional_schedule_config")
        .select("*")
        .eq("clinic_id", profile.clinic_id);

      if (configsError) {
        console.error("Error fetching schedule configs:", configsError);
      } else {
        const configMap = new Map<string, ProfessionalScheduleConfig>();
        (configsData || []).forEach(config => {
          const workingDays = config.working_days as unknown as WeekSchedule;
          configMap.set(config.professional_id, {
            id: config.id,
            professional_id: config.professional_id,
            clinic_id: config.clinic_id,
            use_clinic_default: config.use_clinic_default,
            working_days: workingDays || getDefaultWeekSchedule(),
            default_duration_minutes: config.default_duration_minutes || 30,
          });
        });
        setScheduleConfigs(configMap);
      }

      // Fetch clinic default schedule from opening_hours
      const { data: clinicData } = await supabase
        .from("clinics")
        .select("opening_hours")
        .eq("id", profile.clinic_id)
        .single();

      if (clinicData?.opening_hours) {
        setClinicSchedule(clinicData.opening_hours as unknown as WeekSchedule);
      } else {
        setClinicSchedule(getDefaultWeekSchedule());
      }

    } catch (err) {
      console.error("Error in fetchData:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getScheduleForProfessional = useCallback((professionalId: string): {
    config: ProfessionalScheduleConfig | null;
    effectiveSchedule: WeekSchedule;
    useClinicDefault: boolean;
  } => {
    const config = scheduleConfigs.get(professionalId) || null;
    const useClinicDefault = config?.use_clinic_default ?? true;
    
    let effectiveSchedule: WeekSchedule;
    if (useClinicDefault && clinicSchedule) {
      effectiveSchedule = clinicSchedule;
    } else if (config?.working_days) {
      effectiveSchedule = config.working_days;
    } else {
      effectiveSchedule = clinicSchedule || getDefaultWeekSchedule();
    }

    return { config, effectiveSchedule, useClinicDefault };
  }, [scheduleConfigs, clinicSchedule]);

  const saveProfessionalSchedule = useCallback(async (
    professionalId: string,
    useClinicDefault: boolean,
    workingDays?: WeekSchedule,
    durationMinutes?: number
  ) => {
    if (!clinicId) {
      toast.error("Clínica não encontrada");
      return false;
    }

    setIsSaving(true);

    try {
      const existingConfig = scheduleConfigs.get(professionalId);
      
      const scheduleData = {
        clinic_id: clinicId,
        professional_id: professionalId,
        use_clinic_default: useClinicDefault,
        working_days: JSON.parse(JSON.stringify(workingDays || getDefaultWeekSchedule())) as Json,
        default_duration_minutes: durationMinutes || 30,
      };

      if (existingConfig) {
        // Update existing
        const { error } = await supabase
          .from("professional_schedule_config")
          .update(scheduleData)
          .eq("id", existingConfig.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("professional_schedule_config")
          .insert(scheduleData);

        if (error) throw error;
      }

      toast.success("Horário salvo com sucesso");
      await fetchData();
      return true;
    } catch (err) {
      console.error("Error saving schedule:", err);
      toast.error("Erro ao salvar horário");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [clinicId, scheduleConfigs, fetchData]);

  return {
    professionals,
    scheduleConfigs,
    clinicSchedule,
    isLoading,
    isSaving,
    getScheduleForProfessional,
    saveProfessionalSchedule,
    refetch: fetchData,
  };
}
