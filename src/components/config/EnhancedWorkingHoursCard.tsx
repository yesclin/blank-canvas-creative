import { useState } from "react";
import { Clock, Copy, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
  lunchStart: string;
  lunchEnd: string;
  hasLunch: boolean;
}

export interface WeekSchedule {
  seg: DaySchedule;
  ter: DaySchedule;
  qua: DaySchedule;
  qui: DaySchedule;
  sex: DaySchedule;
  sab: DaySchedule;
  dom: DaySchedule;
}

const weekDays = [
  { id: "seg", label: "Segunda-feira", short: "Seg" },
  { id: "ter", label: "Terça-feira", short: "Ter" },
  { id: "qua", label: "Quarta-feira", short: "Qua" },
  { id: "qui", label: "Quinta-feira", short: "Qui" },
  { id: "sex", label: "Sexta-feira", short: "Sex" },
  { id: "sab", label: "Sábado", short: "Sáb" },
  { id: "dom", label: "Domingo", short: "Dom" },
] as const;

type DayId = (typeof weekDays)[number]["id"];

const defaultDaySchedule: DaySchedule = {
  enabled: false,
  open: "08:00",
  close: "18:00",
  lunchStart: "12:00",
  lunchEnd: "13:00",
  hasLunch: false,
};

const defaultWeekSchedule: WeekSchedule = {
  seg: { ...defaultDaySchedule, enabled: true },
  ter: { ...defaultDaySchedule, enabled: true },
  qua: { ...defaultDaySchedule, enabled: true },
  qui: { ...defaultDaySchedule, enabled: true },
  sex: { ...defaultDaySchedule, enabled: true },
  sab: { ...defaultDaySchedule, enabled: false },
  dom: { ...defaultDaySchedule, enabled: false },
};

interface EnhancedWorkingHoursCardProps {
  schedule: WeekSchedule;
  onScheduleChange: (schedule: WeekSchedule) => void;
  canEdit?: boolean;
}

export function getDefaultWeekSchedule(): WeekSchedule {
  return JSON.parse(JSON.stringify(defaultWeekSchedule));
}

