/**
 * PILATES - Visão Geral (Somente Leitura)
 * 
 * Painel central do aluno com navegação para módulos clínicos.
 * Exibe: dados básicos, objetivo, status, última sessão, alertas.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dumbbell, 
  User,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  ClipboardList,
  Paperclip,
  ChevronRight,
  Target,
  Calendar,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { format, differenceInYears, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useVisaoGeralPilatesData,
  STATUS_ACOMPANHAMENTO_PILATES,
  type PilatesPatientData, 
  type PilatesSummaryData, 
  type PilatesAlert 
} from '@/hooks/prontuario/pilates/useVisaoGeralPilatesData';

interface VisaoGeralPilatesBlockProps {
  patientId: string | null;
  clinicId: string | null;
  canEdit?: boolean;
  onNavigateToModule?: (moduleKey: string) => void;
}

/**
 * Retorna o ícone do alerta baseado na severidade
 */
function getAlertIcon(severity: 'critical' | 'warning' | 'info') {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-accent-foreground" />;
    default:
      return <Info className="h-4 w-4 text-primary" />;
  }
}

/**
 * Retorna a variante do badge de status
 */
function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ativo':
      return 'default';
    case 'pausado':
      return 'secondary';
    case 'finalizado':
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Card clicável para navegação a módulos
 */
