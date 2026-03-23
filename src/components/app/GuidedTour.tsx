import { useEffect, useState, useCallback } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useClinicUsers";
import { usePermissions } from "@/hooks/usePermissions";

// Check if essential onboarding is complete
async function checkEssentialOnboardingComplete(clinicId: string, userId: string): Promise<boolean> {
  try {
    // 1. Check if onboarding is completed or skipped
    const { data: onboarding } = await supabase
      .from("onboarding_progress")
      .select("is_completed, skipped_at")
      .eq("clinic_id", clinicId)
      .eq("user_id", userId)
      .maybeSingle();

    // If onboarding exists and is neither completed nor skipped, essential setup isn't done
    if (onboarding && !onboarding.is_completed && !onboarding.skipped_at) {
      return false;
    }

    // 2. Check if clinic has at least 1 active specialty
    const { data: specialties } = await supabase
      .from("specialties")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .limit(1);

    if (!specialties || specialties.length === 0) {
      return false;
    }

    // 3. Check if clinic has at least 1 active professional
    const { data: professionals } = await supabase
      .from("professionals")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .limit(1);

    if (!professionals || professionals.length === 0) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking essential onboarding:", error);
    return false;
  }
}

// Tour steps by role
const getStepsForRole = (role: string, isAdmin: boolean): DriveStep[] => {
  const baseSteps: DriveStep[] = [
    {
      element: '[data-tour="dashboard"]',
      popover: {
        title: "📊 Seu Dashboard",
        description: "Aqui você tem uma visão geral do seu dia: agenda, indicadores e insights importantes.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="agenda"]',
      popover: {
        title: "📅 Agenda",
        description: "Gerencie todos os agendamentos da clínica. Crie, edite e acompanhe as consultas.",
        side: "right",
        align: "start",
      },
    },
    {
      element: '[data-tour="patients"]',
      popover: {
        title: "👥 Pacientes",
        description: "Cadastre e gerencie os pacientes. Acesse o histórico completo de cada um.",
        side: "right",
        align: "start",
      },
    },
    {
      element: '[data-tour="medical-record"]',
      popover: {
        title: "📋 Prontuário",
        description: "Acesse o prontuário eletrônico dos pacientes. Registre evoluções, exames e documentos.",
        side: "right",
        align: "start",
      },
    },
  ];

  // Add role-specific steps
  if (isAdmin) {
    baseSteps.push(
      {
        element: '[data-tour="management"]',
        popover: {
          title: "💼 Gestão",
          description: "Acompanhe financeiro, estoque, convênios e relatórios gerenciais.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="settings"]',
        popover: {
          title: "⚙️ Configurações",
          description: "Configure a clínica, usuários, permissões e personalize o sistema.",
          side: "right",
          align: "start",
        },
      }
    );
  }

  if (role === "recepcionista") {
    baseSteps.push({
      element: '[data-tour="communication"]',
      popover: {
        title: "💬 Comunicação",
        description: "Envie confirmações, lembretes e gerencie a comunicação com os pacientes.",
        side: "right",
        align: "start",
      },
    });
  }

  // Add final step about user profile
  baseSteps.push({
    element: '[data-tour="user-profile"]',
    popover: {
      title: "👤 Seu Perfil",
      description: "Aqui você pode ver suas informações, trocar de conta ou sair do sistema.",
      side: "top",
      align: "start",
    },
  });

  return baseSteps;
};

interface GuidedTourProps {
  onComplete?: () => void;
}

export function GuidedTour({ onComplete }: GuidedTourProps) {
  const { user } = useCurrentUser();
  const { role, isAdmin, isLoading: permissionsLoading } = usePermissions();
  const [hasCheckedTour, setHasCheckedTour] = useState(false);

  const completeTour = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ tour_completed_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error marking tour as complete:", error);
      }
    } catch (err) {
      console.error("Failed to complete tour:", err);
    }

    onComplete?.();
  }, [user?.id, onComplete]);

  const startTour = useCallback((role: string) => {
    const steps = getStepsForRole(role, isAdmin);
    
    const driverInstance = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: "rgba(0, 0, 0, 0.6)",
      stagePadding: 8,
      stageRadius: 8,
      popoverClass: "yesclin-tour-popover",
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Próximo →",
      prevBtnText: "← Voltar",
      doneBtnText: "Concluir ✓",
      onDestroyStarted: () => {
        completeTour();
        driverInstance.destroy();
      },
      steps,
    });

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      driverInstance.drive();
    }, 500);
  }, [completeTour, isAdmin]);

  useEffect(() => {
    if (!user?.id || hasCheckedTour || permissionsLoading) return;

    const checkTourStatus = async () => {
      try {
        // Get profile with tour status and clinic_id
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("tour_completed_at, clinic_id")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error checking tour status:", error);
          setHasCheckedTour(true);
          return;
        }

        // If tour already completed, don't show
        if (profile?.tour_completed_at) {
          setHasCheckedTour(true);
          return;
        }

        // CRITICAL: Check if essential onboarding is complete before starting tour
        if (profile?.clinic_id) {
          const isEssentialComplete = await checkEssentialOnboardingComplete(
            profile.clinic_id,
            user.id
          );

          if (!isEssentialComplete) {
            console.log("Essential onboarding not complete, skipping tour");
            setHasCheckedTour(true);
            return;
          }
        }

        const effectiveRole = role || "profissional";

        // Start tour after a brief delay to let the UI settle
        setHasCheckedTour(true);
        
        // Small delay to ensure the dashboard is fully rendered
        setTimeout(() => {
          startTour(effectiveRole);
        }, 1500);

      } catch (err) {
        console.error("Error in tour check:", err);
        setHasCheckedTour(true);
      }
    };

    checkTourStatus();
  }, [user?.id, hasCheckedTour, startTour, role, permissionsLoading]);

  return null; // This component doesn't render anything visible
}

