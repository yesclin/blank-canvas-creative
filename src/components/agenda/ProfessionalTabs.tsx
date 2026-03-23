import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Users, User } from "lucide-react";
import type { Professional } from "@/types/agenda";

interface ProfessionalTabsProps {
  professionals: Professional[];
  selectedProfessionalId: string | null; // null = "Todos"
  onSelectProfessional: (id: string | null) => void;
  maxVisibleTabs?: number;
}

export function ProfessionalTabs({
  professionals,
  selectedProfessionalId,
  onSelectProfessional,
  maxVisibleTabs = 5,
}: ProfessionalTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Active professionals only
  const activeProfessionals = professionals.filter(p => p.is_active);

  // Determine visible vs overflow tabs
  const visibleProfessionals = activeProfessionals.slice(0, maxVisibleTabs);
  const overflowProfessionals = activeProfessionals.slice(maxVisibleTabs);

  // Track container width for responsive behavior
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Adjust visible tabs based on container width
  const responsiveMaxTabs = containerWidth < 500 ? 2 : containerWidth < 700 ? 3 : maxVisibleTabs;
  const actualVisibleProfessionals = activeProfessionals.slice(0, responsiveMaxTabs);
  const actualOverflowProfessionals = activeProfessionals.slice(responsiveMaxTabs);

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getShortName = (name: string) => {
    const parts = name.split(" ");
    if (parts.length <= 2) return name;
    // Dr./Dra. + First name
    if (parts[0].toLowerCase().startsWith("dr")) {
      return `${parts[0]} ${parts[1]}`;
    }
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };

  // Check if selected professional is in overflow
  const selectedInOverflow = actualOverflowProfessionals.some(
    p => p.id === selectedProfessionalId
  );
  const selectedOverflowProfessional = selectedInOverflow
    ? actualOverflowProfessionals.find(p => p.id === selectedProfessionalId)
    : null;

  return (
    <div 
      ref={containerRef} 
      className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
    >
      <ScrollArea className="w-full">
        <div className="flex items-center gap-1 px-4 py-2">
          {/* Tab "Todos" */}
          <Button
            variant={selectedProfessionalId === null ? "default" : "ghost"}
            size="sm"
            onClick={() => onSelectProfessional(null)}
            className={cn(
              "flex items-center gap-2 shrink-0 transition-all",
              selectedProfessionalId === null && "shadow-sm"
            )}
          >
            <Users className="h-4 w-4" />
            <span>Todos</span>
          </Button>

          {/* Visible professional tabs */}
          {actualVisibleProfessionals.map((professional) => (
            <Button
              key={professional.id}
              variant={selectedProfessionalId === professional.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onSelectProfessional(professional.id)}
              className={cn(
                "flex items-center gap-2 shrink-0 transition-all",
                selectedProfessionalId === professional.id && "shadow-sm"
              )}
            >
              {professional.avatar_url ? (
                <img
                  src={professional.avatar_url}
                  alt={professional.full_name}
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white"
                  style={{ backgroundColor: professional.color || "#6366f1" }}
                >
                  {getInitials(professional.full_name)}
                </div>
              )}
              <span className="hidden sm:inline">{getShortName(professional.full_name)}</span>
              <span className="sm:hidden">{getInitials(professional.full_name)}</span>
            </Button>
          ))}

          {/* Overflow dropdown */}
          {actualOverflowProfessionals.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={selectedInOverflow ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "flex items-center gap-1 shrink-0",
                    selectedInOverflow && "shadow-sm"
                  )}
                >
                  {selectedOverflowProfessional ? (
                    <>
                      <div
                        className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white"
                        style={{ backgroundColor: selectedOverflowProfessional.color || "#6366f1" }}
                      >
                        {getInitials(selectedOverflowProfessional.full_name)}
                      </div>
                      <span className="hidden sm:inline max-w-[100px] truncate">
                        {getShortName(selectedOverflowProfessional.full_name)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>+{actualOverflowProfessionals.length}</span>
                    </>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {actualOverflowProfessionals.map((professional) => (
                  <DropdownMenuItem
                    key={professional.id}
                    onClick={() => onSelectProfessional(professional.id)}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      selectedProfessionalId === professional.id && "bg-primary/10"
                    )}
                  >
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0"
                      style={{ backgroundColor: professional.color || "#6366f1" }}
                    >
                      {getInitials(professional.full_name)}
                    </div>
                    <span className="truncate">{professional.full_name}</span>
                    {professional.specialty && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {professional.specialty.name}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
}
