/** A callback type is navigation intent only, never evidence of editor authority. */
export function isAdminEmailCallback(hash: string): boolean {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return ['invite', 'magiclink'].includes(params.get('type') ?? '') &&
    !!params.get('access_token') && !!params.get('refresh_token') && !params.has('error');
}
export function isUnclaimedLoginLanding(hash: string): boolean {
  return ['', '#', '#/'].includes(hash);
}

export const LOGIN_RETURN_KEY = 'ed-login-destination:v1';
const allowed = (value: unknown): value is string => typeof value === 'string' &&
  (/^#\/(?:curation|about|nagoya|compare|pilot|restaurants|corporate)?$/.test(value) || /^#\/nagoya\/[0-9a-f-]{36}$/i.test(value));
/** A short-lived first-party route only: no query text, credentials, or identity. */
export function rememberLoginDestination(storage: Pick<Storage, 'setItem'>, hash: string, now = Date.now()) {
  const target = hash.split('?')[0];
  try { storage.setItem(LOGIN_RETURN_KEY, JSON.stringify({ target: allowed(target) ? target : '#/', expiresAt: now + 30 * 60_000 })); } catch { /* Login still works without storage. */ }
}
export function consumeLoginDestination(storage: Pick<Storage, 'getItem' | 'removeItem'>, now = Date.now()): string {
  try {
    const raw = storage.getItem(LOGIN_RETURN_KEY); storage.removeItem(LOGIN_RETURN_KEY);
    const value: unknown = JSON.parse(raw ?? 'null');
    if (value && typeof value === 'object' && 'target' in value && 'expiresAt' in value && allowed(value.target) && typeof value.expiresAt === 'number' && value.expiresAt > now && value.expiresAt <= now + 30 * 60_000) return value.target;
  } catch { /* Unavailable or malformed storage returns to the single entry. */ }
  return '#/';
}
