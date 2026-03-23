import { cn } from "@/lib/utils";
import type { ToothStatus } from "@/types/odontogram";
import { TOOTH_STATUS_COLORS } from "@/types/odontogram";

interface ToothIconProps {
  code: string;
  status: ToothStatus;
  onClick?: () => void;
  isSelected?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Single tooth component for the odontogram
 */
export function ToothIcon({ 
  code, 
  status, 
  onClick, 
  isSelected,
  size = "md",
}: ToothIconProps) {
  const sizeClasses = {
    sm: "w-6 h-8",
    md: "w-8 h-10",
    lg: "w-10 h-12",
  };
  
  const fontSizes = {
    sm: "text-[8px]",
    md: "text-[10px]",
    lg: "text-xs",
  };

  // Determine if it's upper or lower jaw based on first digit
  const quadrant = parseInt(code[0]);
  const isUpper = quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;
  
  // Get fill color based on status
  const getFillColor = () => {
    if (status === 'healthy') return 'hsl(var(--background))';
    if (status === 'missing') return 'transparent';
    return TOOTH_STATUS_COLORS[status];
  };
  
  const getStrokeColor = () => {
    if (status === 'missing') return 'hsl(var(--muted-foreground))';
    if (status === 'healthy') return 'hsl(var(--border))';
    return TOOTH_STATUS_COLORS[status];
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-0.5 rounded transition-all",
        "hover:bg-accent hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring",
        isSelected && "ring-2 ring-primary bg-primary/10",
        sizeClasses[size]
      )}
      title={`Dente ${code}`}
    >
      {/* Tooth number */}
      <span className={cn(
        "font-medium text-muted-foreground",
        fontSizes[size],
        isUpper ? "order-2" : "order-1"
      )}>
        {code}
      </span>
      
      {/* Tooth shape */}
      <svg 
        viewBox="0 0 24 32" 
        className={cn(
          "w-full h-auto",
          isUpper ? "order-1" : "order-2",
          !isUpper && "rotate-180"
        )}
      >
        {status === 'missing' ? (
          // X mark for missing tooth
          <>
            <line 
              x1="6" y1="8" x2="18" y2="24" 
              stroke={getStrokeColor()} 
              strokeWidth="2" 
              strokeDasharray="3,2"
            />
            <line 
              x1="18" y1="8" x2="6" y2="24" 
              stroke={getStrokeColor()} 
              strokeWidth="2" 
              strokeDasharray="3,2"
            />
          </>
        ) : (
          // Tooth shape
          <path
            d="M12 2 C6 2 4 8 4 14 C4 20 6 28 9 30 C10 30 11 28 12 28 C13 28 14 30 15 30 C18 28 20 20 20 14 C20 8 18 2 12 2 Z"
            fill={getFillColor()}
            stroke={getStrokeColor()}
            strokeWidth="1.5"
          />
        )}
        
        {/* Status indicator dot */}
        {status !== 'healthy' && status !== 'missing' && (
          <circle
            cx="12"
            cy="16"
            r="4"
            fill={TOOTH_STATUS_COLORS[status]}
            stroke="white"
            strokeWidth="1"
          />
        )}
      </svg>
    </button>
  );
}
