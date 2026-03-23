import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/types/agenda";

interface AgendaDateNavigationProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function AgendaDateNavigation({
  selectedDate,
  onDateChange,
  viewMode,
  onViewModeChange,
}: AgendaDateNavigationProps) {
  const navigateDate = (direction: "prev" | "next") => {
    const offset = direction === "prev" ? -1 : 1;
    switch (viewMode) {
      case "daily":
        onDateChange(addDays(selectedDate, offset));
        break;
      case "weekly":
        onDateChange(addDays(selectedDate, offset * 7));
        break;
      case "monthly":
        onDateChange(addDays(selectedDate, offset * 30));
        break;
      default:
        onDateChange(addDays(selectedDate, offset));
    }
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      {/* Date Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateDate("prev")}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[180px] font-medium">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateDate("next")}
          className="h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant={isToday ? "secondary" : "ghost"}
          size="sm"
          onClick={goToToday}
          className={cn(isToday && "bg-primary/10 text-primary")}
        >
          Hoje
        </Button>
      </div>

      {/* View Mode Selector - Simplified */}
      <div className="flex border rounded-lg overflow-hidden bg-muted/50">
        {(["daily", "weekly", "monthly"] as ViewMode[]).map((mode) => (
          <Button
            key={mode}
            variant={viewMode === mode ? "default" : "ghost"}
            size="sm"
            className={cn(
              "rounded-none border-0 px-4",
              viewMode !== mode && "hover:bg-muted"
            )}
            onClick={() => onViewModeChange(mode)}
          >
            {mode === "daily" && "Dia"}
            {mode === "weekly" && "Semana"}
            {mode === "monthly" && "Mês"}
          </Button>
        ))}
      </div>
    </div>
  );
}
