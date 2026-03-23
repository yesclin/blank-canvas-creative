import { cn } from "@/lib/utils";
import type { ToothStatus } from "@/types/odontogram";
import { TOOTH_STATUS_COLORS } from "@/types/odontogram";

interface ToothSurfaceSelectorProps {
  selectedSurfaces: string[];
  onToggleSurface: (surface: string) => void;
  status?: ToothStatus;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Interactive 5-surface tooth diagram (MODVL notation)
 * - O: Oclusal (center)
 * - M: Mesial (left)
 * - D: Distal (right)
 * - V: Vestibular (top)
 * - L: Lingual (bottom)
 */
export function ToothSurfaceSelector({
  selectedSurfaces,
  onToggleSurface,
  status = 'healthy',
  disabled = false,
  size = "md",
}: ToothSurfaceSelectorProps) {
  const sizeValues = {
    sm: { width: 64, height: 64, fontSize: 8 },
    md: { width: 100, height: 100, fontSize: 10 },
    lg: { width: 140, height: 140, fontSize: 12 },
  };

  const { width, height, fontSize } = sizeValues[size];
  const cx = width / 2;
  const cy = height / 2;

  const surfaces = [
    { code: 'O', label: 'Oclusal', path: getOclusialPath(cx, cy, size) },
    { code: 'M', label: 'Mesial', path: getMesialPath(cx, cy, size) },
    { code: 'D', label: 'Distal', path: getDistalPath(cx, cy, size) },
    { code: 'V', label: 'Vestibular', path: getVestibularPath(cx, cy, size) },
    { code: 'L', label: 'Lingual', path: getLingualPath(cx, cy, size) },
  ];

  const getColor = (surfaceCode: string) => {
    if (selectedSurfaces.includes(surfaceCode)) {
      return TOOTH_STATUS_COLORS[status] || 'hsl(var(--primary))';
    }
    return 'hsl(var(--muted))';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="select-none"
      >
        {surfaces.map(({ code, label, path }) => (
          <g key={code}>
            <path
              d={path}
              fill={getColor(code)}
              stroke="hsl(var(--border))"
              strokeWidth={1.5}
              className={cn(
                "cursor-pointer transition-all",
                !disabled && "hover:opacity-80",
                disabled && "cursor-not-allowed opacity-50"
              )}
              onClick={() => !disabled && onToggleSurface(code)}
            />
            <text
              x={getTextPosition(code, cx, cy, size).x}
              y={getTextPosition(code, cx, cy, size).y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fontSize}
              fontWeight="500"
              fill={selectedSurfaces.includes(code) ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'}
              className="pointer-events-none"
            >
              {code}
            </text>
          </g>
        ))}
      </svg>
      
      <div className="flex gap-1 flex-wrap justify-center">
        {surfaces.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            disabled={disabled}
            onClick={() => onToggleSurface(code)}
            className={cn(
              "px-2 py-0.5 text-xs rounded border transition-all",
              selectedSurfaces.includes(code)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {code} - {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Path generators for each surface
function getOclusialPath(cx: number, cy: number, size: "sm" | "md" | "lg"): string {
  const r = size === 'sm' ? 12 : size === 'md' ? 18 : 25;
  return `M ${cx - r} ${cy - r} L ${cx + r} ${cy - r} L ${cx + r} ${cy + r} L ${cx - r} ${cy + r} Z`;
}

function getMesialPath(cx: number, cy: number, size: "sm" | "md" | "lg"): string {
  const inner = size === 'sm' ? 12 : size === 'md' ? 18 : 25;
  const outer = size === 'sm' ? 28 : size === 'md' ? 44 : 62;
  return `M ${cx - inner} ${cy - inner} L ${cx - outer} ${cy - outer} L ${cx - outer} ${cy + outer} L ${cx - inner} ${cy + inner} Z`;
}

function getDistalPath(cx: number, cy: number, size: "sm" | "md" | "lg"): string {
  const inner = size === 'sm' ? 12 : size === 'md' ? 18 : 25;
  const outer = size === 'sm' ? 28 : size === 'md' ? 44 : 62;
  return `M ${cx + inner} ${cy - inner} L ${cx + outer} ${cy - outer} L ${cx + outer} ${cy + outer} L ${cx + inner} ${cy + inner} Z`;
}

function getVestibularPath(cx: number, cy: number, size: "sm" | "md" | "lg"): string {
  const inner = size === 'sm' ? 12 : size === 'md' ? 18 : 25;
  const outer = size === 'sm' ? 28 : size === 'md' ? 44 : 62;
  return `M ${cx - inner} ${cy - inner} L ${cx - outer} ${cy - outer} L ${cx + outer} ${cy - outer} L ${cx + inner} ${cy - inner} Z`;
}

function getLingualPath(cx: number, cy: number, size: "sm" | "md" | "lg"): string {
  const inner = size === 'sm' ? 12 : size === 'md' ? 18 : 25;
  const outer = size === 'sm' ? 28 : size === 'md' ? 44 : 62;
  return `M ${cx - inner} ${cy + inner} L ${cx - outer} ${cy + outer} L ${cx + outer} ${cy + outer} L ${cx + inner} ${cy + inner} Z`;
}

function getTextPosition(code: string, cx: number, cy: number, size: "sm" | "md" | "lg") {
  const offset = size === 'sm' ? 20 : size === 'md' ? 32 : 44;
  switch (code) {
    case 'O': return { x: cx, y: cy };
    case 'M': return { x: cx - offset, y: cy };
    case 'D': return { x: cx + offset, y: cy };
    case 'V': return { x: cx, y: cy - offset };
    case 'L': return { x: cx, y: cy + offset };
    default: return { x: cx, y: cy };
  }
}
