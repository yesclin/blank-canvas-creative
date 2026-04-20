import { motion } from "framer-motion";
import {
  Wallet,
  Package,
  FileText,
  Users2,
  CalendarCheck,
  BarChart3,
  LayoutDashboard,
  ShieldCheck,
  MessageCircle,
  Repeat,
} from "lucide-react";

const features = [
  { icon: Wallet, title: "Financeiro completo", description: "Caixa, contas a pagar e receber, conciliação e fluxo de caixa em tempo real." },
  { icon: Package, title: "Controle de estoque", description: "Rastreabilidade por lote, movimentações automáticas e alertas de mínimo." },
  { icon: FileText, title: "Emissão de notas fiscais", description: "NFe, NFSe e NFCe integradas, sem precisar trocar de sistema." },
  { icon: Users2, title: "CRM e vendas", description: "Pipeline de leads, oportunidades, orçamentos e conversão automatizada." },
  { icon: CalendarCheck, title: "Agendamentos online", description: "Agenda inteligente com confirmação automática e link público de booking." },
  { icon: BarChart3, title: "Relatórios inteligentes", description: "Indicadores de produtividade, financeiro e operacional prontos para decidir." },
  { icon: LayoutDashboard, title: "Dashboard em tempo real", description: "Visão consolidada do negócio em um painel claro e personalizável." },
  { icon: ShieldCheck, title: "Usuários e permissões", description: "Controle granular de acessos por papel, equipe e unidade." },
  { icon: MessageCircle, title: "Integração com WhatsApp", description: "Envio automatizado de confirmações, lembretes e campanhas." },
  { icon: Repeat, title: "Assinaturas e cobranças", description: "Cobranças recorrentes automáticas, com Pix, boleto e cartão." },
];

const Features = () => {
  return (
    <section id="features" className="py-20 lg:py-32 bg-background relative">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Funcionalidades
          </span>
          <h2 className="font-display text-3xl lg:text-5xl font-bold text-foreground mt-3 mb-4">
            Tudo que sua empresa precisa em um só lugar
          </h2>
          <p className="text-lg text-muted-foreground">
            Pare de juntar 5 sistemas diferentes. O Yesclin une operação, atendimento, vendas e financeiro
            em uma plataforma única, integrada e fácil de usar.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="feature-card group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <feature.icon size={22} />
              </div>
              <h3 className="font-display font-semibold text-base text-foreground mb-2">
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
