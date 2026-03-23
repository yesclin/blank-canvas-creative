import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User,
  AlertTriangle,
  FileText,
  ChevronRight,
  Calendar,
  Activity,
  Info,
  ShieldAlert,
  Smile,
  ClipboardList,
  Target,
  History,
  type LucideIcon
} from "lucide-react";
import { format, parseISO, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Dados básicos do paciente para Odontologia
 */
export interface OdontologyPatientData {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * Dados resumidos odontológicos
 */
export interface OdontologySummaryData {
  allergies: string[];
  chronic_diseases: string[];
  total_evolutions?: number;
  last_dental_date?: string | null;
  last_professional_name?: string | null;
  treatment_plan_status?: 'none' | 'in_progress' | 'completed' | 'pending';
  teeth_with_issues?: number;
  teeth_treated?: number;
}

/**
 * Alerta clínico ativo
 */
export interface OdontologyClinicalAlert {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  alert_type: string;
  description?: string | null;
  is_active: boolean;
}

interface OdontologiaVisaoGeralBlockProps {
  patient: OdontologyPatientData | null;
  clinicalData: OdontologySummaryData;
  alerts: OdontologyClinicalAlert[];
  loading?: boolean;
  onNavigateToModule?: (moduleKey: string) => void;
}

/**
 * Card de resumo clicável - navega para a aba correspondente
 */
function SummaryCard({
  title,
  icon: Icon,
  moduleKey,
  onNavigate,
  children,
  variant = 'default',
}: {
  title: string;
  icon: LucideIcon;
  moduleKey: string;
  onNavigate?: (key: string) => void;
  children: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger' | 'success';
}) {
  const variantStyles = {
    default: 'hover:border-primary/50',
    warning: 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500/50',
    danger: 'border-destructive/30 bg-destructive/5 hover:border-destructive/50',
    success: 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500/50',
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${variantStyles[variant]}`}
      onClick={() => onNavigate?.(moduleKey)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-md ${
              variant === 'danger' ? 'bg-destructive/10' : 
              variant === 'warning' ? 'bg-amber-500/10' : 
              variant === 'success' ? 'bg-emerald-500/10' : 'bg-primary/10'
            }`}>
              <Icon className={`h-4 w-4 ${
                variant === 'danger' ? 'text-destructive' : 
                variant === 'warning' ? 'text-amber-600' : 
                variant === 'success' ? 'text-emerald-600' : 'text-primary'
              }`} />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-1">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Link rápido compacto para navegação
 */
function QuickLink({ 
  label, 
  icon: Icon, 
  onClick,
  badge,
}: { 
  label: string; 
  icon: LucideIcon; 
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm transition-colors text-left"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] justify-center">
          {badge}
        </Badge>
      )}
    </button>
  );
}

/**
 * Calcula a idade a partir da data de nascimento
 */
function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  try {
    return differenceInYears(new Date(), parseISO(birthDate));
  } catch {
    return null;
  }
}

/**
 * Formata o gênero para exibição
 */
function formatGender(gender: string | null): string {
  if (!gender) return '-';
  const map: Record<string, string> = {
    male: 'Masculino',
    female: 'Feminino',
    M: 'Masculino',
    F: 'Feminino',
    masculino: 'Masculino',
    feminino: 'Feminino',
  };
  return map[gender.toLowerCase()] || gender;
}

/**
 * Formata o status do plano de tratamento
 */
function formatTreatmentPlanStatus(status?: string): { label: string; variant: 'default' | 'warning' | 'success' } {
  switch (status) {
    case 'in_progress':
      return { label: 'Em Andamento', variant: 'warning' };
    case 'completed':
      return { label: 'Concluído', variant: 'success' };
    case 'pending':
      return { label: 'Pendente', variant: 'warning' };
    default:
      return { label: 'Sem Plano', variant: 'default' };
  }
}

/**
 * VISÃO GERAL - Hub central de leitura para Odontologia
 * 
 * Exibe cards informativos com dados odontológicos:
 * - Dados básicos do paciente (idade, sexo)
 * - Último atendimento odontológico
 * - Status do plano de tratamento
 * - Alertas clínicos ativos
 * - Resumo do odontograma
 * 
 * Este bloco é SOMENTE LEITURA e não permite edição direta.
 */
