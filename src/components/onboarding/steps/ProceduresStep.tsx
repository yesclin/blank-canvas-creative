import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Settings,
  Check,
  Loader2,
  Stethoscope,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OnboardingProgress } from "@/hooks/useOnboarding";

// Valid Yesclin specialties (curated IDs)
const VALID_YESCLIN_SPECIALTIES = [
  "clinica-geral",
  "psicologia",
  "nutricao",
  "fisioterapia",
  "pilates",
  "fonoaudiologia",
  "estetica",
  "odontologia",
  "dermatologia",
  "pediatria",
];

interface ProceduresStepProps {
  clinicId: string;
  preferences: OnboardingProgress["preferences"];
  onNext: () => void;
  onBack: () => void;
}

interface ClinicSpecialty {
  id: string;
  name: string;
  area: string | null;
  specialty_type: "padrao" | "personalizada";
  hasProcedures: boolean;
  procedureCount: number;
}

interface BasicProcedure {
  name: string;
  type: "consulta" | "retorno" | "atendimento";
  duration_minutes: number;
  price: number;
  allows_return: boolean;
  return_days: number;
}

// Default basic procedures for each specialty
const BASIC_PROCEDURES: BasicProcedure[] = [
  {
    name: "Consulta Inicial",
    type: "consulta",
    duration_minutes: 50,
    price: 0,
    allows_return: false,
    return_days: 0,
  },
  {
    name: "Retorno",
    type: "retorno",
    duration_minutes: 30,
    price: 0,
    allows_return: false,
    return_days: 0,
  },
  {
    name: "Sessão / Atendimento",
    type: "atendimento",
    duration_minutes: 50,
    price: 0,
    allows_return: false,
    return_days: 0,
  },
];

