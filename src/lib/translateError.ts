/**
 * Tradutor global de mensagens de erro para Português.
 *
 * Use em todo `catch` antes de exibir ao usuário:
 *   toast.error(translateError(error));
 *
 * Mantém o erro técnico apenas no console — nunca exibir cru ao usuário.
 */

type AnyError = unknown;

const EXACT_MAP: Record<string, string> = {
  "Failed to fetch": "Não foi possível conectar ao servidor. Verifique sua internet.",
  "Load failed": "Não foi possível conectar ao servidor. Verifique sua internet.",
  "NetworkError when attempting to fetch resource.": "Erro de conexão com a internet.",
  "Network Error": "Erro de conexão com a internet.",
  "Network request failed": "Erro de conexão com a internet.",
  "Unauthorized": "Você não possui autorização para realizar esta ação.",
  "Forbidden": "Acesso negado.",
  "Invalid token": "Link inválido ou expirado.",
  "Invalid login credentials": "E-mail ou senha inválidos.",
  "Invalid Refresh Token": "Sua sessão expirou. Faça login novamente.",
  "Refresh Token Not Found": "Sua sessão expirou. Faça login novamente.",
  "User not found": "Usuário não encontrado.",
  "User already registered": "Já existe uma conta com este e-mail.",
  "Permission denied": "Permissão insuficiente para esta operação.",
  "Internal Server Error": "Ocorreu um erro interno no servidor.",
  "Function not found": "Serviço indisponível no momento.",
  "Timeout": "A operação demorou mais que o esperado. Tente novamente.",
  "AbortError": "A operação foi cancelada.",
  "The operation was aborted.": "A operação foi cancelada.",
  "JWT expired": "Sua sessão expirou. Faça login novamente.",
  "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar.",
  "Password should be at least 6 characters.": "A senha deve ter ao menos 6 caracteres.",
  "Required": "Campo obrigatório.",
  "Invalid email": "E-mail inválido.",
  "Password too short": "Senha muito curta.",
  "Passwords do not match": "As senhas não coincidem.",
  "Field is required": "Preencha este campo.",
};

const PARTIAL_MAP: Array<[RegExp, string]> = [
  [/weak_password|known to be weak|easy to guess|compromised|pwned|leaked password/i, "Essa senha aparece em vazamentos públicos ou é muito comum. Escolha outra senha, com no mínimo 8 caracteres, letras e números."],
  [/password should be at least|password.*too short|minimum.*characters/i, "A senha deve ter no mínimo 8 caracteres."],
  [/failed to fetch/i, "Não foi possível conectar ao servidor. Verifique sua internet."],
  [/network\s*error|networkerror/i, "Erro de conexão com a internet."],
  [/timeout|timed out/i, "A operação demorou mais que o esperado. Tente novamente."],
  [/jwt (expired|malformed|invalid)/i, "Sua sessão expirou. Faça login novamente."],
  [/invalid.*(token|jwt)/i, "Link inválido ou expirado."],
  [/row-level security|rls|new row violates/i, "Você não possui permissão para acessar esses dados."],
  [/permission denied/i, "Permissão insuficiente para esta operação."],
  [/duplicate key value|already exists/i, "Este registro já existe."],
  [/violates foreign key constraint/i, "Existem dados vinculados a este registro."],
  [/violates not-null constraint/i, "Preencha todos os campos obrigatórios."],
  [/violates check constraint/i, "Dados inválidos para este registro."],
  [/function .* not found|could not find the function/i, "Serviço indisponível no momento."],
  [/invalid login credentials/i, "E-mail ou senha inválidos."],
  [/user (not found|does not exist)/i, "Usuário não encontrado."],
  [/email rate limit/i, "Muitas tentativas. Aguarde alguns minutos."],
  [/rate limit/i, "Muitas tentativas. Aguarde alguns minutos."],
  [/email not confirmed/i, "Confirme seu e-mail antes de entrar."],
  [/unauthorized/i, "Você não possui autorização para realizar esta ação."],
  [/forbidden/i, "Acesso negado."],
  [/not\s*found/i, "Registro não encontrado."],
  [/conflict/i, "Este registro já existe."],
  [/bad request/i, "Dados inválidos."],
  [/unprocessable/i, "Dados inconsistentes."],
  [/internal server error|500/i, "Ocorreu um erro interno no servidor."],
  [/service unavailable|503/i, "Serviço temporariamente indisponível."],
  [/load failed|fetch failed/i, "Não foi possível conectar ao servidor. Verifique sua internet."],
];

const STATUS_MAP: Record<number, string> = {
  400: "Dados inválidos.",
  401: "Sua sessão expirou. Faça login novamente.",
  403: "Acesso negado.",
  404: "Registro não encontrado.",
  408: "A operação demorou mais que o esperado. Tente novamente.",
  409: "Este registro já existe.",
  422: "Dados inconsistentes.",
  429: "Muitas tentativas. Aguarde alguns minutos.",
  500: "Ocorreu um erro interno no servidor.",
  502: "Serviço temporariamente indisponível.",
  503: "Serviço temporariamente indisponível.",
  504: "A operação demorou mais que o esperado. Tente novamente.",
};

const DEFAULT_MESSAGE = "Ocorreu um erro inesperado. Tente novamente.";

function extractMessage(err: AnyError): { message: string; status?: number } {
  if (err == null) return { message: "" };
  if (typeof err === "string") return { message: err };
  const anyErr = err as Record<string, unknown> & { message?: unknown; status?: unknown; statusCode?: unknown; code?: unknown; error?: unknown; hint?: unknown; details?: unknown };

  const status =
    (typeof anyErr.status === "number" ? anyErr.status : undefined) ??
    (typeof anyErr.statusCode === "number" ? anyErr.statusCode : undefined);

  const nested = (anyErr.error && typeof anyErr.error === "object" ? (anyErr.error as { message?: unknown }).message : undefined);

  const message =
    (typeof anyErr.message === "string" && anyErr.message) ||
    (typeof nested === "string" && nested) ||
    (typeof anyErr.hint === "string" && anyErr.hint) ||
    (typeof anyErr.details === "string" && anyErr.details) ||
    (typeof anyErr.code === "string" && anyErr.code) ||
    "";

  return { message: String(message || ""), status };
}

export function translateError(err: AnyError, fallback: string = DEFAULT_MESSAGE): string {
  const { message, status } = extractMessage(err);

  if (message && EXACT_MAP[message]) return EXACT_MAP[message];

  if (message) {
    for (const [re, pt] of PARTIAL_MAP) {
      if (re.test(message)) return pt;
    }
  }

  if (typeof status === "number" && STATUS_MAP[status]) return STATUS_MAP[status];

  // Se a mensagem parece já estar em português (tem acento ou termo comum), preserva.
  if (message && /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]|não|inválid|obrigatóri|senha|usuário/i.test(message)) {
    return message;
  }

  return fallback;
}

export function logAndTranslate(err: AnyError, fallback?: string): string {
  // eslint-disable-next-line no-console
  console.error(err);
  return translateError(err, fallback);
}
