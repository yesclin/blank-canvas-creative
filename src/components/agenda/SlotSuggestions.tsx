import { Clock, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SlotSuggestion } from "@/hooks/useSlotSuggestions";

interface SlotSuggestionsProps {
  suggestions: SlotSuggestion[];
  isLoading: boolean;
  noSlotsAvailable: boolean;
  onSelectSlot: (suggestion: SlotSuggestion) => void;
  className?: string;
}

export function SlotSuggestions({
  suggestions,
  isLoading,
  noSlotsAvailable,
  onSelectSlot,
  className,
}: SlotSuggestionsProps) {
  // Don't show anything if no professional/procedure selected yet
  if (!noSlotsAvailable && suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className={cn("rounded-lg border bg-muted/30 p-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Sugestões de encaixe</span>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 animate-pulse" />
          <span>Buscando horários disponíveis...</span>
        </div>
      )}

      {noSlotsAvailable && !isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-warning" />
          <span>Nenhum horário disponível neste período.</span>
        </div>
      )}

      {suggestions.length > 0 && !isLoading && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={`${suggestion.date.toISOString()}-${suggestion.time}`}
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-auto py-1.5 px-3 text-xs font-medium transition-all",
                "hover:bg-primary hover:text-primary-foreground",
                "hover:border-primary hover:shadow-sm",
                index === 0 && "ring-1 ring-primary/50"
              )}
              onClick={() => onSelectSlot(suggestion)}
            >
              <Clock className="h-3 w-3 mr-1.5" />
              {suggestion.label}
            </Button>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          Clique em um horário para preencher automaticamente
        </p>
      )}
    </div>
  );
}
