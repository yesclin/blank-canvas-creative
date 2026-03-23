/**
 * NUTRIÇÃO - Visão Geral Consolidada (Somente Leitura)
 * 
 * Painel central do paciente conectado a todos os módulos clínicos.
 * NÃO permite edição direta - apenas visualização e navegação.
 * 
 * Módulos conectados:
 * - Avaliação Nutricional Inicial
 * - Avaliação Antropométrica
 * - Diagnóstico Nutricional
 * - Plano Alimentar
 * - Evoluções Nutricionais
 * - Exames / Documentos
 * - Alertas Nutricionais
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Apple, 
  Scale, 
  Target, 
  Calendar,
  Activity,
  User,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  UtensilsCrossed,
  Stethoscope,
  ClipboardList,
  Paperclip,
  ChevronRight,
  Ruler
} from 'lucide-react';
import { format, differenceInYears, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  OBJETIVO_NUTRICIONAL_LABELS, 
  STATUS_ACOMPANHAMENTO_LABELS,
  type NutricaoPatientData, 
  type NutricaoSummaryData, 
  type NutricaoAlert 
} from '@/hooks/prontuario/nutricao';

interface VisaoGeralNutricaoBlockProps {
  patient: NutricaoPatientData | null;
  summary: NutricaoSummaryData;
  alerts: NutricaoAlert[];
  loading: boolean;
  canEdit?: boolean;
  onNavigateToModule?: (moduleKey: string) => void;
}

/**
 * Retorna a cor do badge de IMC baseado na classificação
 */
function getIMCBadgeVariant(classificacao: string | null): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!classificacao) return 'outline';
  
  if (classificacao === 'Peso normal') return 'default';
  if (classificacao === 'Abaixo do peso') return 'secondary';
  if (classificacao.includes('Sobrepeso')) return 'secondary';
  return 'destructive';
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
 * Componente de indicador de variação
 */
function VariacaoIndicador({ 
  valor, 
  sufixo = 'kg', 
  invertido = false 
}: { 
  valor: number | null; 
  sufixo?: string; 
  invertido?: boolean;
}) {
  if (valor === null || valor === 0) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground text-sm">
        <Minus className="h-3 w-3" />
        Sem variação
      </span>
    );
  }
  
  const isPositive = valor > 0;
  const isGood = invertido ? isPositive : !isPositive;
  
  return (
    <span className={`flex items-center gap-1 text-sm font-medium ${isGood ? 'text-primary' : 'text-destructive'}`}>
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? '+' : ''}{valor} {sufixo}
    </span>
  );
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

