import { Lock, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RecordEditability } from "@/hooks/prontuario/useRecordEditability";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  editability: RecordEditability;
}

/**
 * Displays the edit-lock status of a clinical record.
 * - Within window: shows remaining time
 * - Locked by time: shows lock message
 * - Locked by signature: shows immutability notice
 */
export function RecordEditLockBanner({ editability }: Props) {
  if (editability.isLoading) return null;

  // Editable → show subtle info about remaining time
  if (editability.canEdit && editability.editableUntil) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border border-border text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>
          Editável até{" "}
          <strong>
            {format(editability.editableUntil, "HH:mm", { locale: ptBR })}
          </strong>{" "}
          ({editability.minutesRemaining} min restantes)
        </span>
        {editability.requiresJustification && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            Justificativa obrigatória
          </Badge>
        )}
      </div>
    );
  }

  // Locked by signature
  if (editability.isSigned) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>
          <strong>Registro assinado e imutável.</strong> Utilize adendo para complementos.
        </span>
      </div>
    );
  }

  // Locked by time
  if (editability.lockReason === "locked_time") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300">
        <Lock className="h-3.5 w-3.5" />
        <span>
          <strong>Registro bloqueado para edição.</strong> Utilize adendo para complementos.
        </span>
      </div>
    );
  }

  return null;
}
