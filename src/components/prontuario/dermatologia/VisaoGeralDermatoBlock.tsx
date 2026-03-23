import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User,
  AlertTriangle,
  Pill,
  FileText,
  ChevronRight,
  ClipboardList,
  Paperclip,
  History,
  ShieldAlert,
  Calendar,
  Activity,
  Target,
  Info,
  Scan,
  Stethoscope,
  type LucideIcon
} from "lucide-react";
import { format, parseISO, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Dados do paciente para exibição na Visão Geral Dermatológica
 */
export interface DermatoPatientData {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * Dados clínicos dermatológicos resumidos
 */
export interface DermatoClinicalData {
  /** Queixa dermatológica principal (última registrada) */
  main_complaint?: string | null;
  /** Diagnóstico ativo (última hipótese) */
  active_diagnosis?: string | null;
  /** CID-10 vinculado ao diagnóstico */
  cid10_code?: string | null;
  /** Alergias conhecidas */
  allergies: string[];
  /** Medicamentos de uso contínuo */
  current_medications: string[];
  /** Fototipo de pele (Fitzpatrick) */
  skin_phototype?: string | null;
  /** Total de evoluções */
  total_evolutions?: number;
  /** Data da última evolução */
  last_evolution_date?: string | null;
  /** Total de exames/documentos */
  total_exams?: number;
}

/**
 * Alerta dermatológico ativo
 */
export interface DermatoAlertItem {
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
export interface DermatoLastAppointment {
  id: string;
  scheduled_date: string;
  professional_name?: string;
  procedure_name?: string;
  status: string;
}

interface VisaoGeralDermatoBlockProps {
  patient: DermatoPatientData | null;
  clinicalData: DermatoClinicalData;
  alerts: DermatoAlertItem[];
  lastAppointment: DermatoLastAppointment | null;
  loading?: boolean;
  onNavigateToModule?: (moduleKey: string) => void;
}

/**
 * Calcula a idade do paciente
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
 * Formata o gênero do paciente
 */
function formatGender(gender: string | null): string {
  if (!gender) return '—';
  const genderMap: Record<string, string> = {
    'M': 'Masculino',
    'F': 'Feminino',
    'male': 'Masculino',
    'female': 'Feminino',
    'masculino': 'Masculino',
    'feminino': 'Feminino',
  };
  return genderMap[gender.toLowerCase()] || gender;
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
  variant?: 'default' | 'warning' | 'danger' | 'primary';
}) {
  const variantStyles = {
    default: 'hover:border-primary/50',
    warning: 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500/50',
    danger: 'border-destructive/30 bg-destructive/5 hover:border-destructive/50',
    primary: 'border-primary/30 bg-primary/5 hover:border-primary/50',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-amber-500/10 text-amber-600',
    danger: 'bg-destructive/10 text-destructive',
    primary: 'bg-primary/10 text-primary',
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${variantStyles[variant]}`}
      onClick={() => onNavigate?.(moduleKey)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-md ${iconStyles[variant]}`}>
              <Icon className="h-4 w-4" />
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
 * VISÃO GERAL - Hub central de leitura para Dermatologia
 * 
 * Exibe cards informativos específicos para dermatologia:
 * - Dados básicos do paciente (idade, sexo)
 * - Queixa dermatológica principal
 * - Diagnóstico ativo + CID-10
 * - Última consulta
 * - Alertas dermatológicos (alergias, fotossensibilidade)
 * 
 * Este bloco é SOMENTE LEITURA e não permite edição direta.
 * Clique nos cards para navegar aos módulos correspondentes.
 */
export function VisaoGeralDermatoBlock({ 
  patient, 
  clinicalData, 
  alerts,
  lastAppointment,
  loading = false,
  onNavigateToModule,
}: VisaoGeralDermatoBlockProps) {
  
  const activeAlerts = alerts.filter(a => a.is_active);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  const age = patient ? calculateAge(patient.birth_date) : null;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Selecione um paciente para visualizar o resumo dermatológico</p>
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
          <Scan className="h-3 w-3" />
          <span>
            Módulos exibidos: <span className="font-medium text-primary">Dermatologia</span>
          </span>
        </div>
      </div>

      {/* Dados Básicos do Paciente */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{patient.full_name}</h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {age !== null && <span>{age} anos</span>}
                <span>•</span>
                <span>{formatGender(patient.gender)}</span>
                {clinicalData.skin_phototype && (
                  <>
                    <span>•</span>
                    <span>Fototipo {clinicalData.skin_phototype}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

        {/* Queixa Dermatológica Principal */}
        <SummaryCard
          title="Queixa Principal"
          icon={ClipboardList}
          moduleKey="anamnese"
          onNavigate={onNavigateToModule}
          variant={clinicalData.main_complaint ? 'primary' : 'default'}
        >
          {clinicalData.main_complaint ? (
            <p className="text-sm font-medium text-foreground line-clamp-2">
              {clinicalData.main_complaint}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Não registrada</p>
          )}
        </SummaryCard>

        {/* Diagnóstico Ativo + CID-10 */}
        <SummaryCard
          title="Diagnóstico Ativo"
          icon={Target}
          moduleKey="diagnostico"
          onNavigate={onNavigateToModule}
          variant={clinicalData.active_diagnosis ? 'primary' : 'default'}
        >
          {clinicalData.active_diagnosis ? (
            <div>
              <p className="text-sm font-medium text-foreground line-clamp-1">
                {clinicalData.active_diagnosis}
              </p>
              {clinicalData.cid10_code && (
                <Badge variant="outline" className="text-xs mt-1">
                  CID-10: {clinicalData.cid10_code}
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Sem diagnóstico ativo</p>
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

        {/* Última Evolução */}
        <SummaryCard
          title="Evoluções"
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

        {/* Alergias */}
        <SummaryCard
          title="Alergias"
          icon={AlertTriangle}
          moduleKey="alertas"
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

        {/* Medicamentos Contínuos */}
        <SummaryCard
          title="Medicamentos em Uso"
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
          label="Exame Dermato" 
          icon={Stethoscope} 
          onClick={() => onNavigateToModule?.('exame_fisico')} 
        />
        <QuickLink 
          label="Diagnóstico" 
          icon={Target} 
          onClick={() => onNavigateToModule?.('diagnostico')} 
        />
        <QuickLink 
          label="Prescrições" 
          icon={Pill} 
          onClick={() => onNavigateToModule?.('prescricoes')} 
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
          <p>Nenhum alerta dermatológico ativo</p>
        </div>
      )}
    </div>
  );
}

export default VisaoGeralDermatoBlock;
