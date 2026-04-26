import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const FAQCta = () => {
  return (
    <section className="bg-muted/30 pb-20 lg:pb-28">
      <div className="section-container max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-primary/15 bg-card shadow-sm px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left"
        >
          <div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Ainda com dúvidas? Teste sem compromisso.
            </h3>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              7 dias grátis, sem cartão de crédito. Cancele quando quiser.
            </p>
          </div>
          <Button size="lg" asChild className="shrink-0">
            <Link to="/criar-conta">
              Começar teste grátis
              <ArrowRight size={18} />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQCta;
