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
 * Maps to audit_logs table: table_name = entityType, record_id = entityId, new_data = metadata
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('audit_logs').insert({
      clinic_id: params.clinicId,
      user_id: user.id,
      action: params.action,
      table_name: params.entityType,
      record_id: params.entityId || null,
      new_data: params.metadata || {},
    });
  } catch (err) {
    console.error('Audit log error (non-blocking):', err);
  }
}
