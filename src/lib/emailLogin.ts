/** A fixed first-party origin only; never accept redirect URLs from query parameters. */
export function buildEmailLinkRequest(rawEmail: string, origin: string) {
  const email = rawEmail.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('有効なメールアドレスを入力してください。');
  const url = new URL(origin);
  const secure = url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
  if (!secure || url.origin !== origin || url.username || url.password) throw new Error('ログインの戻り先を確認できません。');
  return { email, options: { shouldCreateUser: false as const, emailRedirectTo: url.origin } };
}

/** Never echo provider error text or callback credentials into the UI. */
export function emailCallbackError(hash: string): string {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return params.has('error') || params.has('error_description')
    ? 'ログインリンクを確認できませんでした。有効期限や使用済みでないかを確認し、必要なら再送してください。'
    : '';
}
