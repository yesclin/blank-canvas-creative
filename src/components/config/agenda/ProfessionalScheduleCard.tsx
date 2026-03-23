import { useState, useEffect } from "react";
import { User, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { WeekSchedule, DaySchedule, getDefaultWeekSchedule } from "@/components/config/EnhancedWorkingHoursCard";
import { Professional } from "@/hooks/useProfessionalSchedules";

const weekDays = [
  { id: "seg", label: "Segunda", short: "S" },
  { id: "ter", label: "Terça", short: "T" },
  { id: "qua", label: "Quarta", short: "Q" },
  { id: "qui", label: "Quinta", short: "Q" },
  { id: "sex", label: "Sexta", short: "S" },
  { id: "sab", label: "Sábado", short: "S" },
  { id: "dom", label: "Domingo", short: "D" },
] as const;

type DayId = (typeof weekDays)[number]["id"];

interface ProfessionalScheduleCardProps {
  professional: Professional;
  clinicSchedule: WeekSchedule;
  currentConfig: {
    useClinicDefault: boolean;
    schedule: WeekSchedule;
    durationMinutes: number;
  };
  onSave: (
    useClinicDefault: boolean,
    schedule: WeekSchedule,
    durationMinutes: number
  ) => Promise<boolean>;
  isSaving: boolean;
}

const defaultDaySchedule: DaySchedule = {
  enabled: false,
  open: "08:00",
  close: "18:00",
  lunchStart: "12:00",
  lunchEnd: "13:00",
  hasLunch: false,
};

function normalizeSchedule(schedule: WeekSchedule | undefined | null): WeekSchedule {
  const defaultSchedule = getDefaultWeekSchedule();
  if (!schedule) return defaultSchedule;
  
  return {
    seg: schedule.seg ?? { ...defaultDaySchedule, enabled: true },
    ter: schedule.ter ?? { ...defaultDaySchedule, enabled: true },
    qua: schedule.qua ?? { ...defaultDaySchedule, enabled: true },
    qui: schedule.qui ?? { ...defaultDaySchedule, enabled: true },
    sex: schedule.sex ?? { ...defaultDaySchedule, enabled: true },
    sab: schedule.sab ?? { ...defaultDaySchedule, enabled: false },
    dom: schedule.dom ?? { ...defaultDaySchedule, enabled: false },
  };
}

export function ProfessionalScheduleCard({
  professional,
  clinicSchedule,
  currentConfig,
  onSave,
  isSaving,
}: ProfessionalScheduleCardProps) {
  const normalizedClinicSchedule = normalizeSchedule(clinicSchedule);
  
  const [isOpen, setIsOpen] = useState(false);
  const [useClinicDefault, setUseClinicDefault] = useState(currentConfig.useClinicDefault);
  const [schedule, setSchedule] = useState<WeekSchedule>(
    currentConfig.useClinicDefault 
      ? normalizedClinicSchedule 
      : normalizeSchedule(currentConfig.schedule)
  );
  const [durationMinutes, setDurationMinutes] = useState(currentConfig.durationMinutes);
  const [hasChanges, setHasChanges] = useState(false);
  const [copyPopoverOpen, setCopyPopoverOpen] = useState<DayId | null>(null);

  useEffect(() => {
    setUseClinicDefault(currentConfig.useClinicDefault);
    setSchedule(
      currentConfig.useClinicDefault 
        ? normalizeSchedule(clinicSchedule) 
        : normalizeSchedule(currentConfig.schedule)
    );
    setDurationMinutes(currentConfig.durationMinutes);
    setHasChanges(false);
  }, [currentConfig, clinicSchedule]);

  const handleUseDefaultChange = (checked: boolean) => {
    setUseClinicDefault(checked);
    if (checked) {
      setSchedule(normalizeSchedule(clinicSchedule));
    }
    setHasChanges(true);
  };

  const updateDaySchedule = (day: DayId, updates: Partial<DaySchedule>) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...(prev[day] ?? defaultDaySchedule), ...updates },
    }));
    setHasChanges(true);
  };

  const copyHoursToDay = (fromDay: DayId, toDay: DayId) => {
    const fromSchedule = schedule[fromDay];
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
    const fromSchedule = schedule[fromDay];
    const weekdayIds: DayId[] = ["seg", "ter", "qua", "qui", "sex"];
    
    const newSchedule = { ...schedule };
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
    setSchedule(newSchedule);
    setCopyPopoverOpen(null);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const success = await onSave(useClinicDefault, schedule, durationMinutes);
    if (success) {
      setHasChanges(false);
    }
  };

  const getActiveDays = () => {
    const effectiveSchedule = useClinicDefault ? normalizedClinicSchedule : schedule;
    return weekDays.filter(day => effectiveSchedule[day.id]?.enabled).map(day => day.short);
  };

  const formatTimeRange = () => {
    const effectiveSchedule = useClinicDefault ? normalizedClinicSchedule : schedule;
    const enabledDay = weekDays.find(day => effectiveSchedule[day.id]?.enabled);
    if (!enabledDay) return "Sem horário definido";
    const daySchedule = effectiveSchedule[enabledDay.id];
    if (!daySchedule) return "Sem horário definido";
    return `${daySchedule.open} - ${daySchedule.close}`;
  };

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: professional.color }}
                >
                  {professional.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-base font-medium">
                    {professional.full_name}
                  </CardTitle>
                  {professional.specialty_name && (
                    <p className="text-sm text-muted-foreground">
                      {professional.specialty_name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={useClinicDefault ? "secondary" : "default"} className="text-xs">
                  {useClinicDefault ? "Horário da clínica" : "Personalizado"}
                </Badge>
                <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                  {getActiveDays().map((day, i) => (
                    <span key={i} className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                      {day}
                    </span>
                  ))}
                </div>
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  {formatTimeRange()}
                </span>
                {hasChanges && (
                  <Badge variant="outline" className="border-amber-500 text-amber-600">
                    Não salvo
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <Separator />
            
            {/* Toggle: Use clinic default */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="space-y-0.5">
                <Label className="font-medium">Usar horário da clínica</Label>
                <p className="text-sm text-muted-foreground">
                  Seguir o horário padrão configurado para a clínica
                </p>
              </div>
              <Switch
                checked={useClinicDefault}
                onCheckedChange={handleUseDefaultChange}
              />
            </div>

            {/* Custom schedule section */}
            {!useClinicDefault && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Horário personalizado</Label>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">
                      Duração padrão:
                    </Label>
                    <Input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => {
                        setDurationMinutes(Number(e.target.value));
                        setHasChanges(true);
                      }}
                      min={5}
                      step={5}
                      className="w-20 h-8"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {weekDays.map((day) => {
                    const daySchedule = schedule[day.id];
                    const isWeekend = day.id === "sab" || day.id === "dom";

                    return (
                      <div
                        key={day.id}
                        className={cn(
                          "rounded-lg border p-3 transition-colors",
                          daySchedule.enabled ? "bg-background" : "bg-muted/30"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={daySchedule.enabled}
                              onCheckedChange={(checked) =>
                                updateDaySchedule(day.id, { enabled: checked })
                              }
                            />
                            <Label className={cn(
                              "font-medium",
                              !daySchedule.enabled && "text-muted-foreground"
                            )}>
                              {day.label}
                            </Label>
                            {isWeekend && (
                              <Badge variant="outline" className="text-xs">
                                Fim de semana
                              </Badge>
                            )}
                          </div>

                          {daySchedule.enabled && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={daySchedule.open}
                                onChange={(e) =>
                                  updateDaySchedule(day.id, { open: e.target.value })
                                }
                                className="w-24 h-8"
                              />
                              <span className="text-muted-foreground">às</span>
                              <Input
                                type="time"
                                value={daySchedule.close}
                                onChange={(e) =>
                                  updateDaySchedule(day.id, { close: e.target.value })
                                }
                                className="w-24 h-8"
                              />

                              <Popover
                                open={copyPopoverOpen === day.id}
                                onOpenChange={(open) =>
                                  setCopyPopoverOpen(open ? day.id : null)
                                }
                              >
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 px-2">
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48" align="end">
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">Copiar para:</p>
                                    <div className="space-y-1">
                                      {weekDays
                                        .filter((d) => d.id !== day.id)
                                        .map((targetDay) => (
                                          <Button
                                            key={targetDay.id}
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start h-8"
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
                                      <Check className="h-3 w-3 mr-1" />
                                      Dias úteis
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                        </div>

                        {daySchedule.enabled && (
                          <div className="mt-2 pl-10 flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`lunch-${professional.id}-${day.id}`}
                                checked={daySchedule.hasLunch}
                                onCheckedChange={(checked) =>
                                  updateDaySchedule(day.id, { hasLunch: !!checked })
                                }
                              />
                              <Label
                                htmlFor={`lunch-${professional.id}-${day.id}`}
                                className="text-sm text-muted-foreground cursor-pointer"
                              >
                                Intervalo
                              </Label>
                            </div>

                            {daySchedule.hasLunch && (
                              <>
                                <Input
                                  type="time"
                                  value={daySchedule.lunchStart}
                                  onChange={(e) =>
                                    updateDaySchedule(day.id, { lunchStart: e.target.value })
                                  }
                                  className="w-24 h-7 text-sm"
                                />
                                <span className="text-sm text-muted-foreground">às</span>
                                <Input
                                  type="time"
                                  value={daySchedule.lunchEnd}
                                  onChange={(e) =>
                                    updateDaySchedule(day.id, { lunchEnd: e.target.value })
                                  }
                                  className="w-24 h-7 text-sm"
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                size="sm"
              >
                {isSaving ? "Salvando..." : "Salvar horário"}
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
