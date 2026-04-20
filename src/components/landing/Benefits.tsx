import { motion } from "framer-motion";
import { Clock, ShieldAlert, Gauge, TrendingUp, Sprout } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Economize tempo",
    description: "Automatize tarefas repetitivas e libere sua equipe para o que realmente importa: atender bem.",
    metric: "Até 12h/semana",
  },
  {
    icon: ShieldAlert,
    title: "Reduza erros manuais",
    description: "Fim das planilhas perdidas e digitações duplicadas. Tudo conectado em um banco de dados único.",
    metric: "-87% retrabalho",
  },
  {
    icon: Gauge,
    title: "Tenha controle total",
    description: "Saiba o que está acontecendo no seu negócio em tempo real, de qualquer lugar e dispositivo.",
    metric: "100% visibilidade",
  },
  {
    icon: TrendingUp,
    title: "Aumente vendas",
    description: "CRM, automação de WhatsApp e cobranças recorrentes trabalhando 24/7 para você faturar mais.",
    metric: "+38% conversão",
  },
  {
    icon: Sprout,
    title: "Cresça com organização",
    description: "Estrutura pronta para escalar. Multi-unidades, multi-usuários e processos padronizados.",
    metric: "Pronto para escalar",
  },
];

const Benefits = () => {
  return (
    <section className="py-20 lg:py-32 bg-muted/30 relative overflow-hidden">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Benefícios
          </span>
          <h2 className="font-display text-3xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
            Resultados reais para o seu negócio
          </h2>
          <p className="text-lg text-muted-foreground">
            Mais que um sistema, uma transformação no jeito de operar.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`relative bg-card rounded-2xl p-7 border border-border/60 hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-lg ${
                i === 3 ? "lg:col-start-1" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-brand">
                  <benefit.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  {benefit.metric}
                </span>
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
