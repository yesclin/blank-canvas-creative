import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight, ArrowLeft, Plus, Trash2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InsuranceStepProps {
  clinicId: string;
  onNext: () => void;
  onBack: () => void;
  onUpdatePreferences: (prefs: { accepts_insurance: boolean }) => void;
}

interface Insurance {
  name: string;
  code?: string;
}

export function InsuranceStep({ clinicId, onNext, onBack, onUpdatePreferences }: InsuranceStepProps) {
  const [acceptsInsurance, setAcceptsInsurance] = useState<boolean | null>(null);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const addInsurance = () => {
    setInsurances([...insurances, { name: "", code: "" }]);
  };

  const updateInsurance = (index: number, field: keyof Insurance, value: string) => {
    const updated = [...insurances];
    updated[index] = { ...updated[index], [field]: value };
    setInsurances(updated);
  };

  const removeInsurance = (index: number) => {
    setInsurances(insurances.filter((_, i) => i !== index));
  };

  const handleChoice = async (accepts: boolean) => {
    setAcceptsInsurance(accepts);
    onUpdatePreferences({ accepts_insurance: accepts });

    if (!accepts) {
      onNext();
    }
  };

  const handleSave = async () => {
    const validInsurances = insurances.filter(ins => ins.name.trim());

    if (validInsurances.length === 0) {
      onNext();
      return;
    }

    setIsSaving(true);

    for (const ins of validInsurances) {
      const { error } = await supabase.from("insurances").insert({
        clinic_id: clinicId,
        name: ins.name,
        code: ins.code || null,
      });

      if (error) {
        toast({
          title: "Erro ao cadastrar",
          description: `Não foi possível cadastrar ${ins.name}.`,
          variant: "destructive",
        });
      }
    }

    setIsSaving(false);

    toast({
      title: "Convênios cadastrados!",
      description: `${validInsurances.length} convênio(s) adicionado(s).`,
    });

    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Convênios</h2>
          <p className="text-sm text-muted-foreground">
            Sua clínica atende por convênios?
          </p>
        </div>
      </div>

      {acceptsInsurance === null ? (
        <div className="grid grid-cols-2 gap-4 py-8">
        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2"
          onClick={() => handleChoice(true)}
        >
          <Check className="h-6 w-6 text-emerald-600" />
          <span>Sim, atendo convênios</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => handleChoice(false)}
          >
            <X className="h-6 w-6 text-muted-foreground" />
            <span>Apenas particular</span>
          </Button>
        </div>
      ) : acceptsInsurance ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cadastre os convênios que você atende. Você pode adicionar mais depois.
          </p>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {insurances.map((ins, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 items-end p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex-1 grid gap-2">
                  <Label>Nome do Convênio</Label>
                  <Input
                    value={ins.name}
                    onChange={(e) => updateInsurance(index, "name", e.target.value)}
                    placeholder="Ex: Unimed, Bradesco Saúde"
                  />
                </div>
                <div className="w-32 grid gap-2">
                  <Label>Código</Label>
                  <Input
                    value={ins.code}
                    onChange={(e) => updateInsurance(index, "code", e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeInsurance(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}

            <Button variant="outline" onClick={addInsurance} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Convênio
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        {acceptsInsurance !== null && (
          <div className="flex gap-2">
            {acceptsInsurance && (
              <Button variant="ghost" onClick={onNext}>
                Pular etapa
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Continuar"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
