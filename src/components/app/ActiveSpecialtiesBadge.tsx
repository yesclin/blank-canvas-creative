import { useGlobalSpecialty } from "@/hooks/useGlobalSpecialty";
import { Stethoscope } from "lucide-react";

/**
 * Shows the current effective specialty in the app header.
 * Fully derived — displays the first enabled specialty. No manual selection.
 */
export function ActiveSpecialtiesBadge() {
  const { enabledSpecialties } = useGlobalSpecialty();

  const active = enabledSpecialties[0] || null;
  if (!active) return null;

  return (
    <div className="hidden md:flex items-center gap-1.5 ml-auto px-2.5 py-1 text-xs font-medium text-muted-foreground print:hidden">
      <Stethoscope className="h-3.5 w-3.5" />
      <span className="truncate max-w-[160px]">{active.name}</span>
    </div>
  );
}
