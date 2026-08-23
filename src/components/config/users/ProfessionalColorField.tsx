import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, Palette } from "lucide-react";
import {
  AGENDA_COLOR_PALETTE,
  getAgendaColorLabel,
  getReadableTextColor,
  isValidHexColor,
  resolveProfessionalColor,
} from "@/utils/professionalColors";

interface ProfessionalColorFieldProps {
  value?: string | null;
  onChange: (color: string) => void;
  professionalId?: string | null;
  previewName?: string;
  disabled?: boolean;
}

export function ProfessionalColorField({
  value,
  onChange,
  professionalId,
  previewName,
  disabled,
}: ProfessionalColorFieldProps) {
  const effective = resolveProfessionalColor(value, professionalId);
  const isAuto = !isValidHexColor(value);

  return (
    <div className="grid gap-2">
      <Label className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-primary" />
        Cor na Agenda
      </Label>
      <p className="text-xs text-muted-foreground -mt-1">
        Usada para identificar o profissional nos agendamentos e nas visões Dia,
        Semana e Mês. {isAuto && "Uma cor automática está sendo aplicada até você escolher."}
      </p>

      <div className="flex flex-wrap gap-2">
        {AGENDA_COLOR_PALETTE.map((color) => {
          const selected = effective.toLowerCase() === color.value.toLowerCase() && !isAuto;
          return (
            <button
              key={color.value}
              type="button"
              disabled={disabled}
              title={color.label}
              aria-label={`Cor ${color.label}`}
              aria-pressed={selected}
              onClick={() => onChange(color.value)}
              className={cn(
                "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-transform",
                selected ? "border-foreground scale-110" : "border-transparent hover:scale-105",
                disabled && "opacity-50 cursor-not-allowed",
              )}
              style={{ backgroundColor: color.value }}
            >
              {selected && (
                <Check className="h-4 w-4" style={{ color: getReadableTextColor(color.value) }} />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Input
          type="color"
          value={effective}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-9 w-16 p-1 cursor-pointer"
          aria-label="Cor personalizada"
        />
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
          style={{ backgroundColor: effective, color: getReadableTextColor(effective) }}
        >
          {previewName || "Profissional"}
        </span>
        <span className="text-xs text-muted-foreground">
          {getAgendaColorLabel(effective) || effective.toUpperCase()}
          {isAuto && " (automática)"}
        </span>
      </div>
    </div>
  );
}
