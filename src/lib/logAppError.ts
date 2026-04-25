/**
 * Centralized application error logger.
 *
 * Use in catch blocks to produce structured logs that include the screen,
 * component, action and relevant entity IDs. Keeps console output uniform
 * and makes future integration with a remote logger (Sentry, Logflare, etc.)
 * a one-line change.
 */

export interface AppErrorContext {
  /** Tela / página onde o erro ocorreu (ex: "Prontuário"). */
  screen?: string;
  /** Componente ou hook (ex: "ConsentModule", "useAestheticConsent"). */
  component?: string;
  /** Ação executada (ex: "createConsent", "fetchTemplates"). */
  action?: string;
  patientId?: string | null;
  appointmentId?: string | null;
  specialtyId?: string | null;
  professionalId?: string | null;
  userId?: string | null;
  clinicId?: string | null;
  /** Quaisquer metadados adicionais relevantes para diagnóstico. */
  extra?: Record<string, unknown>;
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  if (typeof error === "object" && error !== null) {
    return error as Record<string, unknown>;
  }
  return { message: String(error) };
}

/**
 * Logs an application error with structured context.
 * Always non-throwing — safe to call inside any catch.
 */
export function logAppError(error: unknown, context: AppErrorContext = {}) {
  try {
    const payload = {
      ...context,
      error: serializeError(error),
      timestamp: new Date().toISOString(),
    };
    // eslint-disable-next-line no-console
    console.error(`[AppError]${context.screen ? ` ${context.screen}` : ""}${context.component ? ` › ${context.component}` : ""}${context.action ? ` › ${context.action}` : ""}`, payload);
  } catch {
    // Logger must never throw.
    // eslint-disable-next-line no-console
    console.error("[AppError] (failed to serialize)", error);
  }
}
