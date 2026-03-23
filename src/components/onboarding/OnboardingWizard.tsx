import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { AnimatePresence } from "framer-motion";
import { useOnboarding, ONBOARDING_STEPS, OnboardingProgress } from "@/hooks/useOnboarding";
import { supabase } from "@/integrations/supabase/client";

import { WelcomeStep } from "./steps/WelcomeStep";
import { ClinicStep } from "./steps/ClinicStep";
import { SpecialtiesStep } from "./steps/SpecialtiesStep";
import { ProfessionalsStep } from "./steps/ProfessionalsStep";
import { ScheduleStep } from "./steps/ScheduleStep";
import { ProceduresStep } from "./steps/ProceduresStep";
import { InsuranceStep } from "./steps/InsuranceStep";
import { FinanceStep } from "./steps/FinanceStep";
import { CommunicationStep } from "./steps/CommunicationStep";
import { CompletionStep } from "./steps/CompletionStep";

export function OnboardingWizard() {
  const {
    shouldShowOnboarding,
    currentStep,
    progressPercentage,
    clinicId,
    preferences,
    updateStep,
    updatePreferences,
    skipOnboarding,
    completeOnboarding,
  } = useOnboarding();

  const [userName, setUserName] = useState("");
  const [clinicName, setClinicName] = useState("");

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, clinic_id")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setUserName(profile.full_name?.split(" ")[0] || "");

        const { data: clinic } = await supabase
          .from("clinics")
          .select("name")
          .eq("id", profile.clinic_id)
          .single();

        if (clinic) {
          setClinicName(clinic.name);
        }
      }
    }

    if (shouldShowOnboarding) {
      loadUserData();
    }
  }, [shouldShowOnboarding]);

  if (!shouldShowOnboarding || !clinicId) return null;

  const currentStepInfo = ONBOARDING_STEPS[currentStep];

  return (
    <Dialog open={shouldShowOnboarding} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Progress Header */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Etapa {currentStep + 1} de {ONBOARDING_STEPS.length}
            </span>
            <span className="font-medium text-primary">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex gap-1">
            {ONBOARDING_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <WelcomeStep
              userName={userName}
              clinicName={clinicName}
              onNext={() => updateStep(1)}
              onSkip={skipOnboarding}
            />
          )}
          {currentStep === 1 && (
            <ClinicStep
              clinicId={clinicId}
              onNext={() => updateStep(2)}
              onBack={() => updateStep(0)}
            />
          )}
          {currentStep === 2 && (
            <SpecialtiesStep
              clinicId={clinicId}
              onNext={() => updateStep(3)}
              onBack={() => updateStep(1)}
              onUpdatePreferences={(prefs) => updatePreferences(prefs)}
            />
          )}
          {currentStep === 3 && (
            <ProfessionalsStep
              onNext={() => updateStep(4)}
              onBack={() => updateStep(2)}
            />
          )}
          {currentStep === 4 && (
            <ScheduleStep
              clinicId={clinicId}
              onNext={() => updateStep(5)}
              onBack={() => updateStep(3)}
            />
          )}
          {currentStep === 5 && (
            <ProceduresStep
              clinicId={clinicId}
              preferences={preferences}
              onNext={() => updateStep(6)}
              onBack={() => updateStep(4)}
            />
          )}
          {currentStep === 6 && (
            <InsuranceStep
              clinicId={clinicId}
              onNext={() => updateStep(7)}
              onBack={() => updateStep(5)}
              onUpdatePreferences={(prefs) => updatePreferences(prefs)}
            />
          )}
          {currentStep === 7 && (
            <FinanceStep
              onNext={() => updateStep(8)}
              onBack={() => updateStep(6)}
              onUpdatePreferences={(prefs) => updatePreferences(prefs)}
            />
          )}
          {currentStep === 8 && (
            <CommunicationStep
              onNext={() => updateStep(9)}
              onBack={() => updateStep(7)}
              onUpdatePreferences={(prefs) => updatePreferences(prefs)}
            />
          )}
          {currentStep === 9 && (
            <CompletionStep onComplete={completeOnboarding} clinicId={clinicId} />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
