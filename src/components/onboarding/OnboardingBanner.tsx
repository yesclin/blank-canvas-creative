import { useOnboarding } from "@/hooks/useOnboarding";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket, ArrowRight } from "lucide-react";

export function OnboardingBanner() {
  const { progress, progressPercentage, restartOnboarding, userRole } = useOnboarding();

  // Only show for admin/owner with incomplete/skipped onboarding
  if (!progress || progress.is_completed || !["admin", "owner"].includes(userRole || "")) {
    return null;
  }

  if (!progress.skipped_at) return null;

  return (
    <Card className="border-primary/20 bg-primary/5 mb-6">
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Complete a configuração</p>
            <p className="text-sm text-muted-foreground">
              {progressPercentage}% concluído - continue de onde parou
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Progress value={progressPercentage} className="w-24 h-2" />
          <Button size="sm" onClick={restartOnboarding}>
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
