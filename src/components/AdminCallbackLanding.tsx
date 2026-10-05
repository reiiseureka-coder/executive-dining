import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/auth';
import { adminEmailCallbackDetected } from '../lib/supabase';
import { isUnclaimedLoginLanding } from '../lib/authLanding';
import { diningRepository } from '../data/diningClient';

export default function AdminCallbackLanding() {
  const { user, loading } = useAuth();
  const handled = useRef(false);
  const userId = user?.id;
  useEffect(() => {
    if (!adminEmailCallbackDetected || loading || !userId || !diningRepository || handled.current) return;
    const startHash = window.location.hash;
    if (!isUnclaimedLoginLanding(startHash)) { handled.current = true; return; }
    const controller = new AbortController();
    const interrupted = () => {
      if (window.location.hash !== startHash) { handled.current = true; controller.abort(); }
    };
    const unlisten = () => {
      window.removeEventListener('hashchange', interrupted);
      window.removeEventListener('popstate', interrupted);
    };
    window.addEventListener('hashchange', interrupted);
    window.addEventListener('popstate', interrupted);
    void diningRepository.canEdit(controller.signal).then(allowed => {
      if (controller.signal.aborted) return;
      handled.current = true;
      if (allowed !== true || window.location.hash !== startHash) return;
      unlisten();
      window.history.replaceState(window.history.state, '', '#/curation');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      window.scrollTo({ top: 0, behavior: 'instant' });
    }).catch(() => { if (!controller.signal.aborted) handled.current = true; });
    return () => { controller.abort(); unlisten(); };
  }, [userId, loading]);
  return null;
}
