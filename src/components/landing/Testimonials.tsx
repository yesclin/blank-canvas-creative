import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dra. Camila Rocha",
    role: "Clínica de Estética · São Paulo",
    initials: "CR",
    quote:
      "Saímos de 4 sistemas diferentes para apenas o Yesclin. A equipe ganhou produtividade e o financeiro finalmente bate todo dia. Indispensável.",
    rating: 5,
  },
  {
    name: "Rafael Mendes",
    role: "Rede de Consultórios · BH",
    initials: "RM",
    quote:
      "A integração com WhatsApp reduziu nosso no-show em 60%. As confirmações automáticas mudaram nossa operação. Vale cada centavo.",
    rating: 5,
  },
  {
    name: "Juliana Alves",
    role: "Studio de Pilates · Curitiba",
    initials: "JA",
    quote:
      "Implementamos em 2 dias e já sentimos diferença. Cobranças recorrentes funcionando sozinhas e relatórios claros. Recomendo de olhos fechados.",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 lg:py-32 bg-muted/30">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Depoimentos
          </span>
          <h2 className="font-display text-3xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
            Quem usa, recomenda
          </h2>
          <p className="text-lg text-muted-foreground">
            Mais de 500 empresas já transformaram a gestão com o Yesclin.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-card rounded-2xl p-7 border border-border/60 relative hover:shadow-lg transition-shadow"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/20" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
