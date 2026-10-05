import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { googleSignInEnabled, supabase } from "../lib/supabase";
import { AuthContext } from "./auth";
import { observeAuthSession } from "../lib/authSession";
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    return observeAuthSession(client.auth, (next) => {
      setSession(next);
      setLoading(false);
    });
  }, []);
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
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
