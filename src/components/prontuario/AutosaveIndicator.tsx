/**
 * Discrete autosave status indicator for anamnesis form headers.
 * Shows a small, non-intrusive text near the header actions.
 */

import { format } from "date-fns";
import { Check, AlertCircle, Loader2, CloudOff } from "lucide-react";
import type { AutosaveStatus } from "@/hooks/prontuario/useAutosave";

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
}

const config: Record<AutosaveStatus, { icon: React.ReactNode; label: string; className: string }> = {
  idle: { icon: null, label: "", className: "" },
  unsaved: {
    icon: <CloudOff className="h-3 w-3" />,
    label: "Alterações não salvas",
    className: "text-amber-600",
  },
  saving: {
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    label: "Salvando rascunho…",
    className: "text-muted-foreground",
  },
  saved: {
    icon: <Check className="h-3 w-3" />,
    label: "Rascunho salvo",
    className: "text-emerald-600",
  },
  error: {
    icon: <AlertCircle className="h-3 w-3" />,
    label: "Falha ao salvar. Tentando novamente…",
    className: "text-destructive",
  },
};

export function AutosaveIndicator({ status, lastSavedAt }: AutosaveIndicatorProps) {
  if (status === "idle") return null;

  const cfg = config[status];

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
      {status === "saved" && lastSavedAt && ` às ${format(lastSavedAt, "HH:mm")}`}
    </span>
  );
}