function ModuleCard({ 
  title, 
  icon: Icon, 
  children, 
  moduleKey,
  onNavigate,
  hasData = true,
}: { 
  title: string; 
  icon: React.ElementType;
  children: React.ReactNode;
  moduleKey: string;
  onNavigate?: (key: string) => void;
  hasData?: boolean;
}) {
  const handleClick = () => {
    if (onNavigate) {
      onNavigate(moduleKey);
    }
  };
  
  return (
    <Card 
      className={`transition-all ${onNavigate ? 'cursor-pointer hover:shadow-md hover:border-primary/50' : ''}`}
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {title}
          </span>
          {onNavigate && (
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? children : (
          <p className="text-muted-foreground text-sm">Não registrado</p>
        )}
      </CardContent>
    </Card>
  );
}

export function VisaoGeralPilatesBlock({
  patientId,
  clinicId,
  canEdit = false,
  onNavigateToModule,
}: VisaoGeralPilatesBlockProps) {
  const { patient, summary, alerts, loading } = useVisaoGeralPilatesData({ 
    patientId, 
    clinicId 
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!patient) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um aluno para visualizar os dados de Pilates.</p>
        </CardContent>
      </Card>
    );
  }

  const idade = patient.birth_date 
    ? differenceInYears(new Date(), new Date(patient.birth_date))
    : null;

  const diasDesdeUltimaSessao = summary.ultima_sessao
    ? differenceInDays(new Date(), new Date(summary.ultima_sessao))
    : null;

  return (
    <div className="space-y-4">
      {/* Alertas Funcionais Ativos */}
      {alerts.length > 0 && (
        <div 
          className="space-y-2 cursor-pointer" 
          onClick={() => onNavigateToModule?.('alertas')}
        >
          {alerts.slice(0, 3).map((alert) => (
            <Card 
              key={alert.id} 
              className={`border-l-4 transition-all hover:shadow-md ${
                alert.severity === 'critical' 
                  ? 'border-l-destructive bg-destructive/10' 
                  : alert.severity === 'warning'
                    ? 'border-l-amber-500 bg-amber-500/10'
                    : 'border-l-primary bg-primary/10'
              }`}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.severity)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.title}</p>
                    {alert.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {alert.alert_type}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {alerts.length > 3 && (
            <p className="text-xs text-muted-foreground text-center">
              +{alerts.length - 3} alertas adicionais
            </p>
          )}
        </div>
      )}

      {/* Cabeçalho do Paciente */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full shrink-0">
                <Dumbbell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{patient.full_name}</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {idade ? `${idade} anos` : 'Idade não informada'}
                  </Badge>
                  {patient.gender && (
                    <Badge variant="outline" className="text-xs">
                      {patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Feminino' : patient.gender}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(summary.status_acompanhamento)}>
                {STATUS_ACOMPANHAMENTO_PILATES[summary.status_acompanhamento]}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid de Módulos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Objetivo do Pilates */}
        <ModuleCard
          title="Objetivo do Pilates"
          icon={Target}
          moduleKey="avaliacao_funcional"
          onNavigate={onNavigateToModule}
          hasData={!!summary.objetivo_pilates || !!summary.objetivo_label}
        >
          {summary.objetivo_label ? (
            <Badge variant="default" className="mb-2">{summary.objetivo_label}</Badge>
          ) : summary.objetivo_pilates ? (
            <p className="text-sm font-medium line-clamp-3">
              {summary.objetivo_pilates}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Objetivo não definido
            </p>
          )}
          {summary.observacoes_objetivo && !summary.objetivo_label && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {summary.observacoes_objetivo}
            </p>
          )}
        </ModuleCard>

        {/* Avaliação Funcional */}
        <ModuleCard
          title="Avaliação Funcional"
          icon={Activity}
          moduleKey="avaliacao_funcional"
          onNavigate={onNavigateToModule}
          hasData={summary.tem_avaliacao}
        >
          {summary.tem_avaliacao ? (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Avaliação Realizada</span>
              </div>
              {summary.ultima_avaliacao && (
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(summary.ultima_avaliacao), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
            </>
          ) : (
            <>
              <Badge variant="outline" className="text-xs">Pendente</Badge>
              <p className="text-muted-foreground text-sm mt-1">
                Avaliação funcional não realizada
              </p>
            </>
          )}
        </ModuleCard>

        {/* Sessões Realizadas */}
        <ModuleCard
          title="Sessões de Pilates"
          icon={ClipboardList}
          moduleKey="evolucao"
          onNavigate={onNavigateToModule}
          hasData={summary.total_sessoes > 0}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{summary.total_sessoes}</span>
            <span className="text-muted-foreground">
              {summary.total_sessoes === 1 ? 'sessão' : 'sessões'}
            </span>
          </div>
        </ModuleCard>

        {/* Última Sessão */}
        <ModuleCard
          title="Última Sessão"
          icon={Calendar}
          moduleKey="evolucao"
          onNavigate={onNavigateToModule}
          hasData={!!summary.ultima_sessao}
        >
          {summary.ultima_sessao ? (
            <>
              <p className="text-lg font-semibold">
                {format(new Date(summary.ultima_sessao), "dd/MM/yyyy", { locale: ptBR })}
              </p>
              {diasDesdeUltimaSessao !== null && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {diasDesdeUltimaSessao === 0 
                    ? 'Hoje'
                    : diasDesdeUltimaSessao === 1 
                      ? 'Ontem' 
                      : `Há ${diasDesdeUltimaSessao} dias`
                  }
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhuma sessão realizada
            </p>
          )}
        </ModuleCard>

        {/* Documentos */}
        <ModuleCard
          title="Documentos"
          icon={Paperclip}
          moduleKey="exames"
          onNavigate={onNavigateToModule}
          hasData={summary.total_documentos > 0}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{summary.total_documentos}</span>
            <span className="text-muted-foreground">
              {summary.total_documentos === 1 ? 'documento' : 'documentos'}
            </span>
          </div>
          {summary.total_documentos === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Nenhum documento anexado
            </p>
          )}
        </ModuleCard>

        {/* Alertas */}
        <ModuleCard
          title="Alertas / Restrições"
          icon={AlertTriangle}
          moduleKey="alertas"
          onNavigate={onNavigateToModule}
          hasData={alerts.length > 0}
        >
          {alerts.length > 0 ? (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-accent-foreground">{alerts.length}</span>
              <span className="text-muted-foreground">
                {alerts.length === 1 ? 'alerta ativo' : 'alertas ativos'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">Sem restrições</span>
            </div>
          )}
        </ModuleCard>
      </div>
    </div>
  );
}
