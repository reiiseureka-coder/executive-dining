import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/auth';
import { useAppAccess } from '../contexts/appAccess';
import { adminEmailCallbackDetected } from '../lib/supabase';
import { consumeLoginDestination, isUnclaimedLoginLanding } from '../lib/authLanding';

export default function AdminCallbackLanding() {
  const { user, loading } = useAuth();
  const access = useAppAccess();
  const handled = useRef(false);
  useEffect(() => {
    if (!adminEmailCallbackDetected || loading || access.loading || !user || handled.current) return;
    handled.current = true;
    let target = consumeLoginDestination(window.localStorage);
    // New navigation always wins. A callback must not pull a user away from their current page.
    if (!isUnclaimedLoginLanding(window.location.hash)) return;
    if ((target === '#/curation' && !access.editor) || (target === '#/pilot' && !access.ownerTrial)) target = '#/';
    window.history.replaceState(window.history.state, '', target);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }, [user, loading, access.loading, access.editor, access.ownerTrial]);
  return null;
}
