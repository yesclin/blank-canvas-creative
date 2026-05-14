/**
 * Sinaliza intenção EXPLÍCITA de logout pelo usuário.
 *
 * Usado pelos guards de autenticação (RequireAuth, AuthSessionGuard) para
 * diferenciar um SIGNED_OUT real (clique em "Sair", trial expirado, sessão
 * inconsistente) de um SIGNED_OUT espúrio causado por:
 *   - falha temporária de refresh de token
 *   - perda momentânea de rede / aba suspensa
 *   - oscilação do Supabase
 *
 * Quando NÃO há intenção registrada, os guards revalidam com getSession()
 * antes de derrubar a sessão e redirecionar para /login.
 *
 * Persistência: sessionStorage com TTL curto (5s). Sobrevive ao reload
 * imediato após signOut, mas não vaza para sessões futuras.
 */

const KEY = "yc.auth.logoutIntent";
const TTL_MS = 5_000;

export function markUserLogout(reason: string = "user-action") {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      KEY,
      JSON.stringify({ at: Date.now(), reason }),
    );
  } catch {
    /* ignore */
  }
}

export function wasLogoutRequestedByUser(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { at?: number };
    if (!parsed?.at) return false;
    if (Date.now() - parsed.at > TTL_MS) {
      window.sessionStorage.removeItem(KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function clearLogoutIntent() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
