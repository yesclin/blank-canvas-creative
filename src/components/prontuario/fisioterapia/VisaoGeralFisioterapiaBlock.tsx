/**
 * FISIOTERAPIA - Visão Geral Consolidada (Somente Leitura)
 * 
 * Painel central do paciente conectado a todos os módulos clínicos.
 * NÃO permite edição direta - apenas visualização e navegação.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  User,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  FileText,
  Stethoscope,
  ClipboardList,
  Paperclip,
  ChevronRight,
  Target,
  Calendar,
  Bone,
  Gauge,
  TrendingUp
} from 'lucide-react';
import { format, differenceInYears, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  STATUS_ACOMPANHAMENTO_LABELS,
  STATUS_PLANO_LABELS,
  type FisioterapiaPatientData, 
  type FisioterapiaSummaryData, 
  type FisioterapiaAlert 
} from '@/hooks/prontuario/fisioterapia';

interface VisaoGeralFisioterapiaBlockProps {
  patient: FisioterapiaPatientData | null;
  summary: FisioterapiaSummaryData;
  alerts: FisioterapiaAlert[];
  loading: boolean;
  canEdit?: boolean;
  onNavigateToModule?: (moduleKey: string) => void;
}

/**
 * Retorna o ícone e estilo do alerta baseado na severidade
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
 * Retorna a cor do badge de status do acompanhamento
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
 * Retorna a cor do indicador de dor baseado no nível (0-10)
 */
function getPainLevelColor(level: number | null): string {
  if (level === null) return 'text-muted-foreground';
  if (level <= 3) return 'text-green-600';
  if (level <= 6) return 'text-yellow-600';
  return 'text-destructive';
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

export function VisaoGeralFisioterapiaBlock({
  patient,
  summary,
  alerts,
  loading,
  canEdit = false,
  onNavigateToModule,
}: VisaoGeralFisioterapiaBlockProps) {
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
          <p className="text-muted-foreground">Selecione um paciente para visualizar os dados de fisioterapia.</p>
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
                    ? 'border-l-accent bg-accent/10'
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
                <Activity className="h-5 w-5 text-primary" />
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
                {STATUS_ACOMPANHAMENTO_LABELS[summary.status_acompanhamento]}
              </Badge>
              {summary.status_plano === 'ativo' && (
                <Badge variant="default">
                  Em Tratamento
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid de Módulos Conectados */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Queixa Principal */}
        <ModuleCard
          title="Queixa Principal"
          icon={Stethoscope}
          moduleKey="anamnese"
          onNavigate={onNavigateToModule}
          hasData={!!summary.queixa_principal}
        >
          {summary.queixa_principal ? (
            <p className="text-lg font-semibold line-clamp-2">
              {summary.queixa_principal}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Queixa não registrada
            </p>
          )}
        </ModuleCard>

        {/* Região Corporal */}
        <ModuleCard
          title="Região em Tratamento"
          icon={Bone}
          moduleKey="anamnese"
          onNavigate={onNavigateToModule}
          hasData={!!summary.regiao_corporal}
        >
          {summary.regiao_corporal ? (
            <p className="text-lg font-semibold">
              {summary.regiao_corporal}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Região não definida
            </p>
          )}
        </ModuleCard>

        {/* Nível de Dor Atual */}
        <ModuleCard
          title="Nível de Dor (EVA)"
          icon={Gauge}
          moduleKey="evolucao"
          onNavigate={onNavigateToModule}
          hasData={summary.nivel_dor_atual !== null}
        >
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${getPainLevelColor(summary.nivel_dor_atual)}`}>
              {summary.nivel_dor_atual !== null ? summary.nivel_dor_atual : '--'}
            </span>
            <span className="text-muted-foreground">/10</span>
          </div>
          {summary.nivel_dor_atual !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              {summary.nivel_dor_atual <= 3 ? 'Dor leve' : 
               summary.nivel_dor_atual <= 6 ? 'Dor moderada' : 'Dor intensa'}
            </p>
          )}
        </ModuleCard>

        {/* Status do Plano Terapêutico */}
        <ModuleCard
          title="Plano Terapêutico"
          icon={Target}
          moduleKey="conduta"
          onNavigate={onNavigateToModule}
          hasData={!!summary.plano_ativo || summary.status_plano !== 'aguardando'}
        >
          {summary.plano_ativo ? (
            <>
              <p className="text-lg font-semibold line-clamp-1">
                {summary.plano_ativo.titulo}
              </p>
              {summary.plano_ativo.objetivo && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {summary.plano_ativo.objetivo}
                </p>
              )}
              <Badge variant="default" className="mt-2">
                {STATUS_PLANO_LABELS[summary.status_plano]}
              </Badge>
            </>
          ) : (
            <>
              <Badge variant="outline">
                {STATUS_PLANO_LABELS[summary.status_plano]}
              </Badge>
              <p className="text-muted-foreground text-sm mt-1">
                Plano não iniciado
              </p>
            </>
          )}
        </ModuleCard>

        {/* Sessões Realizadas */}
        <ModuleCard
          title="Sessões Realizadas"
          icon={ClipboardList}
          moduleKey="evolucao"
          onNavigate={onNavigateToModule}
          hasData={summary.total_sessoes > 0}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{summary.sessoes_realizadas}</span>
            <span className="text-muted-foreground">
              {summary.sessoes_realizadas === 1 ? 'sessão' : 'sessões'}
            </span>
          </div>
          {summary.total_sessoes > 0 && summary.plano_ativo?.previsao_alta && (
            <p className="text-xs text-muted-foreground mt-1">
              Previsão de alta: {format(new Date(summary.plano_ativo.previsao_alta), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          )}
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

        {/* Acompanhamento */}
        <ModuleCard
          title="Acompanhamento"
          icon={TrendingUp}
          moduleKey="timeline"
          onNavigate={onNavigateToModule}
          hasData={summary.total_evolucoes > 0}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{summary.total_evolucoes}</span>
            <span className="text-muted-foreground">
              {summary.total_evolucoes === 1 ? 'evolução' : 'evoluções'}
            </span>
          </div>
        </ModuleCard>

        {/* Documentos Anexados */}
        <ModuleCard
          title="Exames / Documentos"
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
              Nenhum exame ou documento anexado
            </p>
          )}
        </ModuleCard>
      </div>
    </div>
  );
}
