import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, FileText, Users, Check } from "lucide-react";

const Hero = () => {
  const features = [
    "Agenda inteligente",
    "Prontuário digital",
    "Gestão financeira",
    "Multi-especialidades",
  ];

  return (
    <section className="relative min-h-screen hero-gradient overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pattern-grid opacity-50" />
      
      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

      <div className="section-container relative z-10 pt-32 lg:pt-40 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Sistema completo para clínicas de saúde
            </motion.div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
              Gerencie sua clínica com{" "}
              <span className="text-gradient-brand">simplicidade</span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Agenda, prontuário, financeiro e muito mais em uma única plataforma. 
              Feito para clínicas médicas, odontológicas, psicologia, estética e todas as especialidades.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-8">
              {features.map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm"
                >
                  <Check size={14} className="text-primary" />
                  {feature}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="xl" asChild>
                <Link to="/criar-conta">
                  Começar Grátis
                  <ArrowRight size={20} />
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild>
                <Link to="#features">Ver Recursos</Link>
              </Button>
            </div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-10 pt-8 border-t border-border/50"
            >
              <p className="text-sm text-muted-foreground mb-3">
                Confiado por profissionais de saúde
              </p>
              <div className="flex items-center justify-center lg:justify-start gap-6">
                <div className="text-center">
                  <p className="font-display font-bold text-2xl text-foreground">500+</p>
                  <p className="text-xs text-muted-foreground">Clínicas</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="font-display font-bold text-2xl text-foreground">10k+</p>
                  <p className="text-xs text-muted-foreground">Pacientes</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="font-display font-bold text-2xl text-foreground">98%</p>
                  <p className="text-xs text-muted-foreground">Satisfação</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            {/* Dashboard Preview Card */}
            <div className="relative">
              {/* Main Card */}
              <div className="bg-card rounded-3xl shadow-xl border border-border/50 overflow-hidden">
                {/* Window Controls */}
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                
                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-primary/5 rounded-xl p-4 text-center">
                      <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="font-display font-bold text-lg text-foreground">24</p>
                      <p className="text-xs text-muted-foreground">Hoje</p>
                    </div>
                    <div className="bg-accent/10 rounded-xl p-4 text-center">
                      <Users className="w-6 h-6 text-accent mx-auto mb-2" />
                      <p className="font-display font-bold text-lg text-foreground">156</p>
                      <p className="text-xs text-muted-foreground">Pacientes</p>
                    </div>
                    <div className="bg-success/10 rounded-xl p-4 text-center">
                      <FileText className="w-6 h-6 text-success mx-auto mb-2" />
                      <p className="font-display font-bold text-lg text-foreground">89</p>
                      <p className="text-xs text-muted-foreground">Prontuários</p>
                    </div>
                  </div>

                  {/* Appointments Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">Próximos atendimentos</span>
                      <span className="text-primary text-xs">Ver todos</span>
                    </div>
                    
                    {[
                      { time: "09:00", name: "Maria Silva", type: "Consulta", status: "confirmed" },
                      { time: "10:30", name: "João Santos", type: "Retorno", status: "waiting" },
                      { time: "14:00", name: "Ana Costa", type: "Avaliação", status: "confirmed" },
                    ].map((apt, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                        <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                          {apt.time}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{apt.name}</p>
                          <p className="text-xs text-muted-foreground">{apt.type}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${apt.status === 'confirmed' ? 'bg-success' : 'bg-warning'}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-card rounded-2xl shadow-lg border border-border/50 p-4"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Consulta confirmada</p>
                    <p className="text-xs text-muted-foreground">há 2 min</p>
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
