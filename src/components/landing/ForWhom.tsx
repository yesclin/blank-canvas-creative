import { motion } from "framer-motion";
import { Stethoscope, Briefcase, Store, Repeat, CalendarClock, Rocket } from "lucide-react";

const segments = [
  { icon: Stethoscope, title: "Clínicas e consultórios", description: "Multi-especialidades, prontuário, agenda e teleconsulta." },
  { icon: Briefcase, title: "Empresas de serviços", description: "Orçamentos, contratos, ordens de serviço e financeiro." },
  { icon: Store, title: "Comércio", description: "PDV, estoque, NFCe e gestão de fornecedores." },
  { icon: Repeat, title: "Negócios por assinatura", description: "Recorrência, gestão de mensalistas e cobrança automática." },
  { icon: CalendarClock, title: "Atendimento agendado", description: "Salões, estética, academias, consultorias e profissionais autônomos." },
  { icon: Rocket, title: "Negócios em crescimento", description: "Multi-unidade, equipes e relatórios consolidados." },
];

const ForWhom = () => {
  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Para quem é
          </span>
          <h2 className="font-display text-3xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
            Feito para o seu segmento
          </h2>
          <p className="text-lg text-muted-foreground">
            Flexível para se adaptar ao seu modelo de negócio, do autônomo à rede com várias unidades.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {segments.map((seg, i) => (
            <motion.div
              key={seg.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 hover:border-primary/40 hover:shadow-lg transition-all"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-secondary text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <seg.icon size={22} />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground mb-2">{seg.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{seg.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ForWhom;
