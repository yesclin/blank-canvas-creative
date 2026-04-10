/**
 * BodyTypeCarouselSelector
 *
 * Coverflow-style carousel for selecting body type (1–9).
 * Central item is larger with depth/scale effect on lateral items.
 * Supports keyboard, swipe, arrows, and accessible selection.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, User, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveCardImage } from '@/utils/visualCardImageRegistry';

export interface CarouselBodyTypeOption {
  value: number;
  label: string;
  image_placeholder_key?: string;
  image_url?: string | null;
}

interface BodyTypeCarouselSelectorProps {
  title?: string;
  options: CarouselBodyTypeOption[];
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  ariaLabelPrefix?: string;
}

export function BodyTypeCarouselSelector({
  title,
  options,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  className,
  ariaLabelPrefix = 'Opção',
}: BodyTypeCarouselSelectorProps) {
  const isDisabled = disabled || readOnly;

  // activeIndex = currently centered item (visual focus)
  // value = actually selected/persisted value
  const [activeIndex, setActiveIndex] = useState(() => {
    if (value != null) {
      const idx = options.findIndex((o) => o.value === value);
      return idx >= 0 ? idx : Math.floor(options.length / 2);
    }
    return Math.floor(options.length / 2);
  });

  // Sync activeIndex when value changes externally (e.g. loading saved data)
  useEffect(() => {
    if (value != null) {
      const idx = options.findIndex((o) => o.value === value);
      if (idx >= 0 && idx !== activeIndex) setActiveIndex(idx);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = useCallback(
    (dir: -1 | 1) => {
      setActiveIndex((prev) => {
        const next = prev + dir;
        if (next < 0 || next >= options.length) return prev;
        return next;
      });
    },
    [options.length]
  );

  const selectIndex = useCallback(
    (idx: number) => {
      if (isDisabled) return;
      setActiveIndex(idx);
      const opt = options[idx];
      if (opt && opt.value >= 1 && opt.value <= 9) {
        onChange(opt.value);
      }
    },
    [isDisabled, options, onChange]
  );

  // Keyboard navigation
  const containerRef = useRef<HTMLDivElement>(null);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isDisabled) return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          navigate(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigate(1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          selectIndex(activeIndex);
          break;
      }
    },
    [isDisabled, navigate, activeIndex, selectIndex]
  );

  // Touch/swipe support
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 40) {
      navigate(diff > 0 ? -1 : 1);
    }
    touchStartX.current = null;
  };

  const isSelected = value != null && options[activeIndex]?.value === value;

  return (
    <div className={cn('space-y-3', className)}>
      {title && <p className="text-sm font-medium text-foreground">{title}</p>}

      <div
        ref={containerRef}
        className="relative select-none outline-none"
        tabIndex={isDisabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="listbox"
        aria-label={title || 'Seleção de biotipo corporal'}
        aria-activedescendant={`carousel-item-${activeIndex}`}
      >
        {/* Left arrow */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-background/90 shadow-lg border-border transition-opacity',
            activeIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
          onClick={() => navigate(-1)}
          disabled={isDisabled || activeIndex === 0}
          tabIndex={-1}
          aria-label="Anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Carousel track */}
        <div className="flex items-center justify-center py-4 px-12 overflow-hidden min-h-[200px] sm:min-h-[240px]">
          {options.map((opt, idx) => {
            const offset = idx - activeIndex;
            return (
              <CarouselCard
                key={opt.value}
                id={`carousel-item-${idx}`}
                opt={opt}
                offset={offset}
                isActive={idx === activeIndex}
                isSelected={value === opt.value}
                isDisabled={isDisabled}
                ariaLabelPrefix={ariaLabelPrefix}
                onClick={() => selectIndex(idx)}
              />
            );
          })}
        </div>

        {/* Right arrow */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-background/90 shadow-lg border-border transition-opacity',
            activeIndex === options.length - 1
              ? 'opacity-0 pointer-events-none'
              : 'opacity-100'
          )}
          onClick={() => navigate(1)}
          disabled={isDisabled || activeIndex === options.length - 1}
          tabIndex={-1}
          aria-label="Próximo"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Selection indicator */}
      {value != null && (
        <p className="text-center text-xs text-muted-foreground">
          Selecionado: <span className="font-semibold text-primary">{value}</span>
        </p>
      )}
    </div>
  );
}

