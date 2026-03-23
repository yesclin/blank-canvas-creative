import { supabase } from '@/integrations/supabase/client';

export interface AuditLogParams {
  clinicId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an audit event. Fails silently to never disrupt user flows.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('audit_logs').insert({
      clinic_id: params.clinicId,
      user_id: user.id,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      metadata: params.metadata || {},
      user_agent: navigator.userAgent,
    } as any);
  } catch (err) {
    console.error('Audit log error (non-blocking):', err);
  }
}
