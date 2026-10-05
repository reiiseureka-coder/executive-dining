import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { emailSignInEnabled, googleSignInEnabled, supabase } from "../lib/supabase";
import { AuthContext } from "./auth";
import { observeAuthSession } from "../lib/authSession";
import { buildEmailLinkRequest } from "../lib/emailLogin";
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [emailRetryAt, setEmailRetryAt] = useState(0);
  const [emailSending, setEmailSending] = useState(false);
  const nextEmailRequestAt = useRef(0);
  const emailInFlight = useRef(false);
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    return observeAuthSession(client.auth, (next) => {
      setSession(next);
      setLoading(false);
    });
  }, []);
  const signInWithEmail = async (email: string) => {
    if (!supabase || !emailSignInEnabled) throw new Error("メールログインは準備中です。");
    if (emailInFlight.current || Date.now() < nextEmailRequestAt.current) throw new Error("時間をおいてお試しください。");
    const request = buildEmailLinkRequest(email, window.location.origin);
    nextEmailRequestAt.current = Date.now() + 60_000;
    setEmailRetryAt(nextEmailRequestAt.current);
    emailInFlight.current = true;
    setEmailSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp(request);
      if (error) throw error;
    } finally { emailInFlight.current = false; setEmailSending(false); }
  };
  const signInWithGoogle = async () => {
    if (!supabase || !googleSignInEnabled) throw new Error("ログイン機能は準備中です。");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  };
  const signOut = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
  };
  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        emailRetryAt,
        emailSending,
        signInWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
