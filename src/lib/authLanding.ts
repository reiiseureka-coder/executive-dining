/** A callback type is navigation intent only, never evidence of editor authority. */
export function isAdminEmailCallback(hash: string): boolean {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return ['invite', 'magiclink'].includes(params.get('type') ?? '') &&
    !!params.get('access_token') && !!params.get('refresh_token') && !params.has('error');
}
export function isUnclaimedLoginLanding(hash: string): boolean {
  return ['', '#', '#/'].includes(hash);
}
