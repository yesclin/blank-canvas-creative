/**
 * ESTÉTICA - Visão Geral (Somente Leitura)
 * 
 * Painel central do paciente com navegação para módulos de estética.
 * Exibe: dados básicos, procedimentos, último procedimento, status, alertas.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  User,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  ClipboardList,
  Camera,
  FileCheck,
  ChevronRight,
  Calendar,
  Syringe,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { format, differenceInYears, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useVisaoGeralEsteticaData,
  STATUS_TRATAMENTO_ESTETICA,
  type EsteticaPatientData, 
  type EsteticaSummaryData, 
  type EsteticaAlert 
} from '@/hooks/aesthetics/useVisaoGeralEsteticaData';

interface VisaoGeralEsteticaBlockProps {
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
    case 'manutencao':
      return 'secondary';
    case 'concluido':
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

export function VisaoGeralEsteticaBlock({
  patientId,
  clinicId,
  canEdit = false,
  onNavigateToModule,
}: VisaoGeralEsteticaBlockProps) {
  const { patient, summary, alerts, loading } = useVisaoGeralEsteticaData({ 
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
          <p className="text-muted-foreground">Selecione um paciente para visualizar os dados de Estética.</p>
        </CardContent>
      </Card>
    );
  }

  const idade = patient.birth_date 
    ? differenceInYears(new Date(), new Date(patient.birth_date))
    : null;

  const diasDesdeUltimoProc = summary.ultimo_procedimento
    ? differenceInDays(new Date(), new Date(summary.ultimo_procedimento.data))
    : null;

  return (
    <div className="space-y-4">
      {/* Alertas Clínicos Ativos */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert) => (
            <Card 
              key={alert.id} 
              className={`border-l-4 transition-all ${
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
                  <Badge 
                    variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {alert.alert_type}
                  </Badge>
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
                <Sparkles className="h-5 w-5 text-primary" />
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
              <Badge variant={getStatusBadgeVariant(summary.status_tratamento)}>
                {STATUS_TRATAMENTO_ESTETICA[summary.status_tratamento]}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid de Módulos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Total de Procedimentos */}
        <ModuleCard
          title="Procedimentos Realizados"
          icon={Syringe}
          moduleKey="procedimentos_realizados"
          onNavigate={onNavigateToModule}
          hasData={summary.total_procedimentos > 0}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{summary.total_procedimentos}</span>
            <span className="text-muted-foreground">
              {summary.total_procedimentos === 1 ? 'aplicação' : 'aplicações'}
            </span>
          </div>
          {summary.procedimentos_por_tipo.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {summary.procedimentos_por_tipo.map(proc => (
                <Badge key={proc.tipo} variant="secondary" className="text-xs">
                  {proc.label}: {proc.quantidade}
                </Badge>
              ))}
            </div>
          )}
        </ModuleCard>

        {/* Último Procedimento */}
        <ModuleCard
          title="Último Procedimento"
          icon={Calendar}
          moduleKey="evolucao"
          onNavigate={onNavigateToModule}
          hasData={!!summary.ultimo_procedimento}
        >
          {summary.ultimo_procedimento ? (
            <>
              <p className="text-lg font-semibold">
                {format(new Date(summary.ultimo_procedimento.data), "dd/MM/yyyy", { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground">
                {summary.ultimo_procedimento.tipo} - {summary.ultimo_procedimento.produto}
              </p>
              {diasDesdeUltimoProc !== null && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {diasDesdeUltimoProc === 0 
                    ? 'Hoje'
                    : diasDesdeUltimoProc === 1 
                      ? 'Ontem' 
                      : `Há ${diasDesdeUltimoProc} dias`
                  }
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhum procedimento realizado
            </p>
          )}
        </ModuleCard>

        {/* Mapa Facial */}
        <ModuleCard
          title="Mapa Facial"
          icon={MapPin}
          moduleKey="facial_map"
          onNavigate={onNavigateToModule}
          hasData={summary.total_procedimentos > 0}
        >
          {summary.total_procedimentos > 0 ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Mapeamento Ativo</span>
            </div>
          ) : (
            <>
              <Badge variant="outline" className="text-xs">Pendente</Badge>
              <p className="text-muted-foreground text-sm mt-1">
                Iniciar mapeamento facial
              </p>
            </>
          )}
        </ModuleCard>

        {/* Fotos Antes/Depois */}
        <ModuleCard
          title="Fotos Antes / Depois"
          icon={Camera}
          moduleKey="before_after_photos"
          onNavigate={onNavigateToModule}
          hasData={summary.total_fotos_antes_depois > 0}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{summary.total_fotos_antes_depois}</span>
            <span className="text-muted-foreground">
              {summary.total_fotos_antes_depois === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          {summary.total_fotos_antes_depois === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Nenhuma foto registrada
            </p>
          )}
        </ModuleCard>

        {/* Termos Assinados */}
        <ModuleCard
          title="Termos / Consentimentos"
          icon={FileCheck}
          moduleKey="termos_consentimentos"
          onNavigate={onNavigateToModule}
          hasData={summary.total_termos_assinados > 0}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{summary.total_termos_assinados}</span>
            <span className="text-muted-foreground">
              {summary.total_termos_assinados === 1 ? 'termo' : 'termos'}
            </span>
          </div>
          {summary.total_termos_assinados === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Nenhum termo assinado
            </p>
          )}
        </ModuleCard>

        {/* Alertas Clínicos */}
        <ModuleCard
          title="Alertas Clínicos"
          icon={AlertTriangle}
          moduleKey="alertas"
          onNavigate={undefined} // Estética não tem bloco de alertas específico por ora
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
              <span className="text-sm">Sem alertas</span>
            </div>
          )}
        </ModuleCard>
      </div>
    </div>
  );
}
