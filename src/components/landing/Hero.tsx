import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Play, Check, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";

const Hero = () => {
  const trustPoints = [
    "Sem cartão de crédito",
    "Setup em 5 minutos",
    "Suporte humano incluso",
  ];

  return (
    <section className="relative min-h-screen hero-gradient overflow-hidden">
      <div className="absolute inset-0 pattern-grid opacity-50" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />

      <div className="section-container relative z-10 pt-32 lg:pt-40 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20"
            >
              <Sparkles size={14} />
              Plataforma de gestão tudo-em-um
            </motion.div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-foreground leading-[1.05] mb-6">
              Automatize sua empresa com{" "}
              <span className="text-gradient-brand">um sistema completo</span>{" "}
              de gestão
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Centralize agenda, financeiro, estoque, vendas, CRM e WhatsApp em uma única plataforma. 
              Mais controle, menos planilhas, decisões em tempo real.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
              <Button variant="hero" size="xl" asChild>
                <Link to="/criar-conta">
                  Testar Agora Grátis
                  <ArrowRight size={20} />
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild>
                <a href="#cta-final">
                  <Play size={18} />
                  Solicitar Demonstração
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 mb-10">
              {trustPoints.map((point) => (
                <div key={point} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Check size={16} className="text-primary" />
                  {point}
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="pt-8 border-t border-border/50"
            >
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold">
                Empresas que confiam no Yesclin
              </p>
              <div className="flex items-center justify-center lg:justify-start gap-6">
                <div>
                  <p className="font-display font-bold text-2xl text-foreground">500+</p>
                  <p className="text-xs text-muted-foreground">Empresas ativas</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="font-display font-bold text-2xl text-foreground">+R$ 12M</p>
                  <p className="text-xs text-muted-foreground">Processados/mês</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="font-display font-bold text-2xl text-foreground">98%</p>
                  <p className="text-xs text-muted-foreground">Satisfação</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Visual Dashboard Mock */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              <div className="bg-card rounded-3xl shadow-xl border border-border/50 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                  <div className="ml-3 text-xs text-muted-foreground">app.yesclin.com/dashboard</div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Faturamento do mês</p>
                      <p className="font-display font-bold text-2xl text-foreground">R$ 87.420</p>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-success/10 text-success text-xs font-semibold">
                      <TrendingUp size={12} /> +18%
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Agendamentos", value: "142", color: "bg-primary/10 text-primary" },
                      { label: "Vendas", value: "38", color: "bg-accent/10 text-accent" },
                      { label: "Tickets", value: "24", color: "bg-success/10 text-success" },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                        <p className="font-display font-bold text-xl">{s.value}</p>
                        <p className="text-xs opacity-80">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {[
                      { name: "Maria Silva", action: "Pagamento confirmado", value: "R$ 280", status: "success" },
                      { name: "João Santos", action: "Agendamento criado", value: "14:00", status: "primary" },
                      { name: "Ana Costa", action: "WhatsApp enviado", value: "agora", status: "accent" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/40">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          item.status === "success" ? "bg-success/20 text-success" :
                          item.status === "primary" ? "bg-primary/20 text-primary" :
                          "bg-accent/20 text-accent"
                        }`}>
                          {item.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.action}</p>
                        </div>
                        <span className="text-xs font-semibold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-card rounded-2xl shadow-lg border border-border/50 p-4"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">LGPD compliant</p>
                    <p className="text-xs text-muted-foreground">Dados criptografados</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-4 bg-card rounded-2xl shadow-lg border border-border/50 p-4"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">+38% vendas</p>
                    <p className="text-xs text-muted-foreground">vs. mês anterior</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
