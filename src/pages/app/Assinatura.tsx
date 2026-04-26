import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useClinicSubscription } from '@/hooks/useClinicSubscription';

interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  feature_whatsapp: boolean;
  feature_teleconsulta: boolean;
  feature_crm: boolean;
  feature_marketing: boolean;
  feature_automations: boolean;
  feature_inventory: boolean;
  feature_insurances: boolean;
  feature_advanced_reports: boolean;
  feature_audit: boolean;
  feature_priority_support: boolean;
  max_professionals: number | null;
  max_patients: number | null;
}

const FEATURE_LABELS: Array<[keyof Plan, string]> = [
  ['feature_whatsapp', 'WhatsApp'],
  ['feature_teleconsulta', 'Teleconsulta'],
  ['feature_inventory', 'Estoque'],
  ['feature_insurances', 'Convênios'],
  ['feature_advanced_reports', 'Relatórios avançados'],
  ['feature_crm', 'CRM Comercial'],
  ['feature_marketing', 'Marketing'],
  ['feature_automations', 'Automações'],
  ['feature_audit', 'Auditoria'],
  ['feature_priority_support', 'Suporte prioritário'],
];

const SALES_WHATSAPP = '5599999999999';

export default function Assinatura() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const sub = useClinicSubscription();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      setPlans(data ?? []);
      setLoading(false);
    })();
  }, []);

  const requestPlan = async (plan: Plan) => {
    setRequesting(plan.id);
    const { error } = await supabase.rpc('request_subscription', { _cycle: cycle });
    setRequesting(null);

    if (error) {
      toast.error('Não foi possível registrar a solicitação. Tente novamente.');
      return;
    }

    const value = cycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
    const text = encodeURIComponent(
      `Olá! Quero assinar o plano *${plan.name}* (${cycle === 'monthly' ? 'Mensal' : 'Anual'}) — R$ ${Number(value).toFixed(2)}.`,
    );
    window.open(`https://wa.me/${SALES_WHATSAPP}?text=${text}`, '_blank');
    toast.success('Solicitação registrada. Nossa equipe entrará em contato.');
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planos e assinatura</h1>
        <p className="text-sm text-muted-foreground">
          Escolha o plano que melhor se adapta à sua clínica.{' '}
          {sub.status === 'trial' && sub.days_remaining !== null && (
            <span className="text-foreground">
              Restam <strong>{sub.days_remaining}</strong> dias de teste.
            </span>
          )}
          {sub.status === 'overdue' && (
            <span className="text-destructive">Seu período de teste expirou.</span>
          )}
        </p>
      </div>

      <Tabs value={cycle} onValueChange={(v) => setCycle(v as 'monthly' | 'yearly')}>
        <TabsList>
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="yearly">
            Anual <Badge variant="secondary" className="ml-2">Economize 2 meses</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const monthlyPrice = Number(plan.price_monthly);
          const yearlyPrice = Number(plan.price_yearly);
          const monthlyEquiv = yearlyPrice / 12;
          const yearlySaved = monthlyPrice * 12 - yearlyPrice;
          const displayPrice = cycle === 'monthly' ? monthlyPrice : monthlyEquiv;
          const isCurrent = sub.plan_slug === plan.slug;
          return (
            <Card key={plan.id} className={isCurrent ? 'border-primary ring-1 ring-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {isCurrent && <Badge>Plano atual</Badge>}
                </div>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">
                    R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      /mês
                    </span>
                  </div>
                  <div className="mt-1 min-h-[34px] text-xs">
                    {cycle === 'yearly' ? (
                      <div className="space-y-0.5">
                        <p className="text-foreground">
                          <strong>
                            Pagamento único anual de R${' '}
                            {yearlyPrice.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                          </strong>
                        </p>
                        <p className="text-muted-foreground">
                          valor mensal equivalente para comparação
                        </p>
                        <p className="font-medium text-primary">
                          Economize R$ {yearlySaved.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} por ano
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Cobrado mensalmente.</p>
                    )}
                  </div>
                </div>

                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {plan.max_professionals ? `Até ${plan.max_professionals} profissionais` : 'Profissionais ilimitados'}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {plan.max_patients ? `Até ${plan.max_patients} pacientes` : 'Pacientes ilimitados'}
                  </li>
                  {FEATURE_LABELS.filter(([k]) => plan[k]).map(([k, label]) => (
                    <li key={String(k)} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {label}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  onClick={() => requestPlan(plan)}
                  disabled={requesting === plan.id}
                >
                  {requesting === plan.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="mr-2 h-4 w-4" />
                  )}
                  {isCurrent ? 'Renovar' : 'Falar com vendas'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        A ativação é feita manualmente após confirmação do pagamento. Em caso de dúvidas, fale com
        nosso time comercial.
      </p>
    </div>
  );
}
