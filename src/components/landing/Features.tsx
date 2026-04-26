import { motion } from "framer-motion";
import {
  Calendar,
  FileText,
  Users,
  Wallet,
  Video,
  MessageCircle,
  Shield,
  Building2,
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Calendar,
      title: "Agenda Inteligente",
      description: "Encaixes, sala de espera, status do atendimento e disponibilidade por profissional.",
      highlight: true,
    },
    {
      icon: FileText,
      title: "Prontuário Digital",
      description: "Timeline do paciente, modelos por especialidade, anexos e assinatura eletrônica avançada.",
      highlight: true,
    },
    {
      icon: Users,
      title: "Gestão de Pacientes",
      description: "Cadastro completo, histórico de atendimentos, convênios e pré-cadastro público por link.",
      highlight: false,
    },
    {
      icon: Wallet,
      title: "Financeiro por Atendimento",
      description: "Recebimentos por consulta, métodos de pagamento, caixa diário e contas a receber.",
      highlight: true,
    },
    {
      icon: Video,
      title: "Teleconsulta Integrada",
      description: "Consultas online seguras com prontuário, prescrição eletrônica e validação de documentos.",
      highlight: true,
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Conectado",
      description: "Envio de mensagens, modelos prontos e central de relacionamento com o paciente.",
      highlight: false,
    },
    {
      icon: Shield,
      title: "Segurança e LGPD",
      description: "Dados isolados por clínica, controle de acesso por papel e auditoria de ações.",
      highlight: false,
    },
    {
      icon: Building2,
      title: "Multi-Profissional",
      description: "Vários profissionais e especialidades em uma clínica, com permissões individuais.",
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
