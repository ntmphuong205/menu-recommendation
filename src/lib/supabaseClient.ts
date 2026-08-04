import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Used only for Supabase Auth (owner login, see store/useOwnerAuth.ts) — all
// business data goes through the FastAPI backend in src/lib/apiClient.ts,
// never through this client directly.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
