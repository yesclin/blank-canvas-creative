import { useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BRAZIL_STATES,
  CouncilCode,
  getCouncilOptions,
  getCouncilRuleByProfessionalType,
} from "@/constants/specialtyCouncilMap";

interface Specialty {
  id: string;
  name: string;
  slug?: string | null;
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

  // Novos (opcionais para compat. visual)
  primarySpecialtyId?: string;
  onPrimarySpecialtyChange?: (id: string) => void;
  council?: string;
  onCouncilChange?: (v: string) => void;
  councilState?: string;
  onCouncilStateChange?: (v: string) => void;
  rqe?: string;
  onRqeChange?: (v: string) => void;
}

export const professionalTypeLabels: Record<string, string> = {
  medico: "Médico(a)",
  dentista: "Dentista",
  psicologo: "Psicólogo(a)",
  fisioterapeuta: "Fisioterapeuta",
  terapeuta_ocupacional: "Terapeuta Ocupacional",
  nutricionista: "Nutricionista",
  enfermeiro: "Enfermeiro(a)",
  biomedico: "Biomédico(a)",
  farmaceutico: "Farmacêutico(a)",
  educador_fisico: "Educador(a) Físico(a)",
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
  primarySpecialtyId,
  onPrimarySpecialtyChange,
  council,
  onCouncilChange,
  councilState,
  onCouncilStateChange,
  rqe,
  onRqeChange,
}: ProfessionalFieldsProps) {
  // Auto-select when only one specialty is available
  useEffect(() => {
    if (specialties.length === 1 && selectedSpecialtyIds.length === 0) {
      onToggleSpecialty(specialties[0].id);
    }
  }, [specialties, selectedSpecialtyIds.length, onToggleSpecialty]);

  // Auto-pick primary specialty (first selected) when unset
  useEffect(() => {
    if (!onPrimarySpecialtyChange) return;
    if (!primarySpecialtyId && selectedSpecialtyIds.length > 0) {
      onPrimarySpecialtyChange(selectedSpecialtyIds[0]);
    }
    if (primarySpecialtyId && !selectedSpecialtyIds.includes(primarySpecialtyId)) {
      onPrimarySpecialtyChange(selectedSpecialtyIds[0] ?? "");
    }
  }, [selectedSpecialtyIds, primarySpecialtyId, onPrimarySpecialtyChange]);

  // O conselho é definido pelo TIPO DE PROFISSIONAL (não pela especialidade)
  const rule = useMemo(
    () => getCouncilRuleByProfessionalType(professionalType),
    [professionalType]
  );
  const councilOptions = useMemo(() => getCouncilOptions(rule), [rule]);

  // Suggest council automatically when professional type changes and field is empty
  useEffect(() => {
    if (!onCouncilChange) return;
    if (!council && rule.suggested) {
      onCouncilChange(rule.suggested);
    }
    if (council && !rule.allowed.includes(council as CouncilCode)) {
      onCouncilChange(rule.suggested);
    }
  }, [rule, council, onCouncilChange]);

  const councilRequiresRegistration =
    rule.required && council !== "NAO_SE_APLICA";

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
              <span className="text-xs">
                Um administrador deve habilitar especialidades em Configurações da Clínica.
              </span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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

            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Para adicionar novas especialidades, acesse{" "}
              <Link
                to="/app/config/clinica"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
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

      {/* Especialidade principal (visível quando há mais de 1) */}
      {onPrimarySpecialtyChange && selectedSpecialtyIds.length > 1 && (
        <div className="grid gap-2">
          <Label>Especialidade principal</Label>
          <Select
            value={primarySpecialtyId || selectedSpecialtyIds[0] || ""}
            onValueChange={onPrimarySpecialtyChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a especialidade principal" />
            </SelectTrigger>
            <SelectContent>
              {specialties
                .filter((s) => selectedSpecialtyIds.includes(s.id))
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Conselho profissional — derivado do tipo de profissional */}
      {onCouncilChange && !!professionalType && (
        <div className="grid gap-2">
          <Label>
            Conselho profissional{rule.required ? " *" : " (opcional)"}
          </Label>
          <Select value={council || ""} onValueChange={onCouncilChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o conselho" />
            </SelectTrigger>
            <SelectContent>
              {councilOptions.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {professionalType && (
            <p className="text-xs text-muted-foreground">
              Definido pelo tipo de profissional selecionado.
            </p>
          )}
        </div>
      )}

      {/* Número de registro + UF — apenas quando o tipo profissional tem conselho aplicável */}
      {rule.suggested !== "NAO_SE_APLICA" && council !== "NAO_SE_APLICA" && (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
          <div className="grid gap-2">
            <Label htmlFor="registrationNumber">
              Número do registro
              {councilRequiresRegistration ? " *" : " (opcional)"}
            </Label>
            <Input
              id="registrationNumber"
              placeholder="Ex: 12345"
              value={registrationNumber}
              onChange={(e) => onRegistrationNumberChange(e.target.value)}
            />
          </div>
          {onCouncilStateChange && (
            <div className="grid gap-2">
              <Label>UF</Label>
              <Select value={councilState || ""} onValueChange={onCouncilStateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZIL_STATES.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* RQE (apenas para especialidades médicas) */}
      {rule.rqe === "optional" && onRqeChange && (
        <div className="grid gap-2">
          <Label htmlFor="rqe">RQE — Registro de Qualificação de Especialista (opcional)</Label>
          <Input
            id="rqe"
            placeholder="Ex: 12345"
            value={rqe || ""}
            onChange={(e) => onRqeChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
