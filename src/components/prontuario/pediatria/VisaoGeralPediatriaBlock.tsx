import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Baby,
  Calendar,
  User,
  AlertTriangle,
  Stethoscope,
  Clock,
  TrendingUp,
  Syringe,
  Activity,
  CheckCircle
} from 'lucide-react';
import { format, differenceInMonths, differenceInYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ===== TYPES =====
export interface PediatricPatientInfo {
  id: string;
  full_name: string;
  birth_date: string;
  gender?: 'M' | 'F' | 'O';
  photo_url?: string;
}

export interface PediatricGuardian {
  id: string;
  full_name: string;
  relationship: string;
  phone?: string;
  is_primary: boolean;
}

export interface PediatricAlert {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  is_active: boolean;
}

export interface PediatricDiagnosis {
  id: string;
  description: string;
  cid_code?: string;
  is_active: boolean;
  diagnosed_at: string;
}

export interface LastAppointmentInfo {
  id: string;
  date: string;
  professional_name: string;
  type?: string;
}

// ===== UTILITIES =====
function formatAge(birthDate: string): { text: string; months: number } {
  const birth = parseISO(birthDate);
  const now = new Date();
  const totalMonths = differenceInMonths(now, birth);
  const years = differenceInYears(now, birth);
  
  if (totalMonths < 1) {
    const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    return { text: `${days} dias`, months: 0 };
  }
  
  if (totalMonths < 24) {
    return { text: `${totalMonths} meses`, months: totalMonths };
  }
  
  const remainingMonths = totalMonths % 12;
  if (remainingMonths === 0) {
    return { text: `${years} anos`, months: totalMonths };
  }
  
  return { text: `${years} anos e ${remainingMonths} meses`, months: totalMonths };
}

function getGenderLabel(gender?: string): string {
  switch (gender) {
    case 'M': return 'Masculino';
    case 'F': return 'Feminino';
    case 'O': return 'Outro';
    default: return 'Não informado';
  }
}

function getRelativeDate(dateStr: string): string {
  const date = parseISO(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Há ${Math.floor(diffDays / 30)} meses`;
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
}

// ===== SUMMARY INDICATOR CARD =====
interface SummaryIndicatorProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'info';
}

function SummaryIndicator({ title, value, icon, variant = 'default' }: SummaryIndicatorProps) {
  const variantClasses = {
    default: 'bg-muted/50 border-muted',
    warning: 'bg-warning/10 border-warning/30',
    success: 'bg-primary/10 border-primary/30',
    info: 'bg-blue-500/10 border-blue-500/30',
  };

  return (
    <div className={`p-3 rounded-lg border ${variantClasses[variant]}`}>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{title}</span>
      </div>
      <p className="font-semibold text-sm">{value}</p>
    </div>
  );
}

// ===== PROPS =====
export interface VisaoGeralPediatriaBlockProps {
  patientId: string;
  clinicId: string | null;
  canEdit?: boolean;
  onNavigateToModule?: (moduleKey: string) => void;
  className?: string;
}

// ===== COMPONENT =====
export function VisaoGeralPediatriaBlock({
  patientId,
  clinicId,
  canEdit = false,
  onNavigateToModule,
  className,
}: VisaoGeralPediatriaBlockProps) {
  // Fetch patient data
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient-pediatria', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, birth_date, gender')
        .eq('id', patientId)
        .single();
      
      if (error) throw error;
      return {
        id: data.id,
        full_name: data.full_name,
        birth_date: data.birth_date,
        gender: data.gender as 'M' | 'F' | 'O' | undefined,
        photo_url: undefined,
      } as PediatricPatientInfo;
    },
    enabled: !!patientId,
  });

  // Fetch active alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['pediatria-alerts', patientId, clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      const { data, error } = await supabase
        .from('clinical_alerts')
        .select('id, title, severity, is_active')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return (data || []).map(a => ({
        ...a,
        severity: a.severity as 'critical' | 'warning' | 'info',
      }));
    },
    enabled: !!patientId && !!clinicId,
  });

  // Fetch last appointment
  const { data: lastAppointment } = useQuery({
    queryKey: ['last-appointment-pediatria', patientId, clinicId],
    queryFn: async () => {
      if (!clinicId) return null;
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          scheduled_date,
          status,
          professionals:professional_id (full_name)
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('status', 'completed')
        .order('scheduled_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error || !data) return null;
      
      return {
        id: data.id,
        date: data.scheduled_date,
        professional_name: (data.professionals as any)?.full_name || 'Profissional',
      } as LastAppointmentInfo;
    },
    enabled: !!patientId && !!clinicId,
  });

  // Fetch evolutions count
  const { data: evolutionsCount = 0 } = useQuery({
    queryKey: ['evolutions-count-pediatria', patientId, clinicId],
    queryFn: async () => {
      if (!clinicId) return 0;
      const { count, error } = await supabase
        .from('clinical_evolutions')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId);
      
      if (error) return 0;
      return count || 0;
    },
    enabled: !!patientId && !!clinicId,
  });

  const age = useMemo(() => {
    if (!patient?.birth_date) return { text: '-', months: 0 };
    return formatAge(patient.birth_date);
  }, [patient?.birth_date]);
  
  const activeAlerts = useMemo(() => alerts.filter(a => a.is_active), [alerts]);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  const warningAlerts = activeAlerts.filter(a => a.severity === 'warning');

  const isLoading = patientLoading || alertsLoading;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Visão Geral</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!patient) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Baby className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Paciente não encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Baby className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Visão Geral</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Patient Identity */}
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {patient.photo_url ? (
              <img 
                src={patient.photo_url} 
                alt={patient.full_name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <Baby className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{patient.full_name}</h3>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <Badge variant="secondary" className="font-normal">
                <Calendar className="h-3 w-3 mr-1" />
                {age.text}
              </Badge>
              <Badge variant="outline" className="font-normal">
                <User className="h-3 w-3 mr-1" />
                {getGenderLabel(patient.gender)}
              </Badge>
            </div>
            {patient.birth_date && (
              <p className="text-xs text-muted-foreground mt-1">
                Nascimento: {format(parseISO(patient.birth_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Summary Indicators Grid */}
        <div className="grid grid-cols-2 gap-2">
          <SummaryIndicator
            title="Evoluções"
            value={evolutionsCount || 0}
            icon={<Stethoscope className="h-3.5 w-3.5" />}
            variant="default"
          />
          <SummaryIndicator
            title="Alertas Ativos"
            value={activeAlerts.length}
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            variant={activeAlerts.length > 0 ? 'warning' : 'success'}
          />
          <SummaryIndicator
            title="Última Consulta"
            value={lastAppointment ? getRelativeDate(lastAppointment.date) : 'Nenhuma'}
            icon={<Clock className="h-3.5 w-3.5" />}
            variant="info"
          />
          <SummaryIndicator
            title="Idade"
            value={age.text}
            icon={<Calendar className="h-3.5 w-3.5" />}
            variant="default"
          />
        </div>

        {/* Last Appointment Details */}
        {lastAppointment && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span>Última Consulta</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{getRelativeDate(lastAppointment.date)}</div>
                <div className="text-sm text-muted-foreground">
                  {lastAppointment.professional_name}
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {format(parseISO(lastAppointment.date), 'dd/MM/yy', { locale: ptBR })}
              </Badge>
            </div>
          </div>
        )}

        {/* Pediatric Alerts Display */}
        {activeAlerts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>Alertas Pediátricos</span>
              <Badge variant="destructive" className="text-xs">{activeAlerts.length}</Badge>
            </div>
            <div className="space-y-2">
              {criticalAlerts.slice(0, 3).map((alert) => (
                <div 
                  key={alert.id}
                  className="p-2 rounded-lg border border-destructive/30 bg-destructive/10 flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-sm font-medium text-destructive">{alert.title}</span>
                </div>
              ))}
              {warningAlerts.slice(0, 2).map((alert) => (
                <div 
                  key={alert.id}
                  className="p-2 rounded-lg border border-warning/30 bg-warning/10 flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                  <span className="text-sm font-medium">{alert.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeAlerts.length === 0 && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-sm text-primary">Nenhum alerta ativo</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default VisaoGeralPediatriaBlock;