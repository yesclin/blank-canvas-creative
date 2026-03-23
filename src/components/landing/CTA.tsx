import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";

const CTA = () => {
  const benefits = [
    "Sem cartão de crédito",
    "Suporte incluso",
    "Dados seguros",
  ];

  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-brand-700" />
      <div className="absolute inset-0 pattern-grid opacity-10" />
      
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="font-display text-3xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Comece a transformar sua clínica hoje
          </h2>
          <p className="text-lg lg:text-xl text-primary-foreground/80 mb-8">
            Junte-se a centenas de profissionais que já simplificaram a gestão 
            de suas clínicas com o Yesclin.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="inline-flex items-center gap-2 text-primary-foreground/90"
              >
                <CheckCircle size={18} className="text-primary-foreground" />
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="xl"
              className="bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-all"
              asChild
            >
              <Link to="/criar-conta">
                Criar Conta Grátis
                <ArrowRight size={20} />
              </Link>
            </Button>
            <Button
              size="xl"
              variant="ghost"
              className="text-primary-foreground border-2 border-primary-foreground/30 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <Link to="#features">Conhecer Recursos</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