export function ProceduresStep({ clinicId, preferences, onNext, onBack }: ProceduresStepProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [specialties, setSpecialties] = useState<ClinicSpecialty[]>([]);
  const [selectedForAutoCreate, setSelectedForAutoCreate] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState<Record<string, "pending" | "creating" | "done" | "error">>({});
  const { toast } = useToast();

  // Load ONLY clinic specialties (from preferences + custom specialties)
  useEffect(() => {
    async function loadClinicSpecialties() {
      setIsLoading(true);
      const validSpecialties: ClinicSpecialty[] = [];

      // 1. Load the primary specialty from onboarding preferences
      if (preferences.primary_specialty_id) {
        // Custom specialty created during onboarding
        const { data: primarySpec } = await supabase
          .from("specialties")
          .select("id, name, area, specialty_type")
          .eq("id", preferences.primary_specialty_id)
          .eq("is_active", true)
          .maybeSingle();

        if (primarySpec) {
          validSpecialties.push({
            ...primarySpec,
            specialty_type: primarySpec.specialty_type as "padrao" | "personalizada",
            hasProcedures: false,
            procedureCount: 0,
          });
        }
      } else if (preferences.primary_specialty_curated_id && preferences.primary_specialty_name) {
        // Curated specialty - check if valid
        if (VALID_YESCLIN_SPECIALTIES.includes(preferences.primary_specialty_curated_id)) {
          // Check if it exists for the clinic
          const { data: curatedSpec } = await supabase
            .from("specialties")
            .select("id, name, area, specialty_type")
            .eq("clinic_id", clinicId)
            .eq("name", preferences.primary_specialty_name)
            .eq("is_active", true)
            .maybeSingle();

          if (curatedSpec) {
            validSpecialties.push({
              ...curatedSpec,
              specialty_type: curatedSpec.specialty_type as "padrao" | "personalizada",
              hasProcedures: false,
              procedureCount: 0,
            });
          } else {
            // Specialty will be created on completion - show as pending
            validSpecialties.push({
              id: `pending-${preferences.primary_specialty_curated_id}`,
              name: preferences.primary_specialty_name,
              area: "Padrão",
              specialty_type: "padrao",
              hasProcedures: false,
              procedureCount: 0,
            });
          }
        }
      }

      // 2. Load custom specialties for this clinic (personalizadas only)
      const { data: customSpecs } = await supabase
        .from("specialties")
        .select("id, name, area, specialty_type")
        .eq("clinic_id", clinicId)
        .eq("specialty_type", "personalizada")
        .eq("is_active", true)
        .order("name");

      if (customSpecs) {
        for (const spec of customSpecs) {
          // Avoid duplicates
          if (!validSpecialties.find(s => s.id === spec.id)) {
            validSpecialties.push({
              ...spec,
              specialty_type: spec.specialty_type as "padrao" | "personalizada",
              hasProcedures: false,
              procedureCount: 0,
            });
          }
        }
      }

      // 3. Check existing procedures for each specialty
      const specialtyIds = validSpecialties
        .filter(s => !s.id.startsWith("pending-"))
        .map(s => s.id);

      if (specialtyIds.length > 0) {
        const { data: existingProcedures } = await supabase
          .from("procedures")
          .select("specialty_id")
          .eq("clinic_id", clinicId)
          .eq("is_active", true)
          .in("specialty_id", specialtyIds);

        const procedureCountBySpecialty: Record<string, number> = {};
        existingProcedures?.forEach(p => {
          if (p.specialty_id) {
            procedureCountBySpecialty[p.specialty_id] = (procedureCountBySpecialty[p.specialty_id] || 0) + 1;
          }
        });

        // Update procedure counts
        validSpecialties.forEach(spec => {
          if (!spec.id.startsWith("pending-")) {
            spec.procedureCount = procedureCountBySpecialty[spec.id] || 0;
            spec.hasProcedures = spec.procedureCount > 0;
          }
        });
      }

      setSpecialties(validSpecialties);

      // Pre-select specialties that don't have procedures yet (excluding pending)
      const toSelect = new Set<string>();
      validSpecialties.forEach(spec => {
        if (!spec.hasProcedures && !spec.id.startsWith("pending-")) {
          toSelect.add(spec.id);
        }
      });
      setSelectedForAutoCreate(toSelect);

      setIsLoading(false);
    }

    if (clinicId) {
      loadClinicSpecialties();
    }
  }, [clinicId, preferences]);

  const toggleSpecialtySelection = (specialtyId: string) => {
    // Don't allow selection of pending specialties
    if (specialtyId.startsWith("pending-")) return;

    setSelectedForAutoCreate(prev => {
      const next = new Set(prev);
      if (next.has(specialtyId)) {
        next.delete(specialtyId);
      } else {
        next.add(specialtyId);
      }
      return next;
    });
  };

  const handleCreateProcedures = async () => {
    if (selectedForAutoCreate.size === 0) {
      // No procedures to create, just continue
      onNext();
      return;
    }

    setIsCreating(true);

    // Initialize progress
    const initialProgress: Record<string, "pending" | "creating" | "done" | "error"> = {};
    selectedForAutoCreate.forEach(id => {
      initialProgress[id] = "pending";
    });
    setCreationProgress(initialProgress);

    let successCount = 0;
    let errorCount = 0;

    for (const specialtyId of selectedForAutoCreate) {
      setCreationProgress(prev => ({ ...prev, [specialtyId]: "creating" }));

      const specialty = specialties.find(s => s.id === specialtyId);
      if (!specialty) continue;

      try {
        // Check if procedures already exist for this specialty
        const { data: existing } = await supabase
          .from("procedures")
          .select("name")
          .eq("clinic_id", clinicId)
          .eq("specialty_id", specialtyId)
          .eq("is_active", true);

        const existingNames = new Set(existing?.map(p => p.name.toLowerCase()) || []);

        // Create only procedures that don't exist yet
        const proceduresToCreate = BASIC_PROCEDURES.filter(
          p => !existingNames.has(p.name.toLowerCase())
        );

        if (proceduresToCreate.length > 0) {
          const { error } = await supabase.from("procedures").insert(
            proceduresToCreate.map(proc => ({
              clinic_id: clinicId,
              specialty_id: specialtyId,
              name: proc.name,
              duration_minutes: proc.duration_minutes,
              price: proc.price,
              allows_return: proc.allows_return,
              return_days: proc.return_days,
              is_active: true,
            }))
          );

          if (error) throw error;
        }

        setCreationProgress(prev => ({ ...prev, [specialtyId]: "done" }));
        successCount++;
      } catch (err) {
        console.error(`Error creating procedures for ${specialty.name}:`, err);
        setCreationProgress(prev => ({ ...prev, [specialtyId]: "error" }));
        errorCount++;
      }
    }

    setIsCreating(false);

    if (successCount > 0) {
      toast({
        title: "Procedimentos criados!",
        description: `${successCount * BASIC_PROCEDURES.length} procedimentos criados para ${successCount} especialidade(s).`,
      });
    }

    if (errorCount > 0) {
      toast({
        title: "Alguns erros ocorreram",
        description: `${errorCount} especialidade(s) não puderam ser configuradas.`,
        variant: "destructive",
      });
    }

    // Advance to next step
    setTimeout(() => {
      onNext();
    }, 1500);
  };

  const handleSkip = () => {
    toast({
      title: "Etapa pulada",
      description: "Você poderá criar procedimentos depois em Configurações → Procedimentos.",
    });
    onNext();
  };

  const availableSpecialties = specialties.filter(s => !s.id.startsWith("pending-"));
  const pendingSpecialties = specialties.filter(s => s.id.startsWith("pending-"));
  const specialtiesWithoutProcedures = availableSpecialties.filter(s => !s.hasProcedures);
  const specialtiesWithProcedures = availableSpecialties.filter(s => s.hasProcedures);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Procedimentos Básicos</h2>
          <p className="text-sm text-muted-foreground">
            Configure os procedimentos iniciais para suas especialidades
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          Crie procedimentos básicos automaticamente para agilizar a configuração. 
          Cada especialidade receberá: <strong>Consulta Inicial</strong> (50 min), <strong>Retorno</strong> (30 min) e <strong>Sessão/Atendimento</strong> (50 min).
        </AlertDescription>
      </Alert>

      {specialties.length === 0 ? (
        <Alert className="border-muted">
          <Info className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2">
            <span className="font-medium">Nenhuma especialidade configurada para gerar procedimentos.</span>
            <p className="text-xs text-muted-foreground">
              Os procedimentos serão criados automaticamente quando a especialidade for persistida 
              ao final do onboarding, ou você pode criá-los manualmente em{" "}
              <strong>Configurações → Procedimentos</strong>.
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-4">
            {/* Pending specialties (will be created on completion) */}
            {pendingSpecialties.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Aguardando conclusão do onboarding ({pendingSpecialties.length})
                </h4>

                {pendingSpecialties.map(specialty => (
                  <Card key={specialty.id} className="bg-muted/30 border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <span className="font-medium">{specialty.name}</span>
                            <p className="text-xs text-muted-foreground">
                              Procedimentos serão criados automaticamente após a conclusão
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-muted-foreground">
                          Pendente
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Specialties without procedures - can auto-create */}
            {specialtiesWithoutProcedures.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    Prontas para configuração ({specialtiesWithoutProcedures.length})
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const allIds = specialtiesWithoutProcedures.map(s => s.id);
                      const allSelected = allIds.every(id => selectedForAutoCreate.has(id));
                      if (allSelected) {
                        setSelectedForAutoCreate(new Set());
                      } else {
                        setSelectedForAutoCreate(new Set(allIds));
                      }
                    }}
                  >
                    {specialtiesWithoutProcedures.every(s => selectedForAutoCreate.has(s.id))
                      ? "Desmarcar todos"
                      : "Selecionar todos"}
                  </Button>
                </div>

                {specialtiesWithoutProcedures.map(specialty => {
                  const isSelected = selectedForAutoCreate.has(specialty.id);
                  const progress = creationProgress[specialty.id];

                  return (
                    <Card
                      key={specialty.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? "border-primary/50 bg-primary/5" : "hover:bg-muted/50"
                      } ${progress === "done" ? "border-green-500/50 bg-green-50/50" : ""}`}
                      onClick={() => !isCreating && toggleSpecialtySelection(specialty.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSpecialtySelection(specialty.id)}
                              disabled={isCreating}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{specialty.name}</span>
                                {specialty.specialty_type === "personalizada" && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    Personalizada
                                  </Badge>
                                )}
                              </div>
                              {specialty.area && (
                                <span className="text-xs text-muted-foreground">{specialty.area}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {progress === "creating" && (
                              <div className="flex items-center gap-1 text-primary">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-xs">Criando...</span>
                              </div>
                            )}
                            {progress === "done" && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs">Pronto!</span>
                              </div>
                            )}
                            {progress === "error" && (
                              <div className="flex items-center gap-1 text-destructive">
                                <XCircle className="h-4 w-4" />
                                <span className="text-xs">Erro</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {isSelected && !progress && (
                          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                3 procedimentos
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                30-50 min cada
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Specialties with procedures - already configured */}
            {specialtiesWithProcedures.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  Procedimentos já configurados ({specialtiesWithProcedures.length})
                </h4>

                {specialtiesWithProcedures.map(specialty => (
                  <Card key={specialty.id} className="bg-muted/30 opacity-70">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <div>
                            <span className="font-medium">{specialty.name}</span>
                            {specialty.area && (
                              <span className="text-xs text-muted-foreground ml-2">({specialty.area})</span>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {specialty.procedureCount} procedimento(s)
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Actions summary */}
      {selectedForAutoCreate.size > 0 && !isCreating && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm">
            <strong>{selectedForAutoCreate.size}</strong> especialidade(s) selecionada(s) para criação automática
          </span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isCreating}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleSkip} disabled={isCreating}>
            Pular etapa
          </Button>
          <Button
            onClick={handleCreateProcedures}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : selectedForAutoCreate.size > 0 ? (
              <>
                Criar e Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
