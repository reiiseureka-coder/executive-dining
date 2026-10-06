import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import { AppAccessContext } from './appAccess';
import { diningRepository } from '../data/diningClient';
import { ownerTrialRepository } from '../data/ownerTrialClient';
import { ReviewGatewayError } from '../data/repositories/proposedReviewRepository';

/** Navigation hints only. Each data operation still enforces its own server authorization. */
function AccessLookup({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const id = user?.id;
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ id: string; ownerTrial: boolean; editor: boolean; unavailable: boolean } | null>(null);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const owner = ownerTrialRepository ? ownerTrialRepository.context(controller.signal).then(() => ({ allowed: true, unavailable: false })).catch(reason => ({ allowed: false, unavailable: !(reason instanceof ReviewGatewayError && reason.code === 'denied') })) : Promise.resolve({ allowed: false, unavailable: false });
    const editor = diningRepository ? diningRepository.canEdit(controller.signal).then(value => value === true).catch(() => false) : Promise.resolve(false);
    void Promise.all([owner, editor]).then(([trial, canEdit]) => {
      if (!controller.signal.aborted) setResult({ id, ownerTrial: trial.allowed, editor: canEdit, unavailable: trial.unavailable });
    });
    return () => controller.abort();
  }, [id, revision]);
  const current = id && result?.id === id ? result : null;
  return <AppAccessContext.Provider value={{ loading: authLoading || (!!id && !current), ownerTrial: current?.ownerTrial ?? false, editor: current?.editor ?? false, unavailable: current?.unavailable ?? false, retry: () => { setResult(null); setRevision(value => value + 1); } }}>{children}</AppAccessContext.Provider>;
}

export function AppAccessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return <AccessLookup key={user?.id ?? "signed-out"}>{children}</AccessLookup>;
}
