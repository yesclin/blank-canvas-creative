/**
 * Modo Suporte (impersonação leve do Super Admin).
 *
 * NÃO troca de sessão Auth. Apenas marca uma clinic_id alvo em localStorage.
 * O hook useClinicData detecta isso e passa a usar essa clínica como contexto.
 * RLS continua amarrada ao auth.uid() real do super admin.
 */
import { supabase } from '@/integrations/supabase/client';
import { logPlatformAction } from './superAdminAudit';
import { SUPPORT_ADMIN_USER_KEY } from './authSessionIsolation';

const STORAGE_KEY = 'yesclin_support_clinic_id';
const SESSION_ID_KEY = 'yesclin_support_session_id';

export interface ActiveSupportSession {
  sessionId: string;
  clinicId: string;
  adminUserId: string;
}

export function getActiveSupportSession(): ActiveSupportSession | null {
  if (typeof window === 'undefined') return null;
  const clinicId = window.sessionStorage.getItem(STORAGE_KEY);
  const sessionId = window.sessionStorage.getItem(SESSION_ID_KEY);
  const adminUserId = window.sessionStorage.getItem(SUPPORT_ADMIN_USER_KEY);
  if (!clinicId || !sessionId || !adminUserId) return null;
  return { clinicId, sessionId, adminUserId };
}

/**
 * Limpa qualquer sessão de suporte que não pertença ao usuário fornecido.
 * Garante que um Super Admin nunca herde a sessão de suporte de outro usuário
 * (ex.: troca de login na mesma máquina).
 */
export function clearSupportSessionIfMismatch(currentUserId: string | null) {
  if (typeof window === 'undefined') return;
  const owner = window.sessionStorage.getItem(SUPPORT_ADMIN_USER_KEY);
  if (!owner) return;
  if (!currentUserId || owner !== currentUserId) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_ID_KEY);
    window.sessionStorage.removeItem(SUPPORT_ADMIN_USER_KEY);
    window.dispatchEvent(new CustomEvent('yesclin:support-session-changed'));
  }
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
    window.sessionStorage.setItem(STORAGE_KEY, params.clinicId);
    window.sessionStorage.setItem(SESSION_ID_KEY, data.id);
    window.sessionStorage.setItem(SUPPORT_ADMIN_USER_KEY, user.id);
  }
  emitChange();
  return { sessionId: data.id };
}

export async function endSupportSession(): Promise<void> {
  const active = getActiveSupportSession();
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_ID_KEY);
    window.sessionStorage.removeItem(SUPPORT_ADMIN_USER_KEY);
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
