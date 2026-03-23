import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  resolveSpecialtyBySlug, 
  enableCoreModulesForSpecialty,
  STANDARD_SPECIALTY_CATALOG,
  normalizeSlug
} from "./onboarding/specialtyResolver";

export interface OnboardingProgress {
  id: string;
  clinic_id: string;
  user_id: string;
  current_step: number;
  completed_steps: number[];
  is_completed: boolean;
  skipped_at: string | null;
  completed_at: string | null;
  preferences: {
    accepts_insurance?: boolean;
    wants_reminders?: boolean;
    payment_methods?: string[];
    allows_return?: boolean;
    // Specialty selection - using SLUG as primary reference
    primary_specialty_slug?: string;
    primary_specialty_id?: string;
    primary_specialty_name?: string;
    primary_specialty_curated_id?: string; // Legacy, kept for backwards compat
  };
  created_at: string;
  updated_at: string;
}

export const ONBOARDING_STEPS = [
  { id: 0, key: "welcome", title: "Boas-vindas", required: false },
  { id: 1, key: "clinic", title: "Dados da Clínica", required: true },
  { id: 2, key: "specialties", title: "Especialidades", required: true },
  { id: 3, key: "professionals", title: "Profissionais", required: false },
  { id: 4, key: "schedule", title: "Agenda", required: false },
  { id: 5, key: "procedures", title: "Procedimentos", required: false },
  { id: 6, key: "insurance", title: "Convênios", required: false },
  { id: 7, key: "finance", title: "Financeiro", required: false },
  { id: 8, key: "communication", title: "Comunicação", required: false },
  { id: 9, key: "completion", title: "Conclusão", required: false },
];

// Re-export for backwards compatibility
export { STANDARD_SPECIALTY_CATALOG as CURATED_SPECIALTIES_MAP };

