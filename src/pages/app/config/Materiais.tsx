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
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      <div className="space-y-1 text-center">
        <p className="font-medium text-foreground">Redirecionando para Catálogo Clínico</p>
        <p className="text-sm text-muted-foreground">
          O cadastro-base agora acontece em um único macro-módulo operacional.
        </p>
      </div>
    </div>
  );
}
