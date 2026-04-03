import { Activity, Search, Filter, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useScreenPermissionValidation } from "@/hooks/usePermissionValidation";

export default function Atendimento() {
  const { isLoading, hasAccess } = useScreenPermissionValidation("prontuario", "view");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasAccess) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Atendimento
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie os atendimentos da clínica
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar atendimento..." className="pl-9" />
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Calendar className="h-4 w-4" />
          Hoje
        </Button>
      </div>

      {/* Empty state */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Atendimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              Nenhum atendimento encontrado
            </h3>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-md">
              Os atendimentos iniciados a partir da agenda aparecerão aqui. 
              Vá até a Agenda para iniciar um novo atendimento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
