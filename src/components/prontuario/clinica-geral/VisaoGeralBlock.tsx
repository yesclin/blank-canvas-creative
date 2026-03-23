import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User,
  AlertTriangle,
  Pill,
  Heart,
  FileText,
  Stethoscope,
  ChevronRight,
  ClipboardList,
  Paperclip,
  History,
  ShieldAlert,
  Calendar,
  Activity,
  Target,
  Info,
  type LucideIcon
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { SpecialtyKey } from "@/hooks/prontuario/useActiveSpecialty";
import { YESCLIN_SPECIALTY_LABELS } from "@/hooks/prontuario/yesclinSpecialties";

/**
 * Dados do paciente para exibição na Visão Geral
 */
export interface PatientBasicData {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  phone?: string | null;
  email?: string | null;
  cpf?: string | null;
}

/**
 * Dados clínicos resumidos
 */
export interface ClinicalSummaryData {
  allergies: string[];
  chronic_diseases: string[];
  current_medications: string[];
  blood_type?: string | null;
  total_evolutions?: number;
  last_evolution_date?: string | null;
  pending_prescriptions?: number;
  total_exams?: number;
}

/**
 * Alerta clínico ativo
 */
export interface ClinicalAlertItem {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  alert_type: string;
  description?: string | null;
  is_active: boolean;
}

/**
 * Última consulta registrada
 */
export interface LastAppointmentData {
  id: string;
  scheduled_date: string;
  professional_name?: string;
  specialty_name?: string;
  procedure_name?: string;
  status: string;
}

interface VisaoGeralBlockProps {
  patient: PatientBasicData | null;
  clinicalData: ClinicalSummaryData;
  alerts: ClinicalAlertItem[];
  lastAppointment: LastAppointmentData | null;
  loading?: boolean;
  onNavigateToModule?: (moduleKey: string) => void;
  /** Specialty key for context indication */
  activeSpecialtyKey?: SpecialtyKey;
  /** Specialty display name (optional, will use YESCLIN_SPECIALTY_LABELS if not provided) */
  activeSpecialtyName?: string;
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
  variant?: 'default' | 'warning' | 'danger';
}) {
  const variantStyles = {
    default: 'hover:border-primary/50',
    warning: 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500/50',
    danger: 'border-destructive/30 bg-destructive/5 hover:border-destructive/50',
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
              variant === 'warning' ? 'bg-amber-500/10' : 'bg-primary/10'
            }`}>
              <Icon className={`h-4 w-4 ${
                variant === 'danger' ? 'text-destructive' : 
                variant === 'warning' ? 'text-amber-600' : 'text-primary'
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
 * VISÃO GERAL - Hub central de leitura para Clínica Geral
 * 
 * Exibe cards informativos que puxam dados dos módulos:
 * - Queixa principal / Status atual
 * - Última evolução
 * - Alertas ativos
 * - Alergias e doenças crônicas
 * - Próxima sessão / consulta
 * 
 * Este bloco é SOMENTE LEITURA e não permite edição direta.
 * Clique nos cards para navegar aos módulos correspondentes.
 */
export function VisaoGeralBlock({ 
  patient, 
  clinicalData, 
  alerts,
  lastAppointment,
  loading = false,
  onNavigateToModule,
  activeSpecialtyKey = 'geral',
  activeSpecialtyName,
}: VisaoGeralBlockProps) {
  
  const activeAlerts = alerts.filter(a => a.is_active);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  
  // Resolve display name for specialty
  const specialtyDisplayName = activeSpecialtyName || YESCLIN_SPECIALTY_LABELS[activeSpecialtyKey] || 'Clínica Geral';

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
          <p>Selecione um paciente para visualizar o resumo clínico</p>
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
            Módulos exibidos: <span className="font-medium text-primary">{specialtyDisplayName}</span>
          </span>
        </div>
      </div>

      {/* Grid de Cards de Resumo */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        
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

        {/* Última Evolução */}
        <SummaryCard
          title="Última Evolução"
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
                {clinicalData.last_evolution_date 
                  ? `Última em ${format(parseISO(clinicalData.last_evolution_date), "dd/MM/yyyy", { locale: ptBR })}`
                  : 'registros'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhuma evolução</p>
          )}
        </SummaryCard>

        {/* Última Consulta */}
        {lastAppointment && (
          <SummaryCard
            title="Última Consulta"
            icon={Calendar}
            moduleKey="timeline"
            onNavigate={onNavigateToModule}
          >
            <p className="text-lg font-semibold text-foreground">
              {format(parseISO(lastAppointment.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
            </p>
            {lastAppointment.professional_name && (
              <p className="text-xs text-muted-foreground truncate">
                {lastAppointment.professional_name}
              </p>
            )}
          </SummaryCard>
        )}

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

        {/* Doenças Crônicas */}
        <SummaryCard
          title="Doenças Crônicas"
          icon={Heart}
          moduleKey="anamnese"
          onNavigate={onNavigateToModule}
        >
          {clinicalData.chronic_diseases.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {clinicalData.chronic_diseases.slice(0, 3).map((disease, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary"
                  className="text-xs"
                >
                  {disease}
                </Badge>
              ))}
              {clinicalData.chronic_diseases.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{clinicalData.chronic_diseases.length - 3}
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhuma registrada</p>
          )}
        </SummaryCard>

        {/* Medicamentos Contínuos */}
        <SummaryCard
          title="Medicamentos Contínuos"
          icon={Pill}
          moduleKey="prescricoes"
          onNavigate={onNavigateToModule}
        >
          {clinicalData.current_medications.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {clinicalData.current_medications.slice(0, 3).map((med, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline"
                  className="text-xs"
                >
                  {med}
                </Badge>
              ))}
              {clinicalData.current_medications.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{clinicalData.current_medications.length - 3}
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhum registrado</p>
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

        {/* Prescrições Pendentes */}
        {(clinicalData.pending_prescriptions ?? 0) > 0 && (
          <SummaryCard
            title="Prescrições"
            icon={Pill}
            moduleKey="prescricoes"
            onNavigate={onNavigateToModule}
          >
            <p className="text-2xl font-bold text-foreground">{clinicalData.pending_prescriptions}</p>
            <p className="text-xs text-muted-foreground">pendentes</p>
          </SummaryCard>
        )}

        {/* Exames / Documentos */}
        <SummaryCard
          title="Exames / Documentos"
          icon={Paperclip}
          moduleKey="exames"
          onNavigate={onNavigateToModule}
        >
          <p className="text-2xl font-bold text-foreground">{clinicalData.total_exams ?? 0}</p>
          <p className="text-xs text-muted-foreground">arquivos</p>
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
          label="Exame Físico" 
          icon={Stethoscope} 
          onClick={() => onNavigateToModule?.('exame_fisico')} 
        />
        <QuickLink 
          label="Diagnóstico" 
          icon={Target} 
          onClick={() => onNavigateToModule?.('diagnostico')} 
        />
        <QuickLink 
          label="Conduta" 
          icon={Activity} 
          onClick={() => onNavigateToModule?.('conduta')} 
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
