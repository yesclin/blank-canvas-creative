/**
 * BodyTypeSelector
 *
 * Reusable carousel-based body type selector with:
 * - Horizontal scroll with navigation arrows
 * - Single selection with visual highlight
 * - Image error fallback
 * - Keyboard accessibility (Enter/Space)
 * - Responsive: swipe on mobile, arrows on desktop
 * - aria-selected, aria-label support
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Check, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveCardImage } from '@/utils/visualCardImageRegistry';

export interface BodyTypeOption {
  id: string;
  label: string;
  value: number;
  image_placeholder_key?: string;
  image_url?: string | null;
}

interface BodyTypeSelectorProps {
  title?: string;
  options: BodyTypeOption[];
  value: number | string | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  readOnly?: boolean;
  gender?: 'female' | 'male';
  variant?: 'default' | 'compact';
  ariaLabelPrefix?: string;
}

export function BodyTypeSelector({
  title,
  options,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  variant = 'default',
  ariaLabelPrefix = 'Opção',
}: BodyTypeSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDisabled = disabled || readOnly;

  // Normalize value to number for comparison
  const normalizedValue = value != null ? Number(value) : null;

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [checkScroll]);

  // Scroll selected item into view on mount
  useEffect(() => {
    if (normalizedValue == null || !scrollRef.current) return;
    const idx = options.findIndex((o) => o.value === normalizedValue);
    if (idx < 0) return;
    const container = scrollRef.current;
    const child = container.children[idx] as HTMLElement | undefined;
    if (child) {
      child.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.6;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const handleSelect = (opt: BodyTypeOption) => {
    if (isDisabled) return;
    const v = opt.value;
    if (v < 1 || v > 9 || !Number.isInteger(v)) return;
    onChange(v);
  };

  const handleKeyDown = (e: React.KeyboardEvent, opt: BodyTypeOption) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(opt);
    }
  };

  const isCompact = variant === 'compact';

  return (
    <div className="space-y-2">
      {title && <p className="text-sm font-medium text-foreground">{title}</p>}
      <div className="relative group">
        {/* Left arrow */}
        {canScrollLeft && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/90 shadow-md border-border opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll('left')}
            tabIndex={-1}
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth px-1 py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          role="listbox"
          aria-label={title || 'Seleção de biotipo corporal'}
        >
          {options.map((opt) => {
            const isSelected = normalizedValue === opt.value;
            const resolvedImage = resolveCardImage(opt.image_placeholder_key) || opt.image_url;

            return (
              <BodyTypeCard
                key={opt.id}
                opt={opt}
                isSelected={isSelected}
                isDisabled={isDisabled}
                resolvedImage={resolvedImage || null}
                compact={isCompact}
                ariaLabelPrefix={ariaLabelPrefix}
                onSelect={() => handleSelect(opt)}
                onKeyDown={(e) => handleKeyDown(e, opt)}
              />
            );
          })}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/90 shadow-md border-border opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll('right')}
            tabIndex={-1}
            aria-label="Rolar para direita"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ---- Individual card ---- */

interface BodyTypeCardProps {
  opt: BodyTypeOption;
  isSelected: boolean;
  isDisabled: boolean;
  resolvedImage: string | null;
  compact: boolean;
  ariaLabelPrefix: string;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function BodyTypeCard({
  opt,
  isSelected,
  isDisabled,
  resolvedImage,
  compact,
  ariaLabelPrefix,
  onSelect,
  onKeyDown,
}: BodyTypeCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const cardWidth = compact ? 'w-20' : 'w-24 sm:w-28';
  const imgHeight = compact ? 'h-16' : 'h-20 sm:h-24';

  return (
    <div
      role="option"
      aria-selected={isSelected}
      aria-label={`${ariaLabelPrefix}, opção ${opt.value}`}
      tabIndex={isDisabled ? -1 : 0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        'relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition-all flex-shrink-0 cursor-pointer select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        cardWidth,
        isSelected
          ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
          : 'border-border bg-card hover:border-primary/40 hover:shadow-sm',
        isDisabled && 'opacity-60 cursor-not-allowed pointer-events-none'
      )}
    >
      {/* Checkmark */}
      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 rounded-full bg-primary p-0.5 shadow-sm z-10">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}

      {/* Image area */}
      <div className={cn('flex w-full items-center justify-center rounded-lg bg-muted/30 overflow-hidden', imgHeight)}>
        {resolvedImage && !imgError ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-muted-foreground/20 border-t-primary/60 rounded-full animate-spin" />
              </div>
            )}
            <img
              src={resolvedImage}
              alt={opt.label}
              className={cn(
                'h-full w-full object-contain rounded-lg transition-opacity duration-200',
                imgLoaded ? 'opacity-100' : 'opacity-0'
              )}
              loading="eager"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              draggable={false}
            />
          </>
        ) : (
          /* Fallback */
          <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground/50">
            <User className="h-6 w-6" />
            <span className="text-xs font-bold">{opt.value}</span>
          </div>
        )}
      </div>

      {/* Label */}
      <span className={cn(
        'text-[10px] sm:text-xs font-semibold leading-tight text-center tabular-nums',
        isSelected ? 'text-primary' : 'text-muted-foreground'
      )}>
        {opt.label}
      </span>
    </div>
  );
}

/* ---- Default options factory ---- */

export function createBodyTypeOptions(prefix: string): BodyTypeOption[] {
  return Array.from({ length: 9 }, (_, i) => ({
    id: `fig_${i + 1}`,
    label: `${i + 1}`,
    value: i + 1,
    image_placeholder_key: `${prefix}${i + 1}`,
    image_url: null,
  }));
}
