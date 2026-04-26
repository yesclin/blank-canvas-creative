import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Cycle = "monthly" | "yearly";

interface PricingPlan {
  slug: string;
  name: string;
  description: string;
  monthly: number;
  yearly: number; // total cobrado uma vez ao ano
  highlight?: boolean;
  features: string[];
}

const PLANS: PricingPlan[] = [
  {
    slug: "essencial",
    name: "Essencial",
    description: "Para consultórios e profissionais autônomos.",
    monthly: 97,
    yearly: 970,
    features: [
      "Até 2 profissionais",
      "Até 500 pacientes",
      "Agenda, prontuário e atendimento",
      "WhatsApp básico",
      "Teleconsulta básica",
      "Estoque simples",
    ],
  },
  {
    slug: "profissional",
    name: "Profissional",
    description: "Para clínicas em crescimento.",
    monthly: 297,
    yearly: 2970,
    highlight: true,
    features: [
      "Até 5 profissionais",
      "Até 1.500 pacientes",
      "Convênios e estoque completo",
      "Relatórios gerenciais",
      "Permissões por usuário",
      "Teleconsulta completa",
    ],
  },
  {
    slug: "clinica",
    name: "Clínica",
    description: "Para clínicas com operação completa.",
    monthly: 597,
    yearly: 5970,
    features: [
      "Profissionais e pacientes ilimitados",
      "CRM Comercial completo",
      "Marketing e automações",
      "Auditoria e relatórios avançados",
      "Múltiplas instâncias WhatsApp",
      "Suporte prioritário",
    ],
  },
];

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatBRLInt = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function Pricing() {
  const [cycle, setCycle] = useState<Cycle>("monthly");

  return (
    <section id="pricing" className="border-t border-border bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            Planos e preços
          </Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Escolha o plano ideal para sua clínica
          </h2>
          <p className="text-muted-foreground">
            <strong className="text-foreground">Teste grátis por 7 dias.</strong> Sem cartão de crédito. Cancele quando quiser.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <Tabs value={cycle} onValueChange={(v) => setCycle(v as Cycle)}>
            <TabsList>
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
              <TabsTrigger value="yearly">
                Anual
                <Badge variant="secondary" className="ml-2">
                  Economize 2 meses
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const monthlyEquiv = plan.yearly / 12;
            const yearlySaved = plan.monthly * 12 - plan.yearly;
            const displayPrice = cycle === "monthly" ? plan.monthly : monthlyEquiv;

            return (
              <div
                key={plan.slug}
                className={cn(
                  "relative flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-all",
                  plan.highlight
                    ? "border-primary ring-2 ring-primary/20 md:-translate-y-2"
                    : "border-border",
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      Mais escolhido
                    </Badge>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mb-2 flex items-baseline gap-1">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="text-4xl font-bold tracking-tight text-foreground">
                    {formatBRL(displayPrice)}
                  </span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>

                <div className="mb-5 min-h-[40px] text-xs">
                  {cycle === "yearly" ? (
                    <div className="space-y-0.5">
                      <p className="text-foreground">
                        <strong>Pagamento único anual de R$ {formatBRLInt(plan.yearly)}</strong>
                      </p>
                      <p className="text-muted-foreground">valor mensal equivalente para comparação</p>
                      <p className="font-medium text-primary">
                        Economize R$ {formatBRLInt(yearlySaved)} por ano
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Cobrado mensalmente.</p>
                  )}
                </div>

                <Button
                  asChild
                  variant={plan.highlight ? "default" : "outline"}
                  className="mb-5 w-full"
                >
                  <a href="/criar-conta">Começar teste grátis de 7 dias</a>
                </Button>

                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
          No plano anual, a cobrança é feita uma vez ao ano com desconto. Os módulos clínicos
          específicos de cada especialidade são liberados conforme as especialidades ativas na clínica.
        </p>
      </div>
    </section>
  );
}
