import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ReactNode } from "react";

const inlineLink = (to: string, label: string) => (
  <Link to={to} className="text-primary font-medium hover:underline">
    {label}
  </Link>
);

// Each FAQ item has:
// - q: question (string)
// - aText: plain-text answer used for SEO JSON-LD (FAQPage schema)
// - a: rich answer (ReactNode) shown to users, may contain internal links
const faqs: { q: string; aText: string; a: ReactNode }[] = [
  {
    q: "Como funciona o teste grátis de 7 dias?",
    aText:
      "Ao criar sua conta, você libera automaticamente 7 dias de acesso ao plano Profissional, sem precisar informar cartão de crédito. Pode testar todos os recursos com seus dados reais. Dúvidas no caminho? A Central de Ajuda tem tutoriais rápidos.",
    a: (
      <>
        Ao criar sua conta, você libera automaticamente 7 dias de acesso ao
        plano Profissional, sem precisar informar cartão de crédito. Pode
        testar todos os recursos com seus dados reais. Dúvidas no caminho? A{" "}
        {inlineLink("/ajuda", "Central de Ajuda")} tem tutoriais rápidos.
      </>
    ),
  },
  {
    q: "O que acontece quando os 7 dias acabam?",
    aText:
      "Após o período de teste, sua conta entra em modo de bloqueio: você ainda acessa os dados em modo leitura, mas não consegue criar novos pacientes ou agendamentos até escolher um plano. Nada é perdido — basta assinar para continuar de onde parou.",
    a: (
      <>
        Após o período de teste, sua conta entra em modo de bloqueio: você
        ainda acessa os dados em modo leitura, mas não consegue criar novos
        pacientes ou agendamentos até escolher um plano. Nada é perdido —
        basta assinar para continuar de onde parou.
      </>
    ),
  },
  {
    q: "Preciso assinar contrato ou fidelidade?",
    aText:
      "Não. O YesClin funciona em modelo de assinatura mensal ou anual sem fidelidade. Você pode cancelar quando quiser, direto pelo painel ou falando com o nosso time pela página de contato.",
    a: (
      <>
        Não. O YesClin funciona em modelo de assinatura mensal ou anual sem
        fidelidade. Você pode cancelar quando quiser, direto pelo painel ou
        falando com o nosso time pela página de{" "}
        {inlineLink("/contato", "contato")}.
      </>
    ),
  },
  {
    q: "Como funciona o cancelamento?",
    aText:
      "Você pode cancelar a qualquer momento. No plano mensal, o acesso permanece ativo até o fim do período já pago. Seus dados ficam disponíveis para exportação caso precise — fale com a gente em /contato para solicitar.",
    a: (
      <>
        Você pode cancelar a qualquer momento. No plano mensal, o acesso
        permanece ativo até o fim do período já pago. Seus dados ficam
        disponíveis para exportação caso precise — fale com a gente em{" "}
        {inlineLink("/contato", "/contato")} para solicitar.
      </>
    ),
  },
  {
    q: "Meus dados e os dos meus pacientes estão seguros?",
    aText:
      "Sim. Os dados são armazenados em infraestrutura criptografada, com isolamento por clínica, controle de acesso por papel (médico, recepção, admin) e auditoria de ações. O sistema segue as exigências da LGPD — veja detalhes na nossa Política de Privacidade.",
    a: (
      <>
        Sim. Os dados são armazenados em infraestrutura criptografada, com
        isolamento por clínica, controle de acesso por papel (médico, recepção,
        admin) e auditoria de ações. O sistema segue as exigências da LGPD —
        veja detalhes na nossa{" "}
        {inlineLink("/privacidade", "Política de Privacidade")}.
      </>
    ),
  },
  {
    q: "A teleconsulta funciona de verdade dentro do sistema?",
    aText:
      "Sim. A teleconsulta é integrada ao prontuário e à agenda: você gera o link da consulta, atende pelo navegador (sem instalar nada), registra a evolução e emite receita ou atestado durante o atendimento.",
    a: (
      <>
        Sim. A teleconsulta é integrada ao prontuário e à agenda: você gera o
        link da consulta, atende pelo navegador (sem instalar nada), registra
        a evolução e emite receita ou atestado durante o atendimento.
      </>
    ),
  },
  {
    q: "Vocês oferecem suporte? Como falo com o time?",
    aText:
      "Sim, o suporte humano está incluído em todos os planos. Atendemos por WhatsApp e e-mail, com tempo de resposta rápido em horário comercial. Veja todos os canais na página de contato ou consulte a Central de Ajuda antes. O plano Clínica conta com suporte prioritário.",
    a: (
      <>
        Sim, o suporte humano está incluído em todos os planos. Atendemos por
        WhatsApp e e-mail, com tempo de resposta rápido em horário comercial.
        Veja todos os canais na página de{" "}
        {inlineLink("/contato", "contato")} ou consulte a{" "}
        {inlineLink("/ajuda", "Central de Ajuda")} antes. O plano Clínica
        conta com suporte prioritário.
      </>
    ),
  },
  {
    q: "Funciona para qualquer especialidade?",
    aText:
      "Sim. O YesClin atende medicina, odontologia, psicologia, estética, fisioterapia, nutrição, fonoaudiologia, terapia ocupacional e clínicas multidisciplinares, com modelos clínicos próprios para cada área.",
    a: (
      <>
        Sim. O YesClin atende medicina, odontologia, psicologia, estética,
        fisioterapia, nutrição, fonoaudiologia, terapia ocupacional e clínicas
        multidisciplinares, com modelos clínicos próprios para cada área.
      </>
    ),
  },
];

// Build FAQPage JSON-LD for Google Rich Results.
// Reference: https://developers.google.com/search/docs/appearance/structured-data/faqpage
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.aText,
    },
  })),
};

const FAQ = () => {
  return (
    <section id="faq" className="py-20 lg:py-28 bg-muted/30">
      {/* SEO: FAQPage structured data for Google rich results */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="section-container max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Perguntas frequentes
          </span>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mt-3 mb-4">
            Tire suas dúvidas antes de começar
          </h2>
          <p className="text-lg text-muted-foreground">
            Respostas rápidas sobre teste grátis, cobrança, segurança e suporte.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border border-border/60 rounded-2xl p-2 sm:p-4 shadow-sm"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-border/60 last:border-0"
              >
                <AccordionTrigger className="text-left text-foreground font-medium hover:no-underline px-2 sm:px-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed px-2 sm:px-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
