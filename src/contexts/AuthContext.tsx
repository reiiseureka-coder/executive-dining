import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile, UserRank } from '../types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初期セッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchOrCreateProfile(session.user);
      else setLoading(false);
    });

    // セッション変更の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchOrCreateProfile(session.user);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchOrCreateProfile = async (user: User) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      // プロフィールが存在しない場合は作成
      const newProfile = {
        id: user.id,
        email: user.email ?? '',
        display_name: user.user_metadata?.full_name ?? user.email ?? '',
        avatar_url: user.user_metadata?.avatar_url ?? null,
        rank: 'ブロンズ' as UserRank,
      };
      const { data: created } = await supabase
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single();
      if (created) setProfile(toUserProfile(created));
    } else {
      setProfile(toUserProfile(data));
    }
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// DBの snake_case → camelCase 変換
function toUserProfile(data: Record<string, unknown>): UserProfile {
  return {
    id: data.id as string,
    email: data.email as string,
    displayName: data.display_name as string,
    avatarUrl: data.avatar_url as string | undefined,
    rank: data.rank as UserRank,
    createdAt: data.created_at as string,
  };
}
