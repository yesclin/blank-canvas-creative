import { motion } from "framer-motion";
import { 
  Calendar, 
  FileText, 
  Users, 
  CreditCard, 
  MessageSquare, 
  BarChart3,
  Shield,
  Zap
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Calendar,
      title: "Agenda Inteligente",
      description: "Gerencie consultas, sala de espera e disponibilidade por profissional. Confirmações automáticas e lembretes.",
      highlight: true,
    },
    {
      icon: FileText,
      title: "Prontuário Digital",
      description: "Timeline completa do paciente com modelos por especialidade, anexos de imagens e alertas clínicos.",
      highlight: true,
    },
    {
      icon: Users,
      title: "Gestão de Pacientes",
      description: "Cadastro completo, histórico de atendimentos, convênios vinculados e comunicação centralizada.",
      highlight: false,
    },
    {
      icon: CreditCard,
      title: "Controle Financeiro",
      description: "Caixa diário, pacotes de tratamento, contas a receber e integração com convênios.",
      highlight: true,
    },
    {
      icon: MessageSquare,
      title: "CRM e Comunicação",
      description: "Templates de mensagens, histórico de contatos e preparação para automações futuras.",
      highlight: false,
    },
    {
      icon: BarChart3,
      title: "Relatórios",
      description: "Acompanhe indicadores de atendimento, financeiro e produtividade da sua clínica.",
      highlight: false,
    },
    {
      icon: Shield,
      title: "Segurança e LGPD",
      description: "Dados protegidos, isolamento por clínica, auditoria de ações e conformidade com LGPD.",
      highlight: false,
    },
    {
      icon: Zap,
      title: "Multi-Clínica",
      description: "Gerencie múltiplas unidades com dados isolados e permissões específicas por usuário.",
      highlight: false,
    },
  ];

  return (
    <section id="features" className="py-20 lg:py-32 bg-background relative">
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
            Recursos
          </span>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mt-3 mb-4">
            Tudo que sua clínica precisa
          </h2>
          <p className="text-lg text-muted-foreground">
            Uma plataforma completa para otimizar seus atendimentos, organizar suas finanças 
            e oferecer a melhor experiência aos seus pacientes.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`feature-card ${feature.highlight ? 'ring-1 ring-primary/10' : ''}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                feature.highlight 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-secondary text-secondary-foreground'
              }`}>
                <feature.icon size={24} />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
