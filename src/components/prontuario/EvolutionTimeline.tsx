import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  User, 
  FileText, 
  ChevronRight,
  CheckCircle,
  Edit,
  Stethoscope
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

interface EvolutionTimelineProps {
  evolutions: ClinicalEvolution[];
  onViewEvolution?: (evolution: ClinicalEvolution) => void;
  onEditEvolution?: (evolution: ClinicalEvolution) => void;
}

export function EvolutionTimeline({ evolutions, onViewEvolution, onEditEvolution }: EvolutionTimelineProps) {
  // Sort by date descending (most recent first)
  const sortedEvolutions = [...evolutions].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return 'bg-green-100 text-green-700 border-green-300';
      case 'draft': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'amended': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Evoluções
          <Badge variant="secondary">{evolutions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {sortedEvolutions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Nenhuma evolução registrada
            </p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              
              {sortedEvolutions.map((evolution, index) => (
                <div key={evolution.id} className="relative pl-10 pb-6 last:pb-0">
                  {/* Timeline dot */}
                  <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 ${
                    evolution.status === 'signed' 
                      ? 'bg-green-500 border-green-300' 
                      : evolution.status === 'draft'
                      ? 'bg-yellow-500 border-yellow-300'
                      : 'bg-blue-500 border-blue-300'
                  }`} />
                  
                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewEvolution?.(evolution)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">
                              {evolutionTypeLabels[evolution.evolution_type]}
                            </Badge>
                            <Badge className={getStatusColor(evolution.status)}>
                              {evolution.status === 'signed' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {evolutionStatusLabels[evolution.status]}
                            </Badge>
                            {evolution.specialty && (
                              <Badge variant="secondary" className="text-xs">
                                <Stethoscope className="h-3 w-3 mr-1" />
                                {specialtyLabels[evolution.specialty as Specialty]}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {format(parseISO(evolution.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{evolution.professional_name}</span>
                            </div>
                          </div>
                          
                          {/* Preview do conteúdo */}
                          {evolution.content && Object.keys(evolution.content).length > 0 && (
                            <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                              {Object.entries(evolution.content).slice(0, 2).map(([key, value]) => (
                                <p key={key} className="truncate text-muted-foreground">
                                  <span className="font-medium">{key}:</span>{' '}
                                  {String(value).substring(0, 80)}
                                  {String(value).length > 80 && '...'}
                                </p>
                              ))}
                            </div>
                          )}
                          
                          {evolution.next_steps && (
                            <p className="text-sm text-primary mt-2">
                              <strong>Próximo passo:</strong> {evolution.next_steps}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {evolution.status === 'draft' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditEvolution?.(evolution);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
