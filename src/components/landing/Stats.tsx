import { motion } from "framer-motion";

const stats = [
  { value: "5mi+", label: "Agendamentos" },
  { value: "3.5mi+", label: "Pacientes atendidos" },
  { value: "85k+", label: "Documentos assinados" },
  { value: "R$ 62mi+", label: "Valor transacionado" },
];

const Stats = () => {
  return (
    <section className="py-20 bg-foreground text-background">
      <div className="section-container text-center">
        <p className="text-sm uppercase tracking-widest text-background/60 mb-2">Nossos números</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-12">
          Impacto que <span className="text-gradient-brand">transforma vidas</span>
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-background/10 bg-background/5 backdrop-blur p-6"
            >
              <p className="font-display text-4xl lg:text-5xl font-extrabold text-background">{s.value}</p>
              <p className="text-sm text-background/70 mt-2">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
