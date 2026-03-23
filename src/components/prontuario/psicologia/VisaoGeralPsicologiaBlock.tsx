import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User,
  Calendar,
  AlertTriangle,
  Pill,
  Clock,
  ShieldAlert,
  Brain,
  CalendarCheck,
  Repeat,
  PlayCircle,
  PauseCircle,
  XCircle
} from "lucide-react";
import { format, parseISO, differenceInYears, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { 
  PsicologiaPatientData, 
  PsicologiaSummaryData,
  StatusAcompanhamento 
} from "@/hooks/prontuario/psicologia/useVisaoGeralPsicologiaData";

interface VisaoGeralPsicologiaBlockProps {
  patient: PsicologiaPatientData | null;
  summary: PsicologiaSummaryData;
  loading?: boolean;
}

/**
 * VISÃO GERAL - Bloco exclusivo para Psicologia
 * 
 * Exibe um resumo rápido focado em acompanhamento terapêutico:
 * - Dados básicos do paciente (idade, sexo)
 * - Frequência das sessões
 * - Data da última sessão
 * - Alertas ativos (medicamentos em uso, condições relevantes)
 * - Status do acompanhamento (ativo / em pausa / encerrado)
 * 
 * Este bloco é SOMENTE LEITURA.
 */
export function VisaoGeralPsicologiaBlock({ 
  patient, 
  summary,
  loading = false
}: VisaoGeralPsicologiaBlockProps) {
  
  const { alerts, totalSessions, lastSessionDate, lastSessionProfessional, sessionFrequency, statusAcompanhamento } = summary;

  // Filter alerts by type
  const medicationAlerts = alerts.filter(a => 
    a.alert_type === 'medication' || a.alert_type === 'continuous_medication'
  );
  const conditionAlerts = alerts.filter(a => 
    a.alert_type === 'condition' || a.alert_type === 'chronic_disease' || a.alert_type === 'mental_health'
  );
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const otherAlerts = alerts.filter(a => 
    !['medication', 'continuous_medication', 'condition', 'chronic_disease', 'mental_health'].includes(a.alert_type) &&
    a.severity !== 'critical'
  );

  const calculateAge = (birthDate: string | null): string => {
    if (!birthDate) return 'Não informada';
    try {
      const years = differenceInYears(new Date(), parseISO(birthDate));
      return `${years} anos`;
    } catch {
      return 'Não informada';
    }
  };

  const formatGender = (gender: string | null): string => {
    if (!gender) return 'Não informado';
    const genderMap: Record<string, string> = {
      'M': 'Masculino',
      'F': 'Feminino',
      'male': 'Masculino',
      'female': 'Feminino',
      'masculino': 'Masculino',
      'feminino': 'Feminino',
      'outro': 'Outro',
      'other': 'Outro',
    };
    return genderMap[gender.toLowerCase()] || gender;
  };

  const formatDate = (date: string): string => {
    try {
      return format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return date;
    }
  };

  const getDaysSinceLastSession = (date: string | null): string => {
    if (!date) return '';
    try {
      const days = differenceInDays(new Date(), parseISO(date));
      if (days === 0) return 'Hoje';
      if (days === 1) return 'Ontem';
      return `há ${days} dias`;
    } catch {
      return '';
    }
  };

  const getStatusConfig = (status: StatusAcompanhamento) => {
    switch (status) {
      case 'ativo':
        return {
          label: 'Ativo',
          icon: PlayCircle,
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
          iconColor: 'text-green-600 dark:text-green-400',
        };
      case 'em_pausa':
        return {
          label: 'Em Pausa',
          icon: PauseCircle,
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
        };
      case 'encerrado':
        return {
          label: 'Encerrado',
          icon: XCircle,
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-800',
          iconColor: 'text-gray-600 dark:text-gray-400',
        };
    }
  };

  const statusConfig = getStatusConfig(statusAcompanhamento);
  const StatusIcon = statusConfig.icon;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Selecione um paciente para visualizar o resumo do acompanhamento</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com aviso de leitura */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <Brain className="h-4 w-4" />
        <span>Visão geral do acompanhamento — somente leitura. Use a aba "Evoluções" para registros de sessão.</span>
      </div>

      {/* Alertas Críticos - Destaque */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">
                  Alertas Críticos ({criticalAlerts.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {criticalAlerts.map(alert => (
                    <Badge 
                      key={alert.id} 
                      variant="destructive"
                      className="text-xs"
                    >
                      {alert.title}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Dados do Paciente */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Dados do Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Idade</p>
                <p className="font-medium">{calculateAge(patient.birth_date)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Sexo</p>
                <p className="font-medium">{formatGender(patient.gender)}</p>
              </div>
            </div>

            <Separator />

            {/* Status do Acompanhamento */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Status do Acompanhamento</p>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${statusConfig.color}`}>
                <StatusIcon className={`h-5 w-5 ${statusConfig.iconColor}`} />
                <span className="font-medium">{statusConfig.label}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card: Acompanhamento Terapêutico */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              Acompanhamento Terapêutico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total de Sessões */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Total de Sessões</span>
              </div>
              <Badge variant="secondary" className="text-base font-semibold">
                {totalSessions}
              </Badge>
            </div>

            {/* Frequência */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Frequência</span>
              </div>
              <span className="font-medium text-sm">
                {sessionFrequency || 'Não determinada'}
              </span>
            </div>

            <Separator />

            {/* Última Sessão */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Última Sessão</span>
              </div>
              {lastSessionDate ? (
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {formatDate(lastSessionDate)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {getDaysSinceLastSession(lastSessionDate)}
                    </Badge>
                  </div>
                  {lastSessionProfessional && (
                    <p className="text-xs text-muted-foreground">
                      com {lastSessionProfessional}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma sessão registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Clínicos - Medicamentos e Condições */}
      {(medicationAlerts.length > 0 || conditionAlerts.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Informações Clínicas Relevantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Medicamentos em Uso */}
            {medicationAlerts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Medicamentos em Uso</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {medicationAlerts.map((alert) => (
                    <Badge 
                      key={alert.id} 
                      variant="outline"
                      className="text-xs border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                    >
                      {alert.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {medicationAlerts.length > 0 && conditionAlerts.length > 0 && <Separator />}

            {/* Condições Relevantes */}
            {conditionAlerts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Condições Relevantes</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {conditionAlerts.map((alert) => (
                    <Badge 
                      key={alert.id} 
                      variant="secondary"
                      className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                    >
                      {alert.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Outros Alertas */}
      {otherAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Outros Alertas ({otherAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {otherAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    alert.severity === 'warning' 
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                    alert.severity === 'warning' 
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`} />
                  <div>
                    <p className={`font-medium text-sm ${
                      alert.severity === 'warning'
                        ? 'text-yellow-800 dark:text-yellow-300'
                        : 'text-blue-800 dark:text-blue-300'
                    }`}>
                      {alert.title}
                    </p>
                    {alert.description && (
                      <p className={`text-xs mt-0.5 ${
                        alert.severity === 'warning'
                          ? 'text-yellow-700 dark:text-yellow-400'
                          : 'text-blue-700 dark:text-blue-400'
                      }`}>
                        {alert.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio de alertas */}
      {alerts.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Nenhum alerta clínico ativo</p>
        </div>
      )}
    </div>
  );
}