/* ---- Individual Carousel Card ---- */

interface CarouselCardProps {
  id: string;
  opt: CarouselBodyTypeOption;
  offset: number; // -N..0..+N distance from center
  isActive: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  ariaLabelPrefix: string;
  onClick: () => void;
}

function CarouselCard({
  id,
  opt,
  offset,
  isActive,
  isSelected,
  isDisabled,
  ariaLabelPrefix,
  onClick,
}: CarouselCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const resolvedImage = resolveCardImage(opt.image_placeholder_key) || opt.image_url;

  const absOffset = Math.abs(offset);

  // Cards far from center are hidden
  if (absOffset > 3) return null;

  // Scale: center=1, ±1=0.78, ±2=0.6, ±3=0.45
  const scale = absOffset === 0 ? 1 : absOffset === 1 ? 0.78 : absOffset === 2 ? 0.6 : 0.45;
  // Opacity: center=1, ±1=0.85, ±2=0.55, ±3=0.3
  const opacity = absOffset === 0 ? 1 : absOffset === 1 ? 0.85 : absOffset === 2 ? 0.55 : 0.3;
  // Horizontal translation
  const translateX = offset * 80;
  // Z-index: center is highest
  const zIndex = 10 - absOffset;

  return (
    <div
      id={id}
      role="option"
      aria-selected={isSelected}
      aria-label={`${ariaLabelPrefix}, opção ${opt.value}`}
      className={cn(
        'absolute flex flex-col items-center cursor-pointer transition-all duration-300 ease-out',
        isDisabled && 'pointer-events-none'
      )}
      style={{
        transform: `translateX(${translateX}px) scale(${scale})`,
        opacity,
        zIndex,
      }}
      onClick={onClick}
    >
      <div
        className={cn(
          'w-24 h-32 sm:w-28 sm:h-36 md:w-32 md:h-44 rounded-xl border-2 overflow-hidden bg-card shadow-md transition-all duration-300',
          'flex items-center justify-center',
          isSelected
            ? 'border-primary shadow-lg ring-2 ring-primary/30 bg-primary/5'
            : isActive
            ? 'border-primary/40 shadow-lg'
            : 'border-border hover:border-primary/30'
        )}
      >
        {/* Checkmark for selected */}
        {isSelected && (
          <div className="absolute -top-1.5 -right-1.5 rounded-full bg-primary p-0.5 shadow-sm z-10">
            <Check className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
        )}

        {resolvedImage && !imgError ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                <div className="h-5 w-5 border-2 border-muted-foreground/20 border-t-primary/60 rounded-full animate-spin" />
              </div>
            )}
            <img
              src={resolvedImage}
              alt={`Biotipo ${opt.value}`}
              className={cn(
                'h-full w-full object-contain transition-opacity duration-200',
                imgLoaded ? 'opacity-100' : 'opacity-0'
              )}
              loading="eager"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              draggable={false}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground/50">
            <User className="h-8 w-8" />
            <span className="text-lg font-bold">{opt.value}</span>
          </div>
        )}
      </div>

      {/* Label below card */}
      <span
        className={cn(
          'mt-2 text-xs sm:text-sm font-semibold tabular-nums transition-colors duration-200',
          isSelected ? 'text-primary' : isActive ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {opt.label}
      </span>
    </div>
  );
}

/* ---- Default options factory ---- */

export function createCarouselBodyTypeOptions(prefix: string): CarouselBodyTypeOption[] {
  return Array.from({ length: 9 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}`,
    image_placeholder_key: `${prefix}${i + 1}`,
    image_url: null,
  }));
}
