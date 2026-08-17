import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

export interface OwnerAuth {
  /** Whether /admin should be gated behind a login form at all. False when no
   *  Supabase project is configured, so the dashboard stays open for demos. */
  authRequired: boolean;
  user: User | null;
  loading: boolean;
  /** True once the user arrived via a "reset password" email link — Supabase
   *  signs them into a limited recovery session at that point, valid only
   *  for calling changePassword(), not for using the rest of the dashboard. */
  passwordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => void;
  /** Resolves to an error message on failure, or null on success. Requires
   *  an already-valid session (no re-auth prompt) — fine for a small admin
   *  tool; revisit if this ever needs to survive a stolen/shared session. */
  changePassword: (newPassword: string) => Promise<string | null>;
  /** Emails the account a "reset password" link. Always resolves to null
   *  (no error) even for an unknown email — Supabase does this on purpose
   *  so this can't be used to check which emails have accounts. */
  requestPasswordReset: (email: string) => Promise<string | null>;
}

export function useOwnerAuth(): OwnerAuth {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      // USER_UPDATED fires (to every useOwnerAuth() instance, since this
      // listens on the shared Supabase client) right after changePassword()
      // succeeds — that's what actually clears the recovery gate, since
      // changePassword() may run from a different component's own hook
      // instance with its own independent state.
      if (event === "SIGNED_OUT" || event === "USER_UPDATED") setPasswordRecovery(false);
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
    // Success clears passwordRecovery via the USER_UPDATED event above,
    // consistently across every useOwnerAuth() instance.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error ? error.message : null;
  };

  const requestPasswordReset = async (email: string) => {
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin`,
    });
    return error ? error.message : null;
  };

  return {
    authRequired: isSupabaseConfigured,
    user,
    loading,
    passwordRecovery,
    signIn,
    signOut,
    changePassword,
    requestPasswordReset,
  };
}
