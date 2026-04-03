import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ImageOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VisualCardOption } from './types';

interface ImageCarouselSelectorProps {
  options: VisualCardOption[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ImageCarouselSelector({
  options,
  value,
  onChange,
  disabled = false,
}: ImageCarouselSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 200;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative group">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth px-6 py-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {options.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange(opt.id)}
              className={cn(
                'relative flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-all flex-shrink-0 w-24',
                'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40',
                disabled && 'opacity-60 cursor-not-allowed'
              )}
            >
              {isSelected && (
                <div className="absolute top-1 right-1 rounded-full bg-primary p-0.5">
                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                </div>
              )}
              <div className="flex h-20 w-full items-center justify-center rounded bg-muted/40">
                {opt.image_url ? (
                  <img src={opt.image_url} alt={opt.label} className="h-full w-full object-contain rounded" />
                ) : (
                  <ImageOff className="h-5 w-5 text-muted-foreground/40" />
                )}
              </div>
              <span className="text-[10px] font-medium leading-tight text-center">{opt.label}</span>
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
