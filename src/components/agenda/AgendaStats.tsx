import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  UserX, 
  CalendarPlus, 
  Clock, 
  Percent 
} from "lucide-react";
import type { AgendaStats as StatsType } from "@/types/agenda";

interface AgendaStatsProps {
  stats: StatsType;
}

export function AgendaStats({ stats }: AgendaStatsProps) {
  const statItems = [
    {
      label: 'Total de Atendimentos',
      value: stats.totalAppointments,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Faltas',
      value: stats.absences,
      icon: UserX,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: 'Encaixes',
      value: stats.fitIns,
      icon: CalendarPlus,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      label: 'Horários Livres',
      value: stats.freeSlots,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Taxa de Ocupação',
      value: `${stats.occupancyRate}%`,
      icon: Percent,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {statItems.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
