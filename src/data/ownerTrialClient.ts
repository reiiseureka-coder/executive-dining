import { supabase } from '../lib/supabase';
import { OwnerTrialRepository } from './repositories/ownerTrialRepository';
// Used only on the authenticated private route. Every wrapper independently enforces the configured owner.
export const ownerTrialRepository=import.meta.env.VITE_DINING_DATABASE_ENABLED==='true' && supabase?new OwnerTrialRepository(supabase):null;
