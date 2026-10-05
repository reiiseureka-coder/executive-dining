import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
