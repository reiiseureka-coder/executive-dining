import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./auth";
import type { UserProfile, UserRank } from "../types";
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let alive = true;
    let generation = 0;
    const updateSession = async (next: Session | null) => {
      const request = ++generation;
      if (!alive) return;
      setSession(next);
      setProfile(null);
      try {
        if (next?.user) {
          const { data } = await client
            .from("user_profiles")
            .select("*")
            .eq("id", next.user.id)
            .maybeSingle();
          if (alive && request === generation && data)
            setProfile({
              id: data.id,
              email: data.email,
              displayName: data.display_name,
              avatarUrl: data.avatar_url,
              rank: data.rank as UserRank,
              createdAt: data.created_at,
            });
        }
      } finally {
        if (alive && request === generation) setLoading(false);
      }
    };
    client.auth
      .getSession()
      .then(({ data }) => updateSession(data.session))
      .catch(() => {
        if (alive) setLoading(false);
      });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, next) => {
      setTimeout(() => {
        if (alive) void updateSession(next).catch(() => {});
      }, 0);
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  const signInWithGoogle = async () => {
    if (!supabase) throw new Error("ログイン機能は準備中です。");
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
        profile,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
