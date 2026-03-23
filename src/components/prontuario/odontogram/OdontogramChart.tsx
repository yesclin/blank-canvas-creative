import { useState } from "react";
import { ToothIcon } from "./ToothIcon";
import { 
  PERMANENT_TEETH, 
  DECIDUOUS_TEETH,
  TOOTH_STATUS_COLORS,
  type OdontogramTooth,
  type ToothStatus,
} from "@/types/odontogram";
import { getToothByCode } from "@/hooks/useOdontogram";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Baby, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface OdontogramChartProps {
  teeth: OdontogramTooth[];
  onToothClick: (toothCode: string, currentStatus: ToothStatus) => void;
  selectedTooth?: string | null;
  isLoading?: boolean;
}

/**
 * Visual odontogram chart with upper and lower arches
 */
export function OdontogramChart({
  teeth,
  onToothClick,
  selectedTooth,
  isLoading,
}: OdontogramChartProps) {
  const [showDeciduous, setShowDeciduous] = useState(false);
  
  const currentTeeth = showDeciduous ? DECIDUOUS_TEETH : PERMANENT_TEETH;
  
  const getToothStatus = (code: string): ToothStatus => {
    const tooth = getToothByCode(teeth, code);
    return tooth?.status || 'healthy';
  };

  const handleToothClick = (code: string) => {
    const status = getToothStatus(code);
    onToothClick(code, status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">
          Carregando odontograma...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with dentition toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={showDeciduous ? "secondary" : "default"}>
            {showDeciduous ? "Decídua" : "Permanente"}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={showDeciduous ? "ghost" : "secondary"}
            size="sm"
            onClick={() => setShowDeciduous(false)}
            className="gap-1"
          >
            <User className="h-4 w-4" />
            Permanente
          </Button>
          <Button
            variant={showDeciduous ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowDeciduous(true)}
            className="gap-1"
          >
            <Baby className="h-4 w-4" />
            Decídua
          </Button>
        </div>
      </div>

      {/* Odontogram visualization */}
      <div className="relative bg-card rounded-lg border p-4">
        {/* Upper arch */}
        <div className="mb-4">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-xs text-muted-foreground w-8 text-right">D</span>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-medium px-2">Arcada Superior</span>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground w-8">E</span>
          </div>
          
          <div className="flex justify-center gap-px">
            {/* Upper right quadrant */}
            <div className="flex gap-px">
              {currentTeeth.upperRight.map((code) => (
                <ToothIcon
                  key={code}
                  code={code}
                  status={getToothStatus(code)}
                  onClick={() => handleToothClick(code)}
                  isSelected={selectedTooth === code}
                  size="md"
                />
              ))}
            </div>
            
            {/* Center divider */}
            <div className="w-2 bg-border/50 rounded mx-1" />
            
            {/* Upper left quadrant */}
            <div className="flex gap-px">
              {currentTeeth.upperLeft.map((code) => (
                <ToothIcon
                  key={code}
                  code={code}
                  status={getToothStatus(code)}
                  onClick={() => handleToothClick(code)}
                  isSelected={selectedTooth === code}
                  size="md"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Horizontal divider between arches */}
        <div className="h-px bg-border my-4" />

        {/* Lower arch */}
        <div>
          <div className="flex justify-center gap-px">
            {/* Lower right quadrant */}
            <div className="flex gap-px">
              {currentTeeth.lowerRight.map((code) => (
                <ToothIcon
                  key={code}
                  code={code}
                  status={getToothStatus(code)}
                  onClick={() => handleToothClick(code)}
                  isSelected={selectedTooth === code}
                  size="md"
                />
              ))}
            </div>
            
            {/* Center divider */}
            <div className="w-2 bg-border/50 rounded mx-1" />
            
            {/* Lower left quadrant */}
            <div className="flex gap-px">
              {currentTeeth.lowerLeft.map((code) => (
                <ToothIcon
                  key={code}
                  code={code}
                  status={getToothStatus(code)}
                  onClick={() => handleToothClick(code)}
                  isSelected={selectedTooth === code}
                  size="md"
                />
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="text-xs text-muted-foreground w-8 text-right">D</span>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-medium px-2">Arcada Inferior</span>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground w-8">E</span>
          </div>
        </div>
      </div>

      {/* Legend with all main statuses */}
      <div className="flex flex-wrap gap-3 justify-center text-xs">
        <LegendItem status="healthy" label="Hígido" />
        <LegendItem status="caries" label="Cárie" />
        <LegendItem status="restoration" label="Restauração" />
        <LegendItem status="extraction" label="Extração" />
        <LegendItem status="endodontic" label="Canal" />
        <LegendItem status="prosthesis" label="Prótese" />
        <LegendItem status="implant" label="Implante" />
        <LegendItem status="missing" label="Ausente" />
      </div>
    </div>
  );
}

function LegendItem({ status, label }: { status: ToothStatus; label: string }) {
  const color = TOOTH_STATUS_COLORS[status];
  
  return (
    <div className="flex items-center gap-1.5">
      <div 
        className={cn(
          "w-3 h-3 rounded-full border",
          status === 'missing' && "bg-transparent border-dashed"
        )}
        style={{ 
          backgroundColor: status === 'missing' ? 'transparent' : color,
          borderColor: status === 'missing' ? 'hsl(var(--muted-foreground))' : color
        }}
      />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