export function useOnboarding() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if user is admin/owner and should see onboarding
  const checkOnboardingStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        setIsLoading(false);
        return;
      }

      // Get user role from user_roles table
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("clinic_id", profile.clinic_id)
        .single();

      const role = roleData?.role || "recepcionista";
      setUserRole(role);
      setClinicId(profile.clinic_id);

      // Only admin/owner can see onboarding
      if (!["admin", "owner"].includes(role)) {
        setIsLoading(false);
        setShouldShowOnboarding(false);
        return;
      }

      // Check if onboarding exists
      const { data: onboardingData } = await supabase
        .from("onboarding_progress")
        .select("*")
        .eq("clinic_id", profile.clinic_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (onboardingData) {
        setProgress(onboardingData as OnboardingProgress);
        setShouldShowOnboarding(!onboardingData.is_completed && !onboardingData.skipped_at);
      } else {
        // First login - create onboarding record
        const { data: newProgress, error } = await supabase
          .from("onboarding_progress")
          .insert({
            clinic_id: profile.clinic_id,
            user_id: user.id,
            current_step: 0,
            completed_steps: [],
            preferences: {},
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating onboarding:", error);
        } else {
          setProgress(newProgress as OnboardingProgress);
          setShouldShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  const updateStep = useCallback(async (step: number) => {
    if (!progress) return;

    const newCompletedSteps = progress.completed_steps.includes(step - 1)
      ? progress.completed_steps
      : [...progress.completed_steps, step - 1];

    const { error } = await supabase
      .from("onboarding_progress")
      .update({
        current_step: step,
        completed_steps: newCompletedSteps,
      })
      .eq("id", progress.id);

    if (error) {
      toast({
        title: "Erro ao salvar progresso",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setProgress({
      ...progress,
      current_step: step,
      completed_steps: newCompletedSteps,
    });
  }, [progress, toast]);

  const updatePreferences = useCallback(async (preferences: Partial<OnboardingProgress["preferences"]>) => {
    if (!progress) return;

    const newPreferences = { ...progress.preferences, ...preferences };

    const { error } = await supabase
      .from("onboarding_progress")
      .update({ preferences: newPreferences })
      .eq("id", progress.id);

    if (error) {
      console.error("Error updating preferences:", error);
      return;
    }

    setProgress({ ...progress, preferences: newPreferences });
  }, [progress]);

  const skipOnboarding = useCallback(async () => {
    if (!progress) return;

    const { error } = await supabase
      .from("onboarding_progress")
      .update({ skipped_at: new Date().toISOString() })
      .eq("id", progress.id);

    if (error) {
      toast({
        title: "Erro ao pular onboarding",
        variant: "destructive",
      });
      return;
    }

    setProgress({ ...progress, skipped_at: new Date().toISOString() });
    setShouldShowOnboarding(false);
  }, [progress, toast]);

  const completeOnboarding = useCallback(async (): Promise<void> => {
    if (!progress || !clinicId) {
      throw new Error("Dados de progresso ou clínica não encontrados.");
    }

    const prefs = progress.preferences;

    // Try to link specialty to clinic (best-effort, non-blocking)
    const slugToResolve = prefs.primary_specialty_slug 
      || prefs.primary_specialty_curated_id 
      || prefs.primary_specialty_id;

    if (slugToResolve) {
      try {
        const resolved = await resolveSpecialtyBySlug(
          clinicId, 
          slugToResolve, 
          prefs.primary_specialty_name
        );
        
        if (resolved.isNew) {
          try {
            await enableCoreModulesForSpecialty(clinicId, resolved.id);
          } catch (moduleErr) {
            console.error("Error enabling modules (non-fatal):", moduleErr);
          }
        }

        await supabase
          .from("clinics")
          .update({ primary_specialty_id: resolved.id })
          .eq("id", clinicId);
      } catch (resolveErr) {
        // Non-fatal: specialty may already be linked or not selected
        console.error("Error resolving specialty (non-fatal):", resolveErr);
      }
    }

    // Mark onboarding as completed — this is the critical step
    const { error: completeErr } = await supabase
      .from("onboarding_progress")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        completed_steps: ONBOARDING_STEPS.map((s) => s.id),
      })
      .eq("id", progress.id);

    if (completeErr) {
      console.error("Error marking onboarding complete:", completeErr);
      throw new Error("Não foi possível concluir a configuração. Tente novamente.");
    }

    // Update local state
    setProgress({
      ...progress,
      is_completed: true,
      completed_at: new Date().toISOString(),
    });
    setShouldShowOnboarding(false);

    toast({
      title: "Configuração concluída! 🎉",
      description: "Seu sistema está pronto para uso.",
    });
  }, [progress, clinicId, toast]);



  const restartOnboarding = useCallback(async () => {
    if (!progress) return;

    const { error } = await supabase
      .from("onboarding_progress")
      .update({
        current_step: 0,
        completed_steps: [],
        is_completed: false,
        skipped_at: null,
        completed_at: null,
      })
      .eq("id", progress.id);

    if (error) {
      toast({
        title: "Erro ao reiniciar onboarding",
        variant: "destructive",
      });
      return;
    }

    setProgress({
      ...progress,
      current_step: 0,
      completed_steps: [],
      is_completed: false,
      skipped_at: null,
      completed_at: null,
    });
    setShouldShowOnboarding(true);
  }, [progress, toast]);

  const progressPercentage = progress
    ? Math.round((progress.completed_steps.length / (ONBOARDING_STEPS.length - 1)) * 100)
    : 0;

  return {
    progress,
    isLoading,
    shouldShowOnboarding,
    userRole,
    clinicId,
    currentStep: progress?.current_step ?? 0,
    completedSteps: progress?.completed_steps ?? [],
    preferences: progress?.preferences ?? {},
    progressPercentage,
    updateStep,
    updatePreferences,
    skipOnboarding,
    completeOnboarding,
    restartOnboarding,
    ONBOARDING_STEPS,
  };
}
