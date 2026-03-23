import { Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const weekDays = [
  { id: "seg", label: "Segunda" },
  { id: "ter", label: "Terça" },
  { id: "qua", label: "Quarta" },
  { id: "qui", label: "Quinta" },
  { id: "sex", label: "Sexta" },
  { id: "sab", label: "Sábado" },
  { id: "dom", label: "Domingo" },
];

interface WorkingHoursCardProps {
  workingDays: string[];
  openTime: string;
  closeTime: string;
  lunchStart: string;
  lunchEnd: string;
  onWorkingDaysChange: (days: string[]) => void;
  onOpenTimeChange: (time: string) => void;
  onCloseTimeChange: (time: string) => void;
  onLunchStartChange: (time: string) => void;
  onLunchEndChange: (time: string) => void;
}

export function WorkingHoursCard({
  workingDays,
  openTime,
  closeTime,
  lunchStart,
  lunchEnd,
  onWorkingDaysChange,
  onOpenTimeChange,
  onCloseTimeChange,
  onLunchStartChange,
  onLunchEndChange,
}: WorkingHoursCardProps) {
  const toggleDay = (dayId: string) => {
    if (workingDays.includes(dayId)) {
      onWorkingDaysChange(workingDays.filter((d) => d !== dayId));
    } else {
      onWorkingDaysChange([...workingDays, dayId]);
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horário de Funcionamento
        </CardTitle>
        <CardDescription>
          Defina os dias e horários de atendimento da clínica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div>
            <Label className="mb-3 block">Dias de Atendimento</Label>
            <div className="flex flex-wrap gap-3">
              {weekDays.map((day) => (
                <div
                  key={day.id}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={day.id}
                    checked={workingDays.includes(day.id)}
                    onCheckedChange={() => toggleDay(day.id)}
                  />
                  <Label
                    htmlFor={day.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="open_time">Abertura</Label>
              <Input
                id="open_time"
                type="time"
                value={openTime}
                onChange={(e) => onOpenTimeChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="close_time">Fechamento</Label>
              <Input
                id="close_time"
                type="time"
                value={closeTime}
                onChange={(e) => onCloseTimeChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lunch_start">Início do Almoço</Label>
              <Input
                id="lunch_start"
                type="time"
                value={lunchStart}
                onChange={(e) => onLunchStartChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lunch_end">Fim do Almoço</Label>
              <Input
                id="lunch_end"
                type="time"
                value={lunchEnd}
                onChange={(e) => onLunchEndChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
