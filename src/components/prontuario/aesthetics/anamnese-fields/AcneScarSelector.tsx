/**
 * AcneScarSelector
 *
 * Visual card selector for acne scar types with inline SVG cross-section
 * illustrations. No external image dependencies — pure SVG + UI.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/* ---- Scar type definitions ---- */

export interface AcneScarOption {
  value: string;
  label: string;
  description: string;
}

const ACNE_SCAR_OPTIONS: AcneScarOption[] = [
  { value: 'icepick', label: 'Icepick', description: 'Cicatrizes pontuais e profundas em forma de V estreito.' },
  { value: 'boxcar', label: 'Boxcar', description: 'Depressões com bordas retas e base mais plana.' },
  { value: 'rolling', label: 'Rolling', description: 'Ondulações suaves e largas na superfície da pele.' },
  { value: 'hipertrofica', label: 'Hipertrófica', description: 'Cicatrizes elevadas acima da linha da pele.' },
];

/* ---- Inline SVG cross-section illustrations ---- */

function IcepickIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Skin surface */}
      <line x1="0" y1="12" x2="30" y2="12" stroke="currentColor" strokeWidth="2" />
      <line x1="50" y1="12" x2="80" y2="12" stroke="currentColor" strokeWidth="2" />
      {/* Deep V notch */}
      <polyline points="30,12 40,36 50,12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function BoxcarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="2" />
      <line x1="56" y1="12" x2="80" y2="12" stroke="currentColor" strokeWidth="2" />
      {/* Rectangular depression */}
      <polyline points="24,12 24,28 56,28 56,12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function RollingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Wavy surface */}
      <path d="M0,16 C10,16 15,24 25,24 C35,24 38,12 48,12 C58,12 62,22 72,22 C76,22 78,18 80,16" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}

function HipertroficaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="28" x2="24" y2="28" stroke="currentColor" strokeWidth="2" />
      <line x1="56" y1="28" x2="80" y2="28" stroke="currentColor" strokeWidth="2" />
      {/* Raised bump */}
      <path d="M24,28 C24,28 26,10 40,10 C54,10 56,28 56,28" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

const SCAR_ICONS: Record<string, React.FC<{ className?: string }>> = {
  icepick: IcepickIcon,
  boxcar: BoxcarIcon,
  rolling: RollingIcon,
  hipertrofica: HipertroficaIcon,
};

/* ---- Gradient top illustration (skin texture placeholder) ---- */

const SCAR_GRADIENTS: Record<string, { from: string; to: string }> = {
  icepick:      { from: '#f5d6c3', to: '#e8b89e' },
  boxcar:       { from: '#f0d0b8', to: '#dfa88a' },
  rolling:      { from: '#eecfb8', to: '#d4a07a' },
  hipertrofica: { from: '#f2d8c5', to: '#e0b59a' },
};

/* ---- Main component ---- */

interface AcneScarSelectorProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

export function AcneScarSelector({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  className,
}: AcneScarSelectorProps) {
  const isDisabled = disabled || readOnly;
  const selected = ACNE_SCAR_OPTIONS.find((o) => o.value === value) ? (value as string) : null;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn('grid gap-3 grid-cols-2 sm:grid-cols-4', className)}
        role="radiogroup"
        aria-label="Tipo de cicatriz de acne"
      >
        {ACNE_SCAR_OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          const IconComponent = SCAR_ICONS[opt.value];
          const grad = SCAR_GRADIENTS[opt.value];

          return (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${opt.label}: ${opt.description}`}
                  disabled={isDisabled}
                  onClick={() => !isDisabled && onChange(opt.value)}
                  className={cn(
                    'group relative flex flex-col items-center rounded-xl border-2 overflow-hidden transition-all duration-200 outline-none',
                    'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
                    isSelected
                      ? 'border-primary shadow-md ring-1 ring-primary/20 bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:shadow-sm bg-card',
                    isDisabled && 'opacity-60 pointer-events-none cursor-not-allowed',
                  )}
                >
                  {/* Top illustration area */}
                  <div
                    className="w-full aspect-[4/3] flex items-center justify-center relative"
                    style={{
                      background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                    }}
                  >
                    {/* SVG scar cross-section, centered */}
                    {IconComponent && (
                      <IconComponent className="w-16 h-10 text-foreground/70" />
                    )}

                    {/* Selection check */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 rounded-full bg-primary p-0.5 shadow-sm">
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div className="py-2.5 px-2 flex flex-col items-center gap-1 w-full">
                    <span
                      className={cn(
                        'text-xs sm:text-sm font-semibold transition-colors',
                        isSelected ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      {opt.label}
                    </span>

                    {/* Small decorative cross-section below label */}
                    {IconComponent && (
                      <IconComponent className="w-10 h-4 text-muted-foreground/50" />
                    )}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px] text-center text-xs">
                <p className="font-semibold mb-0.5">{opt.label}</p>
                <p>{opt.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export { ACNE_SCAR_OPTIONS };