export function OdontologiaVisaoGeralBlock({ 
  patient, 
  clinicalData, 
  alerts,
  loading = false,
  onNavigateToModule,
}: OdontologiaVisaoGeralBlockProps) {
  
  const activeAlerts = alerts.filter(a => a.is_active);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  
  const age = calculateAge(patient?.birth_date ?? null);
  const treatmentStatus = formatTreatmentPlanStatus(clinicalData.treatment_plan_status);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Selecione um paciente para visualizar o resumo odontológico</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Context: Specialty indicator */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5" />
          <span>Clique nos cards para acessar os módulos</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
          <Info className="h-3 w-3" />
          <span>
            Módulos exibidos: <span className="font-medium text-primary">Odontologia</span>
          </span>
        </div>
      </div>

      {/* Grid de Cards de Resumo */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Dados Básicos do Paciente */}
        <SummaryCard
          title="Dados do Paciente"
          icon={User}
          moduleKey="resumo"
          onNavigate={onNavigateToModule}
        >
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground truncate">
              {patient.full_name}
            </p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {age !== null && (
                <span>{age} anos</span>
              )}
              <span className="text-muted-foreground/50">•</span>
              <span>{formatGender(patient.gender)}</span>
            </div>
          </div>
        </SummaryCard>

        {/* Alertas Críticos - Destaque */}
        {criticalAlerts.length > 0 && (
          <SummaryCard
            title="Alertas Críticos"
            icon={ShieldAlert}
            moduleKey="alertas"
            onNavigate={onNavigateToModule}
            variant="danger"
          >
            <div className="flex flex-wrap gap-1.5">
              {criticalAlerts.slice(0, 3).map(alert => (
                <Badge 
                  key={alert.id} 
                  variant="destructive"
                  className="text-xs"
                >
                  {alert.title}
                </Badge>
              ))}
              {criticalAlerts.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{criticalAlerts.length - 3}
                </Badge>
              )}
            </div>
          </SummaryCard>
        )}

        {/* Último Atendimento Odontológico */}
        <SummaryCard
          title="Último Atendimento"
          icon={Calendar}
          moduleKey="timeline"
          onNavigate={onNavigateToModule}
        >
          {clinicalData.last_dental_date ? (
            <div>
              <p className="text-lg font-semibold text-foreground">
                {format(parseISO(clinicalData.last_dental_date), "dd/MM/yyyy", { locale: ptBR })}
              </p>
              {clinicalData.last_professional_name && (
                <p className="text-xs text-muted-foreground truncate">
                  {clinicalData.last_professional_name}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhum atendimento registrado</p>
          )}
        </SummaryCard>

        {/* Status do Plano de Tratamento */}
        <SummaryCard
          title="Plano de Tratamento"
          icon={Target}
          moduleKey="conduta"
          onNavigate={onNavigateToModule}
          variant={treatmentStatus.variant}
        >
          <div>
            <Badge 
              variant={treatmentStatus.variant === 'success' ? 'default' : 'secondary'}
              className={`text-xs ${
                treatmentStatus.variant === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                treatmentStatus.variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''
              }`}
            >
              {treatmentStatus.label}
            </Badge>
            {(clinicalData.teeth_treated ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {clinicalData.teeth_treated} dentes tratados
              </p>
            )}
          </div>
        </SummaryCard>

        {/* Resumo do Odontograma */}
        <SummaryCard
          title="Odontograma"
          icon={Smile}
          moduleKey="odontograma"
          onNavigate={onNavigateToModule}
        >
          <div className="flex items-center gap-4">
            {(clinicalData.teeth_with_issues ?? 0) > 0 ? (
              <>
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">
                    {clinicalData.teeth_with_issues}
                  </p>
                  <p className="text-[10px] text-muted-foreground">com pendências</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {clinicalData.teeth_treated ?? 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">tratados</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sem marcações</p>
            )}
          </div>
        </SummaryCard>

        {/* Alergias */}
        <SummaryCard
          title="Alergias"
          icon={AlertTriangle}
          moduleKey="anamnese"
          onNavigate={onNavigateToModule}
          variant={clinicalData.allergies.length > 0 ? 'warning' : 'default'}
        >
          {clinicalData.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {clinicalData.allergies.slice(0, 3).map((allergy, idx) => (
                <Badge 
                  key={idx} 
                  variant="destructive" 
                  className="text-xs"
                >
                  {allergy}
                </Badge>
              ))}
              {clinicalData.allergies.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{clinicalData.allergies.length - 3}
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhuma registrada</p>
          )}
        </SummaryCard>

        {/* Alertas Ativos (não críticos) */}
        {activeAlerts.length > 0 && criticalAlerts.length === 0 && (
          <SummaryCard
            title="Alertas Ativos"
            icon={AlertTriangle}
            moduleKey="alertas"
            onNavigate={onNavigateToModule}
            variant="warning"
          >
            <p className="text-2xl font-bold text-foreground">{activeAlerts.length}</p>
            <p className="text-xs text-muted-foreground">alertas para revisar</p>
          </SummaryCard>
        )}

        {/* Total de Evoluções/Atendimentos */}
        <SummaryCard
          title="Atendimentos"
          icon={FileText}
          moduleKey="evolucao"
          onNavigate={onNavigateToModule}
        >
          {clinicalData.total_evolutions && clinicalData.total_evolutions > 0 ? (
            <div>
              <p className="text-2xl font-bold text-foreground">
                {clinicalData.total_evolutions}
              </p>
              <p className="text-xs text-muted-foreground">
                registros no prontuário
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhum atendimento</p>
          )}
        </SummaryCard>
      </div>

      {/* Links rápidos para módulos principais */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6 pt-2">
        <QuickLink 
          label="Anamnese" 
          icon={ClipboardList} 
          onClick={() => onNavigateToModule?.('anamnese')} 
        />
        <QuickLink 
          label="Odontograma" 
          icon={Smile} 
          onClick={() => onNavigateToModule?.('odontograma')} 
        />
        <QuickLink 
          label="Plano" 
          icon={Target} 
          onClick={() => onNavigateToModule?.('conduta')} 
        />
        <QuickLink 
          label="Evoluções" 
          icon={FileText} 
          onClick={() => onNavigateToModule?.('evolucao')} 
        />
        <QuickLink 
          label="Linha do Tempo" 
          icon={History} 
          onClick={() => onNavigateToModule?.('timeline')} 
        />
        <QuickLink 
          label="Alertas" 
          icon={AlertTriangle} 
          onClick={() => onNavigateToModule?.('alertas')} 
          badge={activeAlerts.length > 0 ? activeAlerts.length : undefined}
        />
      </div>

      {/* Estado vazio de alertas */}
      {activeAlerts.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          <ShieldAlert className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
          <p>Nenhum alerta clínico ativo</p>
        </div>
      )}
    </div>
  );
}
