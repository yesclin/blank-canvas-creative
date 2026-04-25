import { supabase } from '@/integrations/supabase/client';

export interface AuditLogInput {
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  clinic_id?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Registra uma ação do Super Admin em platform_audit_logs.
 * Falhas são silenciadas (logadas no console) para nunca quebrar o fluxo principal.
 */
export async function logPlatformAction(input: AuditLogInput): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    await supabase.from('platform_audit_logs').insert({
      actor_user_id: user.id,
      actor_email: user.email,
      action: input.action,
      target_type: input.target_type ?? null,
      target_id: input.target_id ?? null,
      clinic_id: input.clinic_id ?? null,
      metadata: input.metadata ?? {},
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });
  } catch (e) {
    console.warn('[platform_audit_logs] insert failed:', e);
  }
}
