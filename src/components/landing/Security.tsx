import { Shield, Lock, FileCheck2, Eye } from "lucide-react";

const items = [
  { icon: Shield, title: "Proteção total dos dados", desc: "Infraestrutura segura e criptografada de ponta a ponta." },
  { icon: Eye, title: "Consentimento e transparência", desc: "Coletamos e tratamos dados com base legal clara, sempre com seu conhecimento." },
  { icon: Lock, title: "Controle nas suas mãos", desc: "Titulares podem solicitar acesso, correção ou exclusão de dados a qualquer momento." },
  { icon: FileCheck2, title: "Pronto para auditorias", desc: "Histórico completo de acessos e modificações conforme exigido pela LGPD." },
];

const Security = () => {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="section-container">
        <div className="max-w-3xl mb-12">
          <p className="text-sm uppercase tracking-widest text-primary font-semibold mb-2">Segurança</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            Sua clínica segura e em conformidade com a <span className="text-gradient-brand">LGPD</span>
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Privacidade e segurança em primeiro lugar. Seus dados e os de seus pacientes são
            protegidos com responsabilidade.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border border-border/60 rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon size={22} />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-1.5">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Security;
