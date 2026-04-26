import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import avatar1 from "@/assets/avatar-1.jpg";
import avatar2 from "@/assets/avatar-2.jpg";
import avatar3 from "@/assets/avatar-3.jpg";

const testimonials = [
  {
    name: "Dra. Camila Andrade",
    role: "Dentista • Clínica Sorriso",
    avatar: avatar1,
    quote:
      "Antes eu perdia horas com agenda e cobrança. Com o YesClin organizei tudo em uma semana e voltei a ter tempo para meus pacientes.",
  },
  {
    name: "Dr. Rafael Mendes",
    role: "Médico Clínico Geral",
    avatar: avatar2,
    quote:
      "O prontuário digital é simples e completo. Consigo atender, registrar e emitir receitas em poucos cliques, mesmo nas teleconsultas.",
  },
  {
    name: "Dra. Júlia Ferreira",
    role: "Psicóloga • Espaço Acolher",
    avatar: avatar3,
    quote:
      "Finalmente um sistema feito para quem trabalha sozinho ou em equipe. O suporte responde rápido e o financeiro me deu controle real do caixa.",
  },
];

const Testimonials = () => {
  return (
    <section id="depoimentos" className="py-20 lg:py-28 bg-background">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Depoimentos
          </span>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mt-3 mb-4">
            Profissionais que simplificaram a rotina
          </h2>
          <p className="text-lg text-muted-foreground">
            Veja o que dizem quem já trocou planilhas e agendas de papel pelo YesClin.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative bg-card border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/15" />
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-foreground/90 leading-relaxed mb-6">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-primary/20">
                  <AvatarImage src={t.avatar} alt={t.name} loading="lazy" />
                  <AvatarFallback>{t.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback>
                </Avatar>
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
