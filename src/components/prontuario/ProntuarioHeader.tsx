import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Settings, 
  Lock, 
  Shield, 
  ShieldX, 
  Activity,
  AlertTriangle,
  MoreVertical,
  Droplet,
  Heart,
  Pill,
  ShieldAlert,
  Phone,
  CreditCard,
  User,
  Stethoscope,
} from "lucide-react";
import { Link } from "react-router-dom";
import { differenceInYears, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SpecialtyKey } from "@/hooks/prontuario/useActiveSpecialty";
import { YESCLIN_SPECIALTY_LABELS } from "@/hooks/prontuario/yesclinSpecialties";

export interface ClinicalSummaryForHeader {
  allergies: string[];
  chronic_diseases: string[];
  current_medications: string[];
  blood_type?: string | null;
  restrictions?: string[];
}

interface PatientInfo {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  phone?: string | null;
  cpf?: string | null;
}

interface ActiveAppointmentInfo {
  id: string;
  status: string;
}

interface ProntuarioHeaderProps {
  patient: PatientInfo | null;
  patientLoading?: boolean;
  activeSpecialtyKey: SpecialtyKey;
  activeSpecialtyName?: string;
  professionalName?: string | null;
  isSpecialtyFromAppointment: boolean;
  specialtyLoading?: boolean;
  criticalAlertsCount: number;
  isLgpdPending: boolean;
  hasActiveAppointment: boolean;
  activeAppointment: ActiveAppointmentInfo | null;
  appointmentLoading?: boolean;
  appointmentReason?: string;
  isAdmin?: boolean;
  canPrint?: boolean;
  canExport?: boolean;
  onPrint?: () => void;
  onExport?: () => void;
  exporting?: boolean;
  insuranceName?: string | null;
  clinicalSummary?: ClinicalSummaryForHeader | null;
  clinicalDataLoading?: boolean;
  className?: string;
}

