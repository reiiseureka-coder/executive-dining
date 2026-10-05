import { createClient } from "@supabase/supabase-js";
import { isAdminEmailCallback } from "./authLanding";
// Capture only intent before the SDK consumes/clears the callback; never retain callback credentials here.
export const adminEmailCallbackDetected = typeof window !== "undefined" && isAdminEmailCallback(window.location.hash);
const url = import.meta.env.VITE_SUPABASE_URL;
// Publishable keys are the preferred browser key; retain legacy anon-key compatibility.
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key, {
  auth: {
    // In pinned auth-js 2.99.3, params are already parsed before this supported detection hook.
    // Replace the callback history entry so SDK hash cleanup does not leave credentials on Back.
    detectSessionInUrl: (callbackUrl, params) => {
      const matches = Boolean(params.access_token || params.error_description);
      if (params.access_token && params.refresh_token) {
        const clean = new URL(callbackUrl);
        clean.hash = '';
        window.history.replaceState(window.history.state, '', clean.pathname + clean.search);
      }
      return matches;
    },
  },
}) : null;

// New dedicated projects must verify the provider and redirect allowlist before offering Google sign-in.
export const googleSignInEnabled = import.meta.env.VITE_SUPABASE_GOOGLE_LOGIN_ENABLED === 'true';

// Email links are opt-in after SMTP, recipients and redirects have been verified.
export const emailSignInEnabled = import.meta.env.VITE_SUPABASE_EMAIL_LOGIN_ENABLED === 'true';
