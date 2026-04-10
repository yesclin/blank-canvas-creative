import { cn } from '@/lib/utils';
import { ImageOff, Check, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { VisualCardOption } from './types';
import { resolveCardImage } from '@/utils/visualCardImageRegistry';

interface VisualOptionCardGridProps {
  options: VisualCardOption[];
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  columns?: number;
  selection?: 'single' | 'multiple';
  disabled?: boolean;
}

export function VisualOptionCardGrid({
  options,
  value,
  onChange,
  columns = 3,
  selection = 'single',
  disabled = false,
}: VisualOptionCardGridProps) {
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const handleSelect = (optionId: string) => {
    if (disabled) return;
    if (selection === 'single') {
      onChange(optionId);
    } else {
      const next = selectedValues.includes(optionId)
        ? selectedValues.filter((v) => v !== optionId)
        : [...selectedValues, optionId];
      onChange(next);
    }
  };

  const gridCols =
    columns === 2
      ? 'grid-cols-2'
      : columns === 3
      ? 'grid-cols-2 sm:grid-cols-3'
      : columns === 4
      ? 'grid-cols-2 sm:grid-cols-4'
      : columns === 5
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
      : columns === 6
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
      : 'grid-cols-2 sm:grid-cols-3';

  return (
    <div className={cn('grid gap-3', gridCols)}>
      {options.map((opt) => {
        const isSelected = selectedValues.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => handleSelect(opt.id)}
            className={cn(
              'relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-center transition-all',
              'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-card hover:border-primary/40',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            {isSelected && (
              <div className="absolute top-1.5 right-1.5 rounded-full bg-primary p-0.5">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
            <div className="relative aspect-square w-3/4 mx-auto items-center justify-center rounded-md bg-muted/40 overflow-hidden flex">
              {(() => {
                const imgSrc = opt.image_url || resolveCardImage(opt.image_placeholder_key);
                return imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={opt.label}
                    loading="lazy"
                    className="h-full w-full object-cover rounded-md"
                  />
                ) : (
                  <ImageOff className="h-6 w-6 text-muted-foreground/40" />
                );
              })()}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium leading-tight">{opt.label}</span>
              {opt.description && (
                <Tooltip>
                  <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs">
                    {opt.description}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
