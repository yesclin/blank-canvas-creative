import { motion } from "framer-motion";
import {
  CalendarCheck2,
  ClipboardPlus,
  Wallet,
  Boxes,
  Video,
  MessageCircleHeart,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Megaphone,
  FileSignature,
  Users2,
} from "lucide-react";

type Feature = {
  icon: typeof CalendarCheck2;
  title: string;
  description: string;
  badge?: string;
  /** Tailwind gradient + text classes built from semantic tokens */
  tone:
    | "primary"
    | "accent"
    | "success"
    | "warning"
    | "destructive"
    | "info";
};

const tones: Record<
  Feature["tone"],
  { iconBg: string; iconText: string; ring: string; chip: string }
> = {
  primary: {
    iconBg: "bg-gradient-to-br from-primary to-primary/70",
    iconText: "text-primary-foreground",
    ring: "hover:ring-primary/30",
    chip: "bg-primary/10 text-primary",
  },
  accent: {
    iconBg: "bg-gradient-to-br from-accent to-accent/70",
    iconText: "text-accent-foreground",
    ring: "hover:ring-accent/30",
    chip: "bg-accent/10 text-accent",
  },
  success: {
    iconBg: "bg-gradient-to-br from-success to-success/70",
    iconText: "text-success-foreground",
    ring: "hover:ring-success/30",
    chip: "bg-success/10 text-success",
  },
  warning: {
    iconBg: "bg-gradient-to-br from-warning to-warning/70",
    iconText: "text-warning-foreground",
    ring: "hover:ring-warning/30",
    chip: "bg-warning/15 text-warning",
  },
  destructive: {
    iconBg: "bg-gradient-to-br from-destructive to-destructive/70",
    iconText: "text-destructive-foreground",
    ring: "hover:ring-destructive/30",
    chip: "bg-destructive/10 text-destructive",
  },
  info: {
    iconBg: "bg-gradient-to-br from-primary/80 to-accent/80",
    iconText: "text-primary-foreground",
    ring: "hover:ring-primary/30",
    chip: "bg-primary/10 text-primary",
  },
};

const features: Feature[] = [
  {
    icon: CalendarCheck2,
    title: "Agenda Inteligente",
    description:
      "Encaixes, sala de espera, status em tempo real, agendamento público por link e bloqueio por especialidade.",
    tone: "primary",
  },
  {
    icon: ClipboardPlus,
    title: "Prontuário Eletrônico",
    description:
      "8 especialidades nativas, anamneses por modelo, evolução, assinatura avançada e janela de edição de 15 min.",
    tone: "accent",
    badge: "8 especialidades",
  },
  {
    icon: Sparkles,
    title: "Módulo Estética",
    description:
      "Mapa facial geolocalizado, antes/depois, escalas clínicas e PDF consolidado por sessão.",
    tone: "info",
    badge: "Toxina · Filler · Bioestimulador",
  },
  {
    icon: FileSignature,
    title: "Assinatura Digital Avançada",
    description:
      "SHA-256, token de verificação, página pública de validação e auditoria completa de assinaturas.",
    tone: "success",
    badge: "LGPD",
  },
  {
    icon: Wallet,
    title: "Financeiro por Atendimento",
    description:
      "Recebimentos por consulta, múltiplos métodos, fluxo de caixa, contas a receber e fechamento diário.",
    tone: "success",
  },
  {
    icon: Boxes,
    title: "Estoque Clínico FEFO",
    description:
      "Lote, validade, kits clínicos e comerciais, baixa por atendimento e bloqueio de saldo negativo.",
    tone: "warning",
    badge: "FEFO",
  },
  {
    icon: TrendingUp,
    title: "CRM Comercial",
    description:
      "Pipeline de 8 estágios, leads, oportunidades, orçamentos, conversão controlada e metas por vendedor.",
    tone: "primary",
  },
  {
    icon: Megaphone,
    title: "Marketing & Relacionamento",
    description:
      "Campanhas, jornadas automáticas e auditoria de envios manuais para fidelizar pacientes.",
    tone: "accent",
  },
  {
    icon: MessageCircleHeart,
    title: "WhatsApp Multi-Instância",
    description:
      "Integração UAZAPI por clínica, mensagens, modelos prontos e central única de relacionamento.",
    tone: "success",
    badge: "UAZAPI",
  },
  {
    icon: Video,
    title: "Teleconsulta Integrada",
    description:
      "Salas seguras, pré-check do paciente, link automático, prontuário e prescrição na mesma tela.",
    tone: "info",
  },
  {
    icon: Users2,
    title: "Multiusuário com RBAC",
    description:
      "Owner, admin, profissional e recepção — cada papel com permissões clínicas e financeiras isoladas.",
    tone: "warning",
  },
  {
    icon: ShieldCheck,
    title: "Multi-Tenant & LGPD",
    description:
      "Isolamento por clínica via RLS, consentimento, auditoria e retenção em conformidade total.",
    tone: "destructive",
    badge: "RLS",
  },
];

const Features = () => {
  return (
    <section
      id="features"
      className="py-20 lg:py-32 bg-background relative overflow-hidden"
    >
      {/* Subtle colorful glows */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[32rem] h-[32rem] rounded-full bg-accent/10 blur-3xl" />

      <div className="section-container relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-xs uppercase tracking-wider">
            <Sparkles size={12} /> Tecnologia de ponta a ponta
          </span>
          <h2 className="font-display text-3xl lg:text-5xl font-bold text-foreground mt-4 mb-4">
            Recursos para uma{" "}
            <span className="text-gradient-brand">gestão clínica completa</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Tudo o que sua clínica precisa em um só sistema — do agendamento
            ao financeiro, com prontuário eletrônico, estética, comercial e IA
            integrados.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {features.map((feature, index) => {
            const t = tones[feature.tone];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (index % 4) * 0.08 }}
                className={`group relative bg-card border border-border/60 rounded-2xl p-6 ring-1 ring-transparent ${t.ring} hover:shadow-xl hover:-translate-y-0.5 transition-all`}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${t.iconBg} ${t.iconText} flex items-center justify-center mb-4 shadow-sm`}
                >
                  <feature.icon size={22} />
                </div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="font-display font-semibold text-lg text-foreground">
                    {feature.title}
                  </h3>
                  {feature.badge && (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${t.chip}`}
                    >
                      {feature.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
