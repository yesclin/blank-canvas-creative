import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RotateCcw } from 'lucide-react';

// Tooth numbering (FDI World Dental Federation notation)
const ADULT_TEETH = {
  upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
};

const CHILD_TEETH = {
  upper: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  lower: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
};

export type ToothStatus = 'healthy' | 'caries' | 'filled' | 'extracted' | 'missing' | 'treatment' | 'crown' | 'implant';

export const TOOTH_STATUS_CONFIG: Record<ToothStatus, { label: string; color: string; bgColor: string }> = {
  healthy: { label: 'Saudável', color: 'text-green-700', bgColor: 'bg-green-100 hover:bg-green-200' },
  caries: { label: 'Cárie', color: 'text-red-700', bgColor: 'bg-red-100 hover:bg-red-200' },
  filled: { label: 'Restaurado', color: 'text-blue-700', bgColor: 'bg-blue-100 hover:bg-blue-200' },
  extracted: { label: 'Extraído', color: 'text-gray-700', bgColor: 'bg-gray-300 hover:bg-gray-400' },
  missing: { label: 'Ausente', color: 'text-gray-500', bgColor: 'bg-gray-100 hover:bg-gray-200 opacity-50' },
  treatment: { label: 'Em Tratamento', color: 'text-yellow-700', bgColor: 'bg-yellow-100 hover:bg-yellow-200' },
  crown: { label: 'Coroa', color: 'text-purple-700', bgColor: 'bg-purple-100 hover:bg-purple-200' },
  implant: { label: 'Implante', color: 'text-cyan-700', bgColor: 'bg-cyan-100 hover:bg-cyan-200' },
};

export interface ToothData {
  number: number;
  status: ToothStatus;
  notes?: string;
}

interface SimpleOdontogramProps {
  value?: Record<number, ToothData>;
  onChange?: (data: Record<number, ToothData>) => void;
  readOnly?: boolean;
  isChild?: boolean;
  selectedStatus?: ToothStatus;
  onStatusChange?: (status: ToothStatus) => void;
  className?: string;
}

export function SimpleOdontogram({
  value = {},
  onChange,
  readOnly = false,
  isChild = false,
  selectedStatus = 'caries',
  onStatusChange,
  className,
}: SimpleOdontogramProps) {
  const [localSelectedStatus, setLocalSelectedStatus] = useState<ToothStatus>(selectedStatus);
  
  const currentStatus = onStatusChange ? selectedStatus : localSelectedStatus;
  const teeth = isChild ? CHILD_TEETH : ADULT_TEETH;

  const handleToothClick = (toothNumber: number) => {
    if (readOnly || !onChange) return;

    const currentTooth = value[toothNumber];
    const newData = { ...value };

    if (currentTooth?.status === currentStatus) {
      // If clicking same status, reset to healthy
      newData[toothNumber] = { number: toothNumber, status: 'healthy' };
    } else {
      newData[toothNumber] = { number: toothNumber, status: currentStatus };
    }

    onChange(newData);
  };

  const handleStatusSelect = (status: ToothStatus) => {
    if (onStatusChange) {
      onStatusChange(status);
    } else {
      setLocalSelectedStatus(status);
    }
  };

  const handleReset = () => {
    if (onChange) {
      onChange({});
    }
  };

  const getToothStatus = (toothNumber: number): ToothStatus => {
    return value[toothNumber]?.status || 'healthy';
  };

  const renderTooth = (toothNumber: number) => {
    const status = getToothStatus(toothNumber);
    const config = TOOTH_STATUS_CONFIG[status];

    return (
      <TooltipProvider key={toothNumber}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => handleToothClick(toothNumber)}
              disabled={readOnly}
              className={cn(
                'w-8 h-10 rounded-sm border border-border text-xs font-medium transition-all',
                config.bgColor,
                config.color,
                !readOnly && 'cursor-pointer',
                readOnly && 'cursor-default',
                status === 'extracted' && 'line-through'
              )}
            >
              {toothNumber}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dente {toothNumber}: {config.label}</p>
            {value[toothNumber]?.notes && (
              <p className="text-xs text-muted-foreground">{value[toothNumber].notes}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Status Legend / Selector */}
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(TOOTH_STATUS_CONFIG).map(([status, config]) => (
            <Badge
              key={status}
              variant={currentStatus === status ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-all',
                currentStatus === status ? 'ring-2 ring-primary' : ''
              )}
              onClick={() => handleStatusSelect(status as ToothStatus)}
            >
              <span className={cn('w-2 h-2 rounded-full mr-1.5', config.bgColor.split(' ')[0])} />
              {config.label}
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-6 px-2">
            <RotateCcw className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        </div>
      )}

      {/* Odontogram Grid */}
      <div className="flex flex-col items-center gap-4 p-4 bg-muted/30 rounded-lg border">
        {/* Upper Arch */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-muted-foreground mb-1">Arcada Superior</span>
          <div className="flex gap-0.5">
            {teeth.upper.map(renderTooth)}
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-border" />

        {/* Lower Arch */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-0.5">
            {teeth.lower.map(renderTooth)}
          </div>
          <span className="text-xs text-muted-foreground mt-1">Arcada Inferior</span>
        </div>
      </div>

      {/* Summary */}
      {Object.keys(value).length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(
            Object.values(value).reduce((acc, tooth) => {
              if (tooth.status !== 'healthy') {
                acc[tooth.status] = (acc[tooth.status] || 0) + 1;
              }
              return acc;
            }, {} as Record<string, number>)
          ).map(([status, count]) => (
            <Badge key={status} variant="secondary" className="text-xs">
              {TOOTH_STATUS_CONFIG[status as ToothStatus]?.label}: {count}
            </Badge>
          ))}
        </div>
      )}

      {/* Legend for read-only mode */}
      {readOnly && (
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(TOOTH_STATUS_CONFIG).map(([status, config]) => (
            <div key={status} className="flex items-center gap-1">
              <span className={cn('w-3 h-3 rounded-sm border', config.bgColor.split(' ')[0])} />
              <span className="text-muted-foreground">{config.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
