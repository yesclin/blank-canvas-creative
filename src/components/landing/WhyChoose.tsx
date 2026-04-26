import { motion } from "framer-motion";
import { Clock, ShieldCheck, Sparkles, HeartHandshake, Layers, TrendingUp } from "lucide-react";

const reasons = [
  {
    icon: Clock,
    title: "Economize horas por semana",
    description: "Agenda, prontuário e financeiro conectados — sem retrabalho e sem planilha.",
  },
  {
    icon: Layers,
    title: "Tudo em um só lugar",
    description: "Pacientes, atendimentos, recebimentos e WhatsApp em uma única plataforma.",
  },
  {
    icon: ShieldCheck,
    title: "Seguro e em conformidade",
    description: "Dados isolados por clínica, auditoria de ações e adequação à LGPD.",
  },
  {
    icon: Sparkles,
    title: "Feito para sua especialidade",
    description: "Modelos clínicos prontos para medicina, odonto, estética, psicologia e mais.",
  },
  {
    icon: HeartHandshake,
    title: "Suporte humano de verdade",
    description: "Time que conhece a rotina de clínicas e responde rápido quando você precisa.",
  },
  {
    icon: TrendingUp,
    title: "Cresce com você",
    description: "Comece sozinho e expanda para múltiplos profissionais e unidades sem trocar de sistema.",
  },
];

const WhyChoose = () => {
  return (
    <section id="por-que" className="py-20 lg:py-28 bg-background">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Por que escolher
          </span>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mt-3 mb-4">
            Por que escolher o YesClin
          </h2>
          <p className="text-lg text-muted-foreground">
            Benefícios diretos para quem precisa organizar a clínica e voltar a focar no paciente.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-card border border-border/60 rounded-2xl p-6 hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <r.icon size={22} />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                {r.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {r.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
