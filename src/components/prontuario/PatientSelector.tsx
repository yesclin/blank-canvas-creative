import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, FileText, Users, Calendar, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllPatients, type Patient } from '@/hooks/usePatients';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { useClinicData } from '@/hooks/useClinicData';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PatientSelectorProps {
  onSelectPatient: (patientId: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  nao_confirmado: 'Não confirmado',
  confirmado: 'Confirmado',
  chegou: 'Chegou',
  em_atendimento: 'Em atendimento',
  finalizado: 'Finalizado',
  faltou: 'Faltou',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  em_atendimento: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  chegou: 'bg-blue-500/10 text-blue-700 border-blue-200',
  confirmado: 'bg-primary/10 text-primary border-primary/20',
  nao_confirmado: 'bg-muted text-muted-foreground',
};

export function PatientSelector({ onSelectPatient }: PatientSelectorProps) {
  const navigate = useNavigate();
  const { data: patients = [], isLoading } = useAllPatients();
  const { professionalId } = usePermissions();
  const { clinic } = useClinicData();
  const [search, setSearch] = useState('');

  // Fetch today's appointments for this professional
  const { data: todayAppointments = [] } = useQuery({
    queryKey: ['today-appointments-for-prontuario', professionalId, clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const today = format(new Date(), 'yyyy-MM-dd');
      
      let query = supabase
        .from('appointments')
        .select('id, patient_id, status, start_time, specialty_id, procedure_id, professional_id, patients(full_name, cpf, phone)')
        .eq('clinic_id', clinic.id)
        .eq('scheduled_date', today)
        .in('status', ['em_atendimento', 'chegou', 'confirmado', 'nao_confirmado'])
        .order('start_time', { ascending: true });

      // If professional, filter to their appointments only
      if (professionalId) {
        query = query.eq('professional_id', professionalId);
      }

      const { data, error } = await query.limit(20);
      if (error) return [];
      return data || [];
    },
    enabled: !!clinic?.id,
    staleTime: 15000,
  });

  // Filter patients based on search
  const filteredPatients = patients.filter((patient) => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    return (
      patient.full_name.toLowerCase().includes(searchLower) ||
      patient.cpf?.includes(search) ||
      patient.phone?.includes(search) ||
      patient.email?.toLowerCase().includes(searchLower)
    );
  }).slice(0, 20);

  const handleSelectPatient = useCallback((patient: Patient) => {
    onSelectPatient(patient.id);
  }, [onSelectPatient]);

  const handleSelectFromAppointment = useCallback((appointment: any) => {
    const params = new URLSearchParams({
      appointmentId: appointment.id,
      professionalId: appointment.professional_id,
    });
    if (appointment.specialty_id) params.set('specialtyId', appointment.specialty_id);
    if (appointment.procedure_id) params.set('procedureId', appointment.procedure_id);
    navigate(`/app/prontuario/${appointment.patient_id}?${params.toString()}`);
  }, [navigate]);

  const handleGoToPatients = () => {
    navigate('/app/pacientes');
  };

  const handleGoToAgenda = () => {
    navigate('/app/agenda');
  };

  const hasAppointments = todayAppointments.length > 0;

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Prontuário Eletrônico</CardTitle>
          <CardDescription className="text-base">
            {hasAppointments
              ? 'Selecione um paciente da agenda de hoje ou busque por nome'
              : 'Busque um paciente para visualizar seu prontuário'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Today's Appointments */}
          {hasAppointments && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Agenda de hoje
              </div>
              <ScrollArea className="max-h-[250px]">
                <div className="space-y-2">
                  {todayAppointments.map((apt: any) => (
                    <button
                      key={apt.id}
                      onClick={() => handleSelectFromAppointment(apt)}
                      className={cn(
                        "w-full flex items-center gap-4 p-3 rounded-lg border transition-all text-left",
                        "hover:bg-accent hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                        apt.status === 'em_atendimento' && "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20"
                      )}
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {apt.status === 'em_atendimento' ? (
                          <Activity className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <span className="text-sm font-bold text-primary">
                            {(apt.patients?.full_name || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">
                          {apt.patients?.full_name || 'Paciente'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {apt.start_time?.substring(0, 5)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", STATUS_COLORS[apt.status] || '')}
                      >
                        {STATUS_LABELS[apt.status] || apt.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {hasAppointments && <div className="border-t" />}

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF, telefone ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus={!hasAppointments}
            />
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : search.trim() && filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Nenhum paciente encontrado</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleGoToPatients}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar Novo Paciente
              </Button>
            </div>
          ) : search.trim() ? (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left",
                      "hover:bg-accent hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    )}
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-primary">
                        {patient.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{patient.full_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {patient.cpf && <span>{patient.cpf}</span>}
                        {patient.phone && <span>• {patient.phone}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {patient.has_clinical_alert && (
                        <Badge variant="destructive" className="text-xs">Alerta</Badge>
                      )}
                      {!patient.is_active && (
                        <Badge variant="secondary" className="text-xs">Inativo</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : !hasAppointments ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">Digite para buscar pacientes</p>
              <p className="text-sm">ou acesse a partir da lista de pacientes ou agenda</p>
            </div>
          ) : null}

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleGoToPatients}
            >
              <Users className="h-4 w-4 mr-2" />
              Ver Lista de Pacientes
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleGoToAgenda}
            >
              <FileText className="h-4 w-4 mr-2" />
              Ver Agenda
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
