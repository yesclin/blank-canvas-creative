import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, CheckCircle } from "lucide-react";

const CTA = () => {
  const benefits = ["Sem cartão de crédito", "Setup em 5 minutos", "Cancele quando quiser"];

  return (
    <section id="cta-final" className="py-20 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-brand-600 to-accent" />
      <div className="absolute inset-0 pattern-grid opacity-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="font-display text-3xl lg:text-6xl font-extrabold text-primary-foreground mb-6 leading-tight">
            Pare de perder tempo com processos manuais
          </h2>
          <p className="text-lg lg:text-xl text-primary-foreground/90 mb-8 leading-relaxed">
            Comece hoje, veja resultado na primeira semana. Migração assistida, suporte humano
            e tudo pronto para sua equipe começar a usar.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {benefits.map((b) => (
              <div key={b} className="inline-flex items-center gap-2 text-primary-foreground/95">
                <CheckCircle size={18} />
                <span className="text-sm font-medium">{b}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="xl"
              className="bg-white text-primary hover:bg-white/95 shadow-xl hover:shadow-2xl transition-all font-semibold"
              asChild
            >
              <Link to="/criar-conta">
                Começar Agora Grátis
                <ArrowRight size={20} />
              </Link>
            </Button>
            <Button
              size="xl"
              className="bg-success/95 text-success-foreground hover:bg-success shadow-xl hover:shadow-2xl transition-all font-semibold"
              asChild
            >
              <a
                href="https://wa.me/5500000000000?text=Quero%20conhecer%20o%20Yesclin"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={20} />
                Falar no WhatsApp
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
