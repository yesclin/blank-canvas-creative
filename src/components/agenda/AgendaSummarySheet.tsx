import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Calendar,
  UserX,
  CalendarPlus,
  Clock,
  Percent,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import type { AgendaStats as StatsType } from "@/types/agenda";

interface AgendaSummarySheetProps {
  stats: StatsType;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AgendaSummarySheet({ stats, open, onOpenChange }: AgendaSummarySheetProps) {
  const statItems = [
    {
      label: "Total de Atendimentos",
      value: stats.totalAppointments,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Faltas",
      value: stats.absences,
      icon: UserX,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Encaixes",
      value: stats.fitIns,
      icon: CalendarPlus,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      label: "Horários Livres",
      value: stats.freeSlots,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Resumo do dia</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[340px] sm:w-[400px] flex flex-col max-h-screen">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Resumo do Dia
          </SheetTitle>
          <SheetDescription>
            Visão geral dos atendimentos de hoje
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 overflow-y-auto flex-1 min-h-0 pr-1">
          {/* Occupancy Rate - Featured */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Percent className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Taxa de Ocupação</span>
                </div>
                <span className="text-3xl font-bold text-primary">
                  {stats.occupancyRate}%
                </span>
              </div>
              <Progress value={stats.occupancyRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {stats.occupancyRate >= 80 ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    Excelente ocupação!
                  </span>
                ) : stats.occupancyRate >= 50 ? (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="h-3 w-3" />
                    Ocupação moderada
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    Há horários disponíveis
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="space-y-3">
            {statItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.bgColor}`}>
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-xl font-semibold">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Quick Insights */}
          {stats.absences > 0 && (
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="flex items-center gap-2 text-destructive">
                <UserX className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {stats.absences} falta(s) registrada(s)
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Considere entrar em contato para reagendamento
              </p>
            </div>
          )}

          {stats.freeSlots > 3 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {stats.freeSlots} horários livres
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Há oportunidade para encaixes ou novos agendamentos
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