export function EnhancedWorkingHoursCard({
  schedule,
  onScheduleChange,
  canEdit = true,
}: EnhancedWorkingHoursCardProps) {
  const [copyFromDay, setCopyFromDay] = useState<DayId | null>(null);
  const [copyPopoverOpen, setCopyPopoverOpen] = useState<DayId | null>(null);

  // Normalize schedule to ensure all days have valid data
  const normalizedSchedule: WeekSchedule = {
    seg: schedule?.seg ?? { ...defaultDaySchedule, enabled: true },
    ter: schedule?.ter ?? { ...defaultDaySchedule, enabled: true },
    qua: schedule?.qua ?? { ...defaultDaySchedule, enabled: true },
    qui: schedule?.qui ?? { ...defaultDaySchedule, enabled: true },
    sex: schedule?.sex ?? { ...defaultDaySchedule, enabled: true },
    sab: schedule?.sab ?? { ...defaultDaySchedule, enabled: false },
    dom: schedule?.dom ?? { ...defaultDaySchedule, enabled: false },
  };

  const updateDaySchedule = (day: DayId, updates: Partial<DaySchedule>) => {
    if (!canEdit) return;
    
    const newSchedule = {
      ...normalizedSchedule,
      [day]: { ...normalizedSchedule[day], ...updates },
    };
    onScheduleChange(newSchedule);
  };

  const validateTime = (day: DayId): string | null => {
    const daySchedule = normalizedSchedule[day];
    if (!daySchedule?.enabled) return null;

    const open = daySchedule.open;
    const close = daySchedule.close;

    if (open >= close) {
      return "Horário de fechamento deve ser após abertura";
    }

    if (daySchedule.hasLunch) {
      const lunchStart = daySchedule.lunchStart;
      const lunchEnd = daySchedule.lunchEnd;

      if (lunchStart >= lunchEnd) {
        return "Fim do intervalo deve ser após início";
      }
      if (lunchStart <= open || lunchEnd >= close) {
        return "Intervalo deve estar dentro do horário de funcionamento";
      }
    }

    return null;
  };

  const copyHoursToDay = (fromDay: DayId, toDay: DayId) => {
    if (!canEdit || fromDay === toDay) return;
    
    const fromSchedule = normalizedSchedule[fromDay];
    updateDaySchedule(toDay, {
      open: fromSchedule.open,
      close: fromSchedule.close,
      lunchStart: fromSchedule.lunchStart,
      lunchEnd: fromSchedule.lunchEnd,
      hasLunch: fromSchedule.hasLunch,
      enabled: true,
    });
    setCopyPopoverOpen(null);
  };

  const copyToAllWeekdays = (fromDay: DayId) => {
    if (!canEdit) return;
    
    const fromSchedule = normalizedSchedule[fromDay];
    const weekdayIds: DayId[] = ["seg", "ter", "qua", "qui", "sex"];
    
    const newSchedule = { ...normalizedSchedule };
    weekdayIds.forEach((dayId) => {
      newSchedule[dayId] = {
        ...newSchedule[dayId],
        open: fromSchedule.open,
        close: fromSchedule.close,
        lunchStart: fromSchedule.lunchStart,
        lunchEnd: fromSchedule.lunchEnd,
        hasLunch: fromSchedule.hasLunch,
        enabled: true,
      };
    });
    onScheduleChange(newSchedule);
    setCopyPopoverOpen(null);
  };

  const formatTimeRange = (day: DaySchedule): string => {
    if (!day.enabled) return "Fechado";
    let range = `${day.open} - ${day.close}`;
    if (day.hasLunch) {
      range += ` (intervalo: ${day.lunchStart} - ${day.lunchEnd})`;
    }
    return range;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Horário de Funcionamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {weekDays.map((day) => {
          const daySchedule = normalizedSchedule[day.id];
          const error = validateTime(day.id);
          const isWeekend = day.id === "sab" || day.id === "dom";

          return (
            <div
              key={day.id}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                daySchedule.enabled ? "bg-background" : "bg-muted/50",
                error && "border-destructive"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={daySchedule.enabled}
                    onCheckedChange={(checked) =>
                      updateDaySchedule(day.id, { enabled: checked })
                    }
                    disabled={!canEdit}
                  />
                  <Label
                    className={cn(
                      "font-medium",
                      !daySchedule.enabled && "text-muted-foreground"
                    )}
                  >
                    {day.label}
                  </Label>
                  {isWeekend && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      Fim de semana
                    </span>
                  )}
                </div>

                {daySchedule.enabled && canEdit && (
                  <Popover
                    open={copyPopoverOpen === day.id}
                    onOpenChange={(open) =>
                      setCopyPopoverOpen(open ? day.id : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8">
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="end">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Copiar horário para:</p>
                        <div className="space-y-1">
                          {weekDays
                            .filter((d) => d.id !== day.id)
                            .map((targetDay) => (
                              <Button
                                key={targetDay.id}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => copyHoursToDay(day.id, targetDay.id)}
                              >
                                {targetDay.label}
                              </Button>
                            ))}
                        </div>
                        <Separator />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => copyToAllWeekdays(day.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Todos os dias úteis
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {daySchedule.enabled && (
                <div className="space-y-3 pl-10">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Abertura
                      </Label>
                      <Input
                        type="time"
                        value={daySchedule.open}
                        onChange={(e) =>
                          updateDaySchedule(day.id, { open: e.target.value })
                        }
                        disabled={!canEdit}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Fechamento
                      </Label>
                      <Input
                        type="time"
                        value={daySchedule.close}
                        onChange={(e) =>
                          updateDaySchedule(day.id, { close: e.target.value })
                        }
                        disabled={!canEdit}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`lunch-${day.id}`}
                      checked={daySchedule.hasLunch}
                      onCheckedChange={(checked) =>
                        updateDaySchedule(day.id, { hasLunch: !!checked })
                      }
                      disabled={!canEdit}
                    />
                    <Label
                      htmlFor={`lunch-${day.id}`}
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Intervalo (almoço)
                    </Label>
                  </div>

                  {daySchedule.hasLunch && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Início do intervalo
                        </Label>
                        <Input
                          type="time"
                          value={daySchedule.lunchStart}
                          onChange={(e) =>
                            updateDaySchedule(day.id, {
                              lunchStart: e.target.value,
                            })
                          }
                          disabled={!canEdit}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Fim do intervalo
                        </Label>
                        <Input
                          type="time"
                          value={daySchedule.lunchEnd}
                          onChange={(e) =>
                            updateDaySchedule(day.id, {
                              lunchEnd: e.target.value,
                            })
                          }
                          disabled={!canEdit}
                          className="h-9"
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-1 text-destructive text-xs">
                      <AlertCircle className="h-3 w-3" />
                      {error}
                    </div>
                  )}
                </div>
              )}

              {!daySchedule.enabled && (
                <p className="text-sm text-muted-foreground pl-10">Fechado</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
