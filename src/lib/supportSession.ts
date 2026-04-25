/**
 * Modo Suporte (impersonação leve do Super Admin).
 *
 * NÃO troca de sessão Auth. Apenas marca uma clinic_id alvo em localStorage.
 * O hook useClinicData detecta isso e passa a usar essa clínica como contexto.
 * RLS continua amarrada ao auth.uid() real do super admin.
 */
import { supabase } from '@/integrations/supabase/client';
import { logPlatformAction } from './superAdminAudit';

const STORAGE_KEY = 'yesclin_support_clinic_id';
const SESSION_ID_KEY = 'yesclin_support_session_id';

export interface ActiveSupportSession {
  sessionId: string;
  clinicId: string;
}

export function getActiveSupportSession(): ActiveSupportSession | null {
  if (typeof window === 'undefined') return null;
  const clinicId = window.localStorage.getItem(STORAGE_KEY);
  const sessionId = window.localStorage.getItem(SESSION_ID_KEY);
  if (!clinicId || !sessionId) return null;
  return { clinicId, sessionId };
}

function emitChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yesclin:support-session-changed'));
  }
}

export async function startSupportSession(params: {
  clinicId: string;
  reason: string;
}): Promise<{ sessionId: string }> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) throw new Error('Você precisa estar autenticado.');

  const reason = params.reason?.trim();
  if (!reason || reason.length < 5) {
    throw new Error('Informe um motivo claro (mínimo 5 caracteres).');
  }

  const { data, error } = await supabase
    .from('support_sessions')
    .insert({
      admin_user_id: user.id,
      clinic_id: params.clinicId,
      reason,
      status: 'active',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    })
    .select('id')
    .single();

  if (error) throw error;

  await logPlatformAction({
    action: 'support_session.start',
    target_type: 'support_session',
    target_id: data.id,
    clinic_id: params.clinicId,
    metadata: { reason },
  });

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, params.clinicId);
    window.localStorage.setItem(SESSION_ID_KEY, data.id);
  }
  emitChange();
  return { sessionId: data.id };
}

export async function endSupportSession(): Promise<void> {
  const active = getActiveSupportSession();
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SESSION_ID_KEY);
  }
  emitChange();

  if (!active) return;

  const { error } = await supabase
    .from('support_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', active.sessionId);

  if (error) console.warn('[support_session.end] update failed:', error);

  await logPlatformAction({
    action: 'support_session.end',
    target_type: 'support_session',
    target_id: active.sessionId,
    clinic_id: active.clinicId,
  });
}
