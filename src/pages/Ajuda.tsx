import LegalPage from "@/components/landing/LegalPage";
import { Link } from "react-router-dom";

const Ajuda = () => {
  return (
    <LegalPage
      title="Central de Ajuda"
      subtitle="Tire suas dúvidas e aprenda a aproveitar o YesClin ao máximo."
    >
      <h2 className="font-display text-2xl font-bold mt-8 mb-3">Primeiros passos</h2>
      <p>
        Acabou de criar sua conta? Nosso onboarding guia você na configuração
        da clínica, cadastro de profissionais, agenda e prontuário em poucos
        minutos.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8 mb-3">Suporte humano</h2>
      <p>
        Atendemos por WhatsApp e e-mail em horário comercial. Se preferir,
        envie sua dúvida pela página de{" "}
        <Link to="/contato" className="text-primary font-medium hover:underline">
          contato
        </Link>{" "}
        e respondemos rápido.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8 mb-3">Segurança e LGPD</h2>
      <p>
        Para entender como tratamos os dados da sua clínica e dos pacientes,
        leia nossa{" "}
        <Link to="/privacidade" className="text-primary font-medium hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </LegalPage>
  );
};

export default Ajuda;
