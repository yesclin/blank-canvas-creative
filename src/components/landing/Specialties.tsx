import { motion } from "framer-motion";
import { 
  Stethoscope, 
  Smile, 
  Brain, 
  Sparkles, 
  Activity, 
  Apple,
  Ear,
  Hand,
  Leaf,
  Building2
} from "lucide-react";

const Specialties = () => {
  const specialties = [
    { icon: Stethoscope, name: "Medicina", description: "Clínica geral e especialidades" },
    { icon: Smile, name: "Odontologia", description: "Todas as áreas da odontologia" },
    { icon: Brain, name: "Psicologia", description: "Atendimento clínico e avaliações" },
    { icon: Sparkles, name: "Estética", description: "Procedimentos estéticos" },
    { icon: Activity, name: "Fisioterapia", description: "Reabilitação e tratamentos" },
    { icon: Apple, name: "Nutrição", description: "Consultas e acompanhamento" },
    { icon: Ear, name: "Fonoaudiologia", description: "Avaliação e terapia" },
    { icon: Hand, name: "Terapia Ocupacional", description: "Reabilitação funcional" },
    { icon: Leaf, name: "Terapias Integrativas", description: "Acupuntura e mais" },
    { icon: Building2, name: "Multidisciplinar", description: "Clínicas integradas" },
  ];

  return (
    <section id="specialties" className="py-20 lg:py-32 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="section-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Especialidades
          </span>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mt-3 mb-4">
            Feito para sua especialidade
          </h2>
          <p className="text-lg text-muted-foreground">
            Modelos de prontuário, procedimentos e fluxos adaptados para cada área da saúde.
          </p>
        </motion.div>

        {/* Specialties Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {specialties.map((specialty, index) => (
            <motion.div
              key={specialty.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group"
            >
              <div className="specialty-badge flex-col h-full p-4 text-center cursor-pointer">
                <specialty.icon 
                  size={28} 
                  className="mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" 
                />
                <span className="font-medium text-foreground text-sm">{specialty.name}</span>
                <span className="text-xs text-muted-foreground mt-1 hidden sm:block">
                  {specialty.description}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Specialties;
