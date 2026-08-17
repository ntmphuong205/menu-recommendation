import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Used only for Supabase Auth (owner login, see store/useOwnerAuth.ts) — all
// business data goes through the FastAPI backend in src/lib/apiClient.ts,
// never through this client directly.
//
// persistSession: false is deliberate — the admin dashboard is meant to run
// on a shared/counter device, not a personal one, so a session must not
// outlive the browser tab. Without this, Supabase persists the JWT to
// localStorage and silently signs the next person back in as the previous
// admin on page reload/reopen, with no password prompt at all.
export const supabase = url && anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : null;
