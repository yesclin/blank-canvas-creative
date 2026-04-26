import LegalPage from "@/components/landing/LegalPage";
import { Link } from "react-router-dom";
import ConsentManager from "@/components/ConsentManager";

const Privacidade = () => {
  return (
    <LegalPage
      title="Política de Privacidade"
      subtitle="Como o YesClin coleta, armazena e protege seus dados e os dados dos seus pacientes."
    >
      <h2 className="font-display text-2xl font-bold mt-8 mb-3">Compromisso com a LGPD</h2>
      <p>
        O YesClin segue as exigências da Lei Geral de Proteção de Dados
        (LGPD - Lei 13.709/2018). Tratamos os dados clínicos como informações
        sensíveis e aplicamos controles técnicos e administrativos para
        garantir confidencialidade, integridade e disponibilidade.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8 mb-3">Dados que coletamos</h2>
      <p>
        Coletamos apenas os dados necessários para operar o sistema:
        identificação dos profissionais, dados clínicos dos pacientes
        cadastrados pela clínica, registros de agendamento e informações
        financeiras.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8 mb-3">Segurança</h2>
      <p>
        Os dados são armazenados em infraestrutura criptografada, com
        isolamento por clínica, controle de acesso por papel (médico,
        recepção, admin) e auditoria de ações.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8 mb-3">Seus direitos</h2>
      <p>
        Você pode solicitar acesso, correção ou exclusão dos seus dados a
        qualquer momento. Para isso, entre em contato pela nossa{" "}
        <Link to="/contato" className="text-primary font-medium hover:underline">
          página de contato
        </Link>
        .
      </p>
    </LegalPage>
  );
};

export default Privacidade;
