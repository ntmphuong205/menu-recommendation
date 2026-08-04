import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

export interface OwnerAuth {
  /** Whether /admin should be gated behind a login form at all. False when no
   *  Supabase project is configured, so the dashboard stays open for demos. */
  authRequired: boolean;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => void;
  /** Resolves to an error message on failure, or null on success. Requires
   *  an already-valid session (no re-auth prompt) — fine for a small admin
   *  tool; revisit if this ever needs to survive a stolen/shared session. */
  changePassword: (newPassword: string) => Promise<string | null>;
}

export function useOwnerAuth(): OwnerAuth {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  };

  const signOut = () => {
    supabase?.auth.signOut();
  };

  const changePassword = async (newPassword: string) => {
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error ? error.message : null;
  };

  return { authRequired: isSupabaseConfigured, user, loading, signIn, signOut, changePassword };
}