export function ProntuarioHeader({
  patient,
  patientLoading = false,
  activeSpecialtyKey,
  activeSpecialtyName,
  professionalName,
  isSpecialtyFromAppointment,
  specialtyLoading = false,
  criticalAlertsCount,
  isLgpdPending,
  hasActiveAppointment,
  activeAppointment,
  appointmentLoading = false,
  appointmentReason,
  isAdmin = false,
  canPrint = true,
  canExport = true,
  onPrint,
  onExport,
  exporting = false,
  insuranceName,
  clinicalSummary,
  clinicalDataLoading = false,
  className,
}: ProntuarioHeaderProps) {
  const isMobile = useIsMobile();

  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    try {
      return differenceInYears(new Date(), parseISO(birthDate));
    } catch {
      return null;
    }
  };

  const formatGender = (gender: string | null): string => {
    if (!gender) return '';
    const genderMap: Record<string, string> = {
      'M': 'Masculino',
      'F': 'Feminino',
      'male': 'Masculino',
      'female': 'Feminino',
      'masculino': 'Masculino',
      'feminino': 'Feminino',
    };
    return genderMap[gender.toLowerCase()] || gender;
  };

  const formatCpf = (cpf: string): string => {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length === 11) {
      return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
    }
    return cpf;
  };

  if (patientLoading) {
    return (
      <div className={cn("flex flex-col gap-2 p-3 border-b bg-background/95 backdrop-blur sticky top-0 z-20", className)}>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  const age = patient ? calculateAge(patient.birth_date) : null;
  const gender = patient ? formatGender(patient.gender) : '';
  const displaySpecialty = activeSpecialtyName || YESCLIN_SPECIALTY_LABELS[activeSpecialtyKey] || 'Clínica Geral';

  const hasClinicalData = clinicalSummary && (
    clinicalSummary.allergies.length > 0 ||
    clinicalSummary.chronic_diseases.length > 0 ||
    clinicalSummary.current_medications.length > 0 ||
    clinicalSummary.blood_type ||
    (clinicalSummary.restrictions && clinicalSummary.restrictions.length > 0)
  );

  // Patient details chips
  const patientDetails: string[] = [];
  if (age !== null) patientDetails.push(`${age} anos`);
  if (gender) patientDetails.push(gender);

  // Mobile Layout
  if (isMobile) {
    return (
      <div className={cn(
        "flex flex-col gap-1.5 px-3 py-2 border-b bg-background/95 backdrop-blur sticky top-0 z-20",
        className
      )}>
        {/* Row 1: Back + Patient Name + Menu */}
        <div className="flex items-center gap-2">
          <Link to="/app/pacientes">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate text-foreground">
              {patient?.full_name || 'Paciente'}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {patientDetails.join(' • ')}
              {insuranceName && ` • ${insuranceName}`}
            </p>
          </div>

          {/* Status badges */}
          {criticalAlertsCount > 0 && (
            <Badge variant="destructive" className="animate-pulse gap-0.5 h-5 text-[10px] px-1.5">
              <AlertTriangle className="h-3 w-3" />
              {criticalAlertsCount}
            </Badge>
          )}
          {isLgpdPending && (
            <Badge variant="outline" className="gap-0.5 text-destructive border-destructive h-5 text-[10px] px-1.5">
              <Lock className="h-3 w-3" />
              LGPD
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled={!canPrint} onClick={onPrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canExport || exporting} onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exportando...' : 'Exportar PDF'}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/config/prontuario" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Row 2: Specialty + Professional */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <Stethoscope className="h-3 w-3 text-primary flex-shrink-0" />
          <span className="font-medium text-primary">{displaySpecialty}</span>
          {professionalName && (
            <>
              <span className="text-muted-foreground">|</span>
              <span>{professionalName}</span>
            </>
          )}
        </div>

        {/* Row 3: Clinical Summary */}
        {clinicalDataLoading && (
          <div className="flex items-center gap-1.5 px-1">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        )}
        {!clinicalDataLoading && hasClinicalData && (
          <div className="flex flex-wrap items-center gap-1.5 px-1">
            {clinicalSummary!.blood_type && (
              <Badge variant="outline" className="gap-1 h-5 text-[10px]">
                <Droplet className="h-3 w-3 text-red-500" />
                {clinicalSummary!.blood_type}
              </Badge>
            )}
            {clinicalSummary!.allergies.map((a, i) => (
              <Badge key={`a-${i}`} variant="destructive" className="gap-1 h-5 text-[10px]">
                <AlertTriangle className="h-3 w-3" />
                {a}
              </Badge>
            ))}
            {clinicalSummary!.chronic_diseases.map((d, i) => (
              <Badge key={`d-${i}`} variant="secondary" className="gap-1 h-5 text-[10px]">
                <Heart className="h-3 w-3" />
                {d}
              </Badge>
            ))}
            {clinicalSummary!.current_medications.map((m, i) => (
              <Badge key={`m-${i}`} variant="outline" className="gap-1 h-5 text-[10px]">
                <Pill className="h-3 w-3" />
                {m}
              </Badge>
            ))}
            {clinicalSummary!.restrictions?.map((r, i) => (
              <Badge key={`r-${i}`} variant="destructive" className="gap-1 h-5 text-[10px]">
                <ShieldAlert className="h-3 w-3" />
                {r}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout - 3 linhas
  return (
    <div className={cn(
      "flex flex-col border-b bg-background/95 backdrop-blur sticky top-0 z-20",
      className
    )}>
      {/* Linha 1: Dados do Paciente */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link to="/app/pacientes" className="flex-shrink-0">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          {/* Patient name - destaque principal */}
          <h1 className="text-lg font-bold text-foreground whitespace-nowrap">
            {patient?.full_name || 'Paciente'}
          </h1>

          {/* Age, Gender, etc */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
            {patientDetails.length > 0 && (
              <span className="whitespace-nowrap">{patientDetails.join(' • ')}</span>
            )}
            {patient?.cpf && (
              <span className="flex items-center gap-1 whitespace-nowrap">
                <CreditCard className="h-3.5 w-3.5" />
                {formatCpf(patient.cpf)}
              </span>
            )}
            {patient?.phone && (
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Phone className="h-3.5 w-3.5" />
                {patient.phone}
              </span>
            )}
            {insuranceName && (
              <Badge variant="outline" className="gap-1 h-5 text-[10px] font-medium">
                <Shield className="h-3 w-3 text-primary" />
                {insuranceName}
              </Badge>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
            {criticalAlertsCount > 0 && (
              <Badge variant="destructive" className="animate-pulse gap-0.5 h-5 text-[10px] px-1.5">
                <AlertTriangle className="h-3 w-3" />
                {criticalAlertsCount}
              </Badge>
            )}
            {isLgpdPending && (
              <Badge variant="outline" className="gap-0.5 text-destructive border-destructive h-5 text-[10px] px-1.5">
                <Lock className="h-3 w-3" />
                LGPD
              </Badge>
            )}
            {hasActiveAppointment && activeAppointment && (
              <Badge className="gap-0.5 bg-emerald-600 hover:bg-emerald-700 text-white h-5 text-[10px] px-1.5">
                <Activity className="h-3 w-3" />
                Ativo
              </Badge>
            )}
            {!hasActiveAppointment && !appointmentLoading && isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="gap-0.5 bg-amber-600 hover:bg-amber-700 text-white h-5 text-[10px] px-1.5">
                      <Shield className="h-3 w-3" />
                      Admin
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Edição permitida para administradores</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {!hasActiveAppointment && !appointmentLoading && !isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="gap-0.5 text-muted-foreground h-5 text-[10px] px-1.5">
                      <ShieldX className="h-3 w-3" />
                      Leitura
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>{appointmentReason || 'Sem atendimento ativo'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>

      {/* Linha 2: Contexto Clínico + Ações */}
      <div className="flex items-center justify-between px-4 py-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Stethoscope className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="font-medium text-primary">{displaySpecialty}</span>
          {professionalName && (
            <>
              <span className="text-muted-foreground/50">|</span>
              <User className="h-3.5 w-3.5" />
              <span>{professionalName}</span>
            </>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2.5"
                  disabled={!canPrint}
                  onClick={onPrint}
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">Imprimir</span>
                </Button>
              </TooltipTrigger>
              {!canPrint && (
                <TooltipContent>Sem permissão para imprimir</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2.5"
                  disabled={!canExport || exporting}
                  onClick={onExport}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">{exporting ? 'Exportando...' : 'Exportar PDF'}</span>
                </Button>
              </TooltipTrigger>
              {!canExport && (
                <TooltipContent>Sem permissão para exportar</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <Link to="/app/config/prontuario">
            <Button variant="outline" size="sm" className="h-8 px-2.5">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Config</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Linha 3: Resumo Clínico */}
      {clinicalDataLoading && (
        <div className="px-4 pb-2 flex items-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] mr-1">Resumo Clínico:</span>
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      )}
      {!clinicalDataLoading && hasClinicalData && (
        <div className="px-4 pb-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] mr-1">Resumo Clínico:</span>
          
          {clinicalSummary!.blood_type && (
            <Badge variant="outline" className="gap-1 h-5 text-[10px]">
              <Droplet className="h-3 w-3 text-red-500" />
              {clinicalSummary!.blood_type}
            </Badge>
          )}
          
          {clinicalSummary!.allergies.map((a, i) => (
            <Badge key={`allergy-${i}`} variant="destructive" className="gap-1 h-5 text-[10px]">
              <AlertTriangle className="h-3 w-3" />
              {a}
            </Badge>
          ))}
          
          {clinicalSummary!.chronic_diseases.map((d, i) => (
            <Badge key={`disease-${i}`} variant="secondary" className="gap-1 h-5 text-[10px]">
              <Heart className="h-3 w-3" />
              {d}
            </Badge>
          ))}
          
          {clinicalSummary!.current_medications.map((m, i) => (
            <Badge key={`med-${i}`} variant="outline" className="gap-1 h-5 text-[10px]">
              <Pill className="h-3 w-3" />
              {m}
            </Badge>
          ))}
          
          {clinicalSummary!.restrictions?.map((r, i) => (
            <Badge key={`restriction-${i}`} variant="destructive" className="gap-1 h-5 text-[10px]">
              <ShieldAlert className="h-3 w-3" />
              {r}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
