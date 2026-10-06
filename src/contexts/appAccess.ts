import { createContext, useContext } from 'react';
export interface AppAccess {
  loading: boolean;
  ownerTrial: boolean;
  editor: boolean;
  unavailable: boolean;
  retry: () => void;
}
export const AppAccessContext = createContext<AppAccess | null>(null);
export function useAppAccess() {
  const value = useContext(AppAccessContext);
  if (!value) throw new Error('AppAccessProvider is required');
  return value;
}
