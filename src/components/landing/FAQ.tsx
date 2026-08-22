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
    q: "Funciona para a minha especialidade?",
    aText:
      "Sim. O YesClin tem 9 especialidades nativas com modelos próprios de prontuário e anamnese: Clínico Geral, Dermatologia, Odontologia, Psicologia, Estética, Fisioterapia, Nutrição, Pediatria e Pilates. Clínicas multidisciplinares também são suportadas, e novos módulos chegam todo mês.",
    a: (
      <>
        Sim. O YesClin tem 9 especialidades nativas com modelos próprios de
        prontuário e anamnese: Clínico Geral, Dermatologia, Odontologia,
        Psicologia, Estética, Fisioterapia, Nutrição, Pediatria e Pilates.
        Clínicas multidisciplinares também são suportadas, e novos módulos
        chegam todo mês.
      </>
    ),
  },
  {
    q: "Eu uso planilha / papel hoje. Vocês ajudam na migração?",
    aText:
      "Sim. Importamos sua base de pacientes e profissionais a partir de planilha e te ajudamos a configurar agenda, modelos de prontuário e financeiro nos primeiros dias. Em geral, em 1 semana a clínica já está rodando 100% no sistema.",
    a: (
      <>
        Sim. Importamos sua base de pacientes e profissionais a partir de
        planilha e te ajudamos a configurar agenda, modelos de prontuário e
        financeiro nos primeiros dias. Em geral, em 1 semana a clínica já
        está rodando 100% no sistema.
      </>
    ),
  },
  {
    q: "Tem agendamento online para o paciente marcar sozinho?",
    aText:
      "Sim. Cada profissional ganha um link público de agendamento que pode ser usado no Instagram, WhatsApp e site. O paciente escolhe horário, se cadastra e o agendamento já entra na sua agenda — sem retrabalho da recepção.",
    a: (
      <>
        Sim. Cada profissional ganha um link público de agendamento que pode
        ser usado no Instagram, WhatsApp e site. O paciente escolhe horário,
        se cadastra e o agendamento já entra na sua agenda — sem retrabalho
        da recepção.
      </>
    ),
  },
  {
    q: "Funciona com WhatsApp para confirmar consultas?",
    aText:
      "Sim. Conectamos sua instância de WhatsApp (UAZAPI) por clínica e enviamos confirmações, lembretes e mensagens manuais com auditoria. Reduz drasticamente o no-show e centraliza o relacionamento no mesmo sistema.",
    a: (
      <>
        Sim. Conectamos sua instância de WhatsApp (UAZAPI) por clínica e
        enviamos confirmações, lembretes e mensagens manuais com auditoria.
        Reduz drasticamente o no-show e centraliza o relacionamento no mesmo
        sistema.
      </>
    ),
  },
  {
    q: "Atende mais de um profissional / unidade?",
    aText:
      "Sim. O YesClin é multiusuário e multi-tenant: cada profissional tem sua agenda e prontuário, e cada papel (dono, admin, profissional, recepção) tem permissões diferentes. Os dados clínicos só aparecem para quem pode ver.",
    a: (
      <>
        Sim. O YesClin é multiusuário e multi-tenant: cada profissional tem
        sua agenda e prontuário, e cada papel (dono, admin, profissional,
        recepção) tem permissões diferentes. Os dados clínicos só aparecem
        para quem pode ver.
      </>
    ),
  },
  {
    q: "O prontuário tem assinatura digital com validade?",
    aText:
      "Sim. Todos os documentos clínicos são assinados com assinatura eletrônica avançada (SHA-256, token de verificação e página pública de validação). Têm validade jurídica e ficam protegidos contra alteração depois de assinados.",
    a: (
      <>
        Sim. Todos os documentos clínicos são assinados com assinatura
        eletrônica avançada (SHA-256, token de verificação e página pública
        de validação). Têm validade jurídica e ficam protegidos contra
        alteração depois de assinados.
      </>
    ),
  },
  {
    q: "Tem financeiro e controle de estoque?",
    aText:
      "Sim. O financeiro é integrado ao atendimento (cada consulta gera o recebimento certo, com método e fechamento diário) e o estoque usa FEFO com lote, validade, kits clínicos e baixa automática por procedimento. Sem planilha paralela.",
    a: (
      <>
        Sim. O financeiro é integrado ao atendimento (cada consulta gera o
        recebimento certo, com método e fechamento diário) e o estoque usa
        FEFO com lote, validade, kits clínicos e baixa automática por
        procedimento. Sem planilha paralela.
      </>
    ),
  },
  {
    q: "A teleconsulta funciona de verdade dentro do sistema?",
    aText:
      "Sim. A teleconsulta é integrada ao prontuário e à agenda: você gera o link, atende pelo navegador (sem instalar nada), registra a evolução e emite receita ou atestado durante o atendimento.",
    a: (
      <>
        Sim. A teleconsulta é integrada ao prontuário e à agenda: você gera
        o link, atende pelo navegador (sem instalar nada), registra a
        evolução e emite receita ou atestado durante o atendimento.
      </>
    ),
  },
  {
    q: "Meus dados e os dos meus pacientes estão seguros?",
    aText:
      "Sim. Os dados são armazenados em infraestrutura criptografada, com isolamento por clínica, controle de acesso por papel, auditoria de ações e conformidade total com a LGPD. Veja detalhes na Política de Privacidade.",
    a: (
      <>
        Sim. Os dados são armazenados em infraestrutura criptografada, com
        isolamento por clínica, controle de acesso por papel, auditoria de
        ações e conformidade total com a LGPD. Veja detalhes na nossa{" "}
        {inlineLink("/privacidade", "Política de Privacidade")}.
      </>
    ),
  },
  {
    q: "Funciona no celular e no tablet?",
    aText:
      "Sim. O YesClin é 100% web e responsivo: você acessa de qualquer navegador no computador, tablet ou celular, sem instalar nada. Ideal para atender em consultório, em casa ou em visita domiciliar.",
    a: (
      <>
        Sim. O YesClin é 100% web e responsivo: você acessa de qualquer
        navegador no computador, tablet ou celular, sem instalar nada. Ideal
        para atender em consultório, em casa ou em visita domiciliar.
      </>
    ),
  },
  {
    q: "Como funciona o teste grátis de 7 dias?",
    aText:
      "Ao criar sua conta, você libera automaticamente 7 dias de acesso ao plano Pro, sem precisar informar cartão de crédito. Pode testar todos os recursos com seus dados reais. Dúvidas no caminho? A Central de Ajuda tem tutoriais rápidos.",
    a: (
      <>
        Ao criar sua conta, você libera automaticamente 7 dias de acesso ao
        plano Pro, sem precisar informar cartão de crédito. Pode
        testar todos os recursos com seus dados reais. Dúvidas no caminho? A{" "}
        {inlineLink("/ajuda", "Central de Ajuda")} tem tutoriais rápidos.
      </>
    ),
  },
  {
    q: "Preciso assinar contrato ou fidelidade?",
    aText:
      "Não. O YesClin funciona em modelo de assinatura mensal ou anual sem fidelidade. Você pode cancelar quando quiser, direto pelo painel ou falando com nosso time pela página de contato. Seus dados ficam disponíveis para exportação.",
    a: (
      <>
        Não. O YesClin funciona em modelo de assinatura mensal ou anual sem
        fidelidade. Você pode cancelar quando quiser, direto pelo painel ou
        falando com o nosso time pela página de{" "}
        {inlineLink("/contato", "contato")}. Seus dados ficam disponíveis
        para exportação.
      </>
    ),
  },
  {
    q: "Tem suporte humano de verdade?",
    aText:
      "Sim. Suporte humano por WhatsApp e e-mail está incluído em todos os planos, com tempo de resposta rápido em horário comercial. O plano Premium conta com suporte prioritário e onboarding guiado.",
    a: (
      <>
        Sim. Suporte humano por WhatsApp e e-mail está incluído em todos os
        planos, com tempo de resposta rápido em horário comercial. Veja os
        canais em {inlineLink("/contato", "contato")} ou use a{" "}
        {inlineLink("/ajuda", "Central de Ajuda")}. O plano Premium conta
        com suporte prioritário e onboarding guiado.
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
            Tudo o que clínicas perguntam antes de migrar — especialidades, agenda online, WhatsApp, financeiro, segurança e suporte.
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
