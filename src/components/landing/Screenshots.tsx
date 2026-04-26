import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, FileText, Wallet, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import screenAgenda from "@/assets/screen-agenda.jpg";
import screenProntuario from "@/assets/screen-prontuario.jpg";
import screenFinanceiro from "@/assets/screen-financeiro.jpg";
import screenTeleconsulta from "@/assets/screen-teleconsulta.jpg";

const tabs = [
  {
    key: "agenda",
    label: "Agenda",
    icon: Calendar,
    title: "Agenda inteligente e visual",
    description:
      "Visualize sua semana, gerencie encaixes, sala de espera e confirmações em um único lugar.",
    image: screenAgenda,
  },
  {
    key: "prontuario",
    label: "Prontuário",
    icon: FileText,
    title: "Prontuário digital completo",
    description:
      "Timeline do paciente, modelos por especialidade, anexos e assinatura eletrônica avançada.",
    image: screenProntuario,
  },
  {
    key: "financeiro",
    label: "Financeiro",
    icon: Wallet,
    title: "Controle financeiro real",
    description:
      "Caixa diário, recebimentos por agendamento, contas a receber e relatórios prontos.",
    image: screenFinanceiro,
  },
  {
    key: "teleconsulta",
    label: "Teleconsulta",
    icon: Video,
    title: "Teleconsulta integrada",
    description:
      "Atenda à distância com link seguro, prescrição eletrônica e prontuário ao lado.",
    image: screenTeleconsulta,
  },
];

const Screenshots = () => {
  const [active, setActive] = useState(tabs[0].key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <section id="sistema" className="py-20 lg:py-28 bg-muted/30">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Demonstração
          </span>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mt-3 mb-4">
            Veja o sistema funcionando
          </h2>
          <p className="text-lg text-muted-foreground">
            Telas reais do YesClin que sua clínica usa todos os dias.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border",
                active === t.key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-foreground border-border hover:border-primary/40",
              )}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Preview */}
        <motion.div
          key={current.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid lg:grid-cols-5 gap-8 items-center"
        >
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden border border-border/60 shadow-xl bg-card">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/60 border-b border-border/50">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
              </div>
              <img
                src={current.image}
                alt={current.title}
                width={1280}
                height={800}
                loading="lazy"
                className="w-full h-auto"
              />
            </div>
          </div>
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
              <current.icon size={22} />
            </div>
            <h3 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {current.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">{current.description}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Screenshots;
