import { motion } from "framer-motion";
import {
  Stethoscope,
  Smile,
  Brain,
  Sparkles,
  Activity,
  Apple,
  Baby,
  Dumbbell,
  HeartPulse,
  Sun,
  Rocket,
} from "lucide-react";

type Specialty = {
  icon: typeof Stethoscope;
  name: string;
  description: string;
  tone: "primary" | "accent" | "success" | "warning" | "destructive" | "info";
};

const tones: Record<Specialty["tone"], { bg: string; text: string; ring: string }> = {
  primary:     { bg: "bg-primary/10",     text: "text-primary",     ring: "group-hover:ring-primary/40" },
  accent:      { bg: "bg-accent/15",      text: "text-accent",      ring: "group-hover:ring-accent/40" },
  success:     { bg: "bg-success/15",     text: "text-success",     ring: "group-hover:ring-success/40" },
  warning:     { bg: "bg-warning/20",     text: "text-warning",     ring: "group-hover:ring-warning/40" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive", ring: "group-hover:ring-destructive/40" },
  info:        { bg: "bg-primary/10",     text: "text-primary",     ring: "group-hover:ring-primary/40" },
};

const specialties: Specialty[] = [
  { icon: HeartPulse,  name: "Clínico Geral",   description: "Consultas, evolução e prescrição",      tone: "primary" },
  
  { icon: Sun,         name: "Dermatologia",    description: "Lesões, mapeamento e fotos clínicas",   tone: "warning" },
  { icon: Smile,       name: "Odontologia",     description: "Todas as áreas da odontologia",         tone: "info" },
  { icon: Brain,       name: "Psicologia",      description: "6 modelos de anamnese inclusos",        tone: "accent" },
  { icon: Sparkles,    name: "Estética",        description: "Mapa facial, antes/depois e PDF",       tone: "destructive" },
  { icon: Activity,    name: "Fisioterapia",    description: "Avaliação funcional e evolução",        tone: "success" },
  { icon: Apple,       name: "Nutrição",        description: "Antropometria e plano alimentar",       tone: "success" },
  { icon: Baby,        name: "Pediatria",       description: "Curvas OMS e percentil automático",     tone: "warning" },
  { icon: Dumbbell,    name: "Pilates",         description: "Avaliação funcional e 6 modelos",       tone: "primary" },
];

const Specialties = () => {
  return (
    <section id="specialties" className="py-20 lg:py-32 bg-muted/30 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 right-0 w-[28rem] h-[28rem] rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-0 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-3xl" />

      <div className="section-container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-xs uppercase tracking-wider">
            Especialidades
          </span>
          <h2 className="font-display text-3xl lg:text-5xl font-bold text-foreground mt-4 mb-4">
            Feito para a <span className="text-gradient-brand">sua especialidade</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            10 especialidades nativas com modelos de prontuário, anamnese e fluxos clínicos
            específicos — e novos módulos chegando a cada mês.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {specialties.map((s, index) => {
            const t = tones[s.tone];
            return (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (index % 6) * 0.05 }}
                className="group bg-card rounded-2xl border border-border/60 p-6 ring-1 ring-transparent hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${t.bg} ${t.text} flex items-center justify-center ring-2 ring-transparent ${t.ring} transition-all`}>
                    <s.icon size={26} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-lg text-foreground leading-tight">
                      {s.name}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-snug mt-0.5">
                      {s.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="group rounded-2xl p-6 border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center shadow-md">
                <Rocket size={26} />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-lg text-foreground leading-tight">
                  Em breve
                </h3>
                <p className="text-sm text-muted-foreground leading-snug mt-0.5">
                  Novas especialidades e funcionalidades chegando todo mês.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          Ainda não encontrou? Suporte a clínicas multidisciplinares com fluxos personalizáveis.
        </p>
      </div>
    </section>
  );
};

export default Specialties;
