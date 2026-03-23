import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar,
  Search,
  Filter,
  User,
  Clock,
  FileText,
  Eye,
  ChevronRight,
  DollarSign
} from "lucide-react";
import { 
  ClinicalEvolution,
  evolutionTypeLabels,
  evolutionStatusLabels,
  specialtyLabels,
  Specialty
} from "@/types/prontuario";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";

interface AppointmentsTabProps {
  evolutions: ClinicalEvolution[];
  onViewEvolution?: (evolution: ClinicalEvolution) => void;
}

export function AppointmentsTab({ evolutions, onViewEvolution }: AppointmentsTabProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { can, isLoading: permissionsLoading } = usePermissions();
  
  // Check if user can view financial data
  const canViewCosts = can("financeiro", "view");

  // Filter only signed evolutions (completed appointments)
  const appointments = evolutions.filter(e => e.status === 'signed');

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = search === "" || 
      apt.professional_name?.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(apt.content).toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  // Group by month
  const groupedByMonth = filteredAppointments.reduce((acc, apt) => {
    const month = format(parseISO(apt.created_at), "MMMM yyyy", { locale: ptBR });
    if (!acc[month]) acc[month] = [];
    acc[month].push(apt);
    return acc;
  }, {} as Record<string, ClinicalEvolution[]>);

  const statusColors: Record<string, string> = {
    signed: 'bg-green-100 text-green-700 border-green-200',
    draft: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    amended: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Atendimentos Realizados</h2>
          <Badge variant="secondary">{appointments.length}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar atendimentos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{appointments.length}</div>
            <div className="text-xs text-muted-foreground">Total de Atendimentos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter(a => a.evolution_type === 'consultation').length}
            </div>
            <div className="text-xs text-muted-foreground">Consultas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {appointments.filter(a => a.evolution_type === 'return').length}
            </div>
            <div className="text-xs text-muted-foreground">Retornos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {appointments.filter(a => a.evolution_type === 'procedure').length}
            </div>
            <div className="text-xs text-muted-foreground">Procedimentos</div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {Object.keys(groupedByMonth).length > 0 ? (
              Object.entries(groupedByMonth).map(([month, apts]) => (
                <div key={month}>
                  <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-4 py-2 border-b">
                    <h3 className="font-medium text-sm capitalize">{month}</h3>
                  </div>
                  <div className="divide-y">
                    {apts.map(apt => (
                      <div 
                        key={apt.id}
                        className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => onViewEvolution?.(apt)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {evolutionTypeLabels[apt.evolution_type]}
                                </span>
                                {apt.specialty && (
                                  <Badge variant="outline" className="text-xs">
                                    {specialtyLabels[apt.specialty as Specialty]}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <User className="h-3 w-3" />
                                <span>{apt.professional_name || 'Profissional'}</span>
                              </div>
                              {Object.entries(apt.content).slice(0, 1).map(([key, value]) => (
                                <p key={key} className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                  {String(value)}
                                </p>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {format(parseISO(apt.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {canViewCosts && (apt as any).procedure_cost !== undefined && (apt as any).procedure_cost !== null && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {new Intl.NumberFormat("pt-BR", { 
                                      style: "currency", 
                                      currency: "BRL" 
                                    }).format((apt as any).procedure_cost)}
                                  </Badge>
                                )}
                                <Badge className={`${statusColors[apt.status]}`}>
                                  {evolutionStatusLabels[apt.status]}
                                </Badge>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum atendimento encontrado</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
