import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Wallet, ArrowRight, ArrowLeft } from "lucide-react";

interface FinanceStepProps {
  onNext: () => void;
  onBack: () => void;
  onUpdatePreferences: (prefs: { payment_methods: string[]; allows_return: boolean }) => void;
}

const paymentMethods = [
  { id: "dinheiro", label: "Dinheiro" },
  { id: "pix", label: "PIX" },
  { id: "credito", label: "Cartão de Crédito" },
  { id: "debito", label: "Cartão de Débito" },
  { id: "transferencia", label: "Transferência Bancária" },
  { id: "boleto", label: "Boleto" },
];

export function FinanceStep({ onNext, onBack, onUpdatePreferences }: FinanceStepProps) {
  const [selectedMethods, setSelectedMethods] = useState<string[]>(["dinheiro", "pix", "credito", "debito"]);
  const [allowsReturn, setAllowsReturn] = useState(true);

  const toggleMethod = (methodId: string) => {
    setSelectedMethods((prev) =>
      prev.includes(methodId)
        ? prev.filter((m) => m !== methodId)
        : [...prev, methodId]
    );
  };

  const handleContinue = () => {
    onUpdatePreferences({
      payment_methods: selectedMethods,
      allows_return: allowsReturn,
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
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Financeiro</h2>
          <p className="text-sm text-muted-foreground">
            Configure as opções de pagamento
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label className="text-base">Formas de pagamento aceitas</Label>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={method.id}
                  checked={selectedMethods.includes(method.id)}
                  onCheckedChange={() => toggleMethod(method.id)}
                />
                <Label
                  htmlFor={method.id}
                  className="flex-1 cursor-pointer font-normal"
                >
                  {method.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Política de retorno</Label>
              <p className="text-sm text-muted-foreground">
                Permitir retornos gratuitos dentro do prazo?
              </p>
            </div>
            <Switch
              checked={allowsReturn}
              onCheckedChange={setAllowsReturn}
            />
          </div>
          {allowsReturn && (
            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              O prazo de retorno é configurado individualmente por procedimento
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onNext}>
            Pular etapa
          </Button>
          <Button onClick={handleContinue}>
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
