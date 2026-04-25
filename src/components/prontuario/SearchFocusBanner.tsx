import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchFocus } from "@/contexts/SearchFocusContext";

const TYPE_LABELS: Record<string, string> = {
  patient: "dados do paciente",
  clinical_data: "dados clínicos",
  anamnesis: "anamnese",
  evolution: "evolução",
  alert: "alerta",
  document: "documento",
  media: "arquivo",
  aesthetic_product: "produto utilizado",
  facial_map: "mapa facial",
  before_after: "antes/depois",
  odontogram: "odontograma",
  measurement: "medida",
};

interface SearchFocusBannerProps {
  onClear?: () => void;
}

export function SearchFocusBanner({ onClear }: SearchFocusBannerProps) {
  const { focus, clearFocus } = useSearchFocus();
  if (!focus) return null;

  const handleClear = () => {
    clearFocus();
    onClear?.();
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
      <div className="flex min-w-0 items-center gap-2 text-foreground">
        <Search className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate">
          Exibindo resultado da busca
          {focus.type && (
            <>
              {" "}
              — <span className="font-medium">{TYPE_LABELS[focus.type] ?? focus.type}</span>
            </>
          )}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 shrink-0 text-xs"
        onClick={handleClear}
      >
        <X className="mr-1 h-3 w-3" />
        Ver todos os registros
      </Button>
    </div>
  );
}
