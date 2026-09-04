import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { withTimeout } from "@/lib/asyncTimeout";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Identidade/clínica/papel já resolvidos uma única vez no boot pelo escopo
  // ativo. O onboarding NÃO refaz getUser + profiles + user_roles (3 requests
  // sequenciais que atrasavam a inicialização).
  const { scope, isReady: scopeReady, isLoading: scopeLoading } = useActiveClinicScope();
  const userId = scope.userId;
  const clinicId = scope.clinicId;
  const userRole = scope.role;
  const isPrivileged = userRole === "admin" || userRole === "owner";

  const queryKey = ["onboarding-progress", clinicId, userId] as const;

  const query = useQuery({
    queryKey,
    enabled: scopeReady && !!clinicId && !!userId && isPrivileged,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    throwOnError: false,
    queryFn: async (): Promise<OnboardingProgress | null> => {
      const { data: existing } = await withTimeout<any>(
        supabase
          .from("onboarding_progress")
          .select("*")
          .eq("clinic_id", clinicId!)
          .eq("user_id", userId!)
          .limit(1)
          .maybeSingle(),
        10000,
        "Tempo esgotado ao carregar progresso do onboarding.",
      );

      if (existing) return existing as OnboardingProgress;

      const { data: created, error } = await withTimeout<any>(
        supabase
          .from("onboarding_progress")
          .insert({
            clinic_id: clinicId!,
            user_id: userId!,
            current_step: 0,
            completed_steps: [],
            preferences: {},
          })
          .select()
          .limit(1)
          .maybeSingle(),
        10000,
        "Tempo esgotado ao criar onboarding.",
      );

      if (error) {
        console.error("Error creating onboarding:", error);
        return null;
      }
      return (created as OnboardingProgress) ?? null;
    },
  });

  const progress = query.data ?? null;

  // Mutações locais continuam otimistas, mas agora escrevem no cache
  // compartilhado — as 3 instâncias do hook (wizard + banner) ficam em sincronia
  // sem novas requisições.
  const setProgress = useCallback(
    (updater: OnboardingProgress | null | ((prev: OnboardingProgress | null) => OnboardingProgress | null)) => {
      queryClient.setQueryData<OnboardingProgress | null>(queryKey, (prev) =>
        typeof updater === "function"
          ? (updater as (p: OnboardingProgress | null) => OnboardingProgress | null)(prev ?? null)
          : updater,
      );
    },
    [queryClient, clinicId, userId],
  );

  const [dismissed, setDismissed] = useState(false);
  const setShouldShowOnboarding = useCallback((next: boolean) => setDismissed(!next), []);

  const shouldShowOnboarding = Boolean(
    isPrivileged && progress && !progress.is_completed && !progress.skipped_at && !dismissed,
  );

  // Nunca bloqueia a navegação: só reporta carregamento enquanto o escopo ativo
  // (já necessário para o app) resolve e a consulta única está em voo.
  const isLoading = scopeLoading || (isPrivileged && query.isLoading);

  const updateStep = useCallback(async (step: number) => {
    if (!progress) return;

    const newCompletedSteps = progress.completed_steps.includes(step - 1)
      ? progress.completed_steps
      : [...progress.completed_steps, step - 1];

    // Optimistic update via functional setState to avoid stale-closure races
    // with concurrent updatePreferences calls (both wrote setProgress({ ...progress, ... }),
    // causing the later one to overwrite the other's field).
    setProgress((prev) => prev ? {
      ...prev,
      current_step: step,
      completed_steps: newCompletedSteps,
    } : prev);

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
    }
  }, [progress, toast]);

  const updatePreferences = useCallback(async (preferences: Partial<OnboardingProgress["preferences"]>) => {
    if (!progress) return;

    // Functional update: merge into latest preferences, never overwrite current_step.
    setProgress((prev) => prev ? {
      ...prev,
      preferences: { ...prev.preferences, ...preferences },
    } : prev);

    const newPreferences = { ...progress.preferences, ...preferences };
    const { error } = await supabase
      .from("onboarding_progress")
      .update({ preferences: newPreferences })
      .eq("id", progress.id);

    if (error) {
      console.error("Error updating preferences:", error);
    }
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

        // Always enable core modules (idempotent) — don't gate on isNew, so
        // re-running onboarding or selecting an already-existing specialty
        // still wires up the prontuário modules for that specialty.
        try {
          await enableCoreModulesForSpecialty(clinicId, resolved.id);
        } catch (moduleErr) {
          console.error("Error enabling modules (non-fatal):", moduleErr);
        }

        await supabase
          .from("clinics")
          .update({ primary_specialty_id: resolved.id })
          .eq("id", clinicId);

        console.info("[ONBOARDING_COMPLETE] specialty linked", {
          clinicId,
          slug: slugToResolve,
          resolvedId: resolved.id,
          resolvedName: resolved.name,
          isNew: resolved.isNew,
        });
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

    // Invalidate caches so the prontuário/global specialty context picks up
    // the newly provisioned specialty without requiring a manual reload.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["enabled-specialties", clinicId] }),
      queryClient.invalidateQueries({ queryKey: ["enabled-specialties"] }),
      queryClient.invalidateQueries({ queryKey: ["all-specialties", clinicId] }),
      queryClient.invalidateQueries({ queryKey: ["clinic-specialties", clinicId] }),
      queryClient.invalidateQueries({ queryKey: ["current-clinic"] }),
      queryClient.invalidateQueries({ queryKey: ["global-specialty"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic", clinicId] }),
      queryClient.invalidateQueries({ queryKey: ["clinic-data"] }),
      queryClient.invalidateQueries({ queryKey: ["clinic_specialty_modules", clinicId] }),
    ]);

    toast({
      title: "Configuração concluída! 🎉",
      description: "Seu sistema está pronto para uso.",
    });
  }, [progress, clinicId, toast, queryClient]);




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
