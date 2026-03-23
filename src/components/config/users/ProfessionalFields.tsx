import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Specialty {
  id: string;
  name: string;
}

interface ProfessionalFieldsProps {
  professionalType: string;
  onProfessionalTypeChange: (value: string) => void;
  registrationNumber: string;
  onRegistrationNumberChange: (value: string) => void;
  selectedSpecialtyIds: string[];
  onToggleSpecialty: (specialtyId: string) => void;
  specialties: Specialty[];
  loadingSpecialties: boolean;
  clinicId?: string;
  onSpecialtyAdded?: () => void;
}

export const professionalTypeLabels: Record<string, string> = {
  medico: "Médico(a)",
  dentista: "Dentista",
  psicologo: "Psicólogo(a)",
  fisioterapeuta: "Fisioterapeuta",
  nutricionista: "Nutricionista",
  enfermeiro: "Enfermeiro(a)",
  esteticista: "Esteticista",
  outro: "Outro",
};

export function ProfessionalFields({
  professionalType,
  onProfessionalTypeChange,
  registrationNumber,
  onRegistrationNumberChange,
  selectedSpecialtyIds,
  onToggleSpecialty,
  specialties,
  loadingSpecialties,
}: ProfessionalFieldsProps) {
  // Auto-select when only one specialty is available
  useEffect(() => {
    if (specialties.length === 1 && selectedSpecialtyIds.length === 0) {
      onToggleSpecialty(specialties[0].id);
    }
  }, [specialties, selectedSpecialtyIds.length, onToggleSpecialty]);

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-primary/5">
      <div className="grid gap-2">
        <Label htmlFor="professionalType">Tipo de Profissional</Label>
        <Select value={professionalType} onValueChange={onProfessionalTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(professionalTypeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="registrationNumber">Registro Profissional (opcional)</Label>
        <Input
          id="registrationNumber"
          placeholder="Ex: CRM, CRO, CRP..."
          value={registrationNumber}
          onChange={(e) => onRegistrationNumberChange(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            Especialidade(s) Habilitadas *
            {loadingSpecialties && <Loader2 className="h-3 w-3 animate-spin" />}
          </Label>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Apenas especialidades habilitadas na clínica estão disponíveis
        </p>

        {specialties.length === 0 && !loadingSpecialties ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-2">
              <span>Nenhuma especialidade habilitada na clínica.</span>
              <span className="text-xs">Um administrador deve habilitar especialidades em Configurações da Clínica.</span>
              <Button variant="outline" size="sm" asChild className="w-fit">
                <Link to="/app/config/clinica">
                  <Settings className="h-4 w-4 mr-2" />
                  Ir para Configurações
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {specialties.map((specialty) => (
                <div
                  key={specialty.id}
                  className={`flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition-colors ${
                    selectedSpecialtyIds.includes(specialty.id)
                      ? "bg-primary/10 border-primary/30"
                      : "bg-background hover:bg-muted/50"
                  }`}
                  onClick={() => onToggleSpecialty(specialty.id)}
                >
                  <Checkbox
                    id={`specialty-${specialty.id}`}
                    checked={selectedSpecialtyIds.includes(specialty.id)}
                    onCheckedChange={() => onToggleSpecialty(specialty.id)}
                  />
                  <Label
                    htmlFor={`specialty-${specialty.id}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {specialty.name}
                  </Label>
                </div>
              ))}
            </div>
            
            {/* Hint to manage specialties */}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Para adicionar novas especialidades, acesse{" "}
              <Link to="/app/config/clinica" className="text-primary hover:underline inline-flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Configurações da Clínica
              </Link>
            </p>
          </>
        )}

        {selectedSpecialtyIds.length === 0 && specialties.length > 0 && (
          <p className="text-xs text-destructive">Selecione pelo menos uma especialidade</p>
        )}
      </div>
    </div>
  );
}
