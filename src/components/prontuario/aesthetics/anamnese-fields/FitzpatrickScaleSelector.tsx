/**
 * FitzpatrickScaleSelector
 *
 * Color-based card selector for the Fitzpatrick skin phototype scale (I–VI).
 * No images needed — uses solid color swatches with tooltips.
 */

import { cn } from '@/lib/utils';
import { Check, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface FitzpatrickOption {
  value: number;
  label: string;
  color: string;
  description: string;
}

const FITZPATRICK_OPTIONS: FitzpatrickOption[] = [
  { value: 1, label: 'Tipo I', color: '#F5E0D0', description: 'Sempre queima, nunca bronzeia, muito sensível ao sol.' },
  { value: 2, label: 'Tipo II', color: '#E4C8A8', description: 'Frequentemente queima, bronzeia pouco, pele clara.' },
  { value: 3, label: 'Tipo III', color: '#C9A87C', description: 'Às vezes queima, bronzeia gradualmente.' },
  { value: 4, label: 'Tipo IV', color: '#A67B50', description: 'Raramente queima, bronzeia com facilidade.' },
  { value: 5, label: 'Tipo V', color: '#6B3E26', description: 'Muito raramente queima, bronzeia intensamente.' },
  { value: 6, label: 'Tipo VI', color: '#3B1A0A', description: 'Praticamente nunca queima, pele profundamente pigmentada.' },
];

interface FitzpatrickScaleSelectorProps {
  value: number | string | null | undefined;
  onChange: (value: number) => void;
  disabled?: boolean;
  readOnly?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function FitzpatrickScaleSelector({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  showTooltip = true,
  className,
}: FitzpatrickScaleSelectorProps) {
  const isDisabled = disabled || readOnly;
  const numericValue = typeof value === 'string' ? parseInt(value, 10) : (value as number | null | undefined);
  const selectedValue = numericValue && numericValue >= 1 && numericValue <= 6 ? numericValue : null;

  const handleSelect = (v: number) => {
    if (isDisabled) return;
    onChange(v);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          'grid gap-3',
          'grid-cols-3 sm:grid-cols-6',
          className,
        )}
        role="radiogroup"
        aria-label="Escala de Fitzpatrick"
      >
        {FITZPATRICK_OPTIONS.map((opt) => {
          const isSelected = selectedValue === opt.value;
          const isDarkColor = opt.value >= 5;

          return (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${opt.label}: ${opt.description}`}
                  disabled={isDisabled}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'group relative flex flex-col items-center rounded-xl border-2 p-2 transition-all duration-200 outline-none',
                    'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
                    isSelected
                      ? 'border-primary shadow-md ring-1 ring-primary/20 bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:shadow-sm bg-card',
                    isDisabled && 'opacity-60 pointer-events-none cursor-not-allowed',
                  )}
                >
                  {/* Color swatch */}
                  <div
                    className={cn(
                      'w-full aspect-square rounded-lg mb-2 transition-transform duration-200',
                      'group-hover:scale-105',
                      isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
                    )}
                    style={{ backgroundColor: opt.color }}
                  />

                  {/* Check badge */}
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 rounded-full bg-primary p-0.5 shadow-sm z-10">
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}

                  {/* Label + help icon */}
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        'text-xs font-semibold transition-colors',
                        isSelected ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      {opt.label}
                    </span>
                    {showTooltip && (
                      <HelpCircle className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                    )}
                  </div>
                </button>
              </TooltipTrigger>
              {showTooltip && (
                <TooltipContent
                  side="bottom"
                  className="max-w-[220px] text-center text-xs"
                >
                  <p className="font-semibold mb-0.5">{opt.label}</p>
                  <p>{opt.description}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export { FITZPATRICK_OPTIONS };
