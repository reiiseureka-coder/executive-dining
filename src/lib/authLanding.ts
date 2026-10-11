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
  (/^#\/(?:curation|about|nagoya|compare|pilot|restaurants|corporate)?$/.test(value) || /^#\/(?:nagoya|pilot)\/[0-9a-f-]{36}$/i.test(value));
/** Keep only bounded catalog navigation. Never persist email, callback credentials or external destinations. */
export function loginDestination(hash: string): string {
  const [path, query = ''] = hash.split('?');
  if (!allowed(path)) return '#/';
  if (!/^#\/(?:nagoya|compare|pilot)(?:\/|$)/.test(path)) return path;
  const input = new URLSearchParams(query), output = new URLSearchParams();
  for (const [key, max] of [['query',160],['genre',100]] as const) {
    const value = input.get(key)?.trim();
    if (value && value.length <= max && ![...value].some(char=>char.charCodeAt(0)<32)) output.set(key,value);
  }
  const choices: Record<string, string[]> = { information:['private_room','price','hours','notice','coordinates'],sort:['name','recent'],saved:['1'],view:['map','mine','queue'],returnTo:['compare'] };
  for (const [key, values] of Object.entries(choices)) { const value=input.get(key); if(value&&values.includes(value))output.set(key,value); }
  const ids = [...new Set((input.get('ids')??'').split(','))].filter(id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)).slice(0,3);
  if(ids.length)output.set('ids',ids.join(','));
  return path+(output.size?'?'+output.toString():'');
}
export function rememberLoginDestination(storage: Pick<Storage, 'setItem'>, hash: string, now = Date.now()) {
  const target = loginDestination(hash);
  try { storage.setItem(LOGIN_RETURN_KEY, JSON.stringify({ target, expiresAt: now + 30 * 60_000 })); } catch { /* Login still works without storage. */ }
}
export function consumeLoginDestination(storage: Pick<Storage, 'getItem' | 'removeItem'>, now = Date.now()): string {
  try {
    const raw = storage.getItem(LOGIN_RETURN_KEY); storage.removeItem(LOGIN_RETURN_KEY);
    const value: unknown = JSON.parse(raw ?? 'null');
    if (value && typeof value === 'object' && 'target' in value && 'expiresAt' in value && typeof value.target === 'string' && loginDestination(value.target) === value.target && typeof value.expiresAt === 'number' && value.expiresAt > now && value.expiresAt <= now + 30 * 60_000) return value.target;
  } catch { /* Unavailable or malformed storage returns to the single entry. */ }
  return '#/';
}
