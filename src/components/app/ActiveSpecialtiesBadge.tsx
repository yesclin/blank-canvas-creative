import { useGlobalSpecialty } from "@/hooks/useGlobalSpecialty";
import { Stethoscope } from "lucide-react";

/**
 * Shows the current resolved specialty in the app header.
 * Uses the global resolved specialty — single source of truth.
 */
export function ActiveSpecialtiesBadge() {
  const { resolvedSpecialty, isLoading } = useGlobalSpecialty();

  if (isLoading || !resolvedSpecialty) return null;

  return (
    <div className="hidden md:flex items-center gap-1.5 ml-auto px-2.5 py-1 text-xs font-medium text-muted-foreground print:hidden">
      <Stethoscope className="h-3.5 w-3.5" />
      <span className="truncate max-w-[160px]">{resolvedSpecialty.name}</span>
    </div>
  );
}
