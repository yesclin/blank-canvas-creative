import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Como funciona o teste grátis de 7 dias?",
    a: "Ao criar sua conta, você libera automaticamente 7 dias de acesso ao plano Profissional, sem precisar informar cartão de crédito. Pode testar todos os recursos com seus dados reais.",
  },
  {
    q: "O que acontece quando os 7 dias acabam?",
    a: "Após o período de teste, sua conta entra em modo de bloqueio: você ainda acessa os dados em modo leitura, mas não consegue criar novos pacientes ou agendamentos até escolher um plano. Nada é perdido — basta assinar para continuar de onde parou.",
  },
  {
    q: "Preciso assinar contrato ou fidelidade?",
    a: "Não. O YesClin funciona em modelo de assinatura mensal ou anual sem fidelidade. Você pode cancelar quando quiser, direto pelo painel ou falando com nosso time.",
  },
  {
    q: "Como funciona o cancelamento?",
    a: "Você pode cancelar a qualquer momento. No plano mensal, o acesso permanece ativo até o fim do período já pago. Seus dados ficam disponíveis para exportação caso precise.",
  },
  {
    q: "Meus dados e os dos meus pacientes estão seguros?",
    a: "Sim. Os dados são armazenados em infraestrutura criptografada, com isolamento por clínica, controle de acesso por papel (médico, recepção, admin) e auditoria de ações. O sistema segue as exigências da LGPD.",
  },
  {
    q: "A teleconsulta funciona de verdade dentro do sistema?",
    a: "Sim. A teleconsulta é integrada ao prontuário e à agenda: você gera o link da consulta, atende pelo navegador (sem instalar nada), registra a evolução e emite receita ou atestado durante o atendimento.",
  },
  {
    q: "Vocês oferecem suporte? Como falo com o time?",
    a: "Sim, o suporte humano está incluído em todos os planos. Atendemos por WhatsApp e e-mail, com tempo de resposta rápido em horário comercial. O plano Clínica conta com suporte prioritário.",
  },
  {
    q: "Funciona para qualquer especialidade?",
    a: "Sim. O YesClin atende medicina, odontologia, psicologia, estética, fisioterapia, nutrição, fonoaudiologia, terapia ocupacional e clínicas multidisciplinares, com modelos clínicos próprios para cada área.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-20 lg:py-28 bg-muted/30">
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
