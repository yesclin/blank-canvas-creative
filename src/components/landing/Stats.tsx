import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, Cpu, HeartHandshake } from "lucide-react";

const items = [
  {
    icon: Sparkles,
    title: "Tudo em um só lugar",
    desc: "Agenda, prontuário, financeiro, estoque, comercial e WhatsApp integrados.",
  },
  {
    icon: Cpu,
    title: "9 especialidades nativas",
    desc: "Modelos de prontuário, anamneses e fluxos clínicos prontos para usar.",
  },
  {
    icon: ShieldCheck,
    title: "Seguro e em conformidade",
    desc: "Isolamento por clínica, RBAC, auditoria e assinatura digital avançada.",
  },
  {
    icon: HeartHandshake,
    title: "Suporte humanizado",
    desc: "Onboarding guiado, base de conhecimento e atendimento por quem entende do dia a dia clínico.",
  },
];

const Stats = () => {
  return (
    <section className="py-20 bg-foreground text-background relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-primary/15 blur-3xl" />
      <div className="section-container relative text-center">
        <p className="text-sm uppercase tracking-widest text-background/60 mb-2">Por que YesClin</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
          Pensado para a <span className="text-gradient-brand">rotina real</span> da sua clínica
        </h2>
        <p className="max-w-2xl mx-auto text-background/70 text-lg mb-12">
          Um sistema completo, multidisciplinar e seguro — feito para profissionais que querem
          atender mais e se preocupar menos com a operação.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-background/10 bg-background/5 backdrop-blur p-6 text-left hover:bg-background/10 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-4">
                <Icon size={22} />
              </div>
              <h3 className="font-display font-bold text-lg text-background mb-1.5">{title}</h3>
              <p className="text-sm text-background/70 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
