import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface TableRow {
  id: string;
  label: string;
  description?: string;
  extra?: string;
}

interface ClinicalTableSingleChoiceProps {
  rows: TableRow[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ClinicalTableSingleChoice({
  rows,
  value,
  onChange,
  disabled = false,
}: ClinicalTableSingleChoiceProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      {rows.map((row, index) => {
        const isSelected = value === row.id;
        return (
          <button
            key={row.id}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(row.id)}
            className={cn(
              'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
              index < rows.length - 1 && 'border-b',
              isSelected
                ? 'bg-primary/5 text-foreground'
                : 'bg-card hover:bg-muted/50',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            <div
              className={cn(
                'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
              )}
            >
              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-medium text-sm">{row.label}</span>
                {row.description && (
                  <span className="text-xs text-muted-foreground">{row.description}</span>
                )}
              </div>
              {row.extra && (
                <span className="text-xs text-muted-foreground/80">{row.extra}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
