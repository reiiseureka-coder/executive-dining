import type { Session, SupabaseClient } from '@supabase/supabase-js';

/** UI session state only. Editorial authority is always checked by the database RPCs. */
export function observeAuthSession(
  auth: Pick<SupabaseClient['auth'], 'getSession' | 'onAuthStateChange'>,
  onSession: (session: Session | null) => void,
): () => void {
  let alive = true;
  let revision = 0;
  const { data: { subscription } } = auth.onAuthStateChange((_event, next) => {
    if (!alive) return;
    revision++;
    // Keep this callback synchronous; do not start another auth/database request here.
    onSession(next);
  });
  const initialRevision = revision;
  void auth.getSession().then(({ data, error }) => {
    if (alive && revision === initialRevision) onSession(error ? null : data.session);
  }).catch(() => {
    if (alive && revision === initialRevision) onSession(null);
  });
  return () => { alive = false; subscription.unsubscribe(); };
}
