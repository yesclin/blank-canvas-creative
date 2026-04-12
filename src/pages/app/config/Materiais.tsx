import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Redirect: Cadastros Clínicos agora faz parte do módulo unificado "Itens e Estoque".
 * Redireciona automaticamente para /app/gestao/estoque.
 */
export default function ConfigMateriais() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/app/gestao/estoque", { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
