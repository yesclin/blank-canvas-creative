import { supabase } from '@/integrations/supabase/client';

export type AuditSeverity = 'info' | 'warning' | 'critical' | 'error' | 'success';
export type AuditSource = 'frontend' | 'backend' | 'edge_function' | 'trigger' | 'system';

export interface AuditLogInput {
  action: string;
  module?: string;
  /** Tipo da entidade afetada (ex.: 'clinic', 'plan', 'subscription'). */
  target_type?: string | null;
  /** ID da entidade quando UUID. */
  target_id?: string | null;
  /** Alias de target_type para a nova nomenclatura. */
  entity?: string | null;
  /** ID da entidade em formato livre (texto), para entidades não-UUID. */
  entity_id?: string | null;
  clinic_id?: string | null;
  severity?: AuditSeverity;
  description?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  route?: string | null;
  source?: AuditSource;
}

const MODULE_DEFAULTS_BY_PREFIX: Array<[RegExp, string]> = [
  [/^clinic[._]/i, 'clinicas'],
  [/^plan[._]/i, 'planos'],
  [/^subscription[._]/i, 'assinaturas'],
  [/^feature_override[._]/i, 'recursos'],
  [/^platform_user[._]/i, 'usuarios'],
  [/^occurrence[._]/i, 'ocorrencias'],
  [/^integration[._]/i, 'integracoes'],
  [/^finance[._]/i, 'financeiro'],
  [/^export[._]/i, 'plataforma'],
  [/^auth[._]|^login|^logout|^access_denied/i, 'seguranca'],
];

function inferModule(action: string): string {
  for (const [re, mod] of MODULE_DEFAULTS_BY_PREFIX) {
    if (re.test(action)) return mod;
  }
  return 'plataforma';
}

function inferSeverity(action: string): AuditSeverity {
  if (/error|fail|denied|cancel|delete|remove|disable|deactivat/i.test(action)) {
    return /error|fail/i.test(action) ? 'error' : 'warning';
  }
  if (/critical|breach|leak/i.test(action)) return 'critical';
  return 'info';
}

/**
 * Registra uma ação administrativa em platform_audit_logs.
 * Falhas são silenciadas (logadas no console em dev) para nunca quebrar o fluxo principal.
 */
export async function logPlatformAction(input: AuditLogInput): Promise<void> {
  return logPlatformAudit(input);
}

export async function logPlatformAudit(input: AuditLogInput): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    let actorName: string | null = null;
    let actorRole: string | null = null;
    if (user) {
      try {
        const { data: pu } = await supabase
          .from('platform_users')
          .select('full_name, role')
          .eq('user_id', user.id)
          .maybeSingle();
        if (pu) {
          actorName = (pu as { full_name?: string }).full_name ?? null;
          actorRole = (pu as { role?: string }).role ?? null;
        }
      } catch {
        /* tabela pode não existir em todos ambientes */
      }
    }

    const targetType = input.entity ?? input.target_type ?? null;
    const entityIdText =
      input.entity_id ?? (input.target_id != null ? String(input.target_id) : null);

    const payload = {
      actor_user_id: user?.id ?? null,
      actor_email: user?.email ?? null,
      actor_name: actorName,
      actor_role: actorRole,
      action: input.action,
      module: input.module ?? inferModule(input.action),
      target_type: targetType,
      target_id:
        input.target_id ??
        (entityIdText && /^[0-9a-f-]{36}$/i.test(entityIdText) ? entityIdText : null),
      entity: targetType,
      entity_id: entityIdText,
      clinic_id: input.clinic_id ?? null,
      severity: input.severity ?? inferSeverity(input.action),
      description: input.description ?? null,
      old_values: input.old_values ?? null,
      new_values: input.new_values ?? null,
      metadata: input.metadata ?? {},
      route: input.route ?? (typeof window !== 'undefined' ? window.location.pathname : null),
      source: input.source ?? 'frontend',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    };

    await supabase.from('platform_audit_logs').insert(payload);
  } catch (e) {
    if (import.meta.env?.DEV) {
      console.warn('[platform_audit_logs] insert failed:', e);
    }
  }
}
