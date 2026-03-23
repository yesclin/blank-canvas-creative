import { format, parseISO, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Calendar,
  FileText,
  AlertTriangle,
  Phone,
  Mail,
  Building2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Patient } from '@/types/pacientes';
import { genderLabels } from '@/types/pacientes';

interface PatientTableProps {
  patients: Patient[];
  onViewPatient: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
  onScheduleAppointment: (patient: Patient) => void;
  onOpenProntuario: (patient: Patient) => void;
}

export function PatientTable({
  patients,
  onViewPatient,
  onEditPatient,
  onScheduleAppointment,
  onOpenProntuario,
}: PatientTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), parseISO(birthDate));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  if (patients.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
        <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          Nenhum paciente encontrado
        </h3>
        <p className="text-sm text-muted-foreground">
          Tente ajustar os filtros ou cadastrar um novo paciente.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[300px]">Paciente</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Convênio</TableHead>
            <TableHead>Último Atendimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => {
            const age = calculateAge(patient.birth_date);
            
            return (
              <TableRow key={patient.id} className="group hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                        {getInitials(patient.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span 
                          className="font-medium hover:text-primary cursor-pointer transition-colors"
                          onClick={() => onViewPatient(patient)}
                        >
                          {patient.full_name}
                        </span>
                        {patient.has_clinical_alert && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{patient.clinical_alert_text}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {patient.guardian && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="text-xs">
                                Menor
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Responsável: {patient.guardian.full_name}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {patient.cpf && <span>{patient.cpf}</span>}
                        {patient.birth_date && (
                          <>
                            <span>•</span>
                            <span>
                              {age} anos ({genderLabels[patient.gender || ''] || '-'})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {patient.phone && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                    {patient.email && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[180px]">{patient.email}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {patient.insurance ? (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{patient.insurance.insurance_name}</p>
                        {patient.insurance.card_number && (
                          <p className="text-xs text-muted-foreground">
                            {patient.insurance.card_number}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="font-normal">
                      Particular
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {patient.last_appointment_date ? (
                    <div>
                      <p className="text-sm">{formatDate(patient.last_appointment_date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {patient.total_appointments} atendimento(s)
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Sem atendimentos</span>
                  )}
                </TableCell>
                <TableCell>
                  {patient.is_active ? (
                    <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground">
                      Inativo
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewPatient(patient)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver paciente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditPatient(patient)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar cadastro
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onScheduleAppointment(patient)}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Agendar atendimento
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOpenProntuario(patient)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Acessar prontuário
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
