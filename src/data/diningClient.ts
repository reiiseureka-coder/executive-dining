import { supabase } from '../lib/supabase';
import { SupabaseDiningRepository } from './repositories/diningRepository';
// A deployment gate, never a permission/role check. DB functions independently enforce authorization.
export const diningRepository = import.meta.env.VITE_DINING_DATABASE_ENABLED === 'true' && supabase ? new SupabaseDiningRepository(supabase) : null;
