import { Menu, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface TabNavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  /** @deprecated No longer used - all items are shown in the horizontal menu */
  secondary?: boolean;
}

interface ProntuarioTabNavProps {
  items: TabNavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  criticalAlerts?: number;
  className?: string;
}

export function ProntuarioTabNav({
  items,
  activeTab,
  onTabChange,
  criticalAlerts = 0,
  className,
}: ProntuarioTabNavProps) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setDrawerOpen(false);
  };

  const activeItem = items.find(item => item.id === activeTab);

  // Compact button for horizontal menu (Desktop/Tablet)
  const renderCompactButton = (item: TabNavItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        role="tab"
        aria-selected={isActive}
        aria-controls={`panel-${item.id}`}
        onClick={() => handleTabClick(item.id)}
        className={cn(
          // Base styles - compact design
          "inline-flex items-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          // Compact sizing
          "h-8 px-2.5 text-xs",
          // Active state with strong visual distinction
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        {Icon && (
          <Icon
            className={cn(
              "h-3.5 w-3.5 flex-shrink-0",
              isActive ? "text-primary-foreground" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
        )}
        <span>{item.label}</span>
        {item.badge && item.badge > 0 && (
          <Badge
            variant={isActive ? "secondary" : (item.badgeVariant || "destructive")}
            className={cn(
              "text-[10px] px-1 h-4 min-w-[16px] ml-0.5",
              isActive && "bg-primary-foreground/20 text-primary-foreground"
            )}
          >
            {item.badge}
          </Badge>
        )}
      </button>
    );
  };

  // Fullscreen vertical menu item (Mobile)
  const renderDrawerItem = (item: TabNavItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => handleTabClick(item.id)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-left transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted text-foreground"
        )}
      >
        {Icon && (
          <Icon
            className={cn(
              "h-5 w-5 flex-shrink-0",
              isActive ? "text-primary-foreground" : "text-muted-foreground"
            )}
          />
        )}
        <span className="flex-1 font-medium">{item.label}</span>
        {item.badge && item.badge > 0 && (
          <Badge
            variant={isActive ? "secondary" : (item.badgeVariant || "destructive")}
            className={cn(
              "text-xs",
              isActive && "bg-primary-foreground/20 text-primary-foreground"
            )}
          >
            {item.badge}
          </Badge>
        )}
      </button>
    );
  };

  // Mobile: Button + Drawer
  if (isMobile) {
    return (
      <div className={cn("w-full border-b bg-background sticky top-0 z-10", className)}>
        <div className="px-3 py-2">
          <Button
            variant="outline"
            className="w-full justify-between h-10"
            onClick={() => setDrawerOpen(true)}
          >
            <span className="flex items-center gap-2">
              {activeItem?.icon && <activeItem.icon className="h-4 w-4" />}
              <span className="font-medium">
                {activeItem?.label || "Ações do Prontuário"}
              </span>
            </span>
            <Menu className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="border-b pb-4">
              <DrawerTitle className="text-lg">Ações do Prontuário</DrawerTitle>
            </DrawerHeader>
            <ScrollArea className="flex-1 px-4 py-2">
              <nav className="flex flex-col gap-1" role="tablist" aria-label="Navegação do prontuário">
                {items.map(renderDrawerItem)}
              </nav>
            </ScrollArea>
            <div className="p-4 border-t">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Fechar
                </Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  // Desktop/Tablet: Compact horizontal menu with flex-wrap (up to 2 lines)
  return (
    <div className={cn("w-full border-b bg-background sticky top-0 z-10", className)}>
      <nav
        className="flex flex-wrap items-center gap-1.5 py-2 px-3"
        role="tablist"
        aria-label="Navegação do prontuário"
      >
        {items.map(renderCompactButton)}
      </nav>
    </div>
  );
}
