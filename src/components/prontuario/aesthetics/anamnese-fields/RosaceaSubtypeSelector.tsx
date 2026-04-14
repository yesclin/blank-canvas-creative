/**
 * RosaceaSubtypeSelector
 *
 * Visual card selector for rosacea subtypes (1–4) with independent severity
 * select for each subtype. Tooltip descriptions on help icon hover.
 */

import { HelpCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import subtype1Img from '@/assets/skin/rosacea/subtype-1.jpg';
import subtype2Img from '@/assets/skin/rosacea/subtype-2.jpg';
import subtype3Img from '@/assets/skin/rosacea/subtype-3.jpg';
import subtype4Img from '@/assets/skin/rosacea/subtype-4.jpg';

interface RosaceaSubtype {
  key: string;
  label: string;
  image: string;
  description: string;
}

const SUBTYPES: RosaceaSubtype[] = [
  {
    key: 'subtype_1',
    label: 'Subtipo 1',
    image: subtype1Img,
    description: 'Eritemato-telangiectásica. Vermelhidão persistente e vasos aparentes.',
  },
  {
    key: 'subtype_2',
    label: 'Subtipo 2',
    image: subtype2Img,
    description: 'Papulopustulosa. Vermelhidão associada a pápulas e pústulas.',
  },
  {
    key: 'subtype_3',
    label: 'Subtipo 3',
    image: subtype3Img,
    description: 'Fimatosa. Espessamento da pele e irregularidade de relevo, comumente no nariz.',
  },
  {
    key: 'subtype_4',
    label: 'Subtipo 4',
    image: subtype4Img,
    description: 'Ocular. Acometimento ocular com irritação, vermelhidão e sensibilidade.',
  },
];

const SEVERITY_OPTIONS = [
  { value: 'suave', label: 'Suave' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'grave', label: 'Grave' },
];

export type RosaceaValues = Record<string, string | null>;

interface RosaceaSubtypeSelectorProps {
  value: RosaceaValues | null | undefined;
  onChange: (value: RosaceaValues) => void;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

export function RosaceaSubtypeSelector({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  className,
}: RosaceaSubtypeSelectorProps) {
  const isDisabled = disabled || readOnly;
  const current: RosaceaValues = value ?? {};

  const handleCardToggle = (subtypeKey: string) => {
    if (isDisabled) return;
    const isSelected = current[subtypeKey] != null;
    if (isSelected) {
      // Deselect: remove the key entirely
      const next = { ...current };
      delete next[subtypeKey];
      onChange(next);
    } else {
      // Select with no severity yet — set empty string as placeholder
      onChange({ ...current, [subtypeKey]: '' });
    }
  };

  const handleSeverityChange = (subtypeKey: string, severity: string) => {
    if (isDisabled) return;
    onChange({ ...current, [subtypeKey]: severity || null });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          'grid grid-cols-2 md:grid-cols-4 gap-4',
          className,
        )}
      >
        {SUBTYPES.map((st) => {
          const severity = current[st.key] ?? null;
          const isSelected = st.key in current && current[st.key] !== undefined;

          return (
            <div
              key={st.key}
              className={cn(
                'group relative flex flex-col rounded-lg border bg-card shadow-sm transition-all overflow-hidden',
                isSelected
                  ? 'border-primary/50 ring-1 ring-primary/20'
                  : 'border-border hover:border-primary/30',
                isDisabled && 'opacity-60 pointer-events-none',
              )}
            >
              {/* Clickable Image for toggle */}
              <button
                type="button"
                className="relative aspect-square w-full overflow-hidden bg-muted cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => handleCardToggle(st.key)}
                disabled={isDisabled}
                aria-pressed={isSelected}
                aria-label={`${isSelected ? 'Desselecionar' : 'Selecionar'} ${st.label}`}
              >
                <img
                  src={st.image}
                  alt={`${st.label} - ${st.description}`}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div
                  className="absolute inset-0 items-center justify-center bg-muted text-muted-foreground text-sm font-medium"
                  style={{ display: 'none' }}
                >
                  {st.label}
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>

              {/* Label + Tooltip */}
              <div className="flex items-center justify-center gap-1.5 px-3 pt-3 pb-1">
                <span className="text-sm font-semibold text-foreground">{st.label}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Informação sobre ${st.label}`}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs">
                    {st.description}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Severity Select — only enabled when subtype is selected */}
              {/* stopPropagation prevents card toggle when interacting with select */}
              <div
                className="px-3 pb-3 pt-1"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Select
                  key={`${st.key}-${isSelected ? 'on' : 'off'}`}
                  value={isSelected && severity ? severity : undefined}
                  onValueChange={(v) => handleSeverityChange(st.key, v)}
                  disabled={isDisabled || !isSelected}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={isSelected ? 'Selecione grau' : '—'} />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
