import { Fragment, useState } from "react";
import { Check, Crown, Minus, Sparkles, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ALL_PLANS_INCLUDE,
  PLAN_COMPARISON,
  PUBLIC_PLANS,
  type ComparisonValue,
  type PublicPlanSlug,
} from "@/constants/publicPlans";
import { OFFICIAL_SPECIALTIES, OTHER_SPECIALTY_SLUG } from "@/constants/officialSpecialties";

type Cycle = "monthly" | "yearly";

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatBRLInt = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const SPECIALTY_LABELS = OFFICIAL_SPECIALTIES.filter((s) => s.slug !== OTHER_SPECIALTY_SLUG).map(
  (s) => s.name,
);

function ComparisonCell({ value }: { value: ComparisonValue }) {
  if (value === true) {
    return (
      <>
        <Check className="mx-auto h-4 w-4 text-primary" aria-hidden />
        <span className="sr-only">Incluído</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-hidden />
        <span className="sr-only">Não incluído</span>
      </>
    );
  }
  return <span className="text-foreground">{value}</span>;
}

export default function Pricing() {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [showCompare, setShowCompare] = useState(false);

  return (
    <section id="pricing" className="border-t border-border bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            Planos e preços
          </Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Planos para cada fase da sua clínica
          </h2>
          <p className="text-muted-foreground">
            Do atendimento à gestão completa, o Yesclin acompanha o crescimento da sua operação.
          </p>
          <p className="mt-3 text-muted-foreground">
            <strong className="text-foreground">Teste grátis por 7 dias.</strong> Sem cartão de
            crédito. Cancele quando quiser.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <Tabs value={cycle} onValueChange={(v) => setCycle(v as Cycle)}>
            <TabsList>
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
              <TabsTrigger value="yearly">
                Anual
                <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
                  Economize 2 meses
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-12 grid items-start gap-6 md:grid-cols-3">
          {PUBLIC_PLANS.map((plan) => {
            const monthlyEquiv = plan.yearly / 12;
            const yearlySaved = plan.monthly * 12 - plan.yearly;
            const displayPrice = cycle === "monthly" ? plan.monthly : monthlyEquiv;
            const isPopular = plan.badge === "popular";
            const isComplete = plan.badge === "complete";

            return (
              <div
                key={plan.slug}
                className={cn(
                  "relative flex h-full flex-col rounded-xl border bg-card p-6 shadow-sm transition-all",
                  isPopular && "border-primary shadow-lg ring-2 ring-primary/20 md:-translate-y-3",
                  isComplete && "border-primary/40",
                  !plan.badge && "border-border",
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <Badge
                      variant={isPopular ? "default" : "secondary"}
                      className={cn("gap-1", isComplete && "border border-primary/30")}
                    >
                      {isPopular ? (
                        <Sparkles className="h-3 w-3" />
                      ) : (
                        <Crown className="h-3 w-3" />
                      )}
                      {isPopular ? "Mais escolhido" : "Mais completo"}
                    </Badge>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-primary">
                    {plan.tagline}
                  </span>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {plan.positioning}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="text-4xl font-bold tracking-tight text-foreground">
                    {formatBRL(displayPrice)}
                  </span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>

                <div className="mb-6 mt-2 min-h-[56px] text-xs">
                  {cycle === "yearly" ? (
                    <div className="space-y-0.5">
                      <p className="text-foreground">
                        <strong>Pagamento único anual de R$ {formatBRLInt(plan.yearly)}</strong>
                      </p>
                      <p className="text-muted-foreground">
                        valor mensal equivalente para comparação
                      </p>
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
                  variant={isPopular ? "default" : "outline"}
                  size="lg"
                  className="mb-6 w-full"
                >
                  <a href="/criar-conta">Começar teste grátis de 7 dias</a>
                </Button>

                {plan.inheritsFrom && (
                  <p className="mb-3 text-sm font-semibold text-foreground">
                    Tudo do {plan.inheritsFrom}, mais:
                  </p>
                )}

                <ul className="space-y-2.5 text-sm">
                  {plan.highlights.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Especialidades */}
        <div className="mt-14 rounded-xl border border-border bg-muted/30 p-6 md:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Stethoscope className="h-5 w-5 text-primary" aria-hidden />
            </span>
            <h3 className="text-lg font-bold text-foreground md:text-xl">
              Feito para diferentes especialidades
            </h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Os prontuários e modelos clínicos são adaptados por especialidade em todos os planos —
              você escolhe quais ativar conforme o limite do seu plano.
            </p>
            <ul className="mt-5 flex flex-wrap justify-center gap-2">
              {SPECIALTY_LABELS.map((name) => (
                <li key={name}>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {name}
                  </Badge>
                </li>
              ))}
              <li>
                <Badge variant="outline" className="text-xs font-medium">
                  e outras especialidades
                </Badge>
              </li>
            </ul>
          </div>
        </div>

        {/* Todos os planos incluem */}
        <div className="mt-10 rounded-xl border border-border bg-card p-6 md:p-8">
          <h3 className="text-lg font-bold text-foreground md:text-xl">Todos os planos incluem</h3>
          <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {ALL_PLANS_INCLUDE.map((item) => (
              <li key={item} className="flex items-start gap-2 text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Comparativo */}
        <div className="mt-10">
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setShowCompare((v) => !v)}>
              {showCompare ? "Ocultar comparativo" : "Compare os planos"}
            </Button>
          </div>

          {showCompare && (
            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <caption className="sr-only">
                    Comparativo de recursos entre os planos Essencial, Profissional e Clínica
                  </caption>
                  <thead className="bg-muted/50">
                    <tr>
                      <th
                        scope="col"
                        className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left font-semibold text-foreground"
                      >
                        Recurso
                      </th>
                      {PUBLIC_PLANS.map((plan) => (
                        <th
                          key={plan.slug}
                          scope="col"
                          className={cn(
                            "px-4 py-3 text-center font-semibold text-foreground",
                            plan.badge === "popular" && "bg-primary/5 text-primary",
                          )}
                        >
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PLAN_COMPARISON.map((group) => (
                      <Fragment key={group.group}>
                        <tr className="bg-muted/30">
                          <th
                            scope="colgroup"
                            colSpan={4}
                            className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground"
                          >
                            {group.group}
                          </th>
                        </tr>
                        {group.rows.map((row) => (
                          <tr key={`${group.group}-${row.label}`} className="border-t border-border">
                            <th
                              scope="row"
                              className="sticky left-0 z-10 bg-card px-4 py-3 text-left font-normal text-foreground"
                            >
                              {row.label}
                            </th>
                            {PUBLIC_PLANS.map((plan) => (
                              <td
                                key={plan.slug}
                                className={cn(
                                  "px-4 py-3 text-center",
                                  plan.badge === "popular" && "bg-primary/5",
                                )}
                              >
                                <ComparisonCell
                                  value={row.values[plan.slug as PublicPlanSlug]}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
          No plano anual, a cobrança é feita uma vez ao ano com desconto. Os limites de
          profissionais, pacientes, especialidades e agendamentos seguem exatamente as regras
          aplicadas dentro do sistema. Módulos clínicos específicos são liberados conforme as
          especialidades ativas na clínica.
        </p>
      </div>
    </section>
  );
}
