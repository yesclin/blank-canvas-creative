import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, ArrowRight, ArrowLeft, Info, Settings, UserPlus } from "lucide-react";

interface ProfessionalsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ProfessionalsStep({ onNext, onBack }: ProfessionalsStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Profissionais</h2>
          <p className="text-sm text-muted-foreground">
            Cadastre os profissionais que atendem na clínica
          </p>
        </div>
      </div>

      {/* Informative alert - always visible */}
      <Alert className="border-primary/30 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-foreground text-sm">
          O cadastro de profissionais <strong>não é obrigatório</strong> neste momento.
          <br />
          Você poderá adicionar profissionais e usuários posteriormente em{" "}
          <strong>Configurações → Usuários & Permissões</strong>.
        </AlertDescription>
      </Alert>

      {/* Informational content */}
      <div className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-foreground">Cadastro de Profissionais</h3>
              <p className="text-sm text-muted-foreground">
                Profissionais de saúde podem ser cadastrados a qualquer momento após a 
                configuração inicial da clínica. Cada profissional terá sua própria agenda 
                e poderá realizar atendimentos.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center flex-shrink-0">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-foreground">Onde cadastrar?</h3>
              <p className="text-sm text-muted-foreground">
                Acesse <strong>Configurações → Usuários & Permissões</strong> para adicionar 
                novos profissionais, definir especialidades, horários de atendimento e 
                permissões de acesso ao sistema.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Você pode pular esta etapa e continuar configurando sua clínica. 
          Os profissionais podem ser adicionados depois.
        </p>
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
          <Button onClick={onNext}>
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