export function VisaoGeralNutricaoBlock({
  patient,
  summary,
  alerts,
  loading,
  canEdit = false,
  onNavigateToModule,
}: VisaoGeralNutricaoBlockProps) {
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
          <p className="text-muted-foreground">Selecione um paciente para visualizar os dados nutricionais.</p>
        </CardContent>
      </Card>
    );
  }

  const idade = patient.birth_date 
    ? differenceInYears(new Date(), new Date(patient.birth_date))
    : null;

  const diasDesdeUltimaConsulta = summary.ultima_consulta
    ? differenceInDays(new Date(), new Date(summary.ultima_consulta))
    : null;

  const diasDesdeUltimaEvolucao = summary.ultima_evolucao?.data_atendimento
    ? differenceInDays(new Date(), new Date(summary.ultima_evolucao.data_atendimento))
    : null;

  return (
    <div className="space-y-4">
      {/* Alertas Nutricionais Ativos */}
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
                <Apple className="h-5 w-5 text-primary" />
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
              {summary.plano_ativo && (
                <Badge variant="default">
                  Plano Ativo
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid de Módulos Conectados */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Peso Atual e Variação - Avaliação Antropométrica */}
        <ModuleCard
          title="Peso Atual"
          icon={Scale}
          moduleKey="avaliacao_clinica"
          onNavigate={onNavigateToModule}
          hasData={!!summary.peso_atual_kg}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {summary.peso_atual_kg ? `${summary.peso_atual_kg}` : '--'}
            </span>
            <span className="text-muted-foreground">kg</span>
          </div>
          {summary.variacao_peso_kg !== null && (
            <div className="mt-1">
              <VariacaoIndicador valor={summary.variacao_peso_kg} />
              {summary.peso_consulta_anterior && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Anterior: {summary.peso_consulta_anterior} kg
                </p>
              )}
            </div>
          )}
          {summary.data_ultima_medicao && (
            <p className="text-xs text-muted-foreground mt-1">
              Medido em {format(new Date(summary.data_ultima_medicao), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          )}
        </ModuleCard>

        {/* IMC - Avaliação Antropométrica */}
        <ModuleCard
          title="IMC"
          icon={Activity}
          moduleKey="avaliacao_clinica"
          onNavigate={onNavigateToModule}
          hasData={!!summary.imc}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {summary.imc ? summary.imc.toFixed(1) : '--'}
            </span>
            <span className="text-muted-foreground">kg/m²</span>
          </div>
          {summary.classificacao_imc && (
            <Badge variant={getIMCBadgeVariant(summary.classificacao_imc)} className="mt-2">
              {summary.classificacao_imc}
            </Badge>
          )}
          {summary.altura_cm && (
            <p className="text-xs text-muted-foreground mt-1">
              Altura: {(summary.altura_cm / 100).toFixed(2)} m
            </p>
          )}
        </ModuleCard>

        {/* Objetivo Nutricional - Avaliação Inicial */}
        <ModuleCard
          title="Objetivo Nutricional"
          icon={Target}
          moduleKey="avaliacao_nutricional"
          onNavigate={onNavigateToModule}
          hasData={!!summary.objetivo || !!summary.avaliacao_inicial}
        >
          {summary.objetivo ? (
            <>
              <p className="text-lg font-semibold">
                {OBJETIVO_NUTRICIONAL_LABELS[summary.objetivo]}
              </p>
              {summary.objetivo_descricao && summary.objetivo !== 'outro' && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {summary.objetivo_descricao}
                </p>
              )}
            </>
          ) : summary.avaliacao_inicial ? (
            <p className="text-sm">
              Avaliação realizada em {format(new Date(summary.avaliacao_inicial.data_avaliacao), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Objetivo não definido
            </p>
          )}
        </ModuleCard>

        {/* Diagnóstico Nutricional */}
        <ModuleCard
          title="Diagnóstico Nutricional"
          icon={Stethoscope}
          moduleKey="diagnostico_nutricional"
          onNavigate={onNavigateToModule}
          hasData={!!summary.ultimo_diagnostico}
        >
          {summary.ultimo_diagnostico ? (
            <>
              <p className="text-lg font-semibold line-clamp-1">
                {summary.ultimo_diagnostico.diagnostico_principal}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={summary.ultimo_diagnostico.status === 'ativo' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {summary.ultimo_diagnostico.status === 'ativo' ? 'Ativo' : 
                   summary.ultimo_diagnostico.status === 'resolvido' ? 'Resolvido' : 'Em acompanhamento'}
                </Badge>
              </div>
              {summary.total_diagnosticos > 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  +{summary.total_diagnosticos - 1} diagnóstico(s) registrado(s)
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhum diagnóstico registrado
            </p>
          )}
        </ModuleCard>

        {/* Plano Alimentar */}
        <ModuleCard
          title="Plano Alimentar"
          icon={UtensilsCrossed}
          moduleKey="plano_alimentar"
          onNavigate={onNavigateToModule}
          hasData={!!summary.plano_ativo}
        >
          {summary.plano_ativo ? (
            <>
              <p className="text-lg font-semibold line-clamp-1">
                {summary.plano_ativo.titulo}
              </p>
              {summary.plano_ativo.calorias_totais && (
                <p className="text-sm text-muted-foreground">
                  {summary.plano_ativo.calorias_totais} kcal/dia
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Início: {format(new Date(summary.plano_ativo.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
              </p>
              {summary.total_planos > 1 && (
                <p className="text-xs text-muted-foreground">
                  +{summary.total_planos - 1} plano(s) no histórico
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">
                Nenhum plano ativo
              </p>
              {summary.total_planos > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.total_planos} plano(s) no histórico
                </p>
              )}
            </>
          )}
        </ModuleCard>

        {/* Última Evolução Nutricional */}
        <ModuleCard
          title="Última Evolução"
          icon={FileText}
          moduleKey="evolucao"
          onNavigate={onNavigateToModule}
          hasData={!!summary.ultima_evolucao}
        >
          {summary.ultima_evolucao ? (
            <>
              <p className="text-lg font-semibold">
                {format(new Date(summary.ultima_evolucao.data_atendimento), "dd/MM/yyyy", { locale: ptBR })}
              </p>
              {diasDesdeUltimaEvolucao !== null && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {diasDesdeUltimaEvolucao === 0 
                    ? 'Hoje'
                    : diasDesdeUltimaEvolucao === 1 
                      ? 'Ontem' 
                      : `Há ${diasDesdeUltimaEvolucao} dias`
                  }
                </p>
              )}
              {summary.ultima_evolucao.adesao_plano && (
                <Badge variant="outline" className="mt-1 text-xs">
                  Adesão: {summary.ultima_evolucao.adesao_plano}
                </Badge>
              )}
              {summary.total_evolucoes > 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {summary.total_evolucoes} evoluções
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhuma evolução registrada
            </p>
          )}
        </ModuleCard>

        {/* Última Consulta */}
        <ModuleCard
          title="Última Consulta"
          icon={Calendar}
          moduleKey="timeline"
          onNavigate={onNavigateToModule}
          hasData={!!summary.ultima_consulta}
        >
          {summary.ultima_consulta ? (
            <>
              <p className="text-lg font-semibold">
                {format(new Date(summary.ultima_consulta), "dd/MM/yyyy", { locale: ptBR })}
              </p>
              {diasDesdeUltimaConsulta !== null && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {diasDesdeUltimaConsulta === 0 
                    ? 'Hoje'
                    : diasDesdeUltimaConsulta === 1 
                      ? 'Ontem' 
                      : `Há ${diasDesdeUltimaConsulta} dias`
                  }
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhuma consulta realizada
            </p>
          )}
        </ModuleCard>

        {/* Total de Consultas */}
        <ModuleCard
          title="Acompanhamento"
          icon={TrendingUp}
          moduleKey="timeline"
          onNavigate={onNavigateToModule}
          hasData={summary.total_consultas > 0}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{summary.total_consultas}</span>
            <span className="text-muted-foreground">
              {summary.total_consultas === 1 ? 'consulta' : 'consultas'}
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
