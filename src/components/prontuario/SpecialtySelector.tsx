import { 
  Stethoscope, Lock, Brain, Apple, Activity, 
  Sparkles, Smile, Scan, Baby, Dumbbell, ChevronDown 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SpecialtyOption, SpecialtyKey } from '@/hooks/prontuario/useActiveSpecialty';
import { YESCLIN_SPECIALTY_LABELS } from '@/hooks/prontuario/yesclinSpecialties';
import { useGlobalSpecialty } from '@/hooks/useGlobalSpecialty';
import { cn } from '@/lib/utils';

const SPECIALTY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope, Brain, Apple, Activity, Dumbbell, Sparkles, Smile, Scan, Baby,
};

interface SpecialtySelectorProps {
  activeSpecialty: SpecialtyOption | null;
  activeSpecialtyKey: SpecialtyKey;
  isFromAppointment: boolean;
  loading?: boolean;
  allSpecialties?: SpecialtyOption[];
  onSelect?: (id: string) => void;
}

export function SpecialtySelector({
  activeSpecialty,
  activeSpecialtyKey,
  isFromAppointment,
  allSpecialties = [],
  onSelect,
}: SpecialtySelectorProps) {
  const displayLabel = activeSpecialty?.name || YESCLIN_SPECIALTY_LABELS[activeSpecialtyKey] || 'Clínica Geral';
  const IconComponent = activeSpecialty?.icon 
    ? SPECIALTY_ICONS[activeSpecialty.icon] || Stethoscope 
    : Stethoscope;

  // Locked by appointment
  if (isFromAppointment) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
              <IconComponent className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{displayLabel}</span>
              <Lock className="h-3 w-3 text-primary/60" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Especialidade definida pelo atendimento ativo</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Multiple specialties — show dropdown
  if (allSpecialties.length > 1 && onSelect) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors",
            "bg-primary/5 border-primary/20 hover:bg-primary/10 cursor-pointer"
          )}>
            <IconComponent className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{displayLabel}</span>
            <ChevronDown className="h-3 w-3 text-primary/60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {allSpecialties.map((spec) => {
            const SpecIcon = spec.icon ? SPECIALTY_ICONS[spec.icon] || Stethoscope : Stethoscope;
            const isActive = spec.key === activeSpecialtyKey;
            return (
              <DropdownMenuItem
                key={spec.id}
                onClick={() => onSelect(spec.id)}
                className={cn(isActive && "bg-primary/10 font-semibold")}
              >
                <SpecIcon className="h-4 w-4 mr-2 text-primary" />
                {spec.name}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Single specialty — fixed label
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg">
            <IconComponent className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{displayLabel}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Especialidade definida em Configurações &gt; Clínica</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