// CSS to be added to index.css for custom styling
export const tourStyles = `
/* Driver.js custom styles for Yesclin */
.yesclin-tour-popover {
  --djs-primary: hsl(175 84% 40%);
}

.driver-popover {
  background: hsl(var(--card)) !important;
  border: 1px solid hsl(var(--border)) !important;
  border-radius: 12px !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
}

.driver-popover-title {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-weight: 700 !important;
  font-size: 1.1rem !important;
  color: hsl(var(--foreground)) !important;
}

.driver-popover-description {
  font-family: 'Inter', sans-serif !important;
  color: hsl(var(--muted-foreground)) !important;
  line-height: 1.6 !important;
}

.driver-popover-progress-text {
  color: hsl(var(--muted-foreground)) !important;
  font-size: 0.75rem !important;
}

.driver-popover-navigation-btns {
  gap: 8px !important;
}

.driver-popover-prev-btn,
.driver-popover-next-btn {
  font-family: 'Inter', sans-serif !important;
  font-weight: 500 !important;
  padding: 8px 16px !important;
  border-radius: 8px !important;
  transition: all 0.2s !important;
}

.driver-popover-prev-btn {
  background: transparent !important;
  color: hsl(var(--foreground)) !important;
  border: 1px solid hsl(var(--border)) !important;
}

.driver-popover-prev-btn:hover {
  background: hsl(var(--muted)) !important;
}

.driver-popover-next-btn {
  background: hsl(175 84% 40%) !important;
  color: white !important;
  border: none !important;
}

.driver-popover-next-btn:hover {
  background: hsl(176 85% 33%) !important;
}

.driver-popover-close-btn {
  color: hsl(var(--muted-foreground)) !important;
}

.driver-popover-close-btn:hover {
  color: hsl(var(--foreground)) !important;
}

.driver-popover-arrow-side-left.driver-popover-arrow,
.driver-popover-arrow-side-right.driver-popover-arrow,
.driver-popover-arrow-side-top.driver-popover-arrow,
.driver-popover-arrow-side-bottom.driver-popover-arrow {
  border-color: hsl(var(--card)) !important;
}
`;
