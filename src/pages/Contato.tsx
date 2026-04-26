import LegalPage from "@/components/landing/LegalPage";
import { Mail, MessageCircle } from "lucide-react";

const Contato = () => {
  return (
    <LegalPage
      title="Fale com a gente"
      subtitle="Suporte humano por WhatsApp e e-mail, em horário comercial."
    >
      <div className="grid sm:grid-cols-2 gap-4 not-prose mt-6">
        <a
          href="https://wa.me/5500000000000"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 p-5 rounded-xl border border-border/60 bg-card hover:border-primary/40 transition-colors"
        >
          <MessageCircle className="text-primary" size={24} />
          <div>
            <div className="font-semibold text-foreground">WhatsApp</div>
            <div className="text-sm text-muted-foreground">Resposta rápida</div>
          </div>
        </a>
        <a
          href="mailto:contato@yesclin.app"
          className="flex items-center gap-3 p-5 rounded-xl border border-border/60 bg-card hover:border-primary/40 transition-colors"
        >
          <Mail className="text-primary" size={24} />
          <div>
            <div className="font-semibold text-foreground">E-mail</div>
            <div className="text-sm text-muted-foreground">contato@yesclin.app</div>
          </div>
        </a>
      </div>

      <h2 className="font-display text-2xl font-bold mt-10 mb-3">Horário de atendimento</h2>
      <p>Segunda a sexta, das 9h às 18h (horário de Brasília).</p>

      <h2 className="font-display text-2xl font-bold mt-8 mb-3">Outras dúvidas?</h2>
      <p>
        Confira primeiro nossa Central de Ajuda em <strong>/ajuda</strong> —
        muitas respostas já estão lá.
      </p>
    </LegalPage>
  );
};

export default Contato;
