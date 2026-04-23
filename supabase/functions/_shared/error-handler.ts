/**
 * Shared error handling helpers for Edge Functions.
 *
 * Goal: never leak internal details (Postgres errors, table/column names,
 * stack traces, file paths, library messages) to the client. Always log the
 * full error server-side and return a generic, user-safe message.
 */

export type GenericErrorCode =
  | "internal_error"
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited";

const GENERIC_MESSAGES: Record<GenericErrorCode, string> = {
  internal_error: "Erro interno do servidor. Tente novamente em instantes.",
  bad_request: "Requisição inválida.",
  unauthorized: "Não autorizado.",
  forbidden: "Acesso negado.",
  not_found: "Recurso não encontrado.",
  conflict: "Conflito ao processar a solicitação.",
  rate_limited: "Muitas requisições. Tente novamente mais tarde.",
};

const STATUS_BY_CODE: Record<GenericErrorCode, number> = {
  internal_error: 500,
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
};

/**
 * Build a safe JSON error Response. Logs the original error/details server-side
 * and returns ONLY a generic message + optional opaque request id to the client.
 */
export function safeErrorResponse(
  context: string,
  error: unknown,
  options: {
    code?: GenericErrorCode;
    /** Optional safe message override (must NOT include internal details). */
    publicMessage?: string;
    /** Extra CORS / response headers to merge in. */
    headers?: Record<string, string>;
  } = {},
): Response {
  const code = options.code ?? "internal_error";
  const status = STATUS_BY_CODE[code];
  const requestId = crypto.randomUUID();

  // Server-side log only — never sent to client.
  try {
    const detail =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error;
    console.error(`[${context}] [${requestId}]`, detail);
  } catch {
    console.error(`[${context}] [${requestId}] <unserializable error>`);
  }

  const body = {
    error: options.publicMessage ?? GENERIC_MESSAGES[code],
    code,
    request_id: requestId,
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

/**
 * Wrap a handler so any thrown/unknown error is converted to a safe response.
 * The handler receives the original Request and must return a Response.
 */
export function withSafeErrors(
  context: string,
  handler: (req: Request) => Promise<Response>,
  getCorsHeaders: (req: Request) => Record<string, string>,
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      return safeErrorResponse(context, error, {
        headers: getCorsHeaders(req),
      });
    }
  };
}
