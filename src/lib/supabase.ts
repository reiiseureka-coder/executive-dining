import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
// Publishable keys are the preferred browser key; retain legacy anon-key compatibility.
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;

// New dedicated projects must verify the provider and redirect allowlist before offering Google sign-in.
export const googleSignInEnabled = import.meta.env.VITE_SUPABASE_GOOGLE_LOGIN_ENABLED === 'true';
