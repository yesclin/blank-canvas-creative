import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { ProcedureType } from "./types";
import { getRegionsForProcedure, getRegionLabel } from "./types";

interface MuscleListProps {
  selectedMuscle: string | null;
  onSelectMuscle: (muscleId: string) => void;
  disabled?: boolean;
  /** Active procedure type — determines which region list to show */
  procedureType?: ProcedureType;
}

export function MuscleList({ selectedMuscle, onSelectMuscle, disabled, procedureType = 'toxin' }: MuscleListProps) {
  const regions = getRegionsForProcedure(procedureType);
  const label = getRegionLabel(procedureType);

  // Group by region
  const grouped = useMemo(() => {
    const map = new Map<string, typeof regions>();
    for (const item of regions) {
      const list = map.get(item.region) || [];
      list.push(item);
      map.set(item.region, list);
    }
    return Array.from(map.entries()).map(([region, muscles]) => ({ region, muscles }));
  }, [regions]);

  return (
    <ScrollArea className="h-full pr-2">
      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.region}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {group.region}
            </h4>
            <div className="space-y-1">
              {group.muscles.map((muscle) => {
                const isSelected = selectedMuscle === muscle.id;
                return (
                  <button
                    key={muscle.id}
                    onClick={() => onSelectMuscle(muscle.id)}
                    disabled={disabled}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg transition-all",
                      "border border-transparent",
                      "hover:bg-muted/60",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      isSelected && "bg-primary/10 border-primary/30 hover:bg-primary/15"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center",
                        isSelected 
                          ? "border-primary bg-primary" 
                          : "border-muted-foreground/30"
                      )}>
                        {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium text-sm leading-tight",
                          isSelected && "text-primary"
                        )}>
                          {muscle.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                          {muscle.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
