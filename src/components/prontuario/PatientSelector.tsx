import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, FileText, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllPatients, type Patient } from '@/hooks/usePatients';
import { cn } from '@/lib/utils';

interface PatientSelectorProps {
  onSelectPatient: (patientId: string) => void;
}

export function PatientSelector({ onSelectPatient }: PatientSelectorProps) {
  const navigate = useNavigate();
  const { data: patients = [], isLoading } = useAllPatients();
  const [search, setSearch] = useState('');

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
  }).slice(0, 20); // Limit to 20 results

  const handleSelectPatient = useCallback((patient: Patient) => {
    onSelectPatient(patient.id);
  }, [onSelectPatient]);

  const handleGoToPatients = () => {
    navigate('/app/pacientes');
  };

  const handleGoToAgenda = () => {
    navigate('/app/agenda');
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Prontuário Eletrônico</CardTitle>
          <CardDescription className="text-base">
            Busque um paciente para visualizar seu prontuário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF, telefone ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">Digite para buscar pacientes</p>
              <p className="text-sm">ou acesse a partir da lista de pacientes ou agenda</p>
            </div>
          )}

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
