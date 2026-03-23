import { AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { ScheduleConflict } from "@/hooks/useConflictDetection";

interface ConflictAlertProps {
  conflicts: ScheduleConflict[];
  className?: string;
}

const correctionHints: Record<string, string> = {
  past_date: 'Selecione uma data ou horário futuro.',
  inactive_specialty: 'Troque a especialidade ou o profissional.',
  day_off: 'Troque o profissional ou escolha outro dia.',
  outside_hours: 'Ajuste o horário para dentro do expediente.',
  during_break: 'Ajuste o horário para fora do intervalo.',
  overlap: 'Escolha outro horário ou profissional.',
  fit_in_overlap: 'Este encaixe possui sobreposição.',
};

export function ConflictAlert({ conflicts, className }: ConflictAlertProps) {
  if (conflicts.length === 0) return null;
  
  const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
  const warningConflicts = conflicts.filter(c => c.severity === 'warning');
  const hasCritical = criticalConflicts.length > 0;
  
  return (
    <div className={cn("space-y-2", className)}>
      {/* Critical conflicts */}
      {hasCritical && (
        <Alert variant="destructive" className="border-destructive bg-destructive/10">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <AlertTitle className="font-medium text-destructive">
                Conflito crítico — agendamento bloqueado
              </AlertTitle>
              <div className="space-y-1.5">
                {criticalConflicts.map((conflict) => (
                  <AlertDescription 
                    key={conflict.id}
                    className="text-sm space-y-0.5"
                  >
                    <p className="font-medium text-destructive">
                      ⛔ {conflict.message}
                    </p>
                    {conflict.details && (
                      <p className="text-muted-foreground text-xs">{conflict.details}</p>
                    )}
                    <p className="text-xs flex items-center gap-1 text-destructive/80">
                      <ArrowRight className="h-3 w-3" />
                      {correctionHints[conflict.type] || 'Corrija o conflito para continuar.'}
                    </p>
                  </AlertDescription>
                ))}
              </div>
            </div>
          </div>
        </Alert>
      )}

      {/* Warning conflicts */}
      {warningConflicts.length > 0 && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <AlertTitle className="font-medium text-amber-700 dark:text-amber-400">
                Atenção
              </AlertTitle>
              <div className="space-y-1.5">
                {warningConflicts.map((conflict) => (
                  <AlertDescription 
                    key={conflict.id}
                    className="text-sm text-amber-700 dark:text-amber-400"
                  >
                    <span className="font-medium">⚠️ {conflict.message}</span>
                    {conflict.details && (
                      <span className="text-muted-foreground"> — {conflict.details}</span>
                    )}
                  </AlertDescription>
                ))}
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                Avisos não bloqueiam o agendamento.
              </p>
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
}
