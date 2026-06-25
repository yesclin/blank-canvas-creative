import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Search,
  Sparkles,
  Brain,
  Apple,
  Activity,
  Smile,
  Scissors,
  Baby,
  Heart,
  Layers,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Curated list of officially supported specialties (closed whitelist)
const CURATED_SPECIALTIES = [
  { id: "clinica-geral", name: "Clínica Geral", description: "Atendimento médico generalista", icon: Stethoscope, color: "bg-blue-500" },
  { id: "psicologia", name: "Psicologia", description: "Saúde mental e terapia", icon: Brain, color: "bg-purple-500" },
  { id: "nutricao", name: "Nutrição", description: "Alimentação e dieta", icon: Apple, color: "bg-green-500" },
  { id: "fisioterapia", name: "Fisioterapia", description: "Reabilitação e movimento", icon: Activity, color: "bg-orange-500" },
  { id: "pilates", name: "Pilates", description: "Exercícios terapêuticos", icon: Activity, color: "bg-teal-500" },
  { id: "estetica", name: "Estética / Harmonização Facial", description: "Procedimentos estéticos", icon: Scissors, color: "bg-pink-500" },
  { id: "odontologia", name: "Odontologia", description: "Saúde bucal com odontograma digital", icon: Smile, color: "bg-cyan-500" },
  { id: "dermatologia", name: "Dermatologia", description: "Cuidados com a pele", icon: Heart, color: "bg-rose-500" },
  { id: "pediatria", name: "Pediatria", description: "Atendimento infantil", icon: Baby, color: "bg-amber-500" },
  { id: "other_specialty", name: "Outra Especialidade / Atendimento Geral", description: "Modelo básico — personalize apenas o nome exibido", icon: Layers, color: "bg-slate-500" },
];

const OTHER_KEY = "other_specialty";

interface SpecialtiesStepProps {
  clinicId: string;
  onNext: () => void;
  onBack: () => void;
  onUpdatePreferences?: (prefs: {
    primary_specialty_slug?: string;
    primary_specialty_id?: string;
    primary_specialty_name?: string;
    primary_specialty_curated_id?: string;
  }) => void;
  initialSpecialtyId?: string | null;
}

function sanitizeDisplayName(raw: string): string {
  return raw
    .replace(/[<>{}\\\/"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

export function SpecialtiesStep({
  clinicId,
  onNext,
  onBack,
  onUpdatePreferences,
  initialSpecialtyId,
}: SpecialtiesStepProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSpecialtyId || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [otherDisplayName, setOtherDisplayName] = useState("");
  const [isAdvancing, setIsAdvancing] = useState(false);
  const { toast } = useToast();

  const filteredSpecialties = CURATED_SPECIALTIES.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectSpecialty = (id: string) => setSelectedId(id);

  const handleContinue = async () => {
    if (isAdvancing) return;
    const currentSelectedId = selectedId;

    if (!currentSelectedId) {
      toast({
        title: "Selecione uma especialidade",
        description: "Escolha uma especialidade principal para continuar.",
        variant: "destructive",
      });
      return;
    }

    const curatedSpecialty = CURATED_SPECIALTIES.find((s) => s.id === currentSelectedId);
    if (!curatedSpecialty) {
      toast({ title: "Seleção inválida", variant: "destructive" });
      return;
    }

    let displayName = curatedSpecialty.name;
    if (curatedSpecialty.id === OTHER_KEY) {
      const cleaned = sanitizeDisplayName(otherDisplayName);
      if (!cleaned) {
        toast({
          title: "Nome obrigatório",
          description: "Informe o nome que aparecerá no sistema (ex: Quiropraxia).",
          variant: "destructive",
        });
        return;
      }
      displayName = cleaned;
    }

    setIsAdvancing(true);
    try {
      await onUpdatePreferences?.({
        primary_specialty_slug: curatedSpecialty.id,
        primary_specialty_curated_id: curatedSpecialty.id,
        primary_specialty_name: displayName,
        primary_specialty_id: undefined,
      });
      onNext();
    } catch (err) {
      console.error("[ONBOARDING_SPECIALTIES] failed to advance", err);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a especialidade. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleSkip = () => {
    toast({
      title: "Etapa pulada",
      description: "Configure especialidades em Configurações → Clínica.",
      duration: 6000,
    });
    onNext();
  };

  const hasSelection = selectedId !== null;
  const isOther = selectedId === OTHER_KEY;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Stethoscope className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Especialidades da Clínica</h2>
          <p className="text-sm text-muted-foreground">
            Selecione a especialidade principal da sua clínica
          </p>
        </div>
      </div>

      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          As especialidades definem os modelos de prontuário, procedimentos e fluxos de atendimento.
        </AlertDescription>
      </Alert>

      {hasSelection && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">1 especialidade selecionada</span>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar especialidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
        {filteredSpecialties.map((specialty) => {
          const isSelected = selectedId === specialty.id;
          const Icon = specialty.icon;
          return (
            <div
              key={specialty.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none ${
                isSelected
                  ? "bg-primary/10 border-primary shadow-md ring-2 ring-primary/30"
                  : "bg-card border-border hover:border-primary/40 hover:bg-muted/50 hover:shadow-sm"
              }`}
              onClick={() => handleSelectSpecialty(specialty.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectSpecialty(specialty.id);
                }
              }}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                }`}
              >
                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              <div className={`w-9 h-9 rounded-lg ${specialty.color} flex items-center justify-center shrink-0 transition-transform ${isSelected ? "scale-110" : ""}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 pr-6" style={{ wordBreak: "normal", overflowWrap: "normal", hyphens: "none" }}>
                <span className={`font-medium text-sm block whitespace-normal break-normal leading-snug ${isSelected ? "text-primary" : ""}`}>
                  {specialty.name}
                </span>
                <p className="text-xs text-muted-foreground mt-1 whitespace-normal break-normal leading-snug">
                  {specialty.description}
                </p>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isOther && (
        <div className="space-y-3 p-4 rounded-xl border-2 border-primary/30 bg-primary/5">
          <div className="space-y-2">
            <Label htmlFor="other-display-name">
              Nome que aparecerá no sistema <span className="text-destructive">*</span>
            </Label>
            <Input
              id="other-display-name"
              maxLength={60}
              placeholder="Ex: Quiropraxia, Acupuntura, Massoterapia..."
              value={otherDisplayName}
              onChange={(e) => setOtherDisplayName(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Esta opção usa um modelo básico de prontuário e atendimento. Você pode personalizar o
              nome exibido, mas a estrutura interna continuará padronizada para manter o sistema
              estável.
            </p>
          </div>
        </div>
      )}

      {!hasSelection && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Selecione uma especialidade para continuar.</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleSkip}>
            Pular etapa
          </Button>
          <Button
            onClick={handleContinue}
            disabled={
              !hasSelection ||
              isAdvancing ||
              (isOther && !sanitizeDisplayName(otherDisplayName))
            }
          >
            {isAdvancing ? "Salvando..." : "Continuar"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
