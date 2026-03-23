import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Activity,
  Calendar,
  Clock,
  FileText,
  TrendingUp,
  User,
  AlertTriangle,
  Pill,
  Heart,
  Paperclip
} from "lucide-react";
import { 
  PatientSummary, 
  PatientClinicalData, 
  ClinicalEvolution, 
  ClinicalAlert,
  MedicalAttachment,
  evolutionTypeLabels,
  specialtyLabels,
  Specialty
} from "@/types/prontuario";
import { format, parseISO, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OverviewTabProps {
  patient: PatientSummary;
  clinicalData: PatientClinicalData;
  evolutions: ClinicalEvolution[];
  alerts: ClinicalAlert[];
  attachments: MedicalAttachment[];
  onNavigateToTab: (tab: string) => void;
}

export function OverviewTab({ 
  patient, 
  clinicalData, 
  evolutions, 
  alerts,
  attachments,
  onNavigateToTab 
}: OverviewTabProps) {
  const activeAlerts = alerts.filter(a => a.is_active);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  const lastEvolution = evolutions.length > 0 
    ? evolutions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null;
  const signedEvolutions = evolutions.filter(e => e.status === 'signed');

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), parseISO(birthDate));
  };

  return (
    <div className="space-y-6">
      {/* Alertas Críticos */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-700 mb-2">Alertas Críticos Ativos</h4>
                <div className="flex flex-wrap gap-2">
                  {criticalAlerts.map(alert => (
                    <Badge key={alert.id} variant="destructive">{alert.title}</Badge>
                  ))}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => onNavigateToTab('alerts')}>
                Ver Todos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigateToTab('evolutions')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{evolutions.length}</p>
                <p className="text-xs text-muted-foreground">Evoluções</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigateToTab('appointments')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{signedEvolutions.length}</p>
                <p className="text-xs text-muted-foreground">Atendimentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigateToTab('exams')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Paperclip className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attachments.length}</p>
                <p className="text-xs text-muted-foreground">Documentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigateToTab('alerts')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAlerts.length}</p>
                <p className="text-xs text-muted-foreground">Alertas Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumo Clínico */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Resumo Clínico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dados do Paciente */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Idade:</span>
                <span className="ml-2 font-medium">
                  {patient.birth_date ? `${calculateAge(patient.birth_date)} anos` : 'Não informado'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Sexo:</span>
                <span className="ml-2 font-medium">{patient.gender || 'Não informado'}</span>
              </div>
              {clinicalData.blood_type && (
                <div>
                  <span className="text-muted-foreground">Tipo Sanguíneo:</span>
                  <Badge variant="outline" className="ml-2">{clinicalData.blood_type}</Badge>
                </div>
              )}
            </div>

            <Separator />

            {/* Alergias */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Alergias</span>
              </div>
              {clinicalData.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {clinicalData.allergies.map((allergy, idx) => (
                    <Badge key={idx} variant="destructive" className="text-xs">{allergy}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma alergia informada</p>
              )}
            </div>

            {/* Doenças Crônicas */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-pink-500" />
                <span className="text-sm font-medium">Doenças Crônicas</span>
              </div>
              {clinicalData.chronic_diseases.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {clinicalData.chronic_diseases.map((disease, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">{disease}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma doença crônica</p>
              )}
            </div>

            {/* Medicamentos */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Pill className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Medicamentos em Uso</span>
              </div>
              {clinicalData.current_medications.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {clinicalData.current_medications.map((med, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">{med}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum medicamento em uso</p>
              )}
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => onNavigateToTab('anamnesis')}
            >
              Ver Anamnese Completa
            </Button>
          </CardContent>
        </Card>

        {/* Último Atendimento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Último Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastEvolution ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {evolutionTypeLabels[lastEvolution.evolution_type]}
                    </Badge>
                    {lastEvolution.specialty && (
                      <Badge variant="secondary">
                        {specialtyLabels[lastEvolution.specialty as Specialty]}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(parseISO(lastEvolution.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{lastEvolution.professional_name || 'Profissional não informado'}</span>
                </div>

                {/* Preview do conteúdo */}
                <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-2">
                  {Object.entries(lastEvolution.content).slice(0, 2).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                      <p className="text-muted-foreground line-clamp-2">
                        {String(value)}
                      </p>
                    </div>
                  ))}
                </div>

                {lastEvolution.next_steps && (
                  <div className="p-2 bg-blue-50 rounded text-sm border border-blue-200">
                    <span className="font-medium text-blue-700">Próximos passos:</span>
                    <p className="text-blue-600">{lastEvolution.next_steps}</p>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => onNavigateToTab('evolutions')}
                >
                  Ver Histórico Completo
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum atendimento registrado</p>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => onNavigateToTab('evolutions')}
                >
                  Registrar Primeiro Atendimento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linha do Tempo Resumida */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Linha do Tempo Recente
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigateToTab('history')}>
              Ver Histórico Completo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {evolutions.length > 0 ? (
            <div className="space-y-3">
              {evolutions
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((evolution, index) => (
                  <div 
                    key={evolution.id} 
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        evolution.status === 'signed' ? 'bg-green-500' : 
                        evolution.status === 'draft' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      {index < Math.min(evolutions.length - 1, 4) && (
                        <div className="w-0.5 h-8 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {evolutionTypeLabels[evolution.evolution_type]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(evolution.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {evolution.professional_name}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Nenhum registro encontrado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
